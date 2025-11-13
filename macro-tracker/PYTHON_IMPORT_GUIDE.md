# Python USDA Bulk Import Guide

This guide explains what your Python script needs to do to import the USDA FoodData Central database into the `curated_foods` table.

## 📥 USDA Data Source

**Download**: https://fdc.nal.usda.gov/download-datasets.html

**Files to use**:
- **Foundation Foods** (~7,000 foods) - Core whole foods
- **SR Legacy** (~8,000 foods) - Historical Standard Reference
- **Branded Foods** (optional, ~200,000 foods) - For later integration

**Format**: CSV/JSON files in ZIP archive

## 🎯 Target Table Structure

Your Python script should insert data into the `curated_foods` table with this structure:

```sql
CREATE TABLE curated_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Required Fields
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  protein_per_100g DECIMAL(6,2) NOT NULL,
  carbs_per_100g DECIMAL(6,2) NOT NULL,
  fat_per_100g DECIMAL(6,2) NOT NULL,
  calories_per_100g DECIMAL(6,2) NOT NULL,

  -- Optional but Recommended
  subcategory TEXT,
  fiber_per_100g DECIMAL(6,2) DEFAULT 0,
  sugar_per_100g DECIMAL(6,2) DEFAULT 0,
  sodium_per_100mg DECIMAL(6,2) DEFAULT 0,
  variation_type TEXT,
  preparation TEXT,
  modifiers TEXT[],

  -- Metadata
  source TEXT[] DEFAULT ARRAY['usda'],
  usda_fdc_id INTEGER,
  verified BOOLEAN DEFAULT true,
  confidence_score DECIMAL(3,2) DEFAULT 0.95,

  -- Search (auto-populated by trigger)
  search_vector tsvector,
  aliases TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Optional
  serving_sizes JSONB DEFAULT '[]'::jsonb,
  review_status TEXT DEFAULT 'approved'
);
```

## 📋 Python Script Requirements

### 1. Read USDA CSV/JSON Files
```python
import pandas as pd
import json
from pathlib import Path

# Read Foundation Foods
foundation_df = pd.read_csv('foundation_download/food.csv')
nutrients_df = pd.read_csv('foundation_download/food_nutrient.csv')

# Read SR Legacy
sr_legacy_df = pd.read_csv('sr_legacy_download/food.csv')
# ... etc
```

### 2. Clean Food Names

**Original USDA Format**:
```
"CHICKEN,BROILERS OR FRYERS,BREAST,MEAT ONLY,CKD,RSTD"
```

**Your Script Should Transform To**:
```python
{
  "name": "Chicken Breast",
  "display_name": "Chicken Breast (Cooked, No Skin)",
  "variation_type": "breast",
  "preparation": "roasted",
  "modifiers": ["no skin", "boneless"]
}
```

**Use the TypeScript parser as reference**: `lib/services/food-name-parser.ts`

### 3. Categorize Foods

Map USDA food groups to our categories:

```python
CATEGORY_MAPPING = {
    'Poultry Products': 'protein_meat',
    'Beef Products': 'protein_meat',
    'Pork Products': 'protein_meat',
    'Finfish and Shellfish Products': 'protein_fish',
    'Dairy and Egg Products': 'protein_eggs_dairy',
    'Vegetables and Vegetable Products': 'vegetables',
    'Fruits and Fruit Juices': 'fruits',
    'Cereal Grains and Pasta': 'grains',
    'Legumes and Legume Products': 'legumes',
    'Nut and Seed Products': 'nuts_seeds',
    'Fats and Oils': 'oils_fats',
    'Beverages': 'beverages',
}
```

### 4. Extract Macros (per 100g)

USDA data has nutrients - you need to extract:
- **Protein**: Nutrient ID 1003
- **Carbohydrate**: Nutrient ID 1005
- **Fat**: Nutrient ID 1004
- **Energy**: Nutrient ID 1008 (in kcal)
- **Fiber**: Nutrient ID 1079
- **Sugars**: Nutrient ID 2000

```python
def get_nutrient_value(fdc_id, nutrient_id, nutrients_df):
    """Extract nutrient value per 100g"""
    row = nutrients_df[
        (nutrients_df['fdc_id'] == fdc_id) &
        (nutrients_df['nutrient_id'] == nutrient_id)
    ]
    if len(row) > 0:
        return row.iloc[0]['amount']  # Already per 100g in USDA data
    return 0
```

### 5. Insert to Supabase

```python
from supabase import create_client, Client
import os

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)

def insert_food(food_data):
    """Insert a single food into curated_foods table"""
    result = supabase.table("curated_foods").insert({
        "name": food_data["name"],
        "display_name": food_data["display_name"],
        "category": food_data["category"],
        "subcategory": food_data.get("subcategory"),
        "protein_per_100g": food_data["protein_per_100g"],
        "carbs_per_100g": food_data["carbs_per_100g"],
        "fat_per_100g": food_data["fat_per_100g"],
        "calories_per_100g": food_data["calories_per_100g"],
        "fiber_per_100g": food_data.get("fiber_per_100g", 0),
        "sugar_per_100g": food_data.get("sugar_per_100g", 0),
        "variation_type": food_data.get("variation_type"),
        "preparation": food_data.get("preparation"),
        "modifiers": food_data.get("modifiers", []),
        "source": ["usda"],
        "usda_fdc_id": food_data["fdc_id"],
        "verified": True,
        "review_status": "approved"
    }).execute()
    return result

# Batch insert for performance
def batch_insert_foods(foods_list, batch_size=100):
    """Insert foods in batches"""
    for i in range(0, len(foods_list), batch_size):
        batch = foods_list[i:i+batch_size]
        supabase.table("curated_foods").insert(batch).execute()
        print(f"Inserted {i + len(batch)} / {len(foods_list)} foods")
```

## ⚠️ Important Considerations

### Data Quality Filters

**Skip foods with**:
- Missing macros (protein, carbs, fat, calories all 0)
- Invalid FDC IDs
- Extremely long names (>200 characters)
- Test/placeholder entries

### Deduplication

Check for existing `usda_fdc_id` before inserting:

```python
def food_exists(fdc_id):
    result = supabase.table("curated_foods")\
        .select("id")\
        .eq("usda_fdc_id", fdc_id)\
        .execute()
    return len(result.data) > 0

# Only insert if new
if not food_exists(food_data["fdc_id"]):
    insert_food(food_data)
```

### Performance

For ~15,000 foods:
- **Batch size**: 100-500 foods per batch
- **Estimated time**: 5-15 minutes
- **Memory**: Process in chunks if dataset is large

## 📊 Expected Results

After running your Python script:

```sql
-- Should have ~15,000+ foods
SELECT COUNT(*) FROM curated_foods WHERE 'usda' = ANY(source);

-- Category breakdown
SELECT category, COUNT(*) as count
FROM curated_foods
WHERE 'usda' = ANY(source)
GROUP BY category
ORDER BY count DESC;

-- Sample data check
SELECT display_name, category, calories_per_100g, protein_per_100g
FROM curated_foods
WHERE name ILIKE '%chicken%'
LIMIT 10;
```

## 🎯 Success Criteria

Your Python script should:
- ✅ Import all Foundation Foods (~7,000)
- ✅ Import all SR Legacy foods (~8,000)
- ✅ Clean and normalize all food names
- ✅ Correctly categorize foods
- ✅ Extract accurate macros per 100g
- ✅ Set proper metadata (source, verified, etc.)
- ✅ Handle errors gracefully
- ✅ Provide progress logging
- ✅ Complete in under 30 minutes

## 🔧 Debugging

**Check imported data**:
```sql
-- Random sampling
SELECT * FROM curated_foods
WHERE 'usda' = ANY(source)
ORDER BY RANDOM()
LIMIT 10;

-- Verify search works
SELECT * FROM search_curated_foods('chicken', 20, NULL);

-- Check for missing macros
SELECT COUNT(*) FROM curated_foods
WHERE calories_per_100g = 0 OR protein_per_100g = 0;
```

## 📁 Suggested Script Structure

```python
# import_usda_bulk.py
import pandas as pd
from supabase import create_client
from food_name_cleaner import clean_food_name  # Your cleaning logic
from category_mapper import map_category      # Your category mapping

def main():
    # 1. Load USDA data
    print("Loading USDA data...")
    foundation_foods = load_foundation_foods()
    sr_legacy_foods = load_sr_legacy_foods()

    # 2. Clean and transform
    print("Cleaning and transforming...")
    cleaned_foods = []
    for food in foundation_foods + sr_legacy_foods:
        cleaned = clean_and_transform(food)
        if is_valid_food(cleaned):
            cleaned_foods.append(cleaned)

    # 3. Batch insert to Supabase
    print(f"Inserting {len(cleaned_foods)} foods...")
    batch_insert_foods(cleaned_foods, batch_size=100)

    print("✅ Import complete!")

if __name__ == "__main__":
    main()
```

## 🚀 Next Steps

After your Python import completes:
1. Run the SQL verification queries above
2. Test search functionality: `npm run dev` and search for "chicken"
3. Verify food names are distinct and clear
4. Check that all categories are populated
5. Monitor search speed (should be 50-150ms)

Good luck with your Python script! 🐍
