'use client';

import { Badge } from '@/components/ui/badge';
import { Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  accountTier: 'free' | 'trial' | 'premium';
  trialDaysLeft?: number;
  className?: string;
}

/**
 * Crown icon badge for premium/trial users
 * Shows "👑 Premium" or "⚡ Trial (X days left)"
 */
export function PremiumBadge({ accountTier, trialDaysLeft, className }: PremiumBadgeProps) {
  if (accountTier === 'free') {
    return null;
  }

  if (accountTier === 'trial') {
    return (
      <Badge
        className={cn(
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-medium',
          className
        )}
      >
        <Zap className="w-3 h-3 mr-1" />
        Trial
        {trialDaysLeft !== undefined && ` (${trialDaysLeft}d left)`}
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        'bg-gradient-to-r from-primary via-chart-2 to-chart-3 text-white border-0 font-medium',
        className
      )}
    >
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </Badge>
  );
}
