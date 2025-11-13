/**
 * =====================================================
 * UNIFIED FOOD SEARCH API ROUTE (EDAMAM)
 * =====================================================
 * Uses Edamam Food Database API for pre-cleaned, comprehensive food data
 * Replaces previous curated foods + USDA approach
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchFoods } from '@/lib/services/food-search';

export const runtime = 'edge';

/**
 * GET /api/food-search/unified?query=chicken
 *
 * Search foods using Edamam Food Database API
 * Returns clean, pre-formatted food names with 900,000+ foods
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({
        error: 'Query required'
      }, { status: 400 });
    }

    // Search Edamam API
    const result = await searchFoods(query, {
      limit: 20,
    });

    return NextResponse.json({
      success: true,
      foods: result.foods,
      total: result.total,
      source: result.source,
      search_duration_ms: result.search_duration_ms,
    });
  } catch (error) {
    console.error('Unified search error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search foods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
