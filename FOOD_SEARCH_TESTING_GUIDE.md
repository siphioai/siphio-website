# Food Search Intelligence - Testing & Verification Guide

## 🎯 What You Should Experience

When you click "Add Food", you should immediately see:
1. **Top 6 smart suggestions** appearing instantly (zero typing required)
2. Clean, readable food names like "Chicken Breast" instead of "Chicken, broilers or fryers, breast, meat only, cooked, roasted"
3. Smart quantity defaults based on your typical usage
4. Typo-tolerant search when you type

## 📋 Setup Steps (Run These in Order)

### Step 1: Run the Backfill Script in Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `macro-tracker/scripts/backfill-display-names.sql`
5. Click **Run**
6. You should see output like:
   ```
   NOTICE:  Found 91 foods without display names
   NOTICE:  Progress: 10/91
   NOTICE:  Progress: 20/91
   ...
   NOTICE:  Backfill complete! Updated 91 records
   NOTICE:  Refreshing materialized view...
   NOTICE:  Done!
   ```

### Step 2: Verify the Migration

Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check display_name column exists and has data
SELECT name, display_name
FROM food_items
WHERE display_name IS NOT NULL
LIMIT 10;

-- 2. Check materialized view has data
SELECT COUNT(*) as suggestion_count
FROM user_smart_suggestions;

-- 3. Check if your user has suggestions
SELECT u.id as user_id, COUNT(s.*) as suggestions
FROM users u
LEFT JOIN user_smart_suggestions s ON s.user_id = u.id
GROUP BY u.id;
```

### Step 3: Test the Smart Suggestions API

1. Open your browser's Developer Console (F12)
2. Go to the **Network** tab
3. Click "Add Food" in the app
4. Look for the request to `/api/food-search/smart-suggestions`
5. Check the response - you should see:
   ```json
   {
     "success": true,
     "suggestions": [
       {
         "id": "...",
         "name": "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
         "display_name": "Chicken Breast",
         "calories_per_100g": 165,
         ...
       }
     ]
   }
   ```

### Step 4: Test the Features

#### Feature 1: Smart Suggestions (Instant Load)
1. Click "Add Food"
2. **Expected**: Top 6 food suggestions appear immediately in the Search tab
3. **If not working**: Check browser console for API errors

#### Feature 2: Clean Names
1. Look at the food names in the suggestions
2. **Expected**: "Chicken Breast" instead of "Chicken, broilers or fryers, breast, meat only, cooked, roasted"
3. **If not working**: Run the backfill script again

#### Feature 3: Smart Quantities
1. Click on a suggested food
2. **Expected**: The quantity field shows your typical amount (e.g., "150g") with a hint like "💡 Your usual: 150g"
3. **If not working**: This requires existing meal logs - log some foods first

#### Feature 4: Typo Tolerance
1. Type "chiken" (misspelled) in the search box
2. Click Search
3. **Expected**: Still shows chicken-related results
4. **If not working**: Verify the pg_trgm extension is enabled

## 🔍 Troubleshooting

### Issue: No Smart Suggestions Appearing

**Diagnosis Steps:**
1. Open browser console (F12) → Console tab
2. Look for errors when clicking "Add Food"
3. Check the Network tab for `/api/food-search/smart-suggestions` request
4. Look at the server logs in your terminal

**Common Causes:**
- Materialized view is empty (haven't logged any foods yet)
- Backfill script hasn't been run (display_names are NULL)
- API returning error (check console logs)

**Solution:**
1. Run the backfill script in Supabase
2. If you haven't logged any foods yet, the materialized view will be empty
3. The API now has a fallback - it will show popular foods instead
4. After logging some foods, refresh the materialized view:
   ```sql
   REFRESH MATERIALIZED VIEW user_smart_suggestions;
   ```

### Issue: Still Seeing Raw USDA Names

**Cause:** Display names weren't populated

**Solution:**
1. Run the backfill script in Supabase SQL Editor
2. Verify with: `SELECT name, display_name FROM food_items WHERE display_name IS NOT NULL LIMIT 10;`

### Issue: No Smart Quantities

**Cause:** This feature requires meal history

**Solution:**
1. Log some foods to build up history
2. After logging, refresh the materialized view:
   ```sql
   REFRESH MATERIALIZED VIEW user_smart_suggestions;
   ```

### Issue: Typo Tolerance Not Working

**Diagnosis:**
```sql
-- Check if pg_trgm extension is enabled
SELECT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
) AS pg_trgm_enabled;

-- Should return: true
```

**Solution:** Re-run migration 011

## 📊 Verification Checklist

- [ ] Backfill script executed successfully in Supabase
- [ ] Display names populated (verify with SQL query)
- [ ] Smart suggestions API returns data (check Network tab)
- [ ] Foods appear instantly when opening Add Food dialog
- [ ] Food names are clean and readable
- [ ] Search works with typos (e.g., "chiken" finds chicken)
- [ ] Materialized view has data (or shows fallback)

## 🎉 Expected User Experience

### Before (Old System)
1. Click "Add Food"
2. See empty search box
3. Type "chicken breast"
4. Click Search
5. Wait for results
6. Manually enter quantity (default: 100g)

### After (New Intelligent System)
1. Click "Add Food"
2. **Instantly see your top 6 foods** (chicken breast, rice, etc.)
3. Click food → **Quantity auto-filled with your typical amount** (e.g., 150g)
4. Add to meal
5. Done in 2 clicks!

## 📝 Testing Scenario

1. **Fresh Install Test:**
   - Run backfill script
   - Click "Add Food"
   - Should see fallback popular foods (sorted by calories)

2. **With History Test:**
   - Log some foods (chicken, rice, eggs)
   - Refresh materialized view
   - Click "Add Food"
   - Should see personalized suggestions with your typical quantities

3. **Typo Test:**
   - Search for "chiken" (misspelled)
   - Should find "Chicken Breast"

4. **Clean Names Test:**
   - All foods should show simplified names
   - No long USDA format names

## 🔗 Key Files

- **Backfill Script**: `macro-tracker/scripts/backfill-display-names.sql`
- **Verification Script**: `macro-tracker/scripts/verify-migration.sql`
- **Smart Suggestions API**: `macro-tracker/app/api/food-search/smart-suggestions/route.ts`
- **UI Component**: `macro-tracker/components/QuickAddFood.tsx`

## 🚀 Next Steps

1. Run the backfill script in Supabase
2. Test the smart suggestions
3. Log some foods to build up history
4. Refresh materialized view
5. Experience the intelligent food search!
