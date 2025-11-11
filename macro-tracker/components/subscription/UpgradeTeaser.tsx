'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeTeaserProps {
  messagesUsed: number;
  messagesLimit: number;
  onUpgrade: () => void;
}

/**
 * Progressive urgency banner for 40/45/49 messages
 * - At 40/50: Yellow banner "10 messages left - Upgrade for unlimited"
 * - At 45/50: Orange banner "5 messages left! Upgrade to Premium"
 * - At 49/50: Red pulsing banner "Last message! Upgrade now"
 */
export function UpgradeTeaser({ messagesUsed, messagesLimit, onUpgrade }: UpgradeTeaserProps) {
  const remaining = messagesLimit - messagesUsed;

  // Don't show if user has more than 10 messages remaining
  if (remaining > 10) {
    return null;
  }

  // Determine urgency level
  const getUrgencyConfig = () => {
    if (remaining === 1) {
      return {
        bg: 'bg-destructive/10 border-destructive/30',
        text: 'text-destructive',
        icon: AlertCircle,
        message: 'Last message!',
        cta: 'Upgrade Now',
        pulse: true,
      };
    } else if (remaining <= 5) {
      return {
        bg: 'bg-orange-500/10 border-orange-500/30',
        text: 'text-orange-500',
        icon: Zap,
        message: `Only ${remaining} messages left!`,
        cta: 'Upgrade to Premium',
        pulse: false,
      };
    } else {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30',
        text: 'text-amber-500',
        icon: Crown,
        message: `${remaining} messages left this month`,
        cta: 'Upgrade for Unlimited',
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
            onClick={onUpgrade}
            size="sm"
            variant="default"
            className="bg-gradient-to-r from-primary to-chart-2 hover:scale-105 transition-transform"
          >
            <Crown className="w-4 h-4 mr-2" />
            {config.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
