# 🚀 Curated USDA Food Import Guide

## Overview

This guide explains how to import ~5,000-10,000 high-quality, commonly-used foods from the USDA FoodData Central database into your macro tracker.

## What Gets Imported

### ✅ Categories Included (Priority Order)

1. **Proteins** (~500-700 items)
   - Chicken: All cuts (breast, thigh, wing, drumstick, leg, tender), all preparations (raw, cooked, roasted, grilled, fried)
   - Beef: All cuts (sirloin, ribeye, tenderloin, chuck, brisket, round, flank), ground beef variations
   - Pork: All cuts (chop, tenderloin, loin, shoulder, ribs), ground pork
   - Turkey: Breast, thigh, ground turkey
   - Fish: Salmon, tuna, tilapia, cod, halibut, mahi, shrimp - all preparations
   - Eggs: Whole, white, all preparations

2. **Grains & Carbs** (~100-150 items)
   - Rice: White, brown, basmati, jasmine, wild - cooked and raw
   - Pasta: Enriched, whole-wheat - cooked and dry
   - Bread: White, whole-wheat, rye, sourdough
   - Oats: Rolled, steel-cut
   - Quinoa: Cooked and raw

3. **Fruits** (~50-80 items)
   - Common fruits: Apple, banana, orange, berries, mango, pineapple, watermelon, avocado, etc.

4. **Vegetables** (~80-120 items)
   - Common vegetables: Broccoli, spinach, kale, carrots, tomato, potato, sweet potato, onion, peppers, etc.
   - Raw and cooked preparations

5. **Dairy** (~40-60 items)
   - Milk: Whole, skim, 2%, 1%
   - Cheese: Cheddar, mozzarella, parmesan, swiss, feta
   - Yogurt: Plain, greek, various fat contents

6. **Legumes** (~20-30 items)
   - Beans: Black, kidney, pinto
   - Chickpeas, lentils

7. **Nuts & Seeds** (~15-25 items)
   - Almonds, walnuts, pecans, cashews, peanuts, peanut butter

## ✨ Smart Features

### Automatic Name Simplification

All foods get clean, user-friendly names automatically:

```
"Chicken, broilers or fryers, thigh, meat only, cooked, roasted"
  → "Chicken Thigh (roasted)"

"Beef, round, top round steak, separable lean only, trimmed to 0\" fat, choice, raw"
  → "Beef Round (raw)"

"Rice, brown, long-grain, cooked"
  → "Brown Rice (cooked)"
```

### Duplicate Prevention

The script uses `usda_fdc_id` to prevent duplicates. If a food already exists, it gets updated instead of creating a duplicate.

### Quality Filtering

Only imports foods with valid macro data (calories, protein, carbs, fat).

## 📋 Prerequisites

### 1. USDA API Key (Optional but Recommended)

Get a free API key from USDA FoodData Central:
1. Go to: https://fdc.nal.usda.gov/api-key-signup.html
2. Sign up with your email
3. Copy your API key

Add to your `.env` file:
```bash
USDA_API_KEY=your_api_key_here
```

**Note**: The script works without an API key, but with limits. An API key gives you higher rate limits.

### 2. Verify Environment Variables

Make sure your `.env` file has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
USDA_API_KEY=your_usda_api_key  # Optional
```

## 🚀 Running the Import

### Step 1: Dry Run (Recommended)

First, test with a small sample to verify everything works:

Edit `import-curated-usda-foods.ts` temporarily:
```typescript
// Change line ~280 to limit results
const fetchPromises = batch.map(query => fetchUSDAFoods(query, 1)); // Changed from 5 to 1
```

Run the test:
```bash
npx tsx scripts/import-curated-usda-foods.ts
```

You should see:
- ✅ Category progress
- ✅ Sample transformations
- ✅ Import statistics

### Step 2: Full Import

Once verified, change back to full import:
```typescript
const fetchPromises = batch.map(query => fetchUSDAFoods(query, 5)); // Back to 5
```

Run the full import:
```bash
npx tsx scripts/import-curated-usda-foods.ts
```

**Expected Duration**: 15-30 minutes (depending on API rate limits)

## 📊 Expected Output

```
🚀 Starting curated USDA food import...

This will import ~5,000-10,000 high-quality, commonly-used foods.
Each food will get an intelligent simplified name automatically.

📦 Category: PROTEINS
   Queries: 65
  Example: "Chicken, broilers or fryers, breast, meat only, cooked, roasted"
         → "Chicken Breast (roasted)"
  Progress: 100%
  ✅ 487 foods imported

📦 Category: GRAINS
   Queries: 15
  Example: "Rice, brown, long-grain, cooked"
         → "Brown Rice (cooked)"
  Progress: 100%
  ✅ 89 foods imported

📦 Category: FRUITS
   Queries: 15
  ✅ 73 foods imported

📦 Category: VEGETABLES
   Queries: 28
  ✅ 156 foods imported

📦 Category: DAIRY
   Queries: 12
  ✅ 67 foods imported

📦 Category: LEGUMES
   Queries: 5
  ✅ 28 foods imported

📦 Category: NUTS
   Queries: 6
  ✅ 34 foods imported

🔄 Refreshing materialized view...
✅ Materialized view refreshed!

============================================================
🎉 IMPORT COMPLETE!
============================================================
Total queries executed:  146
Total foods fetched:     1,453
Total foods imported:    934
Duplicates skipped:      519
Errors:                  0

By category:
  proteins        487
  grains          89
  fruits          73
  vegetables      156
  dairy           67
  legumes         28
  nuts            34
============================================================
```

## 🧪 Verification

After import, verify the results:

### 1. Check Database

Run in Supabase SQL Editor:
```sql
-- Check total foods
SELECT COUNT(*) FROM food_items;

-- Check chicken variety
SELECT display_name, COUNT(*)
FROM food_items
WHERE name ILIKE '%chicken%'
GROUP BY display_name
ORDER BY COUNT(*) DESC;

-- Verify diversity
SELECT
  COUNT(*) as total_foods,
  COUNT(DISTINCT display_name) as unique_display_names,
  ROUND(COUNT(DISTINCT display_name)::numeric / COUNT(*)::numeric * 100, 2) as diversity_percentage
FROM food_items;
```

### 2. Test Search

Go to your app and search for:
- "chicken" → Should show Breast, Thigh, Wing, Drumstick
- "beef" → Should show Sirloin, Ribeye, Tenderloin, Ground variations
- "rice" → Should show White Rice, Brown Rice, Basmati, Jasmine, Wild Rice

## 🔧 Troubleshooting

### Problem: "USDA API error 429"
**Solution**: You hit the rate limit. Add `USDA_API_KEY` to `.env` or wait 1 hour.

### Problem: "Database error: duplicate key"
**Solution**: This is normal! The script handles duplicates automatically using upsert.

### Problem: "No foods imported"
**Solution**:
1. Check internet connection
2. Verify USDA API is working: https://fdc.nal.usda.gov/api-guide.html
3. Check your .env file has correct Supabase credentials

### Problem: "Error refreshing view"
**Solution**: Run this SQL manually in Supabase:
```sql
REFRESH MATERIALIZED VIEW user_smart_suggestions;
```

## 📈 Next Steps

After successful import:

1. **Test Search** - Verify diverse results appear for common searches
2. **Monitor Performance** - Search should stay fast (<200ms)
3. **User Feedback** - Collect feedback on food variety and naming
4. **Expand** - Add more categories later if needed (see Customization below)

## 🎨 Customization

### Add More Foods

Edit `CURATED_FOOD_QUERIES` in the script to add more search queries:

```typescript
// Add to existing category
proteins: [
  ...existing queries,
  'lamb chop raw',
  'lamb shoulder roasted',
],

// Or add new category
baking: [
  'flour all-purpose',
  'sugar granulated',
  'baking powder',
]
```

### Adjust Results Per Query

Change the number of results fetched per query:

```typescript
// Line ~280
const fetchPromises = batch.map(query => fetchUSDAFoods(query, 10)); // Changed from 5 to 10
```

### Change Rate Limiting

Adjust the delay between batches:

```typescript
// Line ~320
await new Promise(resolve => setTimeout(resolve, 300)); // Changed from 150ms to 300ms
```

## ⚠️ Important Notes

1. **Service Role Key**: The script uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. Keep this key secure!
2. **Rate Limiting**: The script includes delays to respect USDA API limits
3. **Duplicates**: Foods with the same `usda_fdc_id` will be updated, not duplicated
4. **Categories**: All foods start with `category: 'SR Legacy'` (USDA Standard Reference)
5. **Display Names**: Generated automatically using your existing `food-name-simplifier` service

## 🎉 Success Criteria

After import, you should have:
- ✅ ~1,000-2,000 unique foods (actual number depends on USDA availability)
- ✅ Diverse chicken results (Breast, Thigh, Wing, Drumstick)
- ✅ Multiple beef cuts (Sirloin, Ribeye, Tenderloin, etc.)
- ✅ All major food categories covered
- ✅ Fast search performance (<200ms)
- ✅ Clean, user-friendly display names

## 📞 Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Review the script output for error messages
3. Verify your .env configuration
4. Check Supabase dashboard for database errors
