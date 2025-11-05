-- =====================================================
-- MINIMAL DUMMY DATA - STEP BY STEP
-- Run each section separately to identify any issues
-- =====================================================

-- ========== STEP 1: Create Food Items ==========
-- Run this first and verify it works
INSERT INTO food_items (usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
VALUES
  ('seed_eggs', 'Scrambled Eggs', 148, 10, 1.6, 10),
  ('seed_toast', 'Whole Wheat Toast', 247, 13, 41, 3.5),
  ('seed_chicken', 'Grilled Chicken Breast', 165, 31, 0, 3.6),
  ('seed_rice', 'Brown Rice', 112, 2.6, 24, 0.9),
  ('seed_broccoli', 'Broccoli', 34, 2.8, 7, 0.4)
ON CONFLICT (usda_fdc_id) DO UPDATE SET
  name = EXCLUDED.name,
  calories_per_100g = EXCLUDED.calories_per_100g,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g;

-- Verify food items created
SELECT 'Step 1 Complete: Food Items' as status, COUNT(*) as count
FROM food_items
WHERE usda_fdc_id LIKE 'seed_%';


-- ========== STEP 2: Create Macro Goals ==========
-- This will create goals for today and the past 13 days (14 days total)
-- Replace with actual user_id if needed, or this will use the first user
INSERT INTO macro_goals (user_id, date, calories_target, protein_target, carbs_target, fat_target)
SELECT
  (SELECT id FROM users LIMIT 1),
  CURRENT_DATE - d,
  2000,
  150,
  200,
  65
FROM generate_series(0, 13) as d
ON CONFLICT (user_id, date) DO NOTHING;

-- Verify goals created
SELECT 'Step 2 Complete: Macro Goals' as status, COUNT(*) as count
FROM macro_goals
WHERE date >= CURRENT_DATE - 13;


-- ========== STEP 3: Create Today's Breakfast ==========
-- First, create the meal
INSERT INTO meals (user_id, date, meal_type)
SELECT id, CURRENT_DATE, 'breakfast'
FROM users
LIMIT 1
ON CONFLICT DO NOTHING
RETURNING id;

-- Note the meal ID from above, then insert meal items
-- You'll need to replace 'YOUR_MEAL_ID' with the actual UUID returned above
-- Or run this as a transaction:

DO $$
DECLARE
  v_user_id UUID;
  v_meal_id UUID;
  v_eggs_id UUID;
  v_toast_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users LIMIT 1;

  -- Get food item IDs
  SELECT id INTO v_eggs_id FROM food_items WHERE usda_fdc_id = 'seed_eggs';
  SELECT id INTO v_toast_id FROM food_items WHERE usda_fdc_id = 'seed_toast';

  -- Create breakfast meal
  INSERT INTO meals (user_id, date, meal_type)
  VALUES (v_user_id, CURRENT_DATE, 'breakfast')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_meal_id;

  -- If meal already exists, get its ID
  IF v_meal_id IS NULL THEN
    SELECT id INTO v_meal_id
    FROM meals
    WHERE user_id = v_user_id
      AND date = CURRENT_DATE
      AND meal_type = 'breakfast';
  END IF;

  -- Add meal items
  INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
  VALUES
    (v_meal_id, v_eggs_id, 150, 222, 15, 2.4, 15, CURRENT_DATE + TIME '07:30:00'),
    (v_meal_id, v_toast_id, 70, 173, 9.1, 28.7, 2.45, CURRENT_DATE + TIME '07:30:00')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Step 3 Complete: Breakfast created';
END $$;

-- Verify breakfast created
SELECT 'Step 3 Complete: Breakfast' as status,
       COUNT(mi.*) as items,
       SUM(mi.calories)::INTEGER as total_calories
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.date = CURRENT_DATE AND m.meal_type = 'breakfast';


-- ========== STEP 4: Create Today's Lunch ==========
DO $$
DECLARE
  v_user_id UUID;
  v_meal_id UUID;
  v_chicken_id UUID;
  v_rice_id UUID;
  v_broccoli_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users LIMIT 1;

  -- Get food item IDs
  SELECT id INTO v_chicken_id FROM food_items WHERE usda_fdc_id = 'seed_chicken';
  SELECT id INTO v_rice_id FROM food_items WHERE usda_fdc_id = 'seed_rice';
  SELECT id INTO v_broccoli_id FROM food_items WHERE usda_fdc_id = 'seed_broccoli';

  -- Create lunch meal
  INSERT INTO meals (user_id, date, meal_type)
  VALUES (v_user_id, CURRENT_DATE, 'lunch')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_meal_id;

  -- If meal already exists, get its ID
  IF v_meal_id IS NULL THEN
    SELECT id INTO v_meal_id
    FROM meals
    WHERE user_id = v_user_id
      AND date = CURRENT_DATE
      AND meal_type = 'lunch';
  END IF;

  -- Add meal items
  INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
  VALUES
    (v_meal_id, v_chicken_id, 200, 330, 62, 0, 7.2, CURRENT_DATE + TIME '12:30:00'),
    (v_meal_id, v_rice_id, 150, 168, 3.9, 36, 1.35, CURRENT_DATE + TIME '12:30:00'),
    (v_meal_id, v_broccoli_id, 100, 34, 2.8, 7, 0.4, CURRENT_DATE + TIME '12:30:00')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Step 4 Complete: Lunch created';
END $$;

-- Verify lunch created
SELECT 'Step 4 Complete: Lunch' as status,
       COUNT(mi.*) as items,
       SUM(mi.calories)::INTEGER as total_calories
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.date = CURRENT_DATE AND m.meal_type = 'lunch';


-- ========== FINAL SUMMARY ==========
SELECT
  '✅ Minimal seed data created!' as status,
  (SELECT COUNT(*) FROM food_items WHERE usda_fdc_id LIKE 'seed_%') as food_items,
  (SELECT COUNT(*) FROM macro_goals WHERE date >= CURRENT_DATE - 13) as goals_days,
  (SELECT COUNT(*) FROM meals WHERE date = CURRENT_DATE) as todays_meals,
  (SELECT COUNT(*) FROM meal_items WHERE meal_id IN (SELECT id FROM meals WHERE date = CURRENT_DATE)) as todays_items;

-- Show today's totals
SELECT
  m.meal_type,
  COUNT(mi.id) as items,
  SUM(mi.calories)::INTEGER as calories,
  SUM(mi.protein)::DECIMAL(10,1) as protein,
  SUM(mi.carbs)::DECIMAL(10,1) as carbs,
  SUM(mi.fat)::DECIMAL(10,1) as fat
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.date = CURRENT_DATE
GROUP BY m.meal_type
ORDER BY m.meal_type;
