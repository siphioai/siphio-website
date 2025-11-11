'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Sparkles, ArrowRight } from 'lucide-react';

export default function StartTrialPage() {
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const trialFeatures = [
    {
      icon: Zap,
      title: 'Unlimited AI messages',
      description: 'Chat with your AI nutrition coach as much as you want',
    },
    {
      icon: Crown,
      title: 'Custom macro goals',
      description: 'Set personalized targets that work for your lifestyle',
    },
    {
      icon: Sparkles,
      title: 'Advanced analytics',
      description: 'Deep insights into your nutrition trends and progress',
    },
    {
      icon: Check,
      title: 'Data export',
      description: 'Download your data anytime in CSV format',
    },
  ];

  async function activateTrial() {
    setActivating(true);
    setError(null);

    try {
      // 1. Get current user
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to start your trial');
        router.push('/signin');
        return;
      }

      // 2. Get user database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, account_tier')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        setError('Unable to find your account');
        return;
      }

      // Check if user is already on trial or premium
      if (userData.account_tier === 'trial' || userData.account_tier === 'premium') {
        router.push('/');
        return;
      }

      // 3. Create Stripe checkout session for trial with card required
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
          mode: 'trial', // Special mode for trial signup
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start checkout session');
        return;
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error activating trial:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary via-chart-2 to-chart-3 mb-4"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Start Your 7-Day Premium Trial
            </h1>
            <p className="text-muted-foreground text-lg">
              Try premium features risk-free for 7 days
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {trialFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Key Points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="p-4 rounded-lg bg-chart-2/10 mb-8"
          >
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                <span>7 days of unlimited access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                <span>Credit card required (not charged until trial ends)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                <span>Cancel anytime before trial ends - no charge</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
                <span>
                  After trial: $12/month billed automatically (cancel anytime)
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-4"
          >
            <Button
              onClick={activateTrial}
              disabled={activating}
              className="w-full text-lg py-6 bg-gradient-to-r from-primary via-chart-2 to-chart-3 hover:scale-105 transition-transform"
              size="lg"
            >
              {activating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Activating Trial...
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By starting your trial, you agree to our{' '}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
