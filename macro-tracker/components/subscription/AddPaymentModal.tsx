'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daysLeft: number;
  userStats?: {
    streak?: number;
    mealsLogged?: number;
    aiConversations?: number;
  };
}

/**
 * Modal for trial users to add payment method
 * Shows FOMO messaging and plan selection
 */
export function AddPaymentModal({
  open,
  onOpenChange,
  daysLeft,
  userStats,
}: AddPaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);

    try {
      // Call checkout session API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: selectedPlan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-chart-2 to-chart-3 flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Continue Your Premium Access</DialogTitle>
          <DialogDescription className="text-center text-base">
            Don't lose your unlimited AI coaching and advanced features
          </DialogDescription>
        </DialogHeader>

        {/* FOMO Banner */}
        <div
          className={cn(
            'p-4 rounded-lg border',
            daysLeft <= 2
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-500'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
          )}
        >
          <p className="font-medium text-center">
            Your trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
          </p>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-3 gap-4 my-4">
            {userStats.streak !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-chart-2">{userStats.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            )}
            {userStats.mealsLogged !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-chart-3">{userStats.mealsLogged}</p>
                <p className="text-xs text-muted-foreground">Meals</p>
              </div>
            )}
            {userStats.aiConversations !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-primary">{userStats.aiConversations}</p>
                <p className="text-xs text-muted-foreground">AI Chats</p>
              </div>
            )}
          </div>
        )}

        {/* Plan Selection */}
        <div className="space-y-3">
          {/* Monthly Plan */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-colors',
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Monthly</h3>
                <p className="text-sm text-muted-foreground">Billed monthly, cancel anytime</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$12</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>
          </button>

          {/* Annual Plan */}
          <button
            onClick={() => setSelectedPlan('annual')}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-colors relative',
              selectedPlan === 'annual'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="absolute -top-2 right-4">
              <span className="px-2 py-1 rounded-full bg-gradient-to-r from-chart-2 to-chart-3 text-white text-xs font-semibold">
                Save $45
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Annual</h3>
                <p className="text-sm text-muted-foreground">Billed yearly, save $45</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$99</p>
                <p className="text-xs text-muted-foreground">/year</p>
              </div>
            </div>
          </button>
        </div>

        {/* Benefits */}
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm font-semibold mb-2">Premium includes:</p>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
              <span>Unlimited AI messages</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
              <span>Custom macro goals</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-chart-2 flex-shrink-0" />
              <span>Data export</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Button
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-chart-2 hover:scale-105 transition-transform"
          size="lg"
        >
          {loading ? 'Redirecting...' : 'Continue to Payment'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime from your account settings
        </p>
      </DialogContent>
    </Dialog>
  );
}
