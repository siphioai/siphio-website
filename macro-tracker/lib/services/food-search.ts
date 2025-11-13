/**
 * =====================================================
 * FOOD SEARCH SERVICE (EDAMAM API)
 * =====================================================
 * Fast, intelligent food search using Edamam Food Database API
 * - Pre-cleaned food names
 * - Comprehensive nutritional data
 * - Multiple serving sizes
 * - Real-time API search
 */

import {
  searchEdamamFoods,
  extractMacrosFrom100g,
  categorizeEdamamFood,
  type EdamamSearchResponse,
  type EdamamSearchHint,
} from './edamam-api';

// =====================================================
// TYPES
// =====================================================

export interface FoodSearchResult {
  id: string; // Edamam foodId
  name: string; // Common name
  display_name: string; // Full descriptive name
  category: string;

  // Macros per 100g
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories_per_100g: number;
  fiber_per_100g?: number;

  // Details
  brand?: string; // For packaged foods
  serving_sizes?: ServingSize[];

  // Metadata
  source: 'edamam';
  relevance_score?: number;
  image?: string;
}

export interface ServingSize {
  uri: string;
  label: string; // "cup", "oz", "piece", etc.
  grams: number;
  qualified?: {
    label: string;
    grams: number;
  }[];
}

export interface SearchOptions {
  limit?: number;
  category?: 'generic-foods' | 'packaged-foods' | 'generic-meals' | 'fast-foods';
  userId?: string;
}

export interface SearchResult {
  foods: FoodSearchResult[];
  total: number;
  source: 'edamam';
  search_duration_ms: number;
}

// =====================================================
// MAIN SEARCH FUNCTION
// =====================================================

/**
 * Search foods using Edamam Food Database API
 */
export async function searchFoods(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const startTime = Date.now();
  const { limit = 20, category, userId } = options;

  try {
    // Search Edamam API
    const edamamResponse = await searchEdamamFoods(query, {
      category,
      limit,
    });

    // Transform Edamam results to our format
    const foods = transformEdamamResults(edamamResponse);

    const searchDuration = Date.now() - startTime;

    // Track analytics (async, don't wait)
    if (userId) {
      trackSearchAnalytics({
        query,
        userId,
        resultCount: foods.length,
        source: 'edamam',
        searchDurationMs: searchDuration,
      }).catch((err) => console.error('Failed to track analytics:', err));
    }

    return {
      foods,
      total: foods.length,
      source: 'edamam',
      search_duration_ms: searchDuration,
    };
  } catch (error) {
    console.error('Food search error:', error);

    // Return empty results on error
    return {
      foods: [],
      total: 0,
      source: 'edamam',
      search_duration_ms: Date.now() - startTime,
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Transform Edamam search results to our app format
 */
function transformEdamamResults(response: EdamamSearchResponse): FoodSearchResult[] {
  const results: FoodSearchResult[] = [];

  // Process hints (search results)
  for (const hint of response.hints || []) {
    const food = transformEdamamFood(hint);
    if (food) {
      results.push(food);
    }
  }

  // If no hints but we have parsed result, use that
  if (results.length === 0 && response.parsed && response.parsed.length > 0) {
    const parsedFood = transformEdamamFood({
      food: response.parsed[0].food,
      measures: [], // Parsed doesn't include measures
    });
    if (parsedFood) {
      results.push(parsedFood);
    }
  }

  return results;
}

/**
 * Transform single Edamam food item to our format
 */
function transformEdamamFood(hint: EdamamSearchHint | { food: any; measures: any[] }): FoodSearchResult | null {
  const { food, measures } = hint;

  // Extract macros per 100g
  const macros = extractMacrosFrom100g(food);

  // Skip if no nutritional data
  if (macros.calories === 0 && macros.protein === 0 && macros.carbs === 0 && macros.fat === 0) {
    return null;
  }

  // Transform serving sizes
  const servingSizes: ServingSize[] = measures.map((measure: any) => ({
    uri: measure.uri,
    label: measure.label,
    grams: measure.weight,
    qualified: measure.qualified?.map((q: any) => ({
      label: q.label,
      grams: q.weight,
    })),
  }));

  return {
    id: food.foodId,
    name: food.knownAs || food.label,
    display_name: food.label,
    category: categorizeEdamamFood(food),
    protein_per_100g: Math.round(macros.protein * 10) / 10,
    carbs_per_100g: Math.round(macros.carbs * 10) / 10,
    fat_per_100g: Math.round(macros.fat * 10) / 10,
    calories_per_100g: Math.round(macros.calories),
    fiber_per_100g: macros.fiber > 0 ? Math.round(macros.fiber * 10) / 10 : undefined,
    brand: food.brand,
    serving_sizes: servingSizes.length > 0 ? servingSizes : undefined,
    source: 'edamam',
    image: food.image,
  };
}

// =====================================================
// ANALYTICS
// =====================================================

async function trackSearchAnalytics(data: {
  query: string;
  userId?: string;
  resultCount: number;
  source: string;
  searchDurationMs: number;
}) {
  // TODO: Implement analytics tracking
  // Could save to Supabase food_search_analytics table if you want to keep that
  console.log('Search analytics:', data);
}

/**
 * Track when user selects a food from search results
 */
export async function trackFoodSelection(data: {
  query: string;
  userId?: string;
  foodId: string;
  position: number;
}) {
  // TODO: Implement selection tracking
  console.log('Food selection:', data);
}

// =====================================================
// GET FOOD BY ID
// =====================================================

/**
 * Get detailed food information by Edamam food ID
 * Note: This requires a search to find the food first
 * Edamam doesn't have a direct "get by ID" endpoint
 */
export async function getFoodById(id: string): Promise<FoodSearchResult | null> {
  try {
    // Search for the specific food ID
    // This is a limitation of Edamam API - no direct food lookup
    const response = await searchEdamamFoods(id, { limit: 1 });

    if (response.hints && response.hints.length > 0) {
      return transformEdamamFood(response.hints[0]);
    }

    if (response.parsed && response.parsed.length > 0) {
      return transformEdamamFood({
        food: response.parsed[0].food,
        measures: [],
      });
    }

    return null;
  } catch (error) {
    console.error('Get food by ID error:', error);
    return null;
  }
}

// =====================================================
// POPULAR/COMMON FOODS
// =====================================================

/**
 * Get commonly searched foods
 * Since we're using an API, we'll maintain a curated list
 */
export async function getPopularFoods(limit: number = 20): Promise<FoodSearchResult[]> {
  const commonFoods = [
    'chicken breast',
    'salmon',
    'brown rice',
    'broccoli',
    'eggs',
    'greek yogurt',
    'banana',
    'oatmeal',
    'sweet potato',
    'almonds',
  ];

  const results: FoodSearchResult[] = [];

  // Search for each common food
  for (const foodQuery of commonFoods.slice(0, limit)) {
    try {
      const searchResult = await searchFoods(foodQuery, { limit: 1 });
      if (searchResult.foods.length > 0) {
        results.push(searchResult.foods[0]);
      }
    } catch (error) {
      console.error(`Failed to fetch popular food: ${foodQuery}`, error);
    }
  }

  return results;
}
