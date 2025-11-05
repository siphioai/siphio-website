-- =====================================================
-- SEED DATA WITH MANUAL DAILY SUMMARY UPDATE
-- This version manually updates daily_summary to ensure stats appear
-- =====================================================

-- ========== STEP 1: Create Food Items ==========
INSERT INTO food_items (usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
VALUES
  ('seed_eggs', 'Scrambled Eggs', 148, 10, 1.6, 10),
  ('seed_toast', 'Whole Wheat Toast', 247, 13, 41, 3.5),
  ('seed_chicken', 'Grilled Chicken Breast', 165, 31, 0, 3.6),
  ('seed_rice', 'Brown Rice', 112, 2.6, 24, 0.9),
  ('seed_broccoli', 'Broccoli', 34, 2.8, 7, 0.4),
  ('seed_salmon', 'Salmon Fillet', 206, 22, 0, 13),
  ('seed_potato', 'Sweet Potato', 86, 1.6, 20, 0.1)
ON CONFLICT (usda_fdc_id) DO UPDATE SET
  name = EXCLUDED.name,
  calories_per_100g = EXCLUDED.calories_per_100g,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g;


-- ========== STEP 2: Create Macro Goals ==========
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


-- ========== STEP 3: Create Today's Meals ==========
DO $$
DECLARE
  v_user_id UUID;
  v_breakfast_id UUID;
  v_lunch_id UUID;
  v_dinner_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users LIMIT 1;

  -- Create breakfast meal
  INSERT INTO meals (user_id, date, meal_type)
  VALUES (v_user_id, CURRENT_DATE, 'breakfast')
  ON CONFLICT (user_id, date, meal_type) DO NOTHING
  RETURNING id INTO v_breakfast_id;

  IF v_breakfast_id IS NULL THEN
    SELECT id INTO v_breakfast_id FROM meals
    WHERE user_id = v_user_id AND date = CURRENT_DATE AND meal_type = 'breakfast';
  END IF;

  -- Add breakfast items
  INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
  SELECT
    v_breakfast_id,
    fi.id,
    CASE fi.usda_fdc_id
      WHEN 'seed_eggs' THEN 150
      WHEN 'seed_toast' THEN 70
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_eggs' THEN 222
      WHEN 'seed_toast' THEN 173
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_eggs' THEN 15
      WHEN 'seed_toast' THEN 9.1
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_eggs' THEN 2.4
      WHEN 'seed_toast' THEN 28.7
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_eggs' THEN 15
      WHEN 'seed_toast' THEN 2.45
    END,
    CURRENT_DATE + TIME '07:30:00'
  FROM food_items fi
  WHERE fi.usda_fdc_id IN ('seed_eggs', 'seed_toast')
  ON CONFLICT DO NOTHING;

  -- Create lunch meal
  INSERT INTO meals (user_id, date, meal_type)
  VALUES (v_user_id, CURRENT_DATE, 'lunch')
  ON CONFLICT (user_id, date, meal_type) DO NOTHING
  RETURNING id INTO v_lunch_id;

  IF v_lunch_id IS NULL THEN
    SELECT id INTO v_lunch_id FROM meals
    WHERE user_id = v_user_id AND date = CURRENT_DATE AND meal_type = 'lunch';
  END IF;

  -- Add lunch items
  INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
  SELECT
    v_lunch_id,
    fi.id,
    CASE fi.usda_fdc_id
      WHEN 'seed_chicken' THEN 200
      WHEN 'seed_rice' THEN 150
      WHEN 'seed_broccoli' THEN 100
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_chicken' THEN 330
      WHEN 'seed_rice' THEN 168
      WHEN 'seed_broccoli' THEN 34
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_chicken' THEN 62
      WHEN 'seed_rice' THEN 3.9
      WHEN 'seed_broccoli' THEN 2.8
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_chicken' THEN 0
      WHEN 'seed_rice' THEN 36
      WHEN 'seed_broccoli' THEN 7
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_chicken' THEN 7.2
      WHEN 'seed_rice' THEN 1.35
      WHEN 'seed_broccoli' THEN 0.4
    END,
    CURRENT_DATE + TIME '12:30:00'
  FROM food_items fi
  WHERE fi.usda_fdc_id IN ('seed_chicken', 'seed_rice', 'seed_broccoli')
  ON CONFLICT DO NOTHING;

  -- Create dinner meal
  INSERT INTO meals (user_id, date, meal_type)
  VALUES (v_user_id, CURRENT_DATE, 'dinner')
  ON CONFLICT (user_id, date, meal_type) DO NOTHING
  RETURNING id INTO v_dinner_id;

  IF v_dinner_id IS NULL THEN
    SELECT id INTO v_dinner_id FROM meals
    WHERE user_id = v_user_id AND date = CURRENT_DATE AND meal_type = 'dinner';
  END IF;

  -- Add dinner items
  INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
  SELECT
    v_dinner_id,
    fi.id,
    CASE fi.usda_fdc_id
      WHEN 'seed_salmon' THEN 180
      WHEN 'seed_potato' THEN 200
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_salmon' THEN 371
      WHEN 'seed_potato' THEN 172
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_salmon' THEN 39.6
      WHEN 'seed_potato' THEN 3.2
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_salmon' THEN 0
      WHEN 'seed_potato' THEN 40
    END,
    CASE fi.usda_fdc_id
      WHEN 'seed_salmon' THEN 23.4
      WHEN 'seed_potato' THEN 0.2
    END,
    CURRENT_DATE + TIME '18:30:00'
  FROM food_items fi
  WHERE fi.usda_fdc_id IN ('seed_salmon', 'seed_potato')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Today meals created successfully';
END $$;


-- ========== STEP 4: MANUALLY UPDATE DAILY SUMMARY ==========
-- This ensures the statistics show up on the frontend
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
  m.user_id,
  m.date,
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
LEFT JOIN macro_goals mg ON mg.user_id = m.user_id AND mg.date = m.date
WHERE m.date = CURRENT_DATE
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


-- ========== FINAL VERIFICATION ==========
SELECT
  '✅ Seed data created and daily_summary updated!' as status,
  (SELECT COUNT(*) FROM food_items WHERE usda_fdc_id LIKE 'seed_%') as food_items,
  (SELECT COUNT(*) FROM macro_goals WHERE date >= CURRENT_DATE - 13) as goals_days,
  (SELECT COUNT(*) FROM meals WHERE date = CURRENT_DATE) as todays_meals,
  (SELECT COUNT(*) FROM meal_items WHERE meal_id IN (SELECT id FROM meals WHERE date = CURRENT_DATE)) as todays_items;

-- Show today's data from daily_summary
SELECT
  'Daily Summary for Today' as info,
  total_calories,
  total_protein::INTEGER as total_protein,
  total_carbs::INTEGER as total_carbs,
  total_fat::INTEGER as total_fat,
  calories_target,
  protein_target,
  carbs_target,
  fat_target,
  has_logged
FROM daily_summary
WHERE date = CURRENT_DATE;

-- Show breakdown by meal
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
