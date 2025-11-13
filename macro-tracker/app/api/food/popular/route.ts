/**
 * =====================================================
 * POPULAR FOODS API ROUTE (EDAMAM)
 * =====================================================
 * Get most popular/commonly searched foods
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPopularFoods } from '@/lib/services/food-search';

export const runtime = 'edge';

/**
 * GET /api/food/popular?limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get popular foods
    const foods = await getPopularFoods(limit);

    return NextResponse.json({
      success: true,
      foods,
      count: foods.length,
    });
  } catch (error) {
    console.error('Get popular foods error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve popular foods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
