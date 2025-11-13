/**
 * Curated USDA Food Import Script
 *
 * Imports ~5,000-10,000 high-quality, commonly-used foods from USDA FoodData Central
 * with intelligent name simplification and duplicate prevention.
 *
 * Categories imported:
 * - Proteins (chicken, beef, pork, turkey, fish) - all cuts
 * - Grains (rice, pasta, bread, oats, quinoa)
 * - Produce (common fruits and vegetables)
 * - Dairy (milk, cheese, yogurt, eggs)
 * - Legumes (beans, lentils, chickpeas)
 */

import { createClient } from '@supabase/supabase-js';
import { simplifyFoodName } from '../lib/services/food-name-simplifier';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = process.env.USDA_API_KEY || '';

// IMPORTANT: Use SERVICE ROLE key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Nutrient IDs from USDA
const NUTRIENT_IDS = {
  ENERGY: 1008,    // Energy (kcal)
  PROTEIN: 1003,   // Protein (g)
  CARBS: 1005,     // Carbohydrate (g)
  FAT: 1004        // Total lipid (fat) (g)
};

// Curated search queries for high-quality foods
const CURATED_FOOD_QUERIES = {
  // Proteins (Priority 1)
  proteins: [
    // Chicken - all cuts and preparations
    'chicken breast raw', 'chicken breast cooked', 'chicken breast roasted', 'chicken breast grilled',
    'chicken thigh raw', 'chicken thigh cooked', 'chicken thigh roasted',
    'chicken wing raw', 'chicken wing cooked', 'chicken wing fried',
    'chicken drumstick raw', 'chicken drumstick cooked',
    'chicken leg raw', 'chicken leg roasted',
    'chicken tender cooked', 'ground chicken',

    // Beef - all cuts and preparations
    'beef sirloin raw', 'beef sirloin cooked', 'beef sirloin grilled',
    'beef ribeye raw', 'beef ribeye cooked',
    'beef tenderloin raw', 'beef tenderloin roasted',
    'beef chuck raw', 'beef chuck roasted',
    'beef brisket raw', 'beef brisket smoked',
    'beef round raw', 'beef round roasted',
    'beef flank raw', 'beef flank grilled',
    'ground beef 90/10', 'ground beef 85/15', 'ground beef 80/20', 'ground beef 93/7',

    // Pork - all cuts and preparations
    'pork chop raw', 'pork chop cooked', 'pork chop grilled',
    'pork tenderloin raw', 'pork tenderloin roasted',
    'pork loin raw', 'pork loin roasted',
    'pork shoulder raw', 'pork shoulder roasted',
    'pork ribs raw', 'pork ribs smoked',
    'ground pork',

    // Turkey
    'turkey breast raw', 'turkey breast roasted',
    'ground turkey', 'turkey thigh raw',

    // Fish and seafood
    'salmon raw', 'salmon cooked', 'salmon baked', 'salmon grilled',
    'tuna raw', 'tuna cooked', 'tuna grilled',
    'tilapia raw', 'tilapia cooked',
    'cod raw', 'cod baked',
    'halibut raw', 'mahi mahi raw',
    'shrimp raw', 'shrimp cooked',

    // Eggs
    'egg whole raw', 'egg whole cooked', 'egg whole scrambled', 'egg whole boiled',
    'egg white raw', 'egg white cooked',
  ],

  // Grains & Carbs (Priority 2)
  grains: [
    // Rice - all varieties
    'rice white long-grain cooked', 'rice white short-grain cooked', 'rice white raw',
    'rice brown long-grain cooked', 'rice brown short-grain cooked', 'rice brown raw',
    'rice basmati cooked', 'rice jasmine cooked',
    'rice wild cooked', 'rice wild raw',

    // Pasta
    'pasta enriched cooked', 'pasta whole-wheat cooked',
    'pasta enriched dry', 'pasta whole-wheat dry',

    // Bread
    'bread white', 'bread whole-wheat', 'bread whole wheat',
    'bread rye', 'bread sourdough',

    // Oats and cereals
    'oats rolled dry', 'oats steel-cut cooked',
    'quinoa cooked', 'quinoa raw',
  ],

  // Fruits (Priority 3)
  fruits: [
    'apple raw', 'banana raw', 'orange raw',
    'strawberries raw', 'blueberries raw', 'raspberries raw',
    'grape raw', 'mango raw', 'pineapple raw',
    'watermelon raw', 'cantaloupe raw',
    'peach raw', 'pear raw', 'plum raw',
    'avocado raw',
  ],

  // Vegetables (Priority 4)
  vegetables: [
    'broccoli raw', 'broccoli cooked',
    'spinach raw', 'spinach cooked',
    'kale raw', 'kale cooked',
    'carrots raw', 'carrots cooked',
    'tomato raw', 'tomato cooked',
    'potato baked', 'potato boiled', 'potato raw',
    'sweet potato baked', 'sweet potato raw',
    'onion raw', 'onion cooked',
    'bell pepper raw', 'green beans cooked',
    'cauliflower raw', 'cauliflower cooked',
    'zucchini raw', 'zucchini cooked',
    'asparagus raw', 'asparagus cooked',
  ],

  // Dairy (Priority 5)
  dairy: [
    'milk whole', 'milk skim', 'milk 2%', 'milk 1%',
    'cheese cheddar', 'cheese mozzarella', 'cheese parmesan',
    'cheese swiss', 'cheese feta',
    'yogurt plain whole milk', 'yogurt plain nonfat',
    'yogurt greek plain',
  ],

  // Legumes (Priority 6)
  legumes: [
    'beans black cooked', 'beans kidney cooked', 'beans pinto cooked',
    'chickpeas cooked', 'lentils cooked',
  ],

  // Nuts & Seeds (Priority 7)
  nuts: [
    'almonds', 'walnuts', 'pecans', 'cashews',
    'peanuts', 'peanut butter',
  ]
};

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
  }>;
}

interface ImportStats {
  totalQueried: number;
  totalFetched: number;
  totalImported: number;
  duplicatesSkipped: number;
  errors: number;
  byCategory: Record<string, number>;
}

async function fetchUSDAFoods(query: string, limit: number = 10): Promise<USDAFood[]> {
  try {
    const url = new URL(`${USDA_API_BASE}/foods/search`);
    url.searchParams.set('query', query);
    url.searchParams.set('dataType', 'SR Legacy'); // Standard Reference - most reliable
    url.searchParams.set('pageSize', limit.toString());
    if (USDA_API_KEY) {
      url.searchParams.set('api_key', USDA_API_KEY);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`  ⚠️  USDA API error for "${query}": ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.foods || [];
  } catch (error) {
    console.error(`  ❌ Failed to fetch "${query}":`, error);
    return [];
  }
}

function normalizeUSDAFood(usda: USDAFood) {
  const getNutrient = (id: number): number => {
    const nutrient = usda.foodNutrients.find(n => n.nutrientId === id);
    return nutrient?.value ?? 0;
  };

  const name = usda.description;
  const display_name = simplifyFoodName(name);

  return {
    usda_fdc_id: usda.fdcId.toString(),
    name,
    display_name,
    calories_per_100g: Number(getNutrient(NUTRIENT_IDS.ENERGY).toFixed(2)),
    protein_per_100g: Number(getNutrient(NUTRIENT_IDS.PROTEIN).toFixed(2)),
    carbs_per_100g: Number(getNutrient(NUTRIENT_IDS.CARBS).toFixed(2)),
    fat_per_100g: Number(getNutrient(NUTRIENT_IDS.FAT).toFixed(2)),
    category: 'SR Legacy'
  };
}

async function importCuratedFoods() {
  console.log('🚀 Starting curated USDA food import...\n');
  console.log('This will import ~5,000-10,000 high-quality, commonly-used foods.');
  console.log('Each food will get an intelligent simplified name automatically.\n');

  const stats: ImportStats = {
    totalQueried: 0,
    totalFetched: 0,
    totalImported: 0,
    duplicatesSkipped: 0,
    errors: 0,
    byCategory: {}
  };

  // Process each category
  for (const [category, queries] of Object.entries(CURATED_FOOD_QUERIES)) {
    console.log(`\n📦 Category: ${category.toUpperCase()}`);
    console.log(`   Queries: ${queries.length}`);

    stats.byCategory[category] = 0;
    let categoryImported = 0;

    // Process queries in batches of 5 (rate limiting)
    const batchSize = 5;
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      stats.totalQueried += batch.length;

      // Fetch in parallel
      const fetchPromises = batch.map(query => fetchUSDAFoods(query, 5)); // 5 results per query
      const results = await Promise.all(fetchPromises);

      const allFoods = results.flat();
      stats.totalFetched += allFoods.length;

      if (allFoods.length === 0) continue;

      // Normalize and prepare for insert
      const normalized = allFoods.map(normalizeUSDAFood);

      // Filter out foods with missing macros
      const valid = normalized.filter(food =>
        food.calories_per_100g > 0 || food.protein_per_100g > 0
      );

      if (valid.length === 0) continue;

      // Deduplicate by usda_fdc_id within this batch
      // CRITICAL: USDA can return same food multiple times in one query
      const seen = new Map<string, any>();
      const deduplicated = valid.filter(food => {
        if (!seen.has(food.usda_fdc_id)) {
          seen.set(food.usda_fdc_id, food);
          return true;
        }
        stats.duplicatesSkipped++;
        return false;
      });

      if (deduplicated.length === 0) continue;

      // Insert into database (upsert to handle duplicates across batches)
      try {
        const { data, error } = await supabase
          .from('food_items')
          .upsert(deduplicated, {
            onConflict: 'usda_fdc_id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error(`  ❌ Error inserting batch:`, error);
          stats.errors += deduplicated.length;
        } else {
          const imported = data?.length || 0;
          categoryImported += imported;
          stats.totalImported += imported;
          stats.byCategory[category] = categoryImported;

          // Show sample transformation
          if (i === 0 && deduplicated.length > 0) {
            const sample = deduplicated[0];
            console.log(`  Example: "${sample.name}"`);
            console.log(`         → "${sample.display_name}"`);
          }
        }
      } catch (error) {
        console.error(`  ❌ Database error:`, error);
        stats.errors += deduplicated.length;
      }

      // Progress update
      process.stdout.write(`\r  Progress: ${Math.round((i + batch.length) / queries.length * 100)}% `);

      // Rate limiting delay (150ms between batches)
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\r  ✅ ${categoryImported} foods imported`);
  }

  // Refresh materialized view
  console.log('\n🔄 Refreshing materialized view...');
  const { error: refreshError } = await supabase.rpc('refresh_smart_suggestions');

  if (refreshError) {
    console.error('⚠️  Error refreshing view:', refreshError);
  } else {
    console.log('✅ Materialized view refreshed!');
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 IMPORT COMPLETE!');
  console.log('='.repeat(60));
  console.log(`Total queries executed:  ${stats.totalQueried}`);
  console.log(`Total foods fetched:     ${stats.totalFetched}`);
  console.log(`Total foods imported:    ${stats.totalImported}`);
  console.log(`Duplicates skipped:      ${stats.duplicatesSkipped}`);
  console.log(`Errors:                  ${stats.errors}`);
  console.log('\nBy category:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(15)} ${count}`);
  });
  console.log('='.repeat(60));
}

importCuratedFoods();
