# Troubleshooting Dummy Data Generation

## Overview
If you're having issues running the seed data SQL scripts, follow this guide to diagnose and fix the problem.

## Quick Start: Try the Minimal Script

The `minimal_seed.sql` script is designed to be run step-by-step. This helps identify exactly where any issues occur.

### How to Use minimal_seed.sql

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste **only Step 1** (food items section)
3. Run it
4. If it succeeds, move to Step 2
5. Continue with each step until you find which one fails

## Common Errors and Solutions

### Error: "column X does not exist"

**Cause**: The SQL is trying to insert into a column that doesn't exist in your schema.

**Solution**:
1. Check your actual schema:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'food_items';
   ```
2. Compare with the script and remove any columns that don't exist in your table

### Error: "duplicate key value violates unique constraint"

**Cause**: You're trying to insert data that already exists.

**Solution**: The script uses `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`. If you still get this error:
1. First, check what data already exists:
   ```sql
   SELECT * FROM food_items WHERE usda_fdc_id LIKE 'seed_%';
   SELECT * FROM macro_goals WHERE date >= CURRENT_DATE - 13;
   ```
2. Delete existing seed data if needed:
   ```sql
   DELETE FROM food_items WHERE usda_fdc_id LIKE 'seed_%';
   ```

### Error: "null value in column X violates not-null constraint"

**Cause**: A required field is missing in the INSERT statement.

**Solution**:
1. Check which columns are required:
   ```sql
   SELECT column_name, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'food_items' AND is_nullable = 'NO';
   ```
2. Ensure all NOT NULL columns are included in the INSERT

### Error: "No rows returned" or script runs but no data appears

**Cause**: Usually means the `users` table is empty or the user lookup is failing.

**Solution**:
1. Check if you have users:
   ```sql
   SELECT id, email FROM users;
   ```
2. If no users exist, you need to sign up first through your app
3. Once a user exists, re-run the seed script

### Error: "permission denied" or RLS policy error

**Cause**: Row Level Security (RLS) policies are blocking the insert.

**Solution**:
1. Temporarily disable RLS (only do this in development):
   ```sql
   ALTER TABLE food_items DISABLE ROW LEVEL SECURITY;
   ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
   ALTER TABLE meal_items DISABLE ROW LEVEL SECURITY;
   ALTER TABLE macro_goals DISABLE ROW LEVEL SECURITY;
   ```
2. Run the seed script
3. Re-enable RLS:
   ```sql
   ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
   ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE macro_goals ENABLE ROW LEVEL SECURITY;
   ```

### Error: "function generate_series does not exist"

**Cause**: Very unlikely, but some PostgreSQL configurations might not have this function.

**Solution**: Use an alternative approach - run a manual INSERT for each day:
```sql
INSERT INTO macro_goals (user_id, date, calories_target, protein_target, carbs_target, fat_target)
VALUES
  ((SELECT id FROM users LIMIT 1), CURRENT_DATE, 2000, 150, 200, 65),
  ((SELECT id FROM users LIMIT 1), CURRENT_DATE - 1, 2000, 150, 200, 65),
  ((SELECT id FROM users LIMIT 1), CURRENT_DATE - 2, 2000, 150, 200, 65)
  -- ... continue for each day
ON CONFLICT (user_id, date) DO NOTHING;
```

## Manual Verification Steps

After running any seed script, verify the data was created:

### 1. Check food items
```sql
SELECT usda_fdc_id, name, calories_per_100g
FROM food_items
WHERE usda_fdc_id LIKE 'seed_%'
ORDER BY name;
```

**Expected**: Should see 5+ food items with names like "Scrambled Eggs", "Grilled Chicken Breast", etc.

### 2. Check macro goals
```sql
SELECT date, calories_target, protein_target
FROM macro_goals
WHERE date >= CURRENT_DATE - 13
ORDER BY date DESC;
```

**Expected**: Should see 14 rows (one for each day)

### 3. Check meals
```sql
SELECT date, meal_type, COUNT(*) as meal_count
FROM meals
WHERE date >= CURRENT_DATE - 1
GROUP BY date, meal_type
ORDER BY date DESC, meal_type;
```

**Expected**: Should see meals for today and yesterday

### 4. Check meal items
```sql
SELECT
  m.date,
  m.meal_type,
  fi.name,
  mi.quantity_g,
  mi.calories
FROM meal_items mi
JOIN meals m ON mi.meal_id = m.id
JOIN food_items fi ON mi.food_item_id = fi.id
WHERE m.date >= CURRENT_DATE - 1
ORDER BY m.date DESC, m.meal_type, fi.name;
```

**Expected**: Should see individual food items logged to each meal

### 5. Check daily summary
```sql
SELECT
  date,
  total_calories,
  total_protein,
  total_carbs,
  total_fat,
  calories_target
FROM daily_summary
WHERE date >= CURRENT_DATE - 1
ORDER BY date DESC;
```

**Expected**: Should see calculated totals matching the meal items

## Still Having Issues?

### Share Your Error

If none of the above solutions work, please share:

1. The exact error message (copy the full text)
2. Which script you're running (simple_seed.sql, minimal_seed.sql, etc.)
3. Results from this diagnostic query:

```sql
-- Diagnostic information
SELECT
  'Users exist?' as check_name,
  CASE WHEN COUNT(*) > 0 THEN 'YES ✅' ELSE 'NO ❌' END as result,
  COUNT(*)::TEXT as count
FROM users

UNION ALL

SELECT
  'Food items table exists?',
  CASE WHEN COUNT(*) >= 0 THEN 'YES ✅' ELSE 'NO ❌' END,
  COUNT(*)::TEXT
FROM food_items

UNION ALL

SELECT
  'Meals table exists?',
  CASE WHEN COUNT(*) >= 0 THEN 'YES ✅' ELSE 'NO ❌' END,
  COUNT(*)::TEXT
FROM meals

UNION ALL

SELECT
  'Macro goals table exists?',
  CASE WHEN COUNT(*) >= 0 THEN 'YES ✅' ELSE 'NO ❌' END,
  COUNT(*)::TEXT
FROM macro_goals;
```

### Last Resort: Super Simple Single Insert

If everything fails, try this absolute minimal test:

```sql
-- Single food item
INSERT INTO food_items (usda_fdc_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
VALUES ('test_item', 'Test Food', 100, 10, 10, 5)
ON CONFLICT (usda_fdc_id) DO NOTHING;

-- Verify it worked
SELECT * FROM food_items WHERE usda_fdc_id = 'test_item';
```

If even this fails, there's likely a schema mismatch or permissions issue that needs to be addressed at the database level.

## Alternative: Use the App UI

If SQL scripts continue to fail, you can manually add data through your app:

1. Sign in to your app
2. Set your macro goals for today
3. Use the "Add Food" button to log meals
4. Repeat for a few days to build up history

While this is slower, it ensures all triggers and RLS policies work correctly.
