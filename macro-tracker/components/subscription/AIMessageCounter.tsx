'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, Infinity } from 'lucide-react';

interface AIMessageCounterProps {
  messagesUsed: number;
  messagesLimit: number;
  accountTier: 'free' | 'trial' | 'premium';
  className?: string;
}

/**
 * Color-coded AI message counter with urgency levels
 * - Green (0-70%): Normal usage
 * - Yellow (70-90%): Getting close
 * - Orange (90-98%): Almost out
 * - Red (98-100%): Last messages (pulsing)
 * - Premium/Trial: Unlimited with gradient
 */
export function AIMessageCounter({
  messagesUsed,
  messagesLimit,
  accountTier,
  className,
}: AIMessageCounterProps) {
  // Premium/Trial users show "Unlimited"
  if (accountTier === 'premium' || accountTier === 'trial') {
    return (
      <Badge
        className={cn(
          'bg-gradient-to-r from-primary via-chart-2 to-chart-3 text-white border-0 font-medium',
          className
        )}
      >
        <Sparkles className="w-3 h-3 mr-1" />
        Unlimited
        <Infinity className="w-4 h-4 ml-1" />
      </Badge>
    );
  }

  // Calculate percentage for free tier
  const percentage = (messagesUsed / messagesLimit) * 100;

  // Determine color based on percentage
  const getColorClass = () => {
    if (percentage < 70) {
      return 'text-chart-2 bg-chart-2/10 border-chart-2/20';
    } else if (percentage < 90) {
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    } else if (percentage < 98) {
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    } else {
      return 'text-destructive bg-destructive/10 border-destructive/20 animate-pulse';
    }
  };

  return (
    <Badge className={cn('font-mono font-medium border', getColorClass(), className)}>
      {messagesUsed}/{messagesLimit} messages
    </Badge>
  );
}
