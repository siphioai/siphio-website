-- Comprehensive verification of backfill results
-- Check for duplicate display names and variety

-- 1. Check chicken variety (should show different cuts, not all "Chicken")
SELECT
  display_name,
  COUNT(*) as count,
  STRING_AGG(DISTINCT SUBSTRING(name, 1, 60), ' | ') as original_names_sample
FROM food_items
WHERE name ILIKE '%chicken%'
  AND display_name IS NOT NULL
GROUP BY display_name
ORDER BY count DESC
LIMIT 10;

-- 2. Check rice variety (should NOT all be "White Rice")
SELECT
  display_name,
  COUNT(*) as count,
  STRING_AGG(DISTINCT SUBSTRING(name, 1, 60), ' | ') as original_names_sample
FROM food_items
WHERE name ILIKE '%rice%'
  AND display_name IS NOT NULL
GROUP BY display_name
ORDER BY count DESC
LIMIT 10;

-- 3. Check for problematic rice products
SELECT
  name,
  display_name,
  calories_per_100g
FROM food_items
WHERE name ILIKE '%rice cracker%'
   OR name ILIKE '%rice cake%'
   OR name ILIKE '%rice snack%'
LIMIT 10;

-- 4. Overall statistics
SELECT
  COUNT(*) as total_foods,
  COUNT(display_name) as foods_with_display_name,
  COUNT(DISTINCT display_name) as unique_display_names,
  ROUND(COUNT(DISTINCT display_name)::numeric / COUNT(display_name)::numeric * 100, 2) as diversity_percentage
FROM food_items;

-- 5. Find duplicate display_names with different macros (the problem!)
SELECT
  display_name,
  COUNT(*) as duplicate_count,
  ROUND(MAX(calories_per_100g) - MIN(calories_per_100g), 0) as calorie_range,
  ROUND(MAX(protein_per_100g) - MIN(protein_per_100g), 1) as protein_range
FROM food_items
WHERE display_name IS NOT NULL
GROUP BY display_name
HAVING COUNT(*) > 3  -- More than 3 items with same display_name
ORDER BY duplicate_count DESC
LIMIT 15;
