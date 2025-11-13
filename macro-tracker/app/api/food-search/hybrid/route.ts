/**
 * =====================================================
 * FOOD SEARCH API ROUTE (EDAMAM)
 * =====================================================
 * Next.js API route for intelligent food search
 * Uses Edamam Food Database API for pre-cleaned, comprehensive food data
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchFoods, type SearchOptions } from '@/lib/services/food-search';

export const runtime = 'edge'; // Use Edge runtime for better performance

/**
 * POST /api/food-search/hybrid
 *
 * Search for foods from curated database
 *
 * Body:
 * {
 *   query: string;
 *   limit?: number;
 *   category?: string;
 *   userId?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit, category, userId } = body;

    // Validation
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required and must be a string' }, { status: 400 });
    }

    if (query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    if (query.length > 100) {
      return NextResponse.json({ error: 'Query must be less than 100 characters' }, { status: 400 });
    }

    // Search options
    const options: SearchOptions = {
      limit: limit && typeof limit === 'number' ? Math.min(limit, 50) : 20,
      category: category && typeof category === 'string' ? category : undefined,
      userId: userId && typeof userId === 'string' ? userId : undefined,
    };

    // Execute search
    const results = await searchFoods(query, options);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Search error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/food-search/hybrid?q=chicken&limit=10
 *
 * Alternative GET endpoint for simple searches
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter (q or query) is required' }, { status: 400 });
    }

    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;

    const options: SearchOptions = {
      limit: Math.min(limit, 50),
      category,
    };

    const results = await searchFoods(query, options);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Search error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
