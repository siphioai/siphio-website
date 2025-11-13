/**
 * =====================================================
 * FOOD SEARCH CACHE SERVICE
 * =====================================================
 * Intelligent caching for instant search predictions
 * Combines localStorage (persistent) + sessionStorage (temporary)
 */

export interface CachedFood {
  id: string;
  name: string;
  display_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  brand?: string;
  source: string;
  lastUsed?: number;
  usageCount?: number;
  searchQueries?: string[]; // Queries that led to this food
}

const RECENT_FOODS_KEY = 'recent_foods';
const SEARCH_CACHE_KEY = 'search_cache';
const MAX_RECENT_FOODS = 50;
const MAX_SEARCH_CACHE = 100;
const CACHE_EXPIRY = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Get recent foods from localStorage
 */
export function getRecentFoods(): CachedFood[] {
  try {
    const stored = localStorage.getItem(RECENT_FOODS_KEY);
    if (!stored) return [];

    const foods: CachedFood[] = JSON.parse(stored);
    const now = Date.now();

    // Filter out expired foods
    return foods.filter(food => {
      const age = now - (food.lastUsed || 0);
      return age < CACHE_EXPIRY;
    });
  } catch (error) {
    console.error('Error reading recent foods:', error);
    return [];
  }
}

/**
 * Add food to recent foods cache
 */
export function addToRecentFoods(food: any, query?: string): void {
  try {
    const recent = getRecentFoods();
    const now = Date.now();

    // Check if food already exists
    const existingIndex = recent.findIndex(f => f.id === food.id);

    const cachedFood: CachedFood = {
      id: food.id,
      name: food.name,
      display_name: food.display_name || food.name,
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fat_per_100g: food.fat_per_100g,
      fiber_per_100g: food.fiber_per_100g,
      brand: food.brand,
      source: food.source || 'edamam',
      lastUsed: now,
      usageCount: 1,
      searchQueries: query ? [query.toLowerCase()] : [],
    };

    if (existingIndex >= 0) {
      // Update existing food
      const existing = recent[existingIndex];
      cachedFood.usageCount = (existing.usageCount || 0) + 1;

      // Merge search queries
      const queries = new Set([
        ...(existing.searchQueries || []),
        ...(cachedFood.searchQueries || []),
      ]);
      cachedFood.searchQueries = Array.from(queries).slice(0, 10);

      recent[existingIndex] = cachedFood;
    } else {
      // Add new food
      recent.unshift(cachedFood);
    }

    // Keep only MAX_RECENT_FOODS, sorted by lastUsed
    const sorted = recent
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
      .slice(0, MAX_RECENT_FOODS);

    localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(sorted));
  } catch (error) {
    console.error('Error saving recent food:', error);
  }
}

/**
 * Search local cache with smart matching
 */
export function searchLocalCache(query: string): CachedFood[] {
  if (!query || query.length < 2) return [];

  const recent = getRecentFoods();
  const lowerQuery = query.toLowerCase();

  return recent
    .map(food => {
      let score = 0;
      const displayName = food.display_name.toLowerCase();
      const name = food.name.toLowerCase();

      // Exact match (highest priority)
      if (displayName === lowerQuery || name === lowerQuery) {
        score = 1000;
      }
      // Starts with query
      else if (displayName.startsWith(lowerQuery) || name.startsWith(lowerQuery)) {
        score = 500;
      }
      // Contains query
      else if (displayName.includes(lowerQuery) || name.includes(lowerQuery)) {
        score = 250;
      }
      // Query was used to find this food before
      else if (food.searchQueries?.some(q => q.includes(lowerQuery))) {
        score = 100;
      }

      // Boost by usage count
      score += (food.usageCount || 0) * 10;

      // Boost by recency (within last hour gets boost)
      const hourAgo = Date.now() - (1000 * 60 * 60);
      if ((food.lastUsed || 0) > hourAgo) {
        score += 50;
      }

      return { food, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.food)
    .slice(0, 5); // Top 5 predictions
}

/**
 * Session cache for search results (temporary, fast)
 */
const sessionCache = new Map<string, {
  results: any[];
  timestamp: number;
}>();

/**
 * Get cached search results for a query
 */
export function getCachedSearchResults(query: string): any[] | null {
  const cached = sessionCache.get(query.toLowerCase());
  if (!cached) return null;

  // Cache valid for 5 minutes
  const age = Date.now() - cached.timestamp;
  if (age > 1000 * 60 * 5) {
    sessionCache.delete(query.toLowerCase());
    return null;
  }

  return cached.results;
}

/**
 * Cache search results for a query
 */
export function cacheSearchResults(query: string, results: any[]): void {
  try {
    sessionCache.set(query.toLowerCase(), {
      results,
      timestamp: Date.now(),
    });

    // Clean up old entries if cache gets too large
    if (sessionCache.size > MAX_SEARCH_CACHE) {
      const entries = Array.from(sessionCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

      // Keep only the newest MAX_SEARCH_CACHE entries
      sessionCache.clear();
      entries.slice(0, MAX_SEARCH_CACHE).forEach(([key, value]) => {
        sessionCache.set(key, value);
      });
    }
  } catch (error) {
    console.error('Error caching search results:', error);
  }
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  try {
    localStorage.removeItem(RECENT_FOODS_KEY);
    localStorage.removeItem(SEARCH_CACHE_KEY);
    sessionCache.clear();
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
}

/**
 * Merge and rank results from multiple sources
 */
export function mergeAndRankResults(
  localResults: CachedFood[],
  apiResults: any[],
  query: string
): any[] {
  const merged = new Map<string, any>();

  // Add local results with boost
  localResults.forEach((food, index) => {
    merged.set(food.id, {
      ...food,
      _score: 1000 - index * 50, // Higher score for earlier results
      _source: 'local',
    });
  });

  // Add API results
  apiResults.forEach((food, index) => {
    if (!merged.has(food.id)) {
      merged.set(food.id, {
        ...food,
        _score: 500 - index * 10,
        _source: 'api',
      });
    }
  });

  // Sort by score and return
  return Array.from(merged.values())
    .sort((a, b) => b._score - a._score)
    .slice(0, 20);
}
