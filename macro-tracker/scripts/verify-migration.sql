-- Verification Script for Food Search Intelligence Migration
-- Run this in Supabase SQL Editor to verify everything worked

-- 1. Check pg_trgm extension
SELECT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
) AS pg_trgm_enabled;

-- 2. Check new columns on food_items
SELECT
  column_name,
  data_type,
  is_generated
FROM information_schema.columns
WHERE table_name = 'food_items'
  AND column_name IN ('display_name', 'search_vector')
ORDER BY column_name;

-- 3. Check indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'food_items'
  AND (indexname LIKE '%search%' OR indexname LIKE '%trigram%' OR indexname LIKE '%display%')
ORDER BY indexname;

-- 4. Check materialized view exists
SELECT EXISTS (
  SELECT 1 FROM pg_matviews WHERE matviewname = 'user_smart_suggestions'
) AS materialized_view_exists;

-- 5. Check materialized view row count
SELECT COUNT(*) as suggestion_count FROM user_smart_suggestions;

-- 6. Check if search function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'search_foods_fuzzy'
) AS search_function_exists;

-- 7. Check if refresh function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'refresh_smart_suggestions'
) AS refresh_function_exists;

-- 8. Sample: Get top suggestions for first user (if any)
SELECT
  u.id as user_id,
  f.name,
  f.display_name,
  s.log_count,
  s.typical_quantity_g,
  s.is_favorite,
  s.smart_score
FROM user_smart_suggestions s
JOIN users u ON s.user_id = u.id
JOIN food_items f ON s.food_item_id = f.id
ORDER BY u.id, s.smart_score DESC
LIMIT 10;

-- Expected Results:
-- 1. pg_trgm_enabled: true
-- 2. Should show 2 rows (display_name, search_vector)
-- 3. Should show 3 indexes (search, trigram, display_name)
-- 4. materialized_view_exists: true
-- 5. suggestion_count: may be 0 if no user history yet
-- 6. search_function_exists: true
-- 7. refresh_function_exists: true
-- 8. Should show suggestions if you have logged foods
