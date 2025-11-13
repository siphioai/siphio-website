import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // Get current user (handles both authenticated and single-user mode)
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let userId: string | null = null;

  if (authUser) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single();
    userId = userData?.id || null;
  } else {
    const { data: defaultUser } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    userId = defaultUser?.id || null;
  }

  if (!userId) {
    console.error('No user found for smart suggestions');
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // Get top 6 smart suggestions
  const { data, error } = await supabase
    .from('user_smart_suggestions')
    .select(`
      *,
      food_items (
        id,
        display_name,
        name,
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g
      )
    `)
    .eq('user_id', userId)
    .order('smart_score', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Smart suggestions error:', error);

    // Fallback to common foods (chicken, rice, eggs, etc.)
    const { data: fallbackFoods, error: fallbackError } = await supabase
      .from('food_items')
      .select('id, display_name, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
      .not('display_name', 'is', null)
      .or('name.ilike.%chicken breast%,name.ilike.%rice%,name.ilike.%egg%,name.ilike.%salmon%,name.ilike.%banana%,name.ilike.%oats%')
      .limit(6);

    if (fallbackError) {
      console.error('Fallback error:', fallbackError);
      return NextResponse.json({ error: 'Failed to load suggestions', suggestions: [] }, { status: 200 });
    }

    console.log('Using fallback foods:', fallbackFoods?.length || 0);
    return NextResponse.json({
      success: true,
      fallback: true,
      suggestions: fallbackFoods || []
    });
  }

  // If no smart suggestions found, fallback to common foods
  if (!data || data.length === 0) {
    console.log('No smart suggestions found, using fallback');
    const { data: fallbackFoods } = await supabase
      .from('food_items')
      .select('id, display_name, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
      .not('display_name', 'is', null)
      .or('name.ilike.%chicken breast%,name.ilike.%rice%,name.ilike.%egg%,name.ilike.%salmon%,name.ilike.%banana%,name.ilike.%oats%')
      .limit(6);

    return NextResponse.json({
      success: true,
      fallback: true,
      suggestions: fallbackFoods || []
    });
  }

  console.log('Smart suggestions found:', data.length);
  return NextResponse.json({
    success: true,
    suggestions: data.map(item => ({
      ...item.food_items,
      typical_quantity_g: item.typical_quantity_g,
      is_favorite: item.is_favorite,
      log_count: item.log_count,
      last_used_at: item.last_used_at,
      smart_score: item.smart_score
    }))
  });
}
