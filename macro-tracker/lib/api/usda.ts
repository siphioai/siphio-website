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

// Query expansion mapping for common single-word protein searches
// Expands generic queries to specific cuts and preparations
const COMMON_FOOD_EXPANSIONS: Record<string, string[]> = {
  // Chicken variations
  chicken: [
    'chicken',
    'chicken breast',
    'chicken thigh',
    'chicken drumstick',
    'chicken leg',
    'ground chicken'
  ],

  // Beef variations
  beef: [
    'beef',
    'beef chuck',
    'ground beef',
    'beef sirloin',
    'beef brisket',
    'beef tenderloin'
  ],

  // Pork variations
  pork: [
    'pork',
    'pork chop',
    'pork tenderloin',
    'ground pork',
    'pork shoulder',
    'pork loin'
  ],

  // Turkey variations
  turkey: [
    'turkey',
    'turkey breast',
    'ground turkey',
    'turkey thigh',
    'turkey leg'
  ],

  // Fish variations (generic)
  fish: [
    'fish',
    'salmon',
    'tilapia',
    'cod',
    'tuna',
    'mahi'
  ],

  // Specific fish
  salmon: [
    'salmon',
    'salmon fillet',
    'salmon steak'
  ],

  tuna: [
    'tuna',
    'tuna steak',
    'tuna fillet'
  ]
};

/**
 * Expands single-word protein queries into specific cut searches
 * Multi-word queries are not expanded (assumed already specific)
 *
 * @example
 * expandQuery("chicken") → ["chicken", "chicken breast", "chicken thigh", ...]
 * expandQuery("chicken breast") → ["chicken breast"] (no expansion)
 * expandQuery("rice") → ["rice"] (not in expansion map)
 */
function expandQuery(query: string): string[] {
  const normalized = query.toLowerCase().trim();

  // Don't expand if multi-word (already specific)
  if (normalized.includes(' ')) {
    return [query];
  }

  // Check if we have expansion rules for this query
  if (COMMON_FOOD_EXPANSIONS[normalized]) {
    return COMMON_FOOD_EXPANSIONS[normalized];
  }

  // No expansion needed, return original
  return [query];
}

/**
 * Removes duplicate foods by USDA FDC ID
 * Keeps first occurrence of each unique FDC ID
 *
 * CRITICAL: USDA FDC ID is the unique identifier, not food name
 * Same food can appear with slight variations across queries
 */
function deduplicateFoods(foods: any[]): any[] {
  const seen = new Map<string, any>();

  for (const food of foods) {
    // Keep first occurrence only
    if (!seen.has(food.usda_fdc_id)) {
      seen.set(food.usda_fdc_id, food);
    }
  }

  return Array.from(seen.values());
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  // Expand query into multiple specific searches
  const expandedQueries = expandQuery(query);

  const supabase = createClient();

  // Check cache for ALL expanded queries (parallel)
  const cacheChecks = expandedQueries.map(async (q) => {
    const { data } = await supabase
      .from('food_items')
      .select('*')
      .ilike('name', `%${q}%`)
      .limit(10);
    return data || [];
  });

  const cachedResults = (await Promise.all(cacheChecks)).flat();

  if (cachedResults.length > 0) {
    // Deduplicate and return cached results
    const deduplicated = deduplicateFoods(cachedResults);
    return filterAndSortResults(deduplicated, query);
  }

  // Make parallel API calls for all expanded queries
  const apiCalls = expandedQueries.map(async (q) => {
    try {
      const url = new URL(`${USDA_API_BASE}/foods/search`);
      url.searchParams.set('query', q);
      url.searchParams.set('dataType', 'SR Legacy'); // Standard Reference only - most reliable
      url.searchParams.set('pageSize', '50'); // Get more to filter from
      if (USDA_API_KEY) {
        url.searchParams.set('api_key', USDA_API_KEY);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.warn(`USDA API error for query "${q}": ${response.status}`);
        return []; // Return empty array on failure, don't fail entire request
      }

      const data: USDASearchResponse = await response.json();
      return data.foods.map(normalizeUSDAFood);
    } catch (error) {
      console.warn(`Failed to fetch USDA data for query "${q}":`, error);
      return []; // Graceful degradation
    }
  });

  // Wait for all API calls to complete
  const allResults = (await Promise.all(apiCalls)).flat();

  // Deduplicate by FDC ID before filtering
  const deduplicated = deduplicateFoods(allResults);

  // Filter and sort
  const filtered = filterAndSortResults(deduplicated, query);

  // Cache all deduplicated results (not just filtered top 10)
  if (deduplicated.length > 0) {
    await supabase.from('food_items').upsert(deduplicated as any, {
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
    'with sauce', 'flavored', 'seasoned', 'enriched', 'fortified',
    // Stronger processed food indicators
    'breaded', 'nugget', 'patty', 'battered', 'fried with coating',
    'processed', 'formed', 'restructured'
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

    // Whole food indicators (strong positive signals)
    if (nameLower.includes('raw') || nameLower.includes('cooked') ||
        nameLower.includes('roasted') || nameLower.includes('broiled') ||
        nameLower.includes('grilled') || nameLower.includes('baked')) {
      score += 200;
    }

    // Anatomy words (specific cuts = whole food)
    const anatomyWords = [
      'breast', 'thigh', 'leg', 'drumstick', 'wing',
      'chuck', 'sirloin', 'tenderloin', 'brisket', 'round',
      'chop', 'loin', 'shoulder', 'shank',
      'fillet', 'steak'
    ];
    if (anatomyWords.some(word => nameLower.includes(word))) {
      score += 150;
    }

    // Ground meat bonus (whole food)
    if (nameLower.includes('ground')) {
      score += 150;
    }

    // Common meat types
    if (nameLower.includes('broilers or fryers')) { // Most common chicken type
      score += 100;
    }

    // Simpler preparation bonus
    if (nameLower.includes('meat only')) {
      score += 75;
    }

    // Processed food penalties (strong negative signals)
    // Note: Most are filtered out above, but this catches edge cases
    if (nameLower.includes('breaded') || nameLower.includes('nugget') ||
        nameLower.includes('patty') || nameLower.includes('battered') ||
        nameLower.includes('processed') || nameLower.includes('formed')) {
      score -= 500;
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
