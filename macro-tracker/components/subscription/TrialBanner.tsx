'use client';

import { Button } from '@/components/ui/button';
import { Zap, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrialBannerProps {
  daysRemaining: number;
  onAddPayment: () => void;
}

/**
 * Trial countdown banner for dashboard
 * Progressive urgency:
 * - Day 1-3: Green "⚡ Premium Trial Active! X days left"
 * - Day 4-5: Yellow "⏰ Add payment to continue Premium"
 * - Day 6-7: Orange "🔥 Last day! Add payment now" (pulsing)
 */
export function TrialBanner({ daysRemaining, onAddPayment }: TrialBannerProps) {
  // Determine urgency level based on days remaining
  const getUrgencyConfig = () => {
    if (daysRemaining <= 2) {
      return {
        bg: 'bg-orange-500/10 border-orange-500/30',
        text: 'text-orange-500',
        icon: Flame,
        message: daysRemaining === 1 ? 'Last day of trial!' : 'Trial ending soon!',
        cta: 'Add Payment Now',
        pulse: true,
      };
    } else if (daysRemaining <= 5) {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30',
        text: 'text-amber-500',
        icon: Clock,
        message: 'Add payment to continue Premium',
        cta: 'Add Payment Method',
        pulse: false,
      };
    } else {
      return {
        bg: 'bg-chart-2/10 border-chart-2/30',
        text: 'text-chart-2',
        icon: Zap,
        message: `Premium Trial Active! ${daysRemaining} days left`,
        cta: 'Add Payment',
        pulse: false,
      };
    }
  };

  const config = getUrgencyConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-sm',
        config.bg,
        config.pulse && 'animate-pulse'
      )}
    >
      <div className="container max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon className={cn('w-5 h-5', config.text)} />
            <p className={cn('font-medium', config.text)}>{config.message}</p>
          </div>
          <Button
            onClick={onAddPayment}
            size="sm"
            variant="default"
            className={cn(
              'transition-transform hover:scale-105',
              daysRemaining <= 2
                ? 'bg-gradient-to-r from-orange-500 to-destructive'
                : 'bg-gradient-to-r from-primary to-chart-2'
            )}
          >
            {config.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
