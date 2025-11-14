-- Meal Plans Table Schema
-- Stores AI-generated meal plans with JSONB plan data
-- Created for AI Nutrition Coach meal plan generator feature

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one plan per user per week
  UNIQUE(user_id, week_start_date)
);

-- Index for fast lookups by user and date
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, week_start_date);

-- Index for querying plan data structure
CREATE INDEX IF NOT EXISTS idx_meal_plans_data ON meal_plans USING GIN (plan_data);

-- Row Level Security (RLS) Policies
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Users can only see their own meal plans
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own meal plans
CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own meal plans
CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meal plans
CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Example plan_data JSONB structure:
-- {
--   "week_start": "2025-01-13",
--   "daily_target": {
--     "calories": 2000,
--     "protein": 160,
--     "carbs": 200,
--     "fat": 65
--   },
--   "days": [
--     {
--       "date": "2025-01-13",
--       "day_name": "Monday",
--       "meals": [
--         {
--           "id": "meal_001",
--           "name": "Greek Yogurt Protein Bowl",
--           "meal_type": "breakfast",
--           "foods": [
--             {
--               "name": "Greek Yogurt 0% Fat",
--               "quantity_g": 200,
--               "calories": 120,
--               "protein": 20,
--               "carbs": 9,
--               "fat": 0
--             }
--           ],
--           "totals": {
--             "calories": 357,
--             "protein": 24.7,
--             "carbs": 51,
--             "fat": 6.3
--           }
--         }
--       ],
--       "daily_totals": {
--         "calories": 2010,
--         "protein": 162,
--         "carbs": 205,
--         "fat": 63
--       }
--     }
--   ]
-- }
