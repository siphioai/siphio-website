-- ===================================================================
-- Migration: Food Search Intelligence Upgrade
-- Purpose: Add smart suggestions, full-text search, and typo tolerance
-- Created: 2025
-- ===================================================================

-- ===== STEP 1: Enable Extensions =====
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===== STEP 2: Add display_name Column =====
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_food_items_display_name
  ON food_items(display_name);

-- ===== STEP 3: Full-Text Search Support =====
-- Generated tsvector column (auto-updates on INSERT/UPDATE)
ALTER TABLE food_items
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(name, '')), 'B')
  ) STORED;

-- GIN index for FTS (faster than GIST)
CREATE INDEX IF NOT EXISTS idx_food_items_search
  ON food_items USING GIN(search_vector);

-- Trigram index for typo tolerance
CREATE INDEX IF NOT EXISTS idx_food_items_trigram
  ON food_items USING GIN(display_name gin_trgm_ops);

-- ===== STEP 4: Smart Suggestions Materialized View =====
CREATE MATERIALIZED VIEW IF NOT EXISTS user_smart_suggestions AS
WITH
-- Signal 1: Frequently logged foods (implicit behavior)
frequent_foods AS (
  SELECT
    m.user_id,
    mi.food_item_id,
    COUNT(*) as log_count,
    MODE() WITHIN GROUP (ORDER BY mi.quantity_g) as typical_quantity_g,
    MAX(mi.logged_at) as last_used_at,
    FALSE as is_favorite
  FROM meal_items mi
  JOIN meals m ON mi.meal_id = m.id
  WHERE mi.logged_at > NOW() - INTERVAL '90 days'
  GROUP BY m.user_id, mi.food_item_id
),

-- Signal 2: Favorited foods (explicit preference)
favorite_foods AS (
  SELECT
    uf.user_id,
    uf.food_item_id,
    COALESCE(
      (SELECT COUNT(*)
       FROM meal_items mi
       JOIN meals m ON mi.meal_id = m.id
       WHERE m.user_id = uf.user_id
         AND mi.food_item_id = uf.food_item_id
         AND mi.logged_at > NOW() - INTERVAL '90 days'
      ), 0
    ) as log_count,
    COALESCE(uf.last_quantity_g, 100) as typical_quantity_g,
    COALESCE(
      (SELECT MAX(mi.logged_at)
       FROM meal_items mi
       JOIN meals m ON mi.meal_id = m.id
       WHERE m.user_id = uf.user_id
         AND mi.food_item_id = uf.food_item_id
      ),
      uf.favorited_at
    ) as last_used_at,
    TRUE as is_favorite
  FROM user_favorites uf
),

-- Combine signals (favorites take precedence)
combined AS (
  SELECT * FROM favorite_foods
  UNION ALL
  SELECT * FROM frequent_foods
  WHERE NOT EXISTS (
    SELECT 1 FROM favorite_foods ff
    WHERE ff.user_id = frequent_foods.user_id
      AND ff.food_item_id = frequent_foods.food_item_id
  )
),

-- Calculate intelligent score
scored AS (
  SELECT
    user_id,
    food_item_id,
    log_count,
    typical_quantity_g,
    last_used_at,
    is_favorite,
    (
      -- Base score from logging frequency (0-500 points)
      LEAST(log_count * 10, 500) +

      -- MASSIVE bonus for favorites (1000 points)
      CASE WHEN is_favorite THEN 1000 ELSE 0 END +

      -- Recency bonus
      CASE
        WHEN last_used_at > NOW() - INTERVAL '7 days' THEN 300
        WHEN last_used_at > NOW() - INTERVAL '30 days' THEN 150
        WHEN last_used_at > NOW() - INTERVAL '60 days' THEN 50
        ELSE 0
      END
    ) as smart_score
  FROM combined
)

SELECT
  user_id,
  food_item_id,
  log_count,
  typical_quantity_g,
  last_used_at,
  is_favorite,
  smart_score
FROM scored
ORDER BY user_id, smart_score DESC;

-- ===== STEP 5: Indexes for Performance =====
CREATE INDEX IF NOT EXISTS idx_smart_suggestions_user
  ON user_smart_suggestions(user_id, smart_score DESC);

-- CRITICAL: Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_suggestions_unique
  ON user_smart_suggestions(user_id, food_item_id);

-- ===== STEP 6: Postgres Function for Fuzzy Search =====
CREATE OR REPLACE FUNCTION search_foods_fuzzy(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  usda_fdc_id TEXT,
  name TEXT,
  display_name TEXT,
  calories_per_100g DECIMAL,
  protein_per_100g DECIMAL,
  carbs_per_100g DECIMAL,
  fat_per_100g DECIMAL,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.usda_fdc_id,
    f.name,
    f.display_name,
    f.calories_per_100g,
    f.protein_per_100g,
    f.carbs_per_100g,
    f.fat_per_100g,
    (
      -- Full-text search score
      ts_rank(f.search_vector, plainto_tsquery('english', search_query)) * 2 +

      -- Trigram similarity score (typo tolerance)
      similarity(COALESCE(f.display_name, f.name), search_query) * 3 +

      -- Exact match bonus
      CASE WHEN COALESCE(f.display_name, f.name) ILIKE '%' || search_query || '%' THEN 1.0 ELSE 0.0 END
    ) as relevance_score
  FROM food_items f
  WHERE
    f.search_vector @@ plainto_tsquery('english', search_query)
    OR similarity(COALESCE(f.display_name, f.name), search_query) > similarity_threshold
  ORDER BY relevance_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 7: Refresh Function =====
CREATE OR REPLACE FUNCTION refresh_smart_suggestions()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_smart_suggestions;
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 8: Initial Refresh =====
-- Populate the materialized view with initial data
REFRESH MATERIALIZED VIEW user_smart_suggestions;

-- Note: Schedule hourly refresh with Supabase Edge Function
-- See: https://supabase.com/docs/guides/functions/schedule-functions
