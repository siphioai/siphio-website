-- Smart backfill for display names - extracts protein type AND cut
-- This creates readable names like "Chicken Breast", "Chicken Thigh", "Beef Sirloin"
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  food_record RECORD;
  simplified_name TEXT;
  protein_type TEXT;
  cut_type TEXT;
  total_count INTEGER;
  updated_count INTEGER := 0;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM food_items WHERE display_name IS NULL OR display_name = SPLIT_PART(name, ',', 1);
  RAISE NOTICE 'Found % foods to update', total_count;

  -- Process each food item
  FOR food_record IN
    SELECT id, name FROM food_items WHERE display_name IS NULL OR display_name = SPLIT_PART(name, ',', 1)
  LOOP
    simplified_name := food_record.name;

    -- Extract protein type and cut for meats
    IF simplified_name ~* '^(Chicken|Beef|Pork|Turkey|Lamb|Veal|Duck|Goose)' THEN
      -- Get the protein type
      protein_type := SUBSTRING(simplified_name FROM '^(Chicken|Beef|Pork|Turkey|Lamb|Veal|Duck|Goose)');

      -- Extract the cut/part
      cut_type := '';

      -- Chicken cuts
      IF simplified_name ~* 'breast' THEN cut_type := 'Breast';
      ELSIF simplified_name ~* 'thigh' THEN cut_type := 'Thigh';
      ELSIF simplified_name ~* 'wing' THEN cut_type := 'Wing';
      ELSIF simplified_name ~* 'drumstick' THEN cut_type := 'Drumstick';
      ELSIF simplified_name ~* 'leg' THEN cut_type := 'Leg';
      ELSIF simplified_name ~* 'tender' THEN cut_type := 'Tender';

      -- Beef cuts
      ELSIF simplified_name ~* 'sirloin' THEN cut_type := 'Sirloin';
      ELSIF simplified_name ~* 'ribeye|rib eye' THEN cut_type := 'Ribeye';
      ELSIF simplified_name ~* 'tenderloin|filet' THEN cut_type := 'Tenderloin';
      ELSIF simplified_name ~* 'chuck' THEN cut_type := 'Chuck';
      ELSIF simplified_name ~* 'brisket' THEN cut_type := 'Brisket';
      ELSIF simplified_name ~* 'round' THEN cut_type := 'Round';
      ELSIF simplified_name ~* 'flank' THEN cut_type := 'Flank';
      ELSIF simplified_name ~* 'strip' THEN cut_type := 'Strip';
      ELSIF simplified_name ~* 'T-bone|t bone' THEN cut_type := 'T-Bone';

      -- Pork cuts
      ELSIF simplified_name ~* 'chop' THEN cut_type := 'Chop';
      ELSIF simplified_name ~* 'tenderloin' THEN cut_type := 'Tenderloin';
      ELSIF simplified_name ~* 'shoulder' THEN cut_type := 'Shoulder';
      ELSIF simplified_name ~* 'loin' THEN cut_type := 'Loin';
      ELSIF simplified_name ~* 'belly' THEN cut_type := 'Belly';
      ELSIF simplified_name ~* 'ribs' THEN cut_type := 'Ribs';

      -- Ground meat
      ELSIF simplified_name ~* 'ground' THEN cut_type := 'Ground';
      END IF;

      -- Combine protein type and cut
      IF cut_type != '' THEN
        simplified_name := protein_type || ' ' || cut_type;
      ELSE
        simplified_name := protein_type;
      END IF;

    -- Fish
    ELSIF simplified_name ~* '^(Salmon|Tuna|Cod|Tilapia|Halibut|Mackerel|Trout|Bass|Sardines)' THEN
      simplified_name := SUBSTRING(simplified_name FROM '^(Salmon|Tuna|Cod|Tilapia|Halibut|Mackerel|Trout|Bass|Sardines)');

    -- Rice varieties
    ELSIF simplified_name ~* 'Rice' THEN
      IF simplified_name ~* 'basmati' THEN simplified_name := 'Basmati Rice';
      ELSIF simplified_name ~* 'jasmine' THEN simplified_name := 'Jasmine Rice';
      ELSIF simplified_name ~* 'brown.*long-grain' THEN simplified_name := 'Brown Rice';
      ELSIF simplified_name ~* 'white.*long-grain' THEN simplified_name := 'White Rice';
      ELSIF simplified_name ~* 'wild' THEN simplified_name := 'Wild Rice';
      ELSE simplified_name := 'Rice';
      END IF;

    -- Eggs
    ELSIF simplified_name ~* '^Egg' THEN
      IF simplified_name ~* 'scrambled' THEN simplified_name := 'Scrambled Eggs';
      ELSIF simplified_name ~* 'fried' THEN simplified_name := 'Fried Egg';
      ELSIF simplified_name ~* 'boiled' THEN simplified_name := 'Boiled Egg';
      ELSIF simplified_name ~* 'poached' THEN simplified_name := 'Poached Egg';
      ELSIF simplified_name ~* 'omelet' THEN simplified_name := 'Omelet';
      ELSE simplified_name := 'Egg';
      END IF;

    -- Dairy
    ELSIF simplified_name ~* '^(Milk|Cheese|Yogurt|Butter|Cream)' THEN
      simplified_name := SUBSTRING(simplified_name FROM '^(Milk|Cheese|Yogurt|Butter|Cream)');

    -- Fruits
    ELSIF simplified_name ~* '^(Apple|Banana|Orange|Grape|Strawberr|Blueberr|Raspberr|Mango|Pineapple|Watermelon|Peach|Pear)' THEN
      simplified_name := REGEXP_REPLACE(
        SUBSTRING(simplified_name FROM '^(Apple|Banana|Orange|Grape|Strawberr|Blueberr|Raspberr|Mango|Pineapple|Watermelon|Peach|Pear)[a-z]*'),
        '(Strawberr|Blueberr|Raspberr)', '\1ies', 'i'
      );

    -- Vegetables
    ELSIF simplified_name ~* '^(Broccoli|Carrot|Spinach|Tomato|Potato|Onion|Pepper|Cucumber|Lettuce)' THEN
      simplified_name := SUBSTRING(simplified_name FROM '^(Broccoli|Carrot|Spinach|Tomato|Potato|Onion|Pepper|Cucumber|Lettuce)');

    -- Nuts and seeds
    ELSIF simplified_name ~* '^(Almond|Walnut|Peanut|Cashew|Pistachio)' THEN
      simplified_name := SUBSTRING(simplified_name FROM '^(Almond|Walnut|Peanut|Cashew|Pistachio)') || 's';

    -- Oats
    ELSIF simplified_name ~* 'Oats' THEN
      simplified_name := 'Oats';

    -- Bread
    ELSIF simplified_name ~* 'Bread' THEN
      IF simplified_name ~* 'white' THEN simplified_name := 'White Bread';
      ELSIF simplified_name ~* 'wheat|whole' THEN simplified_name := 'Whole Wheat Bread';
      ELSE simplified_name := 'Bread';
      END IF;

    -- Default: take first part before comma and clean up
    ELSE
      simplified_name := SPLIT_PART(simplified_name, ',', 1);
      simplified_name := REGEXP_REPLACE(simplified_name, '\(.*?\)', '', 'g');
      simplified_name := REGEXP_REPLACE(simplified_name, '\s+', ' ', 'g');
      simplified_name := TRIM(simplified_name);
    END IF;

    -- Final cleanup
    simplified_name := REGEXP_REPLACE(simplified_name, '\s+', ' ', 'g');
    simplified_name := TRIM(simplified_name);

    -- Update the record
    UPDATE food_items
    SET display_name = simplified_name
    WHERE id = food_record.id;

    updated_count := updated_count + 1;

    -- Progress logging every 10 records
    IF updated_count % 10 = 0 THEN
      RAISE NOTICE 'Progress: %/%', updated_count, total_count;
    END IF;
  END LOOP;

  RAISE NOTICE 'Smart backfill complete! Updated % records', updated_count;

  -- Refresh the materialized view
  RAISE NOTICE 'Refreshing materialized view...';
  REFRESH MATERIALIZED VIEW user_smart_suggestions;
  RAISE NOTICE 'Done!';
END $$;
