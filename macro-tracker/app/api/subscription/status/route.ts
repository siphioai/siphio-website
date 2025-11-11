import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/subscription/status
 * Returns subscription details for the authenticated user
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

    // 2. Get user subscription data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `id,
        account_tier,
        subscription_status,
        trial_started_at,
        trial_ends_at,
        subscription_current_period_end,
        stripe_customer_id`
      )
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Get subscription details if premium
    let subscriptionDetails = null;
    if (userData.account_tier === 'premium' && userData.stripe_customer_id) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_price_id, cancel_at_period_end, canceled_at')
        .eq('stripe_customer_id', userData.stripe_customer_id)
        .eq('status', 'active')
        .single();

      if (subscription) {
        // Determine plan type from price ID
        const planType = subscription.stripe_price_id.includes('annual') ? 'annual' : 'monthly';

        subscriptionDetails = {
          priceId: subscription.stripe_price_id,
          planType,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at,
        };
      }
    }

    // 4. Build response
    return NextResponse.json({
      accountTier: userData.account_tier,
      subscriptionStatus: userData.subscription_status,
      trialStartedAt: userData.trial_started_at,
      trialEndsAt: userData.trial_ends_at,
      subscriptionCurrentPeriodEnd: userData.subscription_current_period_end,
      stripeCustomerId: userData.stripe_customer_id,
      subscription: subscriptionDetails,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
