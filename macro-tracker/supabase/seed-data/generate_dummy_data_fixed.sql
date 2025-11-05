-- =====================================================
-- DUMMY DATA GENERATOR FOR MACRO TRACKER (FIXED)
-- Creates 2 weeks of realistic meal logging data
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_date DATE;
  v_meal_id UUID;
  v_day_offset INTEGER;
  v_meal_count INTEGER;
  v_food_id UUID;
  v_quantity INTEGER;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id FROM users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please create a user first.';
  END IF;

  RAISE NOTICE 'Using user ID: %', v_user_id;

  -- First, ensure we have some common food items
  -- Breakfast foods
  INSERT INTO food_items (id, usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
  VALUES
    (gen_random_uuid(), 'custom_scrambled_eggs', 'Scrambled Eggs', 148, 10, 1.6, 10),
    (gen_random_uuid(), 'custom_wheat_toast', 'Whole Wheat Toast', 247, 13, 41, 3.5),
    (gen_random_uuid(), 'custom_greek_yogurt', 'Greek Yogurt', 97, 10, 3.6, 5),
    (gen_random_uuid(), 'custom_oatmeal', 'Oatmeal', 68, 2.4, 12, 1.4),
    (gen_random_uuid(), 'custom_banana', 'Banana', 89, 1.1, 23, 0.3),
    (gen_random_uuid(), 'custom_blueberries', 'Blueberries', 57, 0.7, 14, 0.3)
  ON CONFLICT (usda_fdc_id) DO NOTHING;

  -- Lunch/Dinner proteins
  INSERT INTO food_items (id, usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
  VALUES
    (gen_random_uuid(), 'custom_grilled_chicken', 'Grilled Chicken Breast', 165, 31, 0, 3.6),
    (gen_random_uuid(), 'custom_salmon', 'Salmon Fillet', 206, 22, 0, 13),
    (gen_random_uuid(), 'custom_ground_beef', 'Ground Beef 90/10', 176, 20, 0, 10),
    (gen_random_uuid(), 'custom_ribeye', 'Ribeye Steak', 291, 25, 0, 22),
    (gen_random_uuid(), 'custom_turkey', 'Turkey Breast', 135, 30, 0, 1)
  ON CONFLICT (usda_fdc_id) DO NOTHING;

  -- Carbs
  INSERT INTO food_items (id, usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
  VALUES
    (gen_random_uuid(), 'custom_brown_rice', 'Brown Rice', 112, 2.6, 24, 0.9),
    (gen_random_uuid(), 'custom_sweet_potato', 'Sweet Potato', 86, 1.6, 20, 0.1),
    (gen_random_uuid(), 'custom_quinoa', 'Quinoa', 120, 4.4, 21, 1.9),
    (gen_random_uuid(), 'custom_wheat_pasta', 'Whole Wheat Pasta', 124, 5, 26, 0.5),
    (gen_random_uuid(), 'custom_white_rice', 'White Rice', 130, 2.7, 28, 0.3)
  ON CONFLICT (usda_fdc_id) DO NOTHING;

  -- Vegetables
  INSERT INTO food_items (id, usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
  VALUES
    (gen_random_uuid(), 'custom_broccoli', 'Broccoli', 34, 2.8, 7, 0.4),
    (gen_random_uuid(), 'custom_spinach', 'Spinach', 23, 2.9, 3.6, 0.4),
    (gen_random_uuid(), 'custom_mixed_salad', 'Mixed Salad', 15, 1.4, 2.9, 0.2),
    (gen_random_uuid(), 'custom_asparagus', 'Asparagus', 20, 2.2, 3.9, 0.1),
    (gen_random_uuid(), 'custom_bell_peppers', 'Bell Peppers', 26, 1, 6, 0.3)
  ON CONFLICT (usda_fdc_id) DO NOTHING;

  -- Snacks
  INSERT INTO food_items (id, usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
  VALUES
    (gen_random_uuid(), 'custom_almonds', 'Almonds', 579, 21, 22, 50),
    (gen_random_uuid(), 'custom_apple', 'Apple', 52, 0.3, 14, 0.2),
    (gen_random_uuid(), 'custom_protein_shake', 'Protein Shake', 120, 24, 3, 1.5),
    (gen_random_uuid(), 'custom_peanut_butter', 'Peanut Butter', 588, 25, 20, 50),
    (gen_random_uuid(), 'custom_cottage_cheese', 'Cottage Cheese', 98, 11, 3.4, 4.3)
  ON CONFLICT (usda_fdc_id) DO NOTHING;

  RAISE NOTICE 'Food items created/verified';

  -- Generate 14 days of data (2 weeks)
  FOR v_day_offset IN 0..13 LOOP
    v_date := CURRENT_DATE - v_day_offset;

    RAISE NOTICE 'Generating data for: %', v_date;

    -- Create daily macro goals (gradually varying)
    INSERT INTO macro_goals (user_id, date, calories_target, protein_target, carbs_target, fat_target)
    VALUES (
      v_user_id,
      v_date,
      2000 + (v_day_offset * 50), -- Varying calories
      150 + (v_day_offset * 5),    -- Varying protein
      200 + (v_day_offset * 3),    -- Varying carbs
      65 + (v_day_offset * 2)      -- Varying fat
    )
    ON CONFLICT (user_id, date) DO NOTHING;

    -- Generate 3-5 meals per day
    v_meal_count := 3 + (v_day_offset % 3); -- 3, 4, or 5 meals

    -- Breakfast (always)
    INSERT INTO meals (id, user_id, date, meal_type)
    VALUES (gen_random_uuid(), v_user_id, v_date, 'breakfast')
    RETURNING id INTO v_meal_id;

    -- Eggs
    SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_scrambled_eggs' LIMIT 1;
    v_quantity := 150 + (random() * 50)::INTEGER;
    INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
    SELECT v_meal_id, v_food_id, v_quantity,
           (calories_per_100g * v_quantity / 100),
           (protein_per_100g * v_quantity / 100),
           (carbs_per_100g * v_quantity / 100),
           (fat_per_100g * v_quantity / 100),
           v_date + TIME '07:30:00' + (random() * interval '30 minutes')
    FROM food_items WHERE id = v_food_id;

    -- Toast
    SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_wheat_toast' LIMIT 1;
    v_quantity := 60 + (random() * 20)::INTEGER;
    INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
    SELECT v_meal_id, v_food_id, v_quantity,
           (calories_per_100g * v_quantity / 100),
           (protein_per_100g * v_quantity / 100),
           (carbs_per_100g * v_quantity / 100),
           (fat_per_100g * v_quantity / 100),
           v_date + TIME '07:35:00' + (random() * interval '30 minutes')
    FROM food_items WHERE id = v_food_id;

    -- Lunch
    INSERT INTO meals (id, user_id, date, meal_type)
    VALUES (gen_random_uuid(), v_user_id, v_date, 'lunch')
    RETURNING id INTO v_meal_id;

    -- Protein (rotating)
    CASE v_day_offset % 4
      WHEN 0 THEN
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_grilled_chicken' LIMIT 1;
        v_quantity := 180 + (random() * 50)::INTEGER;
      WHEN 1 THEN
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_salmon' LIMIT 1;
        v_quantity := 150 + (random() * 40)::INTEGER;
      WHEN 2 THEN
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_turkey' LIMIT 1;
        v_quantity := 170 + (random() * 50)::INTEGER;
      ELSE
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_ground_beef' LIMIT 1;
        v_quantity := 160 + (random() * 40)::INTEGER;
    END CASE;

    INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
    SELECT v_meal_id, v_food_id, v_quantity,
           (calories_per_100g * v_quantity / 100),
           (protein_per_100g * v_quantity / 100),
           (carbs_per_100g * v_quantity / 100),
           (fat_per_100g * v_quantity / 100),
           v_date + TIME '12:00:00' + (random() * interval '1 hour')
    FROM food_items WHERE id = v_food_id;

    -- Carbs
    SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_brown_rice' LIMIT 1;
    v_quantity := 150 + (random() * 50)::INTEGER;
    INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
    SELECT v_meal_id, v_food_id, v_quantity,
           (calories_per_100g * v_quantity / 100),
           (protein_per_100g * v_quantity / 100),
           (carbs_per_100g * v_quantity / 100),
           (fat_per_100g * v_quantity / 100),
           v_date + TIME '12:05:00' + (random() * interval '1 hour')
    FROM food_items WHERE id = v_food_id;

    -- Vegetables
    SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_broccoli' LIMIT 1;
    v_quantity := 100 + (random() * 50)::INTEGER;
    INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
    SELECT v_meal_id, v_food_id, v_quantity,
           (calories_per_100g * v_quantity / 100),
           (protein_per_100g * v_quantity / 100),
           (carbs_per_100g * v_quantity / 100),
           (fat_per_100g * v_quantity / 100),
           v_date + TIME '12:10:00' + (random() * interval '1 hour')
    FROM food_items WHERE id = v_food_id;

    -- Dinner
    INSERT INTO meals (id, user_id, date, meal_type)
    VALUES (gen_random_uuid(), v_user_id, v_date, 'dinner')
    RETURNING id INTO v_meal_id;

    -- Protein (different from lunch)
    CASE v_day_offset % 3
      WHEN 0 THEN
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_ribeye' LIMIT 1;
        v_quantity := 200 + (random() * 50)::INTEGER;
      WHEN 1 THEN
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_grilled_chicken' LIMIT 1;
        v_quantity := 190 + (random() * 40)::INTEGER;
      ELSE
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_salmon' LIMIT 1;
        v_quantity := 180 + (random() * 50)::INTEGER;
    END CASE;

    INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
    SELECT v_meal_id, v_food_id, v_quantity,
           (calories_per_100g * v_quantity / 100),
           (protein_per_100g * v_quantity / 100),
           (carbs_per_100g * v_quantity / 100),
           (fat_per_100g * v_quantity / 100),
           v_date + TIME '18:30:00' + (random() * interval '1 hour')
    FROM food_items WHERE id = v_food_id;

    -- Sweet potato
    SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_sweet_potato' LIMIT 1;
    v_quantity := 180 + (random() * 50)::INTEGER;
    INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
    SELECT v_meal_id, v_food_id, v_quantity,
           (calories_per_100g * v_quantity / 100),
           (protein_per_100g * v_quantity / 100),
           (carbs_per_100g * v_quantity / 100),
           (fat_per_100g * v_quantity / 100),
           v_date + TIME '18:35:00' + (random() * interval '1 hour')
    FROM food_items WHERE id = v_food_id;

    -- Vegetables
    SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_mixed_salad' LIMIT 1;
    v_quantity := 120 + (random() * 50)::INTEGER;
    INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
    SELECT v_meal_id, v_food_id, v_quantity,
           (calories_per_100g * v_quantity / 100),
           (protein_per_100g * v_quantity / 100),
           (carbs_per_100g * v_quantity / 100),
           (fat_per_100g * v_quantity / 100),
           v_date + TIME '18:40:00' + (random() * interval '1 hour')
    FROM food_items WHERE id = v_food_id;

    -- Snacks (if meal_count > 3)
    IF v_meal_count >= 4 THEN
      INSERT INTO meals (id, user_id, date, meal_type)
      VALUES (gen_random_uuid(), v_user_id, v_date, 'snack')
      RETURNING id INTO v_meal_id;

      -- Protein shake or nuts
      IF v_day_offset % 2 = 0 THEN
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_protein_shake' LIMIT 1;
        v_quantity := 300;
      ELSE
        SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_almonds' LIMIT 1;
        v_quantity := 30 + (random() * 20)::INTEGER;
      END IF;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, v_food_id, v_quantity,
             (calories_per_100g * v_quantity / 100),
             (protein_per_100g * v_quantity / 100),
             (carbs_per_100g * v_quantity / 100),
             (fat_per_100g * v_quantity / 100),
             v_date + TIME '15:00:00' + (random() * interval '2 hours')
      FROM food_items WHERE id = v_food_id;
    END IF;

    -- Evening snack (if meal_count = 5)
    IF v_meal_count = 5 THEN
      INSERT INTO meals (id, user_id, date, meal_type)
      VALUES (gen_random_uuid(), v_user_id, v_date, 'snack')
      RETURNING id INTO v_meal_id;

      SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_greek_yogurt' LIMIT 1;
      v_quantity := 150 + (random() * 50)::INTEGER;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, v_food_id, v_quantity,
             (calories_per_100g * v_quantity / 100),
             (protein_per_100g * v_quantity / 100),
             (carbs_per_100g * v_quantity / 100),
             (fat_per_100g * v_quantity / 100),
             v_date + TIME '21:00:00' + (random() * interval '30 minutes')
      FROM food_items WHERE id = v_food_id;

      -- Blueberries with yogurt
      SELECT id INTO v_food_id FROM food_items WHERE usda_fdc_id = 'custom_blueberries' LIMIT 1;
      v_quantity := 50 + (random() * 30)::INTEGER;

      INSERT INTO meal_items (meal_id, food_item_id, quantity_g, calories, protein, carbs, fat, logged_at)
      SELECT v_meal_id, v_food_id, v_quantity,
             (calories_per_100g * v_quantity / 100),
             (protein_per_100g * v_quantity / 100),
             (carbs_per_100g * v_quantity / 100),
             (fat_per_100g * v_quantity / 100),
             v_date + TIME '21:05:00' + (random() * interval '30 minutes')
      FROM food_items WHERE id = v_food_id;
    END IF;

  END LOOP;

  RAISE NOTICE '✅ Successfully generated 2 weeks of dummy data!';
  RAISE NOTICE 'Total days: 14';
  RAISE NOTICE 'Meals per day: 3-5 (varying)';

END $$;

-- Verify the data was created
SELECT
  date,
  COUNT(DISTINCT m.id) as meal_count,
  COUNT(mi.id) as food_items_count,
  SUM(mi.calories)::INTEGER as total_calories,
  SUM(mi.protein)::INTEGER as total_protein,
  SUM(mi.carbs)::INTEGER as total_carbs,
  SUM(mi.fat)::INTEGER as total_fat
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY date
ORDER BY date DESC;

-- Show summary
SELECT
  '✅ Data Generation Complete!' as status,
  COUNT(DISTINCT date) as days_created,
  COUNT(DISTINCT id) as total_meals
FROM meals
WHERE date >= CURRENT_DATE - INTERVAL '14 days';
