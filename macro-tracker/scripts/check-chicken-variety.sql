-- Check what chicken items exist in database and their display names
SELECT
  display_name,
  COUNT(*) as count,
  ROUND(AVG(calories_per_100g), 0) as avg_calories,
  ROUND(AVG(protein_per_100g), 1) as avg_protein,
  STRING_AGG(DISTINCT SUBSTRING(name, 1, 80), ' | ' ORDER BY SUBSTRING(name, 1, 80)) as sample_names
FROM food_items
WHERE name ILIKE '%chicken%'
  AND name NOT ILIKE '%noodle%'
  AND name NOT ILIKE '%soup%'
  AND name NOT ILIKE '%broth%'
GROUP BY display_name
ORDER BY count DESC, display_name;

-- Also check raw names to see if we have variety in source data
SELECT
  name,
  display_name,
  calories_per_100g,
  protein_per_100g
FROM food_items
WHERE name ILIKE '%chicken%'
  AND name NOT ILIKE '%noodle%'
  AND name NOT ILIKE '%soup%'
  AND name NOT ILIKE '%broth%'
ORDER BY name
LIMIT 20;
