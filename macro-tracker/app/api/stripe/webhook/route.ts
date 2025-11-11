import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Use service_role key to bypass RLS for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 *
 * CRITICAL: Must use req.text() not req.json() for signature verification
 */
export async function POST(request: NextRequest) {
  // Get raw body as text for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Received webhook event: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * User completed checkout and subscription is created
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  // Update user to premium/trial
  const isTrialing = subscription.status === 'trialing';

  await supabaseAdmin
    .from('users')
    .update({
      account_tier: isTrialing ? 'trial' : 'premium',
      subscription_status: subscription.status,
      stripe_customer_id: session.customer as string,
      ai_messages_used: 0, // Reset usage
      trial_started_at: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('id', userId);

  // Create subscription record
  await supabaseAdmin.from('subscriptions').insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  });

  console.log(`Subscription created for user ${userId}`);
}

/**
 * Handle customer.subscription.updated event
 * Subscription status or details changed
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update user status
  const accountTier = subscription.status === 'trialing' ? 'trial' : 'premium';

  await supabaseAdmin
    .from('users')
    .update({
      account_tier: subscription.status === 'active' || subscription.status === 'trialing' ? accountTier : 'free',
      subscription_status: subscription.status,
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('stripe_customer_id', subscription.customer as string);

  console.log(`Subscription updated: ${subscription.id}`);
}

/**
 * Handle customer.subscription.deleted event
 * Subscription was cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Downgrade user to free
  await supabaseAdmin
    .from('users')
    .update({
      account_tier: 'free',
      subscription_status: 'canceled',
      ai_messages_limit: 50, // Keep verified limit
    })
    .eq('stripe_customer_id', subscription.customer as string);

  // Update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription deleted: ${subscription.id}`);
}

/**
 * Handle invoice.payment_succeeded event
 * Payment was successful (renewal)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

    // Ensure user is marked as premium
    await supabaseAdmin
      .from('users')
      .update({
        account_tier: 'premium',
        subscription_status: 'active',
      })
      .eq('stripe_customer_id', invoice.customer as string);

    console.log(`Payment succeeded for subscription: ${subscription.id}`);
  }
}

/**
 * Handle invoice.payment_failed event
 * Payment failed (retry or cancel)
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Update subscription status to past_due
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'past_due',
    })
    .eq('stripe_customer_id', invoice.customer as string);

  console.log(`Payment failed for customer: ${invoice.customer}`);
  // TODO: Send email warning user of failed payment
}
