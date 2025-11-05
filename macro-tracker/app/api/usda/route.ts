import { NextRequest, NextResponse } from 'next/server';
import { searchFoods } from '@/lib/api/usda';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    const results = await searchFoods(query);
    return NextResponse.json({ success: true, foods: results });
  } catch (error) {
    console.error('USDA API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search foods' },
      { status: 500 }
    );
  }
}
