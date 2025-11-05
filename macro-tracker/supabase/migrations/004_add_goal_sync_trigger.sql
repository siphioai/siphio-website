-- supabase/migrations/004_add_goal_sync_trigger.sql
-- Sync macro_goals changes to daily_summary in real-time

-- ===== FUNCTION TO SYNC GOALS TO DAILY SUMMARY =====
-- This ensures that when users update their macro goals,
-- the daily_summary table is immediately updated with the new targets
-- which triggers real-time updates in the UI via Supabase subscriptions

CREATE OR REPLACE FUNCTION sync_goals_to_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  existing_calories INTEGER;
  existing_protein DECIMAL;
  existing_carbs DECIMAL;
  existing_fat DECIMAL;
  existing_logged BOOLEAN;
BEGIN
  -- Get existing totals if they exist
  SELECT
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    has_logged
  INTO
    existing_calories,
    existing_protein,
    existing_carbs,
    existing_fat,
    existing_logged
  FROM daily_summary
  WHERE user_id = NEW.user_id AND date = NEW.date;

  -- Update or insert daily_summary with the new goal targets
  INSERT INTO daily_summary (
    user_id,
    date,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    calories_target,
    protein_target,
    carbs_target,
    fat_target,
    has_logged,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.date,
    COALESCE(existing_calories, 0),
    COALESCE(existing_protein, 0),
    COALESCE(existing_carbs, 0),
    COALESCE(existing_fat, 0),
    NEW.calories_target,
    NEW.protein_target,
    NEW.carbs_target,
    NEW.fat_target,
    COALESCE(existing_logged, false),
    NOW()
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    calories_target = EXCLUDED.calories_target,
    protein_target = EXCLUDED.protein_target,
    carbs_target = EXCLUDED.carbs_target,
    fat_target = EXCLUDED.fat_target,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGER ON MACRO_GOALS TABLE =====
-- Fires whenever a goal is inserted or updated
CREATE TRIGGER trigger_sync_goals_to_daily_summary
AFTER INSERT OR UPDATE ON macro_goals
FOR EACH ROW
EXECUTE FUNCTION sync_goals_to_daily_summary();

-- ===== UPDATE EXISTING FUNCTION =====
-- Enhance the existing update_daily_summary function to also sync goals
-- This ensures that when meal items change, goals are also included

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

  -- Recalculate daily totals and include goal targets
  INSERT INTO daily_summary (
    user_id,
    date,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    calories_target,
    protein_target,
    carbs_target,
    fat_target,
    has_logged,
    updated_at
  )
  SELECT
    meal_user_id,
    meal_date,
    COALESCE(SUM(mi.calories), 0)::INTEGER,
    COALESCE(SUM(mi.protein), 0),
    COALESCE(SUM(mi.carbs), 0),
    COALESCE(SUM(mi.fat), 0),
    COALESCE(mg.calories_target, 2000),
    COALESCE(mg.protein_target, 150),
    COALESCE(mg.carbs_target, 200),
    COALESCE(mg.fat_target, 65),
    COUNT(mi.*) > 0,
    NOW()
  FROM meals m
  LEFT JOIN meal_items mi ON m.id = mi.meal_id
  LEFT JOIN macro_goals mg ON mg.user_id = meal_user_id AND mg.date = meal_date
  WHERE m.user_id = meal_user_id AND m.date = meal_date
  GROUP BY m.user_id, m.date, mg.calories_target, mg.protein_target, mg.carbs_target, mg.fat_target
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    calories_target = EXCLUDED.calories_target,
    protein_target = EXCLUDED.protein_target,
    carbs_target = EXCLUDED.carbs_target,
    fat_target = EXCLUDED.fat_target,
    has_logged = EXCLUDED.has_logged,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===== VERIFICATION =====
SELECT 'Goal sync trigger created successfully' as status;
