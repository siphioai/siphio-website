-- Backfill display names for existing food items
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  food_record RECORD;
  simplified_name TEXT;
  total_count INTEGER;
  updated_count INTEGER := 0;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM food_items WHERE display_name IS NULL;
  RAISE NOTICE 'Found % foods without display names', total_count;

  -- Process each food item
  FOR food_record IN
    SELECT id, name FROM food_items WHERE display_name IS NULL
  LOOP
    -- Simplify the name using pattern matching
    -- This is a simplified version - the full logic is in food-name-simplifier.ts
    simplified_name := SPLIT_PART(food_record.name, ',', 1);
    simplified_name := TRIM(simplified_name);
    simplified_name := REGEXP_REPLACE(simplified_name, '\s+', ' ', 'g');

    -- Basic transformations
    simplified_name := REGEXP_REPLACE(simplified_name, '^(Beef|Chicken|Pork|Turkey|Fish|Salmon|Tuna|Cod|Lamb)\,?\s*', '\1 ', 'i');
    simplified_name := REGEXP_REPLACE(simplified_name, '(boneless|skinless|skin on|bone-in)', '', 'gi');
    simplified_name := REGEXP_REPLACE(simplified_name, '\(.*?\)', '', 'g');
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

  RAISE NOTICE 'Backfill complete! Updated % records', updated_count;

  -- Refresh the materialized view
  RAISE NOTICE 'Refreshing materialized view...';
  REFRESH MATERIALIZED VIEW user_smart_suggestions;
  RAISE NOTICE 'Done!';
END $$;
