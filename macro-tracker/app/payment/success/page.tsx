'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    // Trigger confetti celebration
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Fetch subscription details
    const fetchSubscription = async () => {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const response = await fetch('/api/subscription/status');
        const data = await response.json();
        setSubscriptionDetails(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [searchParams]);

  const handleContinue = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-2/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8 md:p-12 shadow-2xl">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative w-24 h-24 mx-auto mb-6"
          >
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
              transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-chart-3" />
            </motion.div>
          </motion.div>

          {/* Success Message */}
          <div className="text-center space-y-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2">
                <Crown className="w-8 h-8 text-chart-2" />
                Welcome to Premium!
              </h1>
              <p className="text-lg text-muted-foreground">
                Your subscription is now active
              </p>
            </motion.div>

            {/* Subscription Details */}
            {subscriptionDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 rounded-lg bg-gradient-to-br from-primary/5 to-chart-2/5 border border-primary/20"
              >
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold">
                      {subscriptionDetails.subscription?.planType === 'annual'
                        ? 'Annual ($99/year)'
                        : 'Monthly ($12/month)'}
                    </span>
                  </div>
                  {subscriptionDetails.subscriptionCurrentPeriodEnd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next billing date</span>
                      <span className="font-semibold">
                        {new Date(subscriptionDetails.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* What's Included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-left p-6 rounded-lg bg-muted"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-chart-2" />
                What's included:
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Unlimited AI nutrition coach messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Custom macro goals and targets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Advanced analytics and insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Data export (CSV)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Button
              onClick={handleContinue}
              className="w-full text-lg py-6 bg-gradient-to-r from-primary via-chart-2 to-chart-3 hover:scale-105 transition-transform"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              You can manage your subscription in Settings anytime
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
