-- Verification queries after running backfill-display-names.sql
-- Run these in Supabase SQL Editor to confirm everything worked

-- 1. Check if display_name is populated (should show clean names)
SELECT
  name as original_name,
  display_name as simplified_name
FROM food_items
WHERE name ILIKE '%chicken breast%'
LIMIT 5;

-- Expected:
-- original_name: "Chicken, broilers or fryers, breast, meat only, cooked, roasted"
-- simplified_name: "Chicken Breast"

-- 2. Check total foods with display_name
SELECT
  COUNT(*) as total_foods,
  COUNT(display_name) as foods_with_display_name,
  ROUND(COUNT(display_name)::numeric / COUNT(*)::numeric * 100, 2) as percentage_complete
FROM food_items;

-- Expected: Should show 100% or close to it

-- 3. Check if materialized view was refreshed (should have data)
SELECT COUNT(*) as suggestion_count FROM user_smart_suggestions;

-- Expected: May be 0 if no meal history, otherwise should show suggestions

-- 4. Sample clean names (verify simplification worked)
SELECT
  display_name,
  calories_per_100g,
  protein_per_100g
FROM food_items
WHERE display_name IS NOT NULL
ORDER BY calories_per_100g DESC
LIMIT 10;

-- Expected: Should see clean, readable names like:
-- "Chicken Breast", "Basmati Rice", "Scrambled Eggs", etc.

-- 5. Check common foods for fallback suggestions
SELECT
  id,
  display_name,
  name,
  calories_per_100g
FROM food_items
WHERE name ILIKE '%chicken breast%'
   OR name ILIKE '%rice%'
   OR name ILIKE '%egg%'
   OR name ILIKE '%salmon%'
   OR name ILIKE '%banana%'
   OR name ILIKE '%oats%'
LIMIT 10;

-- Expected: Should show common foods with display_name populated
