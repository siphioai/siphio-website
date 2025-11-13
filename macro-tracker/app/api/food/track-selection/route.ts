/**
 * =====================================================
 * TRACK FOOD SELECTION API ROUTE (EDAMAM)
 * =====================================================
 * Track when users select foods from search results
 * Helps improve search quality and user experience
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackFoodSelection } from '@/lib/services/food-search';

export const runtime = 'edge';

/**
 * POST /api/food/track-selection
 *
 * Body:
 * {
 *   query: string;
 *   userId?: string;
 *   foodId: string;   // Edamam food ID
 *   position: number; // Which result position was clicked (1-10)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, userId, foodId, position } = body;

    // Validation
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!foodId || typeof foodId !== 'string') {
      return NextResponse.json(
        { error: 'Food ID is required' },
        { status: 400 }
      );
    }

    if (typeof position !== 'number' || position < 1) {
      return NextResponse.json(
        { error: 'Position must be a positive number' },
        { status: 400 }
      );
    }

    // Track selection analytics
    await trackFoodSelection({
      query,
      userId: userId || undefined,
      foodId,
      position,
    });

    return NextResponse.json({
      success: true,
      message: 'Selection tracked',
    });
  } catch (error) {
    console.error('Track selection error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track selection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
