import { USDASearchResponse, USDASearchResult } from '@/types/usda';
import { FoodItem } from '@/types/macros';
import { createClient } from '@/lib/supabase/client';

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = process.env.USDA_API_KEY || '';

// CRITICAL: Nutrient IDs for macros
const NUTRIENT_IDS = {
  ENERGY: 1008,    // Energy (kcal)
  PROTEIN: 1003,   // Protein (g)
  CARBS: 1005,     // Carbohydrate, by difference (g)
  FAT: 1004        // Total lipid (fat) (g)
};

export async function searchFoods(query: string): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  const supabase = createClient();

  // CRITICAL: Check cache first to avoid API rate limits
  const { data: cached } = await supabase
    .from('food_items')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(10);

  if (cached && cached.length > 0) {
    return filterAndSortResults(cached, query);
  }

  // Call USDA API
  const url = new URL(`${USDA_API_BASE}/foods/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('dataType', 'SR Legacy'); // Standard Reference only - most reliable
  url.searchParams.set('pageSize', '50'); // Get more to filter from
  if (USDA_API_KEY) {
    url.searchParams.set('api_key', USDA_API_KEY);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }

  const data: USDASearchResponse = await response.json();

  // Normalize all results
  const normalized = data.foods.map(normalizeUSDAFood);

  // Filter and sort before caching
  const filtered = filterAndSortResults(normalized, query);

  // CRITICAL: Upsert to cache (avoid duplicates)
  if (filtered.length > 0) {
    await supabase.from('food_items').upsert(filtered as any, {
      onConflict: 'usda_fdc_id',
      ignoreDuplicates: false
    });
  }

  return filtered;
}

// Filter out junk foods and sort by relevance
function filterAndSortResults(foods: any[], query: string): FoodItem[] {
  const queryLower = query.toLowerCase().trim();

  // Words that indicate processed/snack foods we want to avoid
  const excludeWords = [
    'snack', 'cracker', 'chip', 'cookie', 'cake', 'candy', 'cereal',
    'bar', 'mix', 'prepared', 'frozen meal', 'instant', 'canned',
    'with sauce', 'flavored', 'seasoned', 'enriched', 'fortified'
  ];

  // Filter out unwanted foods
  const filtered = foods.filter(food => {
    const nameLower = food.name.toLowerCase();

    // Exclude if contains any exclude words
    if (excludeWords.some(word => nameLower.includes(word))) {
      return false;
    }

    // Must have at least some calories
    if (food.calories_per_100g < 10) {
      return false;
    }

    return true;
  });

  // Score each food by relevance
  const scored = filtered.map(food => {
    const nameLower = food.name.toLowerCase();
    let score = 0;

    // Exact match bonus
    if (nameLower === queryLower) score += 1000;

    // Starts with query bonus
    if (nameLower.startsWith(queryLower)) score += 500;

    // Contains all query words bonus
    const queryWords = queryLower.split(' ');
    const matchedWords = queryWords.filter(word => nameLower.includes(word)).length;
    score += matchedWords * 100;

    // Prefer shorter, simpler names (fewer commas = simpler)
    const commaCount = (food.name.match(/,/g) || []).length;
    score -= commaCount * 20;

    // Prefer "cooked" or "raw" over complex preparations
    if (nameLower.includes('cooked') || nameLower.includes('raw') || nameLower.includes('roasted')) {
      score += 50;
    }

    return { food, score };
  });

  // Sort by score descending and take top 10
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.food);
}

function normalizeUSDAFood(usda: USDASearchResult): Omit<FoodItem, 'id' | 'last_synced'> {
  // CRITICAL: Extract nutrients by ID (some may be missing)
  const getNutrient = (id: number): number => {
    const nutrient = usda.foodNutrients.find(n => n.nutrientId === id);
    return nutrient?.value ?? 0;
  };

  return {
    usda_fdc_id: usda.fdcId.toString(),
    name: usda.description,
    calories_per_100g: Number(getNutrient(NUTRIENT_IDS.ENERGY).toFixed(2)),
    protein_per_100g: Number(getNutrient(NUTRIENT_IDS.PROTEIN).toFixed(2)),
    carbs_per_100g: Number(getNutrient(NUTRIENT_IDS.CARBS).toFixed(2)),
    fat_per_100g: Number(getNutrient(NUTRIENT_IDS.FAT).toFixed(2)),
    category: usda.dataType
  };
}
