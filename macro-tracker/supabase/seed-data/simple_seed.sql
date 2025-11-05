-- =====================================================
-- SIMPLE DUMMY DATA GENERATOR
-- Simplified version with better error handling
-- =====================================================

-- Step 1: Create food items
INSERT INTO food_items (usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
VALUES
  -- Breakfast
  ('seed_eggs', 'Scrambled Eggs', 148, 10, 1.6, 10),
  ('seed_toast', 'Whole Wheat Toast', 247, 13, 41, 3.5),
  ('seed_yogurt', 'Greek Yogurt', 97, 10, 3.6, 5),
  ('seed_banana', 'Banana', 89, 1.1, 23, 0.3),

  -- Proteins
  ('seed_chicken', 'Grilled Chicken Breast', 165, 31, 0, 3.6),
  ('seed_salmon', 'Salmon Fillet', 206, 22, 0, 13),
  ('seed_steak', 'Ribeye Steak', 291, 25, 0, 22),
  ('seed_turkey', 'Turkey Breast', 135, 30, 0, 1),

  -- Carbs
  ('seed_rice', 'Brown Rice', 112, 2.6, 24, 0.9),
  ('seed_potato', 'Sweet Potato', 86, 1.6, 20, 0.1),
  ('seed_pasta', 'Whole Wheat Pasta', 124, 5, 26, 0.5),

  -- Vegetables
  ('seed_broccoli', 'Broccoli', 34, 2.8, 7, 0.4),
  ('seed_salad', 'Mixed Salad', 15, 1.4, 2.9, 0.2),
  ('seed_spinach', 'Spinach', 23, 2.9, 3.6, 0.4),

  -- Snacks
  ('seed_almonds', 'Almonds', 579, 21, 22, 50),
  ('seed_protein', 'Protein Shake', 120, 24, 3, 1.5)
ON CONFLICT (usda_fdc_id) DO UPDATE SET
  name = EXCLUDED.name,
  calories_per_100g = EXCLUDED.calories_per_100g,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g;

-- Step 2: Get the user ID (you may need to adjust this)
-- Replace YOUR_USER_ID below with actual user ID from: SELECT id FROM users;

-- For convenience, let's create a temporary table with the user ID
CREATE TEMP TABLE IF NOT EXISTS temp_user AS
SELECT id as user_id FROM users LIMIT 1;

-- Step 3: Create macro goals for past 14 days
INSERT INTO macro_goals (user_id, date, calories_target, protein_target, carbs_target, fat_target)
SELECT
  user_id,
  CURRENT_DATE - d as date,
  2000 as calories_target,
  150 as protein_target,
  200 as carbs_target,
  65 as fat_target
FROM temp_user, generate_series(0, 13) as d
ON CONFLICT (user_id, date) DO NOTHING;

-- Step 4: Create meals and meal items for each day
-- Day 0 (today)
WITH today_user AS (SELECT user_id FROM temp_user),
breakfast_meal AS (
  INSERT INTO meals (user_id, date, meal_type)
  SELECT user_id, CURRENT_DATE, 'breakfast'
  FROM today_user
  RETURNING id
)
INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
SELECT
  breakfast_meal.id,
  fi.id,
  CASE fi.usda_fdc_id
    WHEN 'seed_eggs' THEN 150
    WHEN 'seed_toast' THEN 70
  END as quantity_g,
  CASE fi.usda_fdc_id
    WHEN 'seed_eggs' THEN 148 * 1.5
    WHEN 'seed_toast' THEN 247 * 0.7
  END as calories,
  CASE fi.usda_fdc_id
    WHEN 'seed_eggs' THEN 10 * 1.5
    WHEN 'seed_toast' THEN 13 * 0.7
  END as protein,
  CASE fi.usda_fdc_id
    WHEN 'seed_eggs' THEN 1.6 * 1.5
    WHEN 'seed_toast' THEN 41 * 0.7
  END as carbs,
  CASE fi.usda_fdc_id
    WHEN 'seed_eggs' THEN 10 * 1.5
    WHEN 'seed_toast' THEN 3.5 * 0.7
  END as fat,
  CURRENT_DATE + TIME '07:30:00' as logged_at
FROM breakfast_meal, food_items fi
WHERE fi.usda_fdc_id IN ('seed_eggs', 'seed_toast');

-- Lunch for today
WITH today_user AS (SELECT user_id FROM temp_user),
lunch_meal AS (
  INSERT INTO meals (user_id, date, meal_type)
  SELECT user_id, CURRENT_DATE, 'lunch'
  FROM today_user
  RETURNING id
)
INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
SELECT
  lunch_meal.id,
  fi.id,
  CASE fi.usda_fdc_id
    WHEN 'seed_chicken' THEN 200
    WHEN 'seed_rice' THEN 150
    WHEN 'seed_broccoli' THEN 100
  END as quantity_g,
  CASE fi.usda_fdc_id
    WHEN 'seed_chicken' THEN 165 * 2
    WHEN 'seed_rice' THEN 112 * 1.5
    WHEN 'seed_broccoli' THEN 34
  END as calories,
  CASE fi.usda_fdc_id
    WHEN 'seed_chicken' THEN 31 * 2
    WHEN 'seed_rice' THEN 2.6 * 1.5
    WHEN 'seed_broccoli' THEN 2.8
  END as protein,
  CASE fi.usda_fdc_id
    WHEN 'seed_chicken' THEN 0
    WHEN 'seed_rice' THEN 24 * 1.5
    WHEN 'seed_broccoli' THEN 7
  END as carbs,
  CASE fi.usda_fdc_id
    WHEN 'seed_chicken' THEN 3.6 * 2
    WHEN 'seed_rice' THEN 0.9 * 1.5
    WHEN 'seed_broccoli' THEN 0.4
  END as fat,
  CURRENT_DATE + TIME '12:30:00' as logged_at
FROM lunch_meal, food_items fi
WHERE fi.usda_fdc_id IN ('seed_chicken', 'seed_rice', 'seed_broccoli');

-- Dinner for today
WITH today_user AS (SELECT user_id FROM temp_user),
dinner_meal AS (
  INSERT INTO meals (user_id, date, meal_type)
  SELECT user_id, CURRENT_DATE, 'dinner'
  FROM today_user
  RETURNING id
)
INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
SELECT
  dinner_meal.id,
  fi.id,
  CASE fi.usda_fdc_id
    WHEN 'seed_salmon' THEN 180
    WHEN 'seed_potato' THEN 200
    WHEN 'seed_salad' THEN 120
  END as quantity_g,
  CASE fi.usda_fdc_id
    WHEN 'seed_salmon' THEN 206 * 1.8
    WHEN 'seed_potato' THEN 86 * 2
    WHEN 'seed_salad' THEN 15 * 1.2
  END as calories,
  CASE fi.usda_fdc_id
    WHEN 'seed_salmon' THEN 22 * 1.8
    WHEN 'seed_potato' THEN 1.6 * 2
    WHEN 'seed_salad' THEN 1.4 * 1.2
  END as protein,
  CASE fi.usda_fdc_id
    WHEN 'seed_salmon' THEN 0
    WHEN 'seed_potato' THEN 20 * 2
    WHEN 'seed_salad' THEN 2.9 * 1.2
  END as carbs,
  CASE fi.usda_fdc_id
    WHEN 'seed_salmon' THEN 13 * 1.8
    WHEN 'seed_potato' THEN 0.1 * 2
    WHEN 'seed_salad' THEN 0.2 * 1.2
  END as fat,
  CURRENT_DATE + TIME '18:30:00' as logged_at
FROM dinner_meal, food_items fi
WHERE fi.usda_fdc_id IN ('seed_salmon', 'seed_potato', 'seed_salad');

-- Repeat for yesterday (Day -1)
WITH yesterday_user AS (SELECT user_id FROM temp_user),
breakfast_meal AS (
  INSERT INTO meals (user_id, date, meal_type)
  SELECT user_id, CURRENT_DATE - 1, 'breakfast'
  FROM yesterday_user
  RETURNING id
)
INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
SELECT
  breakfast_meal.id,
  fi.id,
  CASE fi.usda_fdc_id
    WHEN 'seed_yogurt' THEN 200
    WHEN 'seed_banana' THEN 120
  END as quantity_g,
  CASE fi.usda_fdc_id
    WHEN 'seed_yogurt' THEN 97 * 2
    WHEN 'seed_banana' THEN 89 * 1.2
  END as calories,
  CASE fi.usda_fdc_id
    WHEN 'seed_yogurt' THEN 10 * 2
    WHEN 'seed_banana' THEN 1.1 * 1.2
  END as protein,
  CASE fi.usda_fdc_id
    WHEN 'seed_yogurt' THEN 3.6 * 2
    WHEN 'seed_banana' THEN 23 * 1.2
  END as carbs,
  CASE fi.usda_fdc_id
    WHEN 'seed_yogurt' THEN 5 * 2
    WHEN 'seed_banana' THEN 0.3 * 1.2
  END as fat,
  (CURRENT_DATE - 1) + TIME '07:45:00' as logged_at
FROM breakfast_meal, food_items fi
WHERE fi.usda_fdc_id IN ('seed_yogurt', 'seed_banana');

-- Add a snack for yesterday
WITH yesterday_user AS (SELECT user_id FROM temp_user),
snack_meal AS (
  INSERT INTO meals (user_id, date, meal_type)
  SELECT user_id, CURRENT_DATE - 1, 'snack'
  FROM yesterday_user
  RETURNING id
)
INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
SELECT
  snack_meal.id,
  fi.id,
  40 as quantity_g,
  579 * 0.4 as calories,
  21 * 0.4 as protein,
  22 * 0.4 as carbs,
  50 * 0.4 as fat,
  (CURRENT_DATE - 1) + TIME '15:00:00' as logged_at
FROM snack_meal, food_items fi
WHERE fi.usda_fdc_id = 'seed_almonds';

-- Summary query
SELECT
  '✅ Seed data created!' as status,
  (SELECT COUNT(*) FROM food_items WHERE usda_fdc_id LIKE 'seed_%') as food_items_created,
  (SELECT COUNT(DISTINCT date) FROM meals WHERE date >= CURRENT_DATE - 13) as days_with_meals,
  (SELECT COUNT(*) FROM meals WHERE date >= CURRENT_DATE - 1) as recent_meals_created;

-- Show today's data
SELECT
  'Today' as day,
  m.meal_type,
  COUNT(mi.id) as items,
  SUM(mi.calories)::INTEGER as calories,
  SUM(mi.protein)::INTEGER as protein,
  SUM(mi.carbs)::INTEGER as carbs,
  SUM(mi.fat)::INTEGER as fat
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.date = CURRENT_DATE
GROUP BY m.meal_type
ORDER BY m.meal_type;

-- Clean up temp table
DROP TABLE IF EXISTS temp_user;
