/**
 * =====================================================
 * GET FOOD BY ID API ROUTE (EDAMAM)
 * =====================================================
 * Retrieve detailed food information by Edamam food ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFoodById } from '@/lib/services/food-search';

export const runtime = 'edge';

/**
 * GET /api/food/[id]
 *
 * ID: Edamam food ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Food ID is required' },
        { status: 400 }
      );
    }

    // Get food details from Edamam API
    const food = await getFoodById(id);

    if (!food) {
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      food,
    });
  } catch (error) {
    console.error('Get food error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve food',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
