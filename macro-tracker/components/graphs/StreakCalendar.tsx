'use client';

import { useState } from 'react';
import { useStreakData } from '@/lib/hooks/useStreakData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatISO, startOfMonth, differenceInDays } from 'date-fns';

export function StreakCalendar() {
  const { streak, calendarData, loading } = useStreakData();
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  if (loading) {
    return (
      <Card className="overflow-hidden relative border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-primary/5" />
        <CardHeader className="relative">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-2 to-primary bg-clip-text text-transparent">
            Consistency Rate Daily Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-center h-40">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 border-4 border-chart-2 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get last 30 days for display
  const today = new Date();
  const dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(formatISO(date, { representation: 'date' }));
  }

  // Calculate consistency rate based on current month only
  const monthStart = startOfMonth(today);
  const daysInCurrentMonth = differenceInDays(today, monthStart) + 1; // Include today

  // Filter dates to only include current month dates
  const currentMonthDates = dates.filter(dateStr => {
    const date = new Date(dateStr);
    return date >= monthStart && date <= today;
  });

  const loggedDays = currentMonthDates.filter(date => calendarData[date]).length;
  const consistencyRate = Math.round((loggedDays / daysInCurrentMonth) * 100);

  return (
    <Card className="overflow-hidden relative border-2">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-primary/5 animate-pulse opacity-30" />

      <CardHeader className="relative border-b border-border/50 bg-gradient-to-r from-card to-secondary/20">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-2 to-primary bg-clip-text text-transparent">
              Consistency Rate Daily Entries
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Last 30 days • {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} consistency
            </p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-chart-2/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-chart-2 to-chart-2/70 shadow-lg flex items-center justify-center border-4 border-background">
                <div className="text-3xl font-bold text-white">{streak}</div>
              </div>
            </div>
            <div className="text-xs font-semibold text-muted-foreground mt-2">Day Streak</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative pt-6 space-y-4">
        {/* Consistency Stats with glassmorphism */}
        <div className="relative overflow-hidden rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-chart-2/10" />
          <div className="relative p-4 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg">
                  <span className="text-xl">📈</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-muted-foreground">Consistency Rate</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">{consistencyRate}%</span>
                    <span className="text-sm text-muted-foreground">({loggedDays}/{daysInCurrentMonth} days)</span>
                  </div>
                </div>
              </div>
              {consistencyRate >= 80 && (
                <div className="px-3 py-1 rounded-full bg-chart-2/20 border border-chart-2/30 text-xs font-semibold text-chart-2">
                  Great! 🎉
                </div>
              )}
            </div>
            {consistencyRate >= 75 && consistencyRate < 100 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-lg">💡</span>
                <p className="text-xs font-medium text-foreground">
                  This rate is calculated for {today.toLocaleDateString('en-US', { month: 'long' })} only. Keep it up to maintain your streak!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50">
            <span className="text-lg">📅</span>
            <p className="text-xs font-medium text-muted-foreground">
              Calendar shows your last 30 days of entries.
            </p>
          </div>
          <div className="rounded-xl border border-border/50 p-4 bg-gradient-to-br from-card to-secondary/10">
            <div className="grid grid-cols-7 gap-2">
              {dates.map((date) => {
                const isLogged = calendarData[date];
                const isHovered = hoveredDate === date;
                const dateObj = new Date(date);
                const day = dateObj.getDate();

                return (
                  <div
                    key={date}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center
                      transition-all duration-200 cursor-pointer text-sm font-bold
                      ${isLogged
                        ? 'bg-gradient-to-br from-chart-2 to-chart-2/70 text-white shadow-lg hover:scale-110'
                        : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                      }
                      ${isHovered ? 'ring-2 ring-primary/50' : ''}
                    `}
                    style={isLogged ? {
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                    } : undefined}
                    onMouseEnter={() => setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    title={date}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend with enhanced styling */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30">
            <div className="w-4 h-4 rounded-md bg-gradient-to-br from-chart-2 to-chart-2/70 shadow-sm"></div>
            <span className="text-xs font-semibold text-foreground">Logged</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30">
            <div className="w-4 h-4 rounded-md bg-secondary/30 border-2 border-border/30"></div>
            <span className="text-xs font-semibold text-muted-foreground">Not logged</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
