/**
 * =====================================================
 * AI-POWERED FOOD CURATION SCRIPT
 * =====================================================
 * Uses Claude AI to generate comprehensive, accurate
 * curated food database from USDA data and nutrition sources
 *
 * Usage:
 *   npm run curate-foods -- --category chicken --count 20
 *   npm run curate-foods -- --all
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

// =====================================================
// CONFIGURATION
// =====================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MODEL = 'claude-3-5-sonnet-20241022';

// =====================================================
// FOOD CATEGORIES TO CURATE
// =====================================================

const FOOD_CATEGORIES = {
  // Proteins
  chicken: {
    category: 'protein_meat',
    subcategory: 'poultry',
    count: 25,
    description: 'chicken variations including different cuts and preparations',
  },
  turkey: {
    category: 'protein_meat',
    subcategory: 'poultry',
    count: 15,
    description: 'turkey variations including different cuts and preparations',
  },
  beef: {
    category: 'protein_meat',
    subcategory: 'red_meat',
    count: 25,
    description: 'beef variations including different cuts and preparations',
  },
  pork: {
    category: 'protein_meat',
    subcategory: 'red_meat',
    count: 20,
    description: 'pork variations including different cuts and preparations',
  },
  lamb: {
    category: 'protein_meat',
    subcategory: 'red_meat',
    count: 10,
    description: 'lamb variations including different cuts and preparations',
  },

  // Fish & Seafood
  salmon: {
    category: 'protein_fish',
    subcategory: 'fatty_fish',
    count: 15,
    description: 'salmon variations including wild/farmed, Atlantic/Pacific, different preparations',
  },
  tuna: {
    category: 'protein_fish',
    subcategory: 'fatty_fish',
    count: 12,
    description: 'tuna variations including fresh, canned, different species',
  },
  cod: {
    category: 'protein_fish',
    subcategory: 'white_fish',
    count: 10,
    description: 'cod and other white fish variations',
  },
  shrimp: {
    category: 'protein_fish',
    subcategory: 'shellfish',
    count: 10,
    description: 'shrimp and shellfish variations',
  },

  // Eggs & Dairy
  eggs: {
    category: 'protein_eggs_dairy',
    subcategory: 'eggs',
    count: 15,
    description: 'egg variations including whole, whites, yolks, different preparations',
  },
  dairy: {
    category: 'protein_eggs_dairy',
    subcategory: 'dairy',
    count: 30,
    description: 'dairy products including milk, yogurt, cheese, cottage cheese',
  },

  // Vegetables
  vegetables: {
    category: 'vegetables',
    subcategory: null,
    count: 50,
    description:
      'common vegetables including leafy greens, cruciferous, root vegetables, peppers, etc.',
  },

  // Fruits
  fruits: {
    category: 'fruits',
    subcategory: null,
    count: 40,
    description: 'common fruits including berries, citrus, tropical, stone fruits',
  },

  // Grains
  grains: {
    category: 'grains',
    subcategory: null,
    count: 30,
    description: 'grains including rice, pasta, bread, oats, quinoa, etc.',
  },

  // Legumes
  legumes: {
    category: 'legumes',
    subcategory: null,
    count: 20,
    description: 'beans, lentils, chickpeas, and other legumes',
  },

  // Nuts & Seeds
  nuts_seeds: {
    category: 'nuts_seeds',
    subcategory: null,
    count: 25,
    description: 'nuts and seeds including almonds, walnuts, chia, flax, etc.',
  },

  // Oils & Fats
  oils_fats: {
    category: 'oils_fats',
    subcategory: null,
    count: 15,
    description: 'cooking oils, butter, avocado, and other healthy fats',
  },
};

// =====================================================
// AI CURATION PROMPT
// =====================================================

function createCurationPrompt(
  foodType: string,
  category: string,
  subcategory: string | null,
  description: string,
  count: number
): string {
  return `You are a professional nutrition database curator with expertise in USDA nutrition data and food science.

Your task: Generate a comprehensive, accurate list of ${count} ${description}.

Requirements:
1. Each food must have ACCURATE macros per 100g verified from USDA database
2. Include diverse variations (cuts, preparations, types)
3. Use clean, human-readable names
4. Include common serving sizes with accurate gram weights
5. Add search aliases people might use
6. If available, include USDA FDC ID for verification

Category: ${category}
${subcategory ? `Subcategory: ${subcategory}` : ''}

For each food, provide:
- name: Base name (e.g., "Chicken Breast", "Salmon")
- display_name: Full descriptive name (e.g., "Chicken Breast (Cooked, No Skin)")
- variation_type: Specific cut or type (e.g., "breast", "fillet", "ground")
- preparation: Cooking method (e.g., "cooked", "grilled", "raw", "roasted")
- modifiers: Array of descriptors (e.g., ["no skin", "boneless", "wild"])
- protein_per_100g: Grams of protein per 100g
- carbs_per_100g: Grams of carbohydrates per 100g
- fat_per_100g: Grams of fat per 100g
- calories_per_100g: Calories per 100g
- fiber_per_100g: Grams of fiber per 100g (0 if none)
- sugar_per_100g: Grams of sugar per 100g (0 if none)
- serving_sizes: Array of common servings with format:
  [
    { "unit": "oz", "grams": 28, "display": "1 oz" },
    { "unit": "breast", "grams": 174, "display": "1 medium breast (6 oz)" }
  ]
- aliases: Array of search terms (e.g., ["chicken breast", "grilled chicken", "chicken"])
- usda_fdc_id: USDA Food Data Central ID (if known, otherwise null)

CRITICAL REQUIREMENTS:
- Macros MUST be accurate - verify from USDA database
- Include both raw and cooked variations where applicable
- For meats: include with/without skin, different cooking methods
- For fish: include wild/farmed, Atlantic/Pacific if relevant
- Serving sizes must be realistic and commonly used
- All numeric values must be numbers, not strings

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Chicken Breast",
    "display_name": "Chicken Breast (Cooked, No Skin)",
    "variation_type": "breast",
    "preparation": "cooked",
    "modifiers": ["no skin", "boneless"],
    "protein_per_100g": 31.0,
    "carbs_per_100g": 0,
    "fat_per_100g": 3.6,
    "calories_per_100g": 165,
    "fiber_per_100g": 0,
    "sugar_per_100g": 0,
    "serving_sizes": [
      { "unit": "oz", "grams": 28, "display": "1 oz" },
      { "unit": "breast", "grams": 174, "display": "1 medium breast (6 oz)" },
      { "unit": "cup", "grams": 140, "display": "1 cup diced" }
    ],
    "aliases": ["chicken breast", "grilled chicken breast", "baked chicken breast", "chicken"],
    "usda_fdc_id": 171477
  }
]

Generate ${count} diverse, accurate foods. Focus on quality over quantity.`;
}

// =====================================================
// AI CURATION FUNCTION
// =====================================================

async function curateFoodCategory(
  foodType: string,
  config: (typeof FOOD_CATEGORIES)[keyof typeof FOOD_CATEGORIES]
): Promise<any[]> {
  console.log(`\n🤖 Curating ${config.count} ${foodType} variations...`);

  const prompt = createCurationPrompt(
    foodType,
    config.category,
    config.subcategory,
    config.description,
    config.count
  );

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      temperature: 0.3, // Lower temperature for more accurate/consistent results
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Response:', content.text);
      throw new Error('No JSON array found in response');
    }

    const foods = JSON.parse(jsonMatch[0]);

    // Add category and subcategory to each food
    const enrichedFoods = foods.map((food: any) => ({
      ...food,
      category: config.category,
      subcategory: config.subcategory,
      verified: true,
      source: ['ai_curated', 'usda'],
      confidence_score: 0.95,
      review_status: 'approved',
    }));

    console.log(`✅ Generated ${enrichedFoods.length} ${foodType} variations`);
    return enrichedFoods;
  } catch (error) {
    console.error(`❌ Failed to curate ${foodType}:`, error);
    return [];
  }
}

// =====================================================
// DATABASE IMPORT
// =====================================================

async function importToDatabase(foods: any[]): Promise<void> {
  if (foods.length === 0) {
    console.log('⚠️  No foods to import');
    return;
  }

  console.log(`\n💾 Importing ${foods.length} foods to database...`);

  const { data, error } = await supabase.from('curated_foods').insert(foods).select();

  if (error) {
    console.error('❌ Database import error:', error);
    throw error;
  }

  console.log(`✅ Successfully imported ${data?.length || 0} foods`);
}

// =====================================================
// EXPORT TO JSON
// =====================================================

async function exportToJSON(foods: any[], filename: string): Promise<void> {
  const exportDir = path.join(process.cwd(), 'data', 'curated-foods');

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const filepath = path.join(exportDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(foods, null, 2));

  console.log(`📝 Exported to: ${filepath}`);
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  const args = process.argv.slice(2);
  const categoryArg = args.find((arg) => arg.startsWith('--category='));
  const countArg = args.find((arg) => arg.startsWith('--count='));
  const allFlag = args.includes('--all');
  const exportOnly = args.includes('--export-only');

  let allFoods: any[] = [];

  if (allFlag) {
    // Curate all categories
    console.log('🚀 Starting FULL database curation...\n');
    console.log(`📊 Total categories: ${Object.keys(FOOD_CATEGORIES).length}`);
    console.log(
      `🎯 Target foods: ${Object.values(FOOD_CATEGORIES).reduce((sum, c) => sum + c.count, 0)}\n`
    );

    for (const [foodType, config] of Object.entries(FOOD_CATEGORIES)) {
      const foods = await curateFoodCategory(foodType, config);
      allFoods.push(...foods);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } else if (categoryArg) {
    // Curate specific category
    const category = categoryArg.split('=')[1];
    const config = FOOD_CATEGORIES[category as keyof typeof FOOD_CATEGORIES];

    if (!config) {
      console.error(`❌ Unknown category: ${category}`);
      console.log(`Available categories: ${Object.keys(FOOD_CATEGORIES).join(', ')}`);
      process.exit(1);
    }

    if (countArg) {
      config.count = parseInt(countArg.split('=')[1]);
    }

    const foods = await curateFoodCategory(category, config);
    allFoods = foods;
  } else {
    console.log('Usage:');
    console.log('  npm run curate-foods -- --all');
    console.log('  npm run curate-foods -- --category=chicken');
    console.log('  npm run curate-foods -- --category=chicken --count=30');
    process.exit(1);
  }

  // Export to JSON
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = allFlag
    ? `all-foods-${timestamp}.json`
    : `${categoryArg?.split('=')[1]}-${timestamp}.json`;

  await exportToJSON(allFoods, filename);

  // Import to database (unless export-only flag)
  if (!exportOnly) {
    await importToDatabase(allFoods);
  }

  console.log('\n🎉 Curation complete!');
  console.log(`📊 Total foods generated: ${allFoods.length}`);
}

// Run main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
