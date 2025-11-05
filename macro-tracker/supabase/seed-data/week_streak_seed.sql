-- =====================================================
-- WEEK STREAK SEED DATA
-- Creates 7 days of complete meal logging with variety
-- Perfect for testing graphs, trends, and analytics
-- =====================================================

-- ========== STEP 1: Create Food Items ==========
INSERT INTO food_items (usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
VALUES
  -- Breakfast items
  ('seed_eggs', 'Scrambled Eggs', 148, 10, 1.6, 10),
  ('seed_toast', 'Whole Wheat Toast', 247, 13, 41, 3.5),
  ('seed_yogurt', 'Greek Yogurt', 97, 10, 3.6, 5),
  ('seed_banana', 'Banana', 89, 1.1, 23, 0.3),
  ('seed_oatmeal', 'Oatmeal', 68, 2.4, 12, 1.4),
  ('seed_berries', 'Mixed Berries', 57, 0.7, 14, 0.3),

  -- Proteins
  ('seed_chicken', 'Grilled Chicken Breast', 165, 31, 0, 3.6),
  ('seed_salmon', 'Salmon Fillet', 206, 22, 0, 13),
  ('seed_steak', 'Ribeye Steak', 291, 25, 0, 22),
  ('seed_turkey', 'Turkey Breast', 135, 30, 0, 1),
  ('seed_tuna', 'Tuna', 132, 28, 0, 1.3),
  ('seed_shrimp', 'Shrimp', 99, 24, 0.2, 0.3),

  -- Carbs
  ('seed_rice', 'Brown Rice', 112, 2.6, 24, 0.9),
  ('seed_potato', 'Sweet Potato', 86, 1.6, 20, 0.1),
  ('seed_pasta', 'Whole Wheat Pasta', 124, 5, 26, 0.5),
  ('seed_quinoa', 'Quinoa', 120, 4.4, 21, 1.9),

  -- Vegetables
  ('seed_broccoli', 'Broccoli', 34, 2.8, 7, 0.4),
  ('seed_salad', 'Mixed Salad', 15, 1.4, 2.9, 0.2),
  ('seed_spinach', 'Spinach', 23, 2.9, 3.6, 0.4),
  ('seed_asparagus', 'Asparagus', 20, 2.2, 3.9, 0.1),

  -- Snacks
  ('seed_almonds', 'Almonds', 579, 21, 22, 50),
  ('seed_protein_shake', 'Protein Shake', 120, 24, 3, 1.5),
  ('seed_apple', 'Apple', 52, 0.3, 14, 0.2),
  ('seed_peanut_butter', 'Peanut Butter', 588, 25, 20, 50)
ON CONFLICT (usda_fdc_id) DO UPDATE SET
  name = EXCLUDED.name,
  calories_per_100g = EXCLUDED.calories_per_100g,
  protein_per_100g = EXCLUDED.protein_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g;


-- ========== STEP 2: Create Macro Goals for 7 Days ==========
INSERT INTO macro_goals (user_id, date, calories_target, protein_target, carbs_target, fat_target)
SELECT
  (SELECT id FROM users LIMIT 1),
  CURRENT_DATE - d,
  2000,
  150,
  200,
  65
FROM generate_series(0, 6) as d
ON CONFLICT (user_id, date) DO NOTHING;


-- ========== STEP 3: Create 7 Days of Meal Data ==========
DO $$
DECLARE
  v_user_id UUID;
  v_meal_id UUID;
  day_offset INTEGER;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users LIMIT 1;

  -- Loop through 7 days (today and 6 days back)
  FOR day_offset IN 0..6 LOOP
    RAISE NOTICE 'Creating meals for day %', day_offset;

    -- ========== DAY 0 (Today) ==========
    IF day_offset = 0 THEN
      -- Breakfast: Eggs + Toast
      INSERT INTO meals (user_id, date, meal_type)
      VALUES (v_user_id, CURRENT_DATE - day_offset, 'breakfast')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING
      RETURNING id INTO v_meal_id;

      IF v_meal_id IS NULL THEN
        SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'breakfast';
      END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 150, 222, 15, 2.4, 15, (CURRENT_DATE - day_offset) + TIME '07:30:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_eggs'
      ON CONFLICT DO NOTHING;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 70, 173, 9.1, 28.7, 2.45, (CURRENT_DATE - day_offset) + TIME '07:35:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_toast'
      ON CONFLICT DO NOTHING;

      -- Lunch: Chicken + Rice + Broccoli
      INSERT INTO meals (user_id, date, meal_type)
      VALUES (v_user_id, CURRENT_DATE - day_offset, 'lunch')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING
      RETURNING id INTO v_meal_id;

      IF v_meal_id IS NULL THEN
        SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'lunch';
      END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 200, 330, 62, 0, 7.2, (CURRENT_DATE - day_offset) + TIME '12:30:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_chicken'
      ON CONFLICT DO NOTHING;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 150, 168, 3.9, 36, 1.35, (CURRENT_DATE - day_offset) + TIME '12:30:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_rice'
      ON CONFLICT DO NOTHING;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 100, 34, 2.8, 7, 0.4, (CURRENT_DATE - day_offset) + TIME '12:30:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_broccoli'
      ON CONFLICT DO NOTHING;

      -- Snack: Protein Shake
      INSERT INTO meals (user_id, date, meal_type)
      VALUES (v_user_id, CURRENT_DATE - day_offset, 'snack')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING
      RETURNING id INTO v_meal_id;

      IF v_meal_id IS NULL THEN
        SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'snack';
      END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 250, 300, 60, 7.5, 3.75, (CURRENT_DATE - day_offset) + TIME '15:00:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_protein_shake'
      ON CONFLICT DO NOTHING;

      -- Dinner: Salmon + Sweet Potato + Asparagus
      INSERT INTO meals (user_id, date, meal_type)
      VALUES (v_user_id, CURRENT_DATE - day_offset, 'dinner')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING
      RETURNING id INTO v_meal_id;

      IF v_meal_id IS NULL THEN
        SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'dinner';
      END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 180, 371, 39.6, 0, 23.4, (CURRENT_DATE - day_offset) + TIME '18:30:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_salmon'
      ON CONFLICT DO NOTHING;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 200, 172, 3.2, 40, 0.2, (CURRENT_DATE - day_offset) + TIME '18:30:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_potato'
      ON CONFLICT DO NOTHING;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 150, 30, 3.3, 5.85, 0.15, (CURRENT_DATE - day_offset) + TIME '18:30:00'
      FROM food_items fi WHERE fi.usda_fdc_id = 'seed_asparagus'
      ON CONFLICT DO NOTHING;

    -- ========== DAY 1 ==========
    ELSIF day_offset = 1 THEN
      -- Breakfast: Yogurt + Banana + Berries
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'breakfast')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'breakfast'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 200, 194, 20, 7.2, 10, (CURRENT_DATE - day_offset) + TIME '07:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_yogurt' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 120, 107, 1.32, 27.6, 0.36, (CURRENT_DATE - day_offset) + TIME '07:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_banana' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 80, 46, 0.56, 11.2, 0.24, (CURRENT_DATE - day_offset) + TIME '07:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_berries' ON CONFLICT DO NOTHING;

      -- Lunch: Turkey + Quinoa + Salad
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'lunch')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'lunch'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 180, 243, 54, 0, 1.8, (CURRENT_DATE - day_offset) + TIME '12:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_turkey' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 150, 180, 6.6, 31.5, 2.85, (CURRENT_DATE - day_offset) + TIME '12:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_quinoa' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 100, 15, 1.4, 2.9, 0.2, (CURRENT_DATE - day_offset) + TIME '12:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_salad' ON CONFLICT DO NOTHING;

      -- Snack: Apple + Peanut Butter
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'snack')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'snack'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 150, 78, 0.45, 21, 0.3, (CURRENT_DATE - day_offset) + TIME '15:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_apple' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 30, 176, 7.5, 6, 15, (CURRENT_DATE - day_offset) + TIME '15:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_peanut_butter' ON CONFLICT DO NOTHING;

      -- Dinner: Steak + Pasta + Spinach
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'dinner')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'dinner'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 200, 582, 50, 0, 44, (CURRENT_DATE - day_offset) + TIME '19:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_steak' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 120, 149, 6, 31.2, 0.6, (CURRENT_DATE - day_offset) + TIME '19:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_pasta' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 100, 23, 2.9, 3.6, 0.4, (CURRENT_DATE - day_offset) + TIME '19:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_spinach' ON CONFLICT DO NOTHING;

    -- ========== DAY 2 ==========
    ELSIF day_offset = 2 THEN
      -- Breakfast: Oatmeal + Berries + Almonds
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'breakfast')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'breakfast'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 200, 136, 4.8, 24, 2.8, (CURRENT_DATE - day_offset) + TIME '07:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_oatmeal' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 100, 57, 0.7, 14, 0.3, (CURRENT_DATE - day_offset) + TIME '07:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_berries' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 30, 174, 6.3, 6.6, 15, (CURRENT_DATE - day_offset) + TIME '07:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_almonds' ON CONFLICT DO NOTHING;

      -- Lunch: Tuna + Rice + Broccoli
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'lunch')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'lunch'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 150, 198, 42, 0, 1.95, (CURRENT_DATE - day_offset) + TIME '13:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_tuna' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 160, 179, 4.16, 38.4, 1.44, (CURRENT_DATE - day_offset) + TIME '13:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_rice' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 120, 41, 3.36, 8.4, 0.48, (CURRENT_DATE - day_offset) + TIME '13:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_broccoli' ON CONFLICT DO NOTHING;

      -- Snack: Protein Shake
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'snack')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'snack'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 250, 300, 60, 7.5, 3.75, (CURRENT_DATE - day_offset) + TIME '16:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_protein_shake' ON CONFLICT DO NOTHING;

      -- Dinner: Chicken + Sweet Potato + Salad
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'dinner')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'dinner'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 220, 363, 68.2, 0, 7.92, (CURRENT_DATE - day_offset) + TIME '18:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_chicken' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 180, 155, 2.88, 36, 0.18, (CURRENT_DATE - day_offset) + TIME '18:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_potato' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 120, 18, 1.68, 3.48, 0.24, (CURRENT_DATE - day_offset) + TIME '18:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_salad' ON CONFLICT DO NOTHING;

    -- ========== DAY 3 ==========
    ELSIF day_offset = 3 THEN
      -- Breakfast: Eggs + Toast + Banana
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'breakfast')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'breakfast'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 120, 178, 12, 1.92, 12, (CURRENT_DATE - day_offset) + TIME '07:20:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_eggs' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 60, 148, 7.8, 24.6, 2.1, (CURRENT_DATE - day_offset) + TIME '07:20:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_toast' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 100, 89, 1.1, 23, 0.3, (CURRENT_DATE - day_offset) + TIME '07:20:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_banana' ON CONFLICT DO NOTHING;

      -- Lunch: Shrimp + Quinoa + Asparagus
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'lunch')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'lunch'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 200, 198, 48, 0.4, 0.6, (CURRENT_DATE - day_offset) + TIME '12:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_shrimp' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 140, 168, 6.16, 29.4, 2.66, (CURRENT_DATE - day_offset) + TIME '12:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_quinoa' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 130, 26, 2.86, 5.07, 0.13, (CURRENT_DATE - day_offset) + TIME '12:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_asparagus' ON CONFLICT DO NOTHING;

      -- Snack: Almonds
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'snack')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'snack'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 40, 232, 8.4, 8.8, 20, (CURRENT_DATE - day_offset) + TIME '15:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_almonds' ON CONFLICT DO NOTHING;

      -- Dinner: Salmon + Rice + Spinach
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'dinner')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'dinner'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 200, 412, 44, 0, 26, (CURRENT_DATE - day_offset) + TIME '19:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_salmon' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 140, 157, 3.64, 33.6, 1.26, (CURRENT_DATE - day_offset) + TIME '19:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_rice' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 120, 28, 3.48, 4.32, 0.48, (CURRENT_DATE - day_offset) + TIME '19:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_spinach' ON CONFLICT DO NOTHING;

    -- ========== DAY 4 ==========
    ELSIF day_offset = 4 THEN
      -- Breakfast: Yogurt + Berries + Almonds
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'breakfast')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'breakfast'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 220, 213, 22, 7.92, 11, (CURRENT_DATE - day_offset) + TIME '07:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_yogurt' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 90, 51, 0.63, 12.6, 0.27, (CURRENT_DATE - day_offset) + TIME '07:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_berries' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 25, 145, 5.25, 5.5, 12.5, (CURRENT_DATE - day_offset) + TIME '07:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_almonds' ON CONFLICT DO NOTHING;

      -- Lunch: Chicken + Pasta + Broccoli
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'lunch')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'lunch'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 190, 314, 58.9, 0, 6.84, (CURRENT_DATE - day_offset) + TIME '12:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_chicken' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 130, 161, 6.5, 33.8, 0.65, (CURRENT_DATE - day_offset) + TIME '12:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_pasta' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 110, 37, 3.08, 7.7, 0.44, (CURRENT_DATE - day_offset) + TIME '12:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_broccoli' ON CONFLICT DO NOTHING;

      -- Snack: Protein Shake + Banana
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'snack')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'snack'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 250, 300, 60, 7.5, 3.75, (CURRENT_DATE - day_offset) + TIME '15:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_protein_shake' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 100, 89, 1.1, 23, 0.3, (CURRENT_DATE - day_offset) + TIME '15:20:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_banana' ON CONFLICT DO NOTHING;

      -- Dinner: Turkey + Sweet Potato + Salad
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'dinner')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'dinner'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 200, 270, 60, 0, 2, (CURRENT_DATE - day_offset) + TIME '18:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_turkey' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 210, 181, 3.36, 42, 0.21, (CURRENT_DATE - day_offset) + TIME '18:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_potato' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 100, 15, 1.4, 2.9, 0.2, (CURRENT_DATE - day_offset) + TIME '18:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_salad' ON CONFLICT DO NOTHING;

    -- ========== DAY 5 ==========
    ELSIF day_offset = 5 THEN
      -- Breakfast: Oatmeal + Banana + Peanut Butter
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'breakfast')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'breakfast'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 180, 122, 4.32, 21.6, 2.52, (CURRENT_DATE - day_offset) + TIME '07:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_oatmeal' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 110, 98, 1.21, 25.3, 0.33, (CURRENT_DATE - day_offset) + TIME '07:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_banana' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 25, 147, 6.25, 5, 12.5, (CURRENT_DATE - day_offset) + TIME '07:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_peanut_butter' ON CONFLICT DO NOTHING;

      -- Lunch: Tuna + Quinoa + Salad
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'lunch')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'lunch'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 170, 224, 47.6, 0, 2.21, (CURRENT_DATE - day_offset) + TIME '13:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_tuna' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 130, 156, 5.72, 27.3, 2.47, (CURRENT_DATE - day_offset) + TIME '13:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_quinoa' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 110, 17, 1.54, 3.19, 0.22, (CURRENT_DATE - day_offset) + TIME '13:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_salad' ON CONFLICT DO NOTHING;

      -- Snack: Apple + Almonds
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'snack')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'snack'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 130, 68, 0.39, 18.2, 0.26, (CURRENT_DATE - day_offset) + TIME '16:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_apple' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 35, 203, 7.35, 7.7, 17.5, (CURRENT_DATE - day_offset) + TIME '16:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_almonds' ON CONFLICT DO NOTHING;

      -- Dinner: Steak + Rice + Asparagus
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'dinner')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'dinner'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 210, 611, 52.5, 0, 46.2, (CURRENT_DATE - day_offset) + TIME '19:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_steak' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 150, 168, 3.9, 36, 1.35, (CURRENT_DATE - day_offset) + TIME '19:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_rice' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 140, 28, 3.08, 5.46, 0.14, (CURRENT_DATE - day_offset) + TIME '19:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_asparagus' ON CONFLICT DO NOTHING;

    -- ========== DAY 6 ==========
    ELSIF day_offset = 6 THEN
      -- Breakfast: Eggs + Toast + Berries
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'breakfast')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'breakfast'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 140, 207, 14, 2.24, 14, (CURRENT_DATE - day_offset) + TIME '08:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_eggs' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 75, 185, 9.75, 30.75, 2.63, (CURRENT_DATE - day_offset) + TIME '08:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_toast' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 70, 40, 0.49, 9.8, 0.21, (CURRENT_DATE - day_offset) + TIME '08:00:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_berries' ON CONFLICT DO NOTHING;

      -- Lunch: Shrimp + Pasta + Spinach
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'lunch')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'lunch'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 180, 178, 43.2, 0.36, 0.54, (CURRENT_DATE - day_offset) + TIME '12:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_shrimp' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 140, 174, 7, 36.4, 0.7, (CURRENT_DATE - day_offset) + TIME '12:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_pasta' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 110, 25, 3.19, 3.96, 0.44, (CURRENT_DATE - day_offset) + TIME '12:45:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_spinach' ON CONFLICT DO NOTHING;

      -- Snack: Protein Shake
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'snack')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'snack'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 250, 300, 60, 7.5, 3.75, (CURRENT_DATE - day_offset) + TIME '15:30:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_protein_shake' ON CONFLICT DO NOTHING;

      -- Dinner: Salmon + Sweet Potato + Broccoli
      INSERT INTO meals (user_id, date, meal_type) VALUES (v_user_id, CURRENT_DATE - day_offset, 'dinner')
      ON CONFLICT (user_id, date, meal_type) DO NOTHING RETURNING id INTO v_meal_id;
      IF v_meal_id IS NULL THEN SELECT id INTO v_meal_id FROM meals WHERE user_id = v_user_id AND date = CURRENT_DATE - day_offset AND meal_type = 'dinner'; END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 190, 391, 41.8, 0, 24.7, (CURRENT_DATE - day_offset) + TIME '18:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_salmon' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 190, 163, 3.04, 38, 0.19, (CURRENT_DATE - day_offset) + TIME '18:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_potato' ON CONFLICT DO NOTHING;
      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, fi.id, 130, 44, 3.64, 9.1, 0.52, (CURRENT_DATE - day_offset) + TIME '18:15:00' FROM food_items fi WHERE fi.usda_fdc_id = 'seed_broccoli' ON CONFLICT DO NOTHING;

    END IF;
  END LOOP;

  RAISE NOTICE '✅ Created 7 days of meal data!';
END $$;


-- ========== STEP 4: MANUALLY UPDATE DAILY SUMMARY FOR ALL 7 DAYS ==========
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
WHERE m.date >= CURRENT_DATE - 6 AND m.date <= CURRENT_DATE
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
  '✅ Week streak seed data complete!' as status,
  (SELECT COUNT(*) FROM food_items WHERE usda_fdc_id LIKE 'seed_%') as food_items,
  (SELECT COUNT(DISTINCT date) FROM meals WHERE date >= CURRENT_DATE - 6) as days_with_meals,
  (SELECT COUNT(*) FROM meals WHERE date >= CURRENT_DATE - 6) as total_meals,
  (SELECT COUNT(*) FROM meal_items WHERE meal_id IN (SELECT id FROM meals WHERE date >= CURRENT_DATE - 6)) as total_items;

-- Show daily summaries for the week
SELECT
  date,
  total_calories as calories,
  total_protein::INTEGER as protein,
  total_carbs::INTEGER as carbs,
  total_fat::INTEGER as fat,
  ROUND((total_calories::DECIMAL / calories_target * 100), 1) as cal_pct,
  ROUND((total_protein / protein_target * 100), 1) as protein_pct,
  has_logged
FROM daily_summary
WHERE date >= CURRENT_DATE - 6 AND date <= CURRENT_DATE
ORDER BY date DESC;

-- Show meal count by day
SELECT
  m.date,
  COUNT(DISTINCT m.id) as meals,
  COUNT(mi.id) as items,
  SUM(mi.calories)::INTEGER as total_cal
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.date >= CURRENT_DATE - 6
GROUP BY m.date
ORDER BY m.date DESC;
