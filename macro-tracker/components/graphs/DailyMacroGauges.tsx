'use client';

import { useRealtimeMacros } from '@/lib/hooks/useRealtimeMacros';
import { calculateProgress } from '@/lib/utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CircularProgressProps {
  percentage: number;
  color: string;
  size: number;
  strokeWidth: number;
}

function CircularProgress({ percentage, color, size, strokeWidth }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-secondary"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
        style={{
          filter: `drop-shadow(0 0 8px ${color}40)`
        }}
      />
    </svg>
  );
}

export function DailyMacroGauges() {
  const { current, targets, loading } = useRealtimeMacros();

  if (loading) {
    return (
      <Card className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
        <CardHeader className="relative">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Today&apos;s Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-center h-64">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading your progress...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const macros = [
    {
      name: 'Calories',
      current: current.calories,
      target: targets.calories,
      color: '#0170B9',
      bgColor: 'from-chart-1/20 to-chart-1/5',
      icon: '🔥'
    },
    {
      name: 'Protein',
      current: current.protein,
      target: targets.protein,
      color: '#10B981',
      bgColor: 'from-chart-2/20 to-chart-2/5',
      icon: '💪'
    },
    {
      name: 'Carbs',
      current: current.carbs,
      target: targets.carbs,
      color: '#F59E0B',
      bgColor: 'from-chart-3/20 to-chart-3/5',
      icon: '🌾'
    },
    {
      name: 'Fat',
      current: current.fat,
      target: targets.fat,
      color: '#8B5CF6',
      bgColor: 'from-chart-4/20 to-chart-4/5',
      icon: '🥑'
    }
  ];

  return (
    <Card className="overflow-hidden relative border-2">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 opacity-50" />

      <CardHeader className="relative border-b border-border/50 bg-gradient-to-r from-card to-secondary/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              Today&apos;s Progress
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Real-time macro tracking
            </p>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </CardHeader>

      <CardContent className="relative pt-8 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {macros.map((macro) => {
            const progress = calculateProgress(macro.current, macro.target);
            const percentage = progress.percentage; // Allow percentage to exceed 100
            const displayPercentage = Math.min(percentage, 100); // Cap display at 100 for the circle
            const isExceeded = percentage > 100;
            const isComplete = percentage >= 100;
            const isNearComplete = percentage >= 85 && percentage < 100;

            return (
              <div
                key={macro.name}
                className="group relative"
              >
                {/* Card background with gradient */}
                <div className={`
                  absolute inset-0 rounded-2xl bg-gradient-to-br ${macro.bgColor}
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  blur-xl
                `} />

                <div className="relative p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:scale-105">
                  {/* Icon badge */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-chart-2/10 backdrop-blur-sm border border-border/50 flex items-center justify-center text-xl shadow-lg">
                    {macro.icon}
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                    {/* Circular progress */}
                    <div className="relative">
                      <CircularProgress
                        percentage={displayPercentage}
                        color={macro.color}
                        size={120}
                        strokeWidth={10}
                      />
                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div
                          className="text-3xl font-bold transition-all duration-500"
                          style={{ color: macro.color }}
                        >
                          {isExceeded ? '100' : percentage.toFixed(0)}%
                        </div>
                        {isComplete && !isExceeded && (
                          <div className="text-lg animate-bounce">✓</div>
                        )}
                      </div>
                    </div>

                    {/* Macro name */}
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-base">{macro.name}</h4>
                      <div className="text-sm">
                        <span className="font-bold" style={{ color: macro.color }}>
                          {macro.current.toFixed(0)}
                        </span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-muted-foreground">
                          {macro.target.toFixed(0)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {macro.name === 'Calories' ? 'cal' : 'g'}
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    {isExceeded && macro.name === 'Protein' && (
                      <div className="px-3 py-1 rounded-full bg-chart-2/10 border border-chart-2/30 text-xs font-semibold text-chart-2 animate-pulse">
                        Hit!
                      </div>
                    )}
                    {isExceeded && macro.name !== 'Protein' && (
                      <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-500 animate-pulse">
                        Exceeded!
                      </div>
                    )}
                    {isComplete && !isExceeded && (
                      <div className="px-3 py-1 rounded-full bg-chart-2/10 border border-chart-2/30 text-xs font-semibold text-chart-2 animate-pulse">
                        Goal Reached! 🎉
                      </div>
                    )}
                    {isNearComplete && !isComplete && (
                      <div className="px-3 py-1 rounded-full bg-chart-3/10 border border-chart-3/30 text-xs font-semibold text-chart-3">
                        Almost There! 💪
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
