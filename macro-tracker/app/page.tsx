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
import { Bot, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [coachOpen, setCoachOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Macro Tracker</h1>
            <p className="text-muted-foreground mt-1">Track your daily nutrition goals</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-12 p-2"
              onClick={() => router.push('/settings')}
            >
              <Settings className="w-full h-full" />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
