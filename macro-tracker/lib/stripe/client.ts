import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

/**
 * Stripe client instance configured with API version
 * Used for server-side Stripe operations
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // @ts-ignore - Using latest stable API version
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

/**
 * Price IDs for subscription plans
 * Set these in your .env file after creating products in Stripe
 */
export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY || '',
  annual: process.env.STRIPE_PRICE_ID_ANNUAL || '',
};

/**
 * Helper function to get price ID for a plan type
 */
export function getPriceId(planType: 'monthly' | 'annual'): string {
  const priceId = STRIPE_PRICE_IDS[planType];
  if (!priceId) {
    throw new Error(`Price ID not configured for plan: ${planType}`);
  }
  return priceId;
}

/**
 * Helper function to format amount from cents to dollars
 */
export function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}
