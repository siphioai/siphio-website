'use client';

import { useState, useEffect } from 'react';

export interface SubscriptionData {
  accountTier: 'free' | 'trial' | 'premium';
  subscriptionStatus: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  subscription: {
    priceId: string;
    planType: 'monthly' | 'annual';
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
  } | null;
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

/**
 * Custom hook for subscription data and actions
 * Methods:
 * - fetchSubscription()
 * - openCustomerPortal() → Redirects to Stripe Customer Portal
 */
export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If user not found or subscription data missing, default to free tier
        console.warn('Subscription data not available, defaulting to free tier');
        setSubscription({
          accountTier: 'free',
          subscriptionStatus: null,
          trialStartedAt: null,
          trialEndsAt: null,
          subscriptionCurrentPeriodEnd: null,
          stripeCustomerId: null,
          subscription: null,
        });
        return;
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      // Default to free tier on error
      setSubscription({
        accountTier: 'free',
        subscriptionStatus: null,
        trialStartedAt: null,
        trialEndsAt: null,
        subscriptionCurrentPeriodEnd: null,
        stripeCustomerId: null,
        subscription: null,
      });
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to open customer portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    openCustomerPortal,
  };
}
