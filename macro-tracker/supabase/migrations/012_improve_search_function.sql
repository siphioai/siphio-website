-- Improved search function that searches both name and display_name
-- This ensures users find "Chicken Breast" when typing "chicken"

-- Drop the old function first
DROP FUNCTION IF EXISTS search_foods_fuzzy(TEXT, FLOAT, INT);

-- Create the improved function
CREATE OR REPLACE FUNCTION search_foods_fuzzy(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_name TEXT,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  relevance_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH scored_foods AS (
    SELECT
      f.id,
      f.name,
      f.display_name,
      f.calories_per_100g,
      f.protein_per_100g,
      f.carbs_per_100g,
      f.fat_per_100g,
      -- Combine FTS and trigram similarity for best results
      GREATEST(
        -- Full-text search on search_vector (highest priority)
        ts_rank(f.search_vector, websearch_to_tsquery('english', search_query)) * 2.0,
        -- Trigram similarity on name
        SIMILARITY(f.name, search_query),
        -- Trigram similarity on display_name (prioritized for clean matches)
        SIMILARITY(COALESCE(f.display_name, f.name), search_query) * 1.5
      ) AS score
    FROM food_items f
    WHERE
      -- Match on FTS OR trigram similarity on either field
      f.search_vector @@ websearch_to_tsquery('english', search_query)
      OR SIMILARITY(f.name, search_query) > similarity_threshold
      OR SIMILARITY(COALESCE(f.display_name, f.name), search_query) > similarity_threshold
  )
  SELECT
    scored_foods.id,
    scored_foods.name,
    scored_foods.display_name,
    scored_foods.calories_per_100g,
    scored_foods.protein_per_100g,
    scored_foods.carbs_per_100g,
    scored_foods.fat_per_100g,
    scored_foods.score
  FROM scored_foods
  WHERE scored_foods.score > 0
  ORDER BY scored_foods.score DESC, scored_foods.display_name ASC
  LIMIT max_results;
END;
$$;
