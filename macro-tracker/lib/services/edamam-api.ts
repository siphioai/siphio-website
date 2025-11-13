/**
 * =====================================================
 * EDAMAM FOOD DATABASE API SERVICE
 * =====================================================
 * Integration with Edamam Food Database API v2
 * https://developer.edamam.com/food-database-api-docs
 *
 * Features:
 * - Food search with natural language processing
 * - Detailed nutritional information (28+ nutrients)
 * - Pre-cleaned, standardized food names
 * - Multiple serving sizes and measures
 */

// =====================================================
// TYPES
// =====================================================

export interface EdamamFood {
  foodId: string;
  label: string; // Display name (e.g., "Chicken Breast, Roasted")
  knownAs: string; // Common name
  nutrients: {
    ENERC_KCAL?: number; // Calories
    PROCNT?: number; // Protein (g)
    FAT?: number; // Fat (g)
    CHOCDF?: number; // Carbs (g)
    FIBTG?: number; // Fiber (g)
  };
  category: string; // "Generic foods", "Packaged foods", etc.
  categoryLabel: string; // "food" or "meal"
  image?: string;
  brand?: string; // For branded foods
  servingSizes?: EdamamMeasure[];
}

export interface EdamamMeasure {
  uri: string;
  label: string; // "cup", "oz", "whole", etc.
  weight: number; // grams
  qualified?: {
    // e.g., "small", "medium", "large"
    label: string;
    weight: number;
  }[];
}

export interface EdamamSearchHint {
  food: EdamamFood;
  measures: EdamamMeasure[];
}

export interface EdamamSearchResponse {
  text: string; // Query text
  parsed: Array<{
    food: EdamamFood;
  }>;
  hints: EdamamSearchHint[];
  _links?: {
    next?: {
      href: string;
      title: string;
    };
  };
}

export interface EdamamNutrientsRequest {
  ingredients: Array<{
    quantity: number;
    measureURI?: string;
    foodId: string;
  }>;
}

export interface EdamamNutrientsResponse {
  uri: string;
  calories: number;
  totalWeight: number;
  dietLabels: string[];
  healthLabels: string[];
  cautions: string[];
  totalNutrients: {
    [key: string]: {
      label: string;
      quantity: number;
      unit: string;
    };
  };
  totalDaily: {
    [key: string]: {
      label: string;
      quantity: number;
      unit: string;
    };
  };
}

// =====================================================
// CONFIGURATION
// =====================================================

const EDAMAM_BASE_URL = 'https://api.edamam.com/api/food-database/v2';
const EDAMAM_APP_ID = process.env.NEXT_PUBLIC_EDAMAM_APP_ID || '';
const EDAMAM_APP_KEY = process.env.NEXT_PUBLIC_EDAMAM_APP_KEY || '';

// Validate credentials
if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
  console.warn(
    '⚠️ Edamam API credentials not found. Please set NEXT_PUBLIC_EDAMAM_APP_ID and NEXT_PUBLIC_EDAMAM_APP_KEY in your .env file.'
  );
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Search for foods using Edamam Food Database API
 *
 * @param query - Search query (e.g., "chicken breast", "apple")
 * @param options - Search options
 * @returns Search results with food items and measures
 */
export async function searchEdamamFoods(
  query: string,
  options: {
    category?: 'generic-foods' | 'packaged-foods' | 'generic-meals' | 'fast-foods';
    limit?: number;
  } = {}
): Promise<EdamamSearchResponse> {
  const { category, limit = 20 } = options;

  // Build query parameters
  const params = new URLSearchParams({
    app_id: EDAMAM_APP_ID,
    app_key: EDAMAM_APP_KEY,
    ingr: query,
  });

  if (category) {
    params.append('category', category);
  }

  const url = `${EDAMAM_BASE_URL}/parser?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status} ${response.statusText}`);
    }

    const data: EdamamSearchResponse = await response.json();

    // Limit hints to requested amount
    if (data.hints && limit) {
      data.hints = data.hints.slice(0, limit);
    }

    return data;
  } catch (error) {
    console.error('Edamam search error:', error);
    throw error;
  }
}

/**
 * Get detailed nutritional information for a specific food and serving size
 *
 * @param foodId - Edamam food ID
 * @param quantity - Quantity (default: 100g)
 * @param measureURI - Optional measure URI for specific serving size
 * @returns Detailed nutritional information
 */
export async function getEdamamNutrients(
  foodId: string,
  quantity: number = 100,
  measureURI?: string
): Promise<EdamamNutrientsResponse> {
  const url = `${EDAMAM_BASE_URL}/nutrients?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;

  const requestBody: EdamamNutrientsRequest = {
    ingredients: [
      {
        quantity,
        foodId,
        ...(measureURI && { measureURI }),
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Edamam Nutrients API error: ${response.status} ${response.statusText}`);
    }

    const data: EdamamNutrientsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Edamam nutrients error:', error);
    throw error;
  }
}

/**
 * Extract macros per 100g from Edamam food data
 * Normalizes to per 100g regardless of original serving size
 *
 * @param food - Edamam food object
 * @returns Macros per 100g
 */
export function extractMacrosFrom100g(food: EdamamFood): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
} {
  // Edamam provides nutrients per 100g by default in the "nutrients" field
  return {
    calories: food.nutrients.ENERC_KCAL || 0,
    protein: food.nutrients.PROCNT || 0,
    carbs: food.nutrients.CHOCDF || 0,
    fat: food.nutrients.FAT || 0,
    fiber: food.nutrients.FIBTG || 0,
  };
}

/**
 * Categorize Edamam food into our app's categories
 *
 * @param food - Edamam food object
 * @returns Category string
 */
export function categorizeEdamamFood(food: EdamamFood): string {
  const label = food.label.toLowerCase();
  const category = food.category.toLowerCase();

  // Meat & Poultry
  if (
    label.includes('chicken') ||
    label.includes('beef') ||
    label.includes('pork') ||
    label.includes('turkey') ||
    label.includes('lamb') ||
    label.includes('meat')
  ) {
    return 'protein_meat';
  }

  // Fish & Seafood
  if (
    label.includes('fish') ||
    label.includes('salmon') ||
    label.includes('tuna') ||
    label.includes('shrimp') ||
    label.includes('seafood')
  ) {
    return 'protein_fish';
  }

  // Eggs & Dairy
  if (
    label.includes('egg') ||
    label.includes('milk') ||
    label.includes('cheese') ||
    label.includes('yogurt') ||
    label.includes('dairy')
  ) {
    return 'protein_eggs_dairy';
  }

  // Vegetables
  if (
    label.includes('vegetable') ||
    label.includes('broccoli') ||
    label.includes('spinach') ||
    label.includes('carrot') ||
    label.includes('lettuce') ||
    category.includes('vegetable')
  ) {
    return 'vegetables';
  }

  // Fruits
  if (
    label.includes('fruit') ||
    label.includes('apple') ||
    label.includes('banana') ||
    label.includes('orange') ||
    label.includes('berry') ||
    category.includes('fruit')
  ) {
    return 'fruits';
  }

  // Grains
  if (
    label.includes('rice') ||
    label.includes('bread') ||
    label.includes('pasta') ||
    label.includes('oat') ||
    label.includes('grain') ||
    label.includes('cereal')
  ) {
    return 'grains';
  }

  // Legumes
  if (
    label.includes('bean') ||
    label.includes('lentil') ||
    label.includes('chickpea') ||
    label.includes('pea')
  ) {
    return 'legumes';
  }

  // Nuts & Seeds
  if (
    label.includes('nut') ||
    label.includes('almond') ||
    label.includes('seed') ||
    label.includes('peanut')
  ) {
    return 'nuts_seeds';
  }

  // Oils & Fats
  if (label.includes('oil') || label.includes('butter') || label.includes('fat')) {
    return 'oils_fats';
  }

  // Beverages
  if (
    label.includes('drink') ||
    label.includes('beverage') ||
    label.includes('juice') ||
    label.includes('water')
  ) {
    return 'beverages';
  }

  // Default
  return 'other';
}

/**
 * Check if API credentials are configured
 */
export function isEdamamConfigured(): boolean {
  return Boolean(EDAMAM_APP_ID && EDAMAM_APP_KEY);
}
