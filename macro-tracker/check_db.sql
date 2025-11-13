-- Quick check: do we have different chicken cuts in raw data?
SELECT 
  CASE
    WHEN name ILIKE '%thigh%' THEN 'HAS_THIGH'
    WHEN name ILIKE '%wing%' THEN 'HAS_WING'
    WHEN name ILIKE '%drumstick%' THEN 'HAS_DRUMSTICK'
    WHEN name ILIKE '%leg%' THEN 'HAS_LEG'
    WHEN name ILIKE '%breast%' THEN 'HAS_BREAST'
    ELSE 'OTHER'
  END as cut_type,
  COUNT(*) as count
FROM food_items
WHERE name ILIKE '%chicken%'
GROUP BY cut_type
ORDER BY count DESC;
