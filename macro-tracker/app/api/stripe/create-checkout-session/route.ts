import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { stripe, getPriceId } from '@/lib/stripe/client';

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe checkout session for subscription
 *
 * Body: { planType: 'monthly' | 'annual' }
 */
export async function POST(request: NextRequest) {
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

    // 2. Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id, account_tier')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already premium
    if (userData.account_tier === 'premium') {
      return NextResponse.json(
        { error: 'Already subscribed' },
        { status: 400 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { planType, mode } = body;

    // If mode is 'trial', default to monthly plan
    const selectedPlanType = mode === 'trial' ? 'monthly' : planType;

    if (!selectedPlanType || !['monthly', 'annual'].includes(selectedPlanType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const priceId = getPriceId(selectedPlanType as 'monthly' | 'annual');

    // 4. Create or retrieve Stripe customer
    let customerId = userData.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: userData.id,
          auth_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userData.id);
    }

    // 5. Check if user is on trial or requesting trial mode
    const isOnTrial = userData.account_tier === 'trial';
    const isTrialSignup = mode === 'trial' && !isOnTrial;

    // 6. Create checkout session
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const sessionConfig: any = {
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancelled`,
      metadata: {
        user_id: userData.id,
        auth_id: user.id,
      },
      allow_promotion_codes: true,
      payment_method_collection: 'always', // ALWAYS collect card, even for trial
    };

    // If user is starting a trial, offer 7-day trial with card required
    if (isTrialSignup) {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        metadata: {
          user_id: userData.id,
          is_trial_signup: 'true', // Flag for webhook to set trial status
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}
