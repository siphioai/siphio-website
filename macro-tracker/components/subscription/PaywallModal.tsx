'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, X } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userStats?: {
    streak?: number;
    mealsLogged?: number;
    aiConversations?: number;
  };
}

/**
 * Full-screen modal at 50/50 messages
 * Shows user stats and upgrade options
 */
export function PaywallModal({ open, onOpenChange, userStats }: PaywallModalProps) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  const handleStartTrial = () => {
    setRedirecting(true);
    router.push('/start-trial');
  };

  const features = {
    free: [
      { name: '50 AI messages per month', included: true },
      { name: '500 character message limit', included: true },
      { name: 'Basic nutrition tracking', included: true },
      { name: 'Unlimited AI messages', included: false },
      { name: '2000 character messages', included: false },
      { name: 'Custom macro goals', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Data export', included: false },
      { name: 'Priority support', included: false },
    ],
    premium: [
      { name: 'Unlimited AI messages', included: true },
      { name: '2000 character messages', included: true },
      { name: 'Custom macro goals', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Data export (CSV)', included: true },
      { name: 'Priority support', included: true },
      { name: 'All future features', included: true },
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-chart-2 to-chart-3 flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            You've reached your free limit
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Upgrade to Premium for unlimited AI coaching
          </DialogDescription>
        </DialogHeader>

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-3 gap-4 my-6">
            {userStats.streak !== undefined && (
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-chart-2">{userStats.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            )}
            {userStats.mealsLogged !== undefined && (
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-chart-3">{userStats.mealsLogged}</p>
                <p className="text-xs text-muted-foreground">Meals Logged</p>
              </div>
            )}
            {userStats.aiConversations !== undefined && (
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-primary">{userStats.aiConversations}</p>
                <p className="text-xs text-muted-foreground">AI Chats</p>
              </div>
            )}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-4 my-6">
          {/* Current Plan */}
          <div className="p-6 rounded-lg border-2 border-border bg-card">
            <h3 className="text-lg font-semibold mb-2">Free Plan</h3>
            <p className="text-3xl font-bold mb-4">
              $0<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <ul className="space-y-2 mb-4">
              {features.free.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {feature.included ? (
                    <Check className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Current plan</p>
          </div>

          {/* Premium Plan */}
          <div className="p-6 rounded-lg border-2 border-primary bg-gradient-to-br from-primary/5 to-chart-2/5 relative">
            <div className="absolute -top-3 right-4">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-chart-2 text-white text-xs font-semibold">
                Recommended
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Premium</h3>
            <p className="text-3xl font-bold mb-1">
              $12<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground mb-4">or $99/year (save $45)</p>
            <ul className="space-y-2 mb-6">
              {features.premium.slice(0, 6).map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  <span>{feature.name}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={handleStartTrial}
              disabled={redirecting}
              className="w-full bg-gradient-to-r from-primary to-chart-2 hover:scale-105 transition-transform"
              size="lg"
            >
              {redirecting ? 'Redirecting...' : 'Start 7-Day Trial'}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Card required • Not charged until trial ends
            </p>
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
