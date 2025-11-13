-- =====================================================
-- CURATED FOODS SYSTEM - Complete Schema
-- =====================================================
-- This migration creates the entire curated foods system
-- for intelligent, fast food search with AI-powered curation

-- =====================================================
-- 1. CURATED FOODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS curated_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Food Identification
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,

  -- Macros per 100g (standardized base)
  protein_per_100g DECIMAL(6,2) NOT NULL,
  carbs_per_100g DECIMAL(6,2) NOT NULL,
  fat_per_100g DECIMAL(6,2) NOT NULL,
  calories_per_100g DECIMAL(6,2) NOT NULL,
  fiber_per_100g DECIMAL(6,2) DEFAULT 0,
  sugar_per_100g DECIMAL(6,2) DEFAULT 0,
  sodium_per_100mg DECIMAL(6,2) DEFAULT 0,

  -- Additional Details
  variation_type TEXT, -- 'breast', 'thigh', 'fillet', etc.
  preparation TEXT, -- 'raw', 'cooked', 'grilled', 'fried', etc.
  modifiers TEXT[], -- ['no skin', 'boneless', 'wild', etc.]

  -- Metadata
  verified BOOLEAN DEFAULT false,
  source TEXT[] DEFAULT ARRAY['ai_curated'],
  usda_fdc_id INTEGER,
  confidence_score DECIMAL(3,2) DEFAULT 0.95,

  -- Search Optimization (using trigger instead of GENERATED for PostgreSQL compatibility)
  search_vector tsvector,
  aliases TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Common Serving Sizes (JSONB for flexibility)
  serving_sizes JSONB DEFAULT '[]'::jsonb,

  -- Quality Control
  review_status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_category CHECK (category IN (
    'protein_meat', 'protein_fish', 'protein_eggs_dairy',
    'vegetables', 'fruits', 'grains', 'legumes',
    'nuts_seeds', 'oils_fats', 'beverages', 'other'
  )),
  CONSTRAINT valid_review_status CHECK (review_status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT positive_macros CHECK (
    protein_per_100g >= 0 AND
    carbs_per_100g >= 0 AND
    fat_per_100g >= 0 AND
    calories_per_100g >= 0
  )
);

-- =====================================================
-- 2. SEARCH ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS food_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Search Details
  query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Results
  result_count INTEGER DEFAULT 0,
  source TEXT NOT NULL, -- 'curated', 'usda', 'hybrid'
  curated_count INTEGER DEFAULT 0,
  usda_count INTEGER DEFAULT 0,

  -- User Interaction
  selected_food_id UUID REFERENCES curated_foods(id) ON DELETE SET NULL,
  selected_usda_fdc_id INTEGER,
  position_clicked INTEGER, -- Which result was clicked (1-10)

  -- Performance
  search_duration_ms INTEGER,

  -- Feedback
  user_feedback TEXT, -- 'helpful', 'not_helpful', 'incorrect'

  -- Timestamp
  searched_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for analytics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. USER FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS curated_food_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  curated_food_id UUID REFERENCES curated_foods(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  feedback_type TEXT NOT NULL, -- 'incorrect_macros', 'wrong_name', 'duplicate', 'other'
  feedback_text TEXT,

  suggested_name TEXT,
  suggested_macros JSONB, -- { protein: X, carbs: Y, fat: Z, calories: W }

  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'applied', 'rejected'
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_feedback_type CHECK (feedback_type IN (
    'incorrect_macros', 'wrong_name', 'duplicate', 'missing_variation', 'other'
  )),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewed', 'applied', 'rejected'))
);

-- =====================================================
-- 4. TRIGGER FUNCTION FOR SEARCH VECTOR
-- =====================================================

-- Function to automatically update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.display_name, '') || ' ' ||
    COALESCE(array_to_string(NEW.aliases, ' '), '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.subcategory, '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to update search_vector before insert or update
CREATE TRIGGER curated_foods_search_vector_update
  BEFORE INSERT OR UPDATE ON curated_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Full-text search index (most important!)
CREATE INDEX IF NOT EXISTS idx_curated_foods_search
ON curated_foods USING GIN(search_vector);

-- Category-based filtering
CREATE INDEX IF NOT EXISTS idx_curated_foods_category
ON curated_foods(category);

CREATE INDEX IF NOT EXISTS idx_curated_foods_subcategory
ON curated_foods(subcategory) WHERE subcategory IS NOT NULL;

-- Variation and preparation filtering
CREATE INDEX IF NOT EXISTS idx_curated_foods_variation
ON curated_foods(variation_type) WHERE variation_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curated_foods_preparation
ON curated_foods(preparation) WHERE preparation IS NOT NULL;

-- Quality control
CREATE INDEX IF NOT EXISTS idx_curated_foods_review_status
ON curated_foods(review_status);

CREATE INDEX IF NOT EXISTS idx_curated_foods_verified
ON curated_foods(verified) WHERE verified = true;

-- Usage tracking
CREATE INDEX IF NOT EXISTS idx_curated_foods_usage
ON curated_foods(usage_count DESC, last_used_at DESC);

-- USDA linking
CREATE INDEX IF NOT EXISTS idx_curated_foods_usda_fdc_id
ON curated_foods(usda_fdc_id) WHERE usda_fdc_id IS NOT NULL;

-- Search analytics indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_user
ON food_search_analytics(user_id, searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query
ON food_search_analytics(query, searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_analytics_source
ON food_search_analytics(source);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_food
ON curated_food_feedback(curated_food_id);

CREATE INDEX IF NOT EXISTS idx_feedback_status
ON curated_food_feedback(status, created_at DESC);

-- =====================================================
-- 6. FUNCTIONS FOR SEARCH
-- =====================================================

-- Smart search function with ranking
CREATE OR REPLACE FUNCTION search_curated_foods(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_name TEXT,
  category TEXT,
  subcategory TEXT,
  protein_per_100g DECIMAL,
  carbs_per_100g DECIMAL,
  fat_per_100g DECIMAL,
  calories_per_100g DECIMAL,
  fiber_per_100g DECIMAL,
  variation_type TEXT,
  preparation TEXT,
  modifiers TEXT[],
  serving_sizes JSONB,
  usda_fdc_id INTEGER,
  relevance_rank REAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.id,
    cf.name,
    cf.display_name,
    cf.category,
    cf.subcategory,
    cf.protein_per_100g,
    cf.carbs_per_100g,
    cf.fat_per_100g,
    cf.calories_per_100g,
    cf.fiber_per_100g,
    cf.variation_type,
    cf.preparation,
    cf.modifiers,
    cf.serving_sizes,
    cf.usda_fdc_id,
    -- Ranking formula: exact match > word match > partial match
    (
      CASE
        WHEN LOWER(cf.name) = LOWER(search_query) THEN 1.0
        WHEN LOWER(cf.display_name) = LOWER(search_query) THEN 0.95
        WHEN cf.name ILIKE search_query || '%' THEN 0.9
        ELSE ts_rank_cd(cf.search_vector, plainto_tsquery('english', search_query))
      END
    )::REAL as relevance_rank
  FROM curated_foods cf
  WHERE
    cf.review_status = 'approved'
    AND (
      cf.search_vector @@ plainto_tsquery('english', search_query)
      OR cf.name ILIKE '%' || search_query || '%'
      OR cf.display_name ILIKE '%' || search_query || '%'
      OR search_query = ANY(cf.aliases)
    )
    AND (category_filter IS NULL OR cf.category = category_filter)
  ORDER BY relevance_rank DESC, cf.usage_count DESC
  LIMIT limit_count;
END;
$$;

-- Track food usage
CREATE OR REPLACE FUNCTION increment_food_usage(food_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE curated_foods
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = food_id;
END;
$$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_curated_foods_updated_at
  BEFORE UPDATE ON curated_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE curated_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_food_feedback ENABLE ROW LEVEL SECURITY;

-- Everyone can read approved curated foods
CREATE POLICY "Anyone can view approved curated foods"
  ON curated_foods FOR SELECT
  USING (review_status = 'approved');

-- Everyone can search (execute function)
GRANT EXECUTE ON FUNCTION search_curated_foods TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_food_usage TO authenticated, anon;

-- Users can create search analytics
CREATE POLICY "Users can create search analytics"
  ON food_search_analytics FOR INSERT
  WITH CHECK (true);

-- Users can view their own analytics
CREATE POLICY "Users can view own analytics"
  ON food_search_analytics FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can submit feedback
CREATE POLICY "Users can submit feedback"
  ON curated_food_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON curated_food_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON curated_foods TO authenticated, anon;
GRANT INSERT ON food_search_analytics TO authenticated, anon;
GRANT SELECT ON food_search_analytics TO authenticated, anon;
GRANT INSERT, SELECT ON curated_food_feedback TO authenticated, anon;

-- =====================================================
-- 9. INITIAL SEED DATA (Sample)
-- =====================================================

-- Insert a few sample foods to demonstrate structure
INSERT INTO curated_foods (
  name, display_name, category, subcategory,
  protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g, fiber_per_100g,
  variation_type, preparation, modifiers, aliases, serving_sizes, usda_fdc_id, verified
) VALUES
(
  'Chicken Breast',
  'Chicken Breast (Cooked, No Skin)',
  'protein_meat',
  'poultry',
  31.0, 0, 3.6, 165, 0,
  'breast', 'cooked', ARRAY['no skin', 'boneless'],
  ARRAY['chicken breast', 'grilled chicken breast', 'baked chicken breast'],
  '[
    {"unit": "oz", "grams": 28, "display": "1 oz"},
    {"unit": "breast", "grams": 174, "display": "1 medium breast (6 oz)"},
    {"unit": "cup", "grams": 140, "display": "1 cup diced"}
  ]'::jsonb,
  171477,
  true
),
(
  'Salmon',
  'Salmon (Atlantic, Cooked)',
  'protein_fish',
  'fatty_fish',
  25.4, 0, 12.4, 206, 0,
  'fillet', 'cooked', ARRAY['atlantic', 'farmed'],
  ARRAY['salmon', 'salmon fillet', 'cooked salmon'],
  '[
    {"unit": "oz", "grams": 28, "display": "1 oz"},
    {"unit": "fillet", "grams": 178, "display": "1 fillet (6.3 oz)"},
    {"unit": "cup", "grams": 155, "display": "1 cup flaked"}
  ]'::jsonb,
  175167,
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run AI curation script to populate database
-- 2. Update API routes to use hybrid search
-- 3. Monitor search analytics for improvements
