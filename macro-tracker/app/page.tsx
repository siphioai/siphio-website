'use client';

import { useState } from 'react';
import { MacroGoalsForm } from '@/components/MacroGoalsForm';
import { DailyMacroGauges } from '@/components/graphs/DailyMacroGauges';
import { WeeklyTrendChart } from '@/components/graphs/WeeklyTrendChart';
import { MonthlyCompositionChart } from '@/components/graphs/MonthlyCompositionChart';
import { StreakCalendar } from '@/components/graphs/StreakCalendar';
import { FoodLog } from '@/components/FoodLog';
import { AINutritionCoach } from '@/components/AINutritionCoach';
import { Button } from '@/components/ui/button';
import { Bot, Settings, ChefHat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';

export default function Home() {
  const [coachOpen, setCoachOpen] = useState(false);
  const router = useRouter();
  const { subscription } = useSubscription();

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">Macro Tracker</h1>
              {subscription && (subscription.accountTier === 'premium' || subscription.accountTier === 'trial') && (
                <PremiumBadge
                  accountTier={subscription.accountTier}
                  trialDaysLeft={
                    subscription.accountTier === 'trial' && subscription.trialEndsAt
                      ? Math.ceil(
                          (new Date(subscription.trialEndsAt).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : undefined
                  }
                />
              )}
            </div>
            <p className="text-muted-foreground mt-1">Track your daily nutrition goals</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-12 p-2"
              onClick={() => router.push('/settings')}
              title="Settings"
            >
              <Settings className="w-full h-full" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-12 p-2"
              onClick={() => router.push('/meal-plans')}
              title="Meal Plans"
            >
              <ChefHat className="w-full h-full" />
            </Button>
            <div className="relative">
              <Button
                size="lg"
                variant="outline"
                className="relative overflow-hidden group h-12 w-12 p-2"
                onClick={() => setCoachOpen(true)}
              >
                <Bot className="w-full h-full" />
              </Button>
              {/* AI Notification Badge */}
              <div className="absolute -top-2 -right-2 flex items-center gap-0.5 px-2 py-1 rounded-full bg-gradient-to-r from-primary to-chart-2 shadow-lg">
                <span className="text-[10px] font-bold text-white whitespace-nowrap">Use AI</span>
              </div>
            </div>
            <MacroGoalsForm />
          </div>
        </header>

        {/* Primary Metrics - Daily Gauges highlighted */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Today's Progress</h2>
          <DailyMacroGauges />
        </section>

        {/* Food Log Section - Primary action area */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Food Log</h2>
          <FoodLog />
        </section>

        {/* Analytics Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StreakCalendar />
            <WeeklyTrendChart />
          </div>
          <div className="mt-4">
            <MonthlyCompositionChart />
          </div>
        </section>
      </div>

      {/* AI Nutrition Coach Modal */}
      <AINutritionCoach open={coachOpen} onOpenChange={setCoachOpen} />
    </div>
  );
}
