/**
 * =====================================================
 * CURATED FOOD SEARCH SERVICE
 * =====================================================
 * Fast, intelligent food search from curated database:
 * 1. Complete USDA FoodData Central database (imported)
 * 2. Branded foods from alternative API (future)
 * 3. All data pre-cleaned and normalized
 * 4. Analytics tracking
 */

import { createClient } from '@/lib/supabase/client';
import {
  parseUSDADescription,
  createDisplayName,
  createVariationSignature,
  scoreRelevance,
  cleanUSDADescription,
  categorizeFood,
} from './food-name-parser';

// =====================================================
// TYPES
// =====================================================

export interface FoodSearchResult {
  id?: string; // UUID for curated foods
  fdc_id?: number; // USDA FDC ID
  name: string;
  display_name: string;
  category: string;
  subcategory?: string;

  // Macros per 100g
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories_per_100g: number;
  fiber_per_100g?: number;

  // Details
  variation_type?: string;
  preparation?: string;
  modifiers?: string[];
  serving_sizes?: ServingSize[];

  // Metadata
  source: 'usda' | 'branded'; // All foods are in curated_foods, source indicates original database
  relevance_score?: number;
  verified?: boolean;
}

export interface ServingSize {
  unit: string;
  grams: number;
  display: string;
}

export interface SearchOptions {
  limit?: number;
  category?: string;
  userId?: string;
  includeBranded?: boolean; // Future: Include branded foods from alternative API
}

export interface SearchResult {
  foods: FoodSearchResult[];
  total: number;
  source: 'curated' | 'usda' | 'hybrid';
  curated_count: number;
  usda_count: number;
  search_duration_ms: number;
}

// =====================================================
// MAIN SEARCH FUNCTION
// =====================================================

/**
 * Search curated foods database (USDA + Branded all pre-imported)
 */
export async function searchFoods(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const startTime = Date.now();
  const { limit = 20, category, userId } = options;

  // Search curated database (contains all USDA foods + branded foods)
  const results = await searchCuratedFoods(query, {
    limit,
    category,
  });

  const searchDuration = Date.now() - startTime;

  // Count sources
  const usdaCount = results.filter(f => f.source === 'usda').length;
  const brandedCount = results.filter(f => f.source === 'branded').length;

  // Track analytics (async, don't wait)
  trackSearchAnalytics({
    query,
    userId,
    resultCount: results.length,
    curatedCount: usdaCount, // USDA foods from curated DB
    usdaCount: brandedCount, // Branded foods from curated DB
    source: 'curated',
    searchDurationMs: searchDuration,
  }).catch((err) => console.error('Failed to track analytics:', err));

  return {
    foods: results,
    total: results.length,
    source: 'curated',
    curated_count: usdaCount,
    usda_count: brandedCount,
    search_duration_ms: searchDuration,
  };
}

// =====================================================
// CURATED FOOD SEARCH
// =====================================================

async function searchCuratedFoods(
  query: string,
  options: { limit: number; category?: string }
): Promise<FoodSearchResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('search_curated_foods', {
    search_query: query,
    limit_count: options.limit,
    category_filter: options.category || null,
  });

  if (error) {
    console.error('Curated search error:', error);
    return [];
  }

  return (data || []).map((food: any) => {
    // Determine source from source array (defaults to 'usda' for bulk imports)
    const sourceArray = food.source || ['usda'];
    const primarySource = sourceArray.includes('branded') ? 'branded' : 'usda';

    return {
      id: food.id,
      fdc_id: food.usda_fdc_id,
      name: food.name,
      display_name: food.display_name,
      category: food.category,
      subcategory: food.subcategory,
      protein_per_100g: parseFloat(food.protein_per_100g),
      carbs_per_100g: parseFloat(food.carbs_per_100g),
      fat_per_100g: parseFloat(food.fat_per_100g),
      calories_per_100g: parseFloat(food.calories_per_100g),
      fiber_per_100g: food.fiber_per_100g ? parseFloat(food.fiber_per_100g) : undefined,
      variation_type: food.variation_type,
      preparation: food.preparation,
      modifiers: food.modifiers,
      serving_sizes: food.serving_sizes,
      source: primarySource,
      relevance_score: food.relevance_rank,
      verified: food.verified || false,
    };
  });
}

// =====================================================
// REMOVED: USDA API SEARCH FUNCTIONS
// =====================================================
// All USDA foods are now pre-imported into curated_foods table
// via Python bulk import script
// =====================================================

// =====================================================
// ANALYTICS
// =====================================================

async function trackSearchAnalytics(data: {
  query: string;
  userId?: string;
  resultCount: number;
  curatedCount: number;
  usdaCount: number;
  source: string;
  searchDurationMs: number;
}) {
  const supabase = createClient();

  await supabase.from('food_search_analytics').insert({
    query: data.query,
    user_id: data.userId,
    result_count: data.resultCount,
    curated_count: data.curatedCount,
    usda_count: data.usdaCount,
    source: data.source,
    search_duration_ms: data.searchDurationMs,
  });
}

/**
 * Track when user selects a food from search results
 */
export async function trackFoodSelection(data: {
  query: string;
  userId?: string;
  foodId?: string;
  fdcId?: number;
  position: number;
}) {
  const supabase = createClient();

  await supabase.from('food_search_analytics').insert({
    query: data.query,
    user_id: data.userId,
    selected_food_id: data.foodId,
    selected_usda_fdc_id: data.fdcId,
    position_clicked: data.position,
  });
}

/**
 * Increment usage count for curated food
 */
export async function incrementFoodUsage(foodId: string) {
  const supabase = createClient();
  await supabase.rpc('increment_food_usage', { food_id: foodId });
}

// =====================================================
// GET FOOD BY ID
// =====================================================

/**
 * Get detailed food information by ID or FDC ID
 */
export async function getFoodById(
  id: string | number
): Promise<FoodSearchResult | null> {
  // All foods are in curated_foods now
  if (typeof id === 'string') {
    return getCuratedFoodById(id);
  } else {
    // Look up by USDA FDC ID
    return getCuratedFoodByFdcId(id);
  }
}

async function getCuratedFoodById(id: string): Promise<FoodSearchResult | null> {
  const supabase = createClient();

  const { data, error } = await supabase.from('curated_foods').select('*').eq('id', id).single();

  if (error || !data) return null;

  return {
    id: data.id,
    fdc_id: data.usda_fdc_id,
    name: data.name,
    display_name: data.display_name,
    category: data.category,
    subcategory: data.subcategory,
    protein_per_100g: parseFloat(data.protein_per_100g),
    carbs_per_100g: parseFloat(data.carbs_per_100g),
    fat_per_100g: parseFloat(data.fat_per_100g),
    calories_per_100g: parseFloat(data.calories_per_100g),
    fiber_per_100g: data.fiber_per_100g ? parseFloat(data.fiber_per_100g) : undefined,
    variation_type: data.variation_type,
    preparation: data.preparation,
    modifiers: data.modifiers,
    serving_sizes: data.serving_sizes,
    source: 'curated',
    verified: data.verified,
  };
}

async function getCuratedFoodByFdcId(fdcId: number): Promise<FoodSearchResult | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('curated_foods')
    .select('*')
    .eq('usda_fdc_id', fdcId)
    .single();

  if (error || !data) return null;

  const sourceArray = data.source || ['usda'];
  const primarySource = sourceArray.includes('branded') ? 'branded' : 'usda';

  return {
    id: data.id,
    fdc_id: data.usda_fdc_id,
    name: data.name,
    display_name: data.display_name,
    category: data.category,
    subcategory: data.subcategory,
    protein_per_100g: parseFloat(data.protein_per_100g),
    carbs_per_100g: parseFloat(data.carbs_per_100g),
    fat_per_100g: parseFloat(data.fat_per_100g),
    calories_per_100g: parseFloat(data.calories_per_100g),
    fiber_per_100g: data.fiber_per_100g ? parseFloat(data.fiber_per_100g) : undefined,
    variation_type: data.variation_type,
    preparation: data.preparation,
    modifiers: data.modifiers,
    serving_sizes: data.serving_sizes,
    source: primarySource,
    verified: data.verified,
  };
}

// =====================================================
// POPULAR FOODS
// =====================================================

/**
 * Get most popular foods from curated database
 */
export async function getPopularFoods(limit: number = 20): Promise<FoodSearchResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('curated_foods')
    .select('*')
    .eq('review_status', 'approved')
    .order('usage_count', { ascending: false })
    .order('last_used_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((food) => ({
    id: food.id,
    fdc_id: food.usda_fdc_id,
    name: food.name,
    display_name: food.display_name,
    category: food.category,
    subcategory: food.subcategory,
    protein_per_100g: parseFloat(food.protein_per_100g),
    carbs_per_100g: parseFloat(food.carbs_per_100g),
    fat_per_100g: parseFloat(food.fat_per_100g),
    calories_per_100g: parseFloat(food.calories_per_100g),
    fiber_per_100g: food.fiber_per_100g ? parseFloat(food.fiber_per_100g) : undefined,
    variation_type: food.variation_type,
    preparation: food.preparation,
    modifiers: food.modifiers,
    serving_sizes: food.serving_sizes,
    source: 'curated',
    verified: food.verified,
  }));
}

/**
 * Get foods by category
 */
export async function getFoodsByCategory(
  category: string,
  limit: number = 50
): Promise<FoodSearchResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('curated_foods')
    .select('*')
    .eq('category', category)
    .eq('review_status', 'approved')
    .order('name')
    .limit(limit);

  if (error || !data) return [];

  return data.map((food) => ({
    id: food.id,
    fdc_id: food.usda_fdc_id,
    name: food.name,
    display_name: food.display_name,
    category: food.category,
    subcategory: food.subcategory,
    protein_per_100g: parseFloat(food.protein_per_100g),
    carbs_per_100g: parseFloat(food.carbs_per_100g),
    fat_per_100g: parseFloat(food.fat_per_100g),
    calories_per_100g: parseFloat(food.calories_per_100g),
    fiber_per_100g: food.fiber_per_100g ? parseFloat(food.fiber_per_100g) : undefined,
    variation_type: food.variation_type,
    preparation: food.preparation,
    modifiers: food.modifiers,
    serving_sizes: food.serving_sizes,
    source: 'curated',
    verified: food.verified,
  }));
}
