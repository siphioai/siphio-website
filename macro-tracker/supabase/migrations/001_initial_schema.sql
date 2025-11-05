-- supabase/migrations/001_initial_schema.sql
-- CRITICAL: Run this in Supabase SQL Editor after project creation

-- ===== USERS TABLE =====
-- Future multi-user support (single user for now)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default user for single-user mode
INSERT INTO users (email, name) VALUES ('default@example.com', 'Default User');

-- ===== MACRO GOALS TABLE =====
-- Allows changing goals over time (different targets per day)
CREATE TABLE macro_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  calories_target INTEGER NOT NULL CHECK (calories_target > 0),
  protein_target INTEGER NOT NULL CHECK (protein_target >= 0),
  carbs_target INTEGER NOT NULL CHECK (carbs_target >= 0),
  fat_target INTEGER NOT NULL CHECK (fat_target >= 0),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_macro_goals_user_date ON macro_goals(user_id, date DESC);

-- ===== FOOD ITEMS TABLE =====
-- Cached USDA food items (avoid repeated API calls)
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usda_fdc_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  calories_per_100g DECIMAL(10, 2) NOT NULL DEFAULT 0,
  protein_per_100g DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs_per_100g DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fat_per_100g DECIMAL(10, 2) NOT NULL DEFAULT 0,
  serving_size_g DECIMAL(10, 2),
  category TEXT,
  last_synced TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_items_name ON food_items(name);
CREATE INDEX idx_food_items_usda_id ON food_items(usda_fdc_id);

-- ===== MEALS TABLE =====
-- Meal containers (breakfast, lunch, dinner, snack)
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type meal_type_enum NOT NULL,
  name TEXT, -- Optional custom name override
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, meal_type) -- Prevent duplicate meals per day
);

CREATE INDEX idx_meals_user_date ON meals(user_id, date DESC);

-- ===== MEAL ITEMS TABLE =====
-- Individual food entries within meals
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE RESTRICT,
  quantity_g DECIMAL(10, 2) NOT NULL CHECK (quantity_g > 0),
  -- CRITICAL: Store calculated macros (not just reference) for historical accuracy
  calories DECIMAL(10, 2) NOT NULL,
  protein DECIMAL(10, 2) NOT NULL,
  carbs DECIMAL(10, 2) NOT NULL,
  fat DECIMAL(10, 2) NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);

-- ===== DAILY SUMMARY TABLE =====
-- Auto-updated by trigger for performance (no manual recalculation needed)
CREATE TABLE daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(10, 2) DEFAULT 0,
  total_carbs DECIMAL(10, 2) DEFAULT 0,
  total_fat DECIMAL(10, 2) DEFAULT 0,
  calories_target INTEGER,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  has_logged BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summary_user_date ON daily_summary(user_id, date DESC);

-- ===== TRIGGER FUNCTION =====
-- Auto-updates daily_summary when meal_items change
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  meal_date DATE;
  meal_user_id UUID;
BEGIN
  -- Get meal date and user_id from parent meal
  SELECT m.date, m.user_id INTO meal_date, meal_user_id
  FROM meals m
  WHERE m.id = COALESCE(NEW.meal_id, OLD.meal_id);

  -- Recalculate daily totals (INSERT or UPDATE daily_summary)
  INSERT INTO daily_summary (user_id, date, total_calories, total_protein, total_carbs, total_fat, has_logged, updated_at)
  SELECT
    meal_user_id,
    meal_date,
    COALESCE(SUM(mi.calories), 0)::INTEGER,
    COALESCE(SUM(mi.protein), 0),
    COALESCE(SUM(mi.carbs), 0),
    COALESCE(SUM(mi.fat), 0),
    COUNT(*) > 0,
    NOW()
  FROM meals m
  LEFT JOIN meal_items mi ON m.id = mi.meal_id
  WHERE m.user_id = meal_user_id AND m.date = meal_date
  GROUP BY m.user_id, m.date
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    has_logged = EXCLUDED.has_logged,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to meal_items table
CREATE TRIGGER trigger_update_daily_summary
AFTER INSERT OR UPDATE OR DELETE ON meal_items
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

-- ===== ROW LEVEL SECURITY (RLS) =====
-- CRITICAL: Required for Supabase real-time to work
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Permissive policies for single-user mode
-- TODO: Update these when adding auth (filter by auth.uid())
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their goals" ON macro_goals
  FOR ALL USING (true);

CREATE POLICY "Users can manage their meals" ON meals
  FOR ALL USING (true);

CREATE POLICY "Users can manage their meal items" ON meal_items
  FOR ALL USING (true);

CREATE POLICY "Users can view their daily summary" ON daily_summary
  FOR SELECT USING (true);

-- Food items are public (read-only for users, writable by API)
CREATE POLICY "Food items are viewable by all" ON food_items
  FOR SELECT USING (true);

CREATE POLICY "Food items are insertable" ON food_items
  FOR INSERT WITH CHECK (true);

-- ===== ENABLE REAL-TIME =====
-- CRITICAL: Enable real-time replication for daily_summary table
ALTER PUBLICATION supabase_realtime ADD TABLE daily_summary;

-- ===== VERIFICATION QUERY =====
-- Run this to verify schema was created successfully
SELECT
  'Tables created: ' || COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'macro_goals', 'food_items', 'meals', 'meal_items', 'daily_summary');
