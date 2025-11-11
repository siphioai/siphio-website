import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/ai/usage
 * Returns AI usage statistics for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        'id, account_tier, ai_messages_used, ai_messages_limit, email_verified_at'
      )
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Call database function to check if user can send messages
    const { data: canSendData, error: canSendError } = await supabase.rpc(
      'can_user_send_ai_message',
      {
        p_user_id: userData.id,
      }
    );

    if (canSendError) {
      console.error('Error checking message capability:', canSendError);
      // Don't fail the request, just use default values
    }

    // 4. Determine if email is verified
    const emailVerified = !!userData.email_verified_at;

    // 5. Calculate messages remaining
    const messagesRemaining =
      userData.account_tier === 'premium' || userData.account_tier === 'trial'
        ? -1 // Unlimited
        : Math.max(0, userData.ai_messages_limit - userData.ai_messages_used);

    // 6. Determine if user can send messages
    const canSend =
      canSendData?.can_send ??
      (userData.account_tier === 'premium' ||
        userData.account_tier === 'trial' ||
        userData.ai_messages_used < userData.ai_messages_limit);

    // 7. Build response
    return NextResponse.json({
      messagesUsed: userData.ai_messages_used,
      messagesLimit: userData.ai_messages_limit,
      canSend,
      accountTier: userData.account_tier,
      emailVerified,
      reason: canSendData?.reason || null,
      messagesRemaining,
    });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
