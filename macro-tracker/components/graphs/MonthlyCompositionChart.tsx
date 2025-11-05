'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLast30Days } from '@/lib/utils/date-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';

type ViewMode = 'calories' | 'grams' | 'percentage';

export function MonthlyCompositionChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calories');
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const dates = getLast30Days();

      const { data: summaries } = await supabase
        .from('daily_summary')
        .select('*')
        .in('date', dates)
        .order('date');

      // Convert macros to different formats
      const chartData = dates.map(date => {
        const summary: any = summaries?.find((s: any) => s.date === date);
        const protein = summary?.total_protein || 0;
        const carbs = summary?.total_carbs || 0;
        const fat = summary?.total_fat || 0;
        const caloriesTarget = summary?.calories_target || 2000;

        const proteinCal = protein * 4;
        const carbsCal = carbs * 4;
        const fatCal = fat * 9;
        const totalCal = proteinCal + carbsCal + fatCal;

        return {
          date: date.substring(5), // MM-DD
          fullDate: date,
          caloriesTarget,
          // Calories
          proteinCal,
          carbsCal,
          fatCal,
          // Grams
          proteinG: protein,
          carbsG: carbs,
          fatG: fat,
          // Percentages
          proteinPct: totalCal > 0 ? Math.round((proteinCal / totalCal) * 100) : 0,
          carbsPct: totalCal > 0 ? Math.round((carbsCal / totalCal) * 100) : 0,
          fatPct: totalCal > 0 ? Math.round((fatCal / totalCal) * 100) : 0,
        };
      });

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="overflow-hidden relative border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-4/5" />
        <CardHeader className="relative">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-3 to-chart-4 bg-clip-text text-transparent">
            30-Day Macro Composition
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-center h-64">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 border-4 border-chart-3 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading composition data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate averages for display
  const avgProtein = Math.round(data.reduce((sum, d) => sum + (viewMode === 'calories' ? d.proteinCal : viewMode === 'grams' ? d.proteinG : d.proteinPct), 0) / data.length);
  const avgCarbs = Math.round(data.reduce((sum, d) => sum + (viewMode === 'calories' ? d.carbsCal : viewMode === 'grams' ? d.carbsG : d.carbsPct), 0) / data.length);
  const avgFat = Math.round(data.reduce((sum, d) => sum + (viewMode === 'calories' ? d.fatCal : viewMode === 'grams' ? d.fatG : d.fatPct), 0) / data.length);

  // Calculate average calorie target for reference line
  const avgCalorieTarget = data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + d.caloriesTarget, 0) / data.length)
    : 2000;

  const getDataKeys = () => {
    switch (viewMode) {
      case 'calories':
        return { protein: 'proteinCal', carbs: 'carbsCal', fat: 'fatCal', unit: 'cal' };
      case 'grams':
        return { protein: 'proteinG', carbs: 'carbsG', fat: 'fatG', unit: 'g' };
      case 'percentage':
        return { protein: 'proteinPct', carbs: 'carbsPct', fat: 'fatPct', unit: '%' };
    }
  };

  const dataKeys = getDataKeys();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const unit = dataKeys.unit;
      const dataPoint = payload[0]?.payload;

      // Format the full date (e.g., "October 31, 2024")
      const fullDate = dataPoint?.fullDate
        ? new Date(dataPoint.fullDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        : label;

      // Calculate total calories from all macros
      const totalCalories = viewMode === 'calories'
        ? Math.round((dataPoint?.proteinCal || 0) + (dataPoint?.carbsCal || 0) + (dataPoint?.fatCal || 0))
        : null;

      return (
        <div className="bg-card/95 backdrop-blur-md border-2 border-primary/20 rounded-2xl p-4 shadow-2xl">
          <p className="font-bold text-base mb-1 text-primary">{fullDate}</p>
          {totalCalories && (
            <p className="text-sm font-semibold text-muted-foreground mb-3">
              Total: {totalCalories} cal
            </p>
          )}
          <div className="space-y-2">
            {payload.reverse().map((entry: any) => (
              <div key={entry.name} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{
                      backgroundColor: entry.color,
                      boxShadow: `0 0 10px ${entry.color}60`
                    }}
                  />
                  <span className="text-sm font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-lg" style={{ color: entry.color }}>
                  {Math.round(entry.value)}{unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden relative border-2">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-chart-4/5 animate-pulse opacity-30" />

      <CardHeader className="relative border-b border-border/50 bg-gradient-to-r from-card to-secondary/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-2 via-chart-3 to-chart-4 bg-clip-text text-transparent">
              30-Day Macro Composition
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Stacked area visualization
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'calories' ? 'default' : 'outline'}
              onClick={() => setViewMode('calories')}
              className="font-semibold"
            >
              🔥 Calories
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'grams' ? 'default' : 'outline'}
              onClick={() => setViewMode('grams')}
              className="font-semibold"
            >
              ⚖️ Grams
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'percentage' ? 'default' : 'outline'}
              onClick={() => setViewMode('percentage')}
              className="font-semibold"
            >
              📊 %
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative pt-6 space-y-4">
        {/* Averages Summary with glassmorphism */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Avg Protein', value: avgProtein, color: 'chart-2', icon: '💪', gradient: 'from-chart-2/20 to-chart-2/5' },
            { label: 'Avg Carbs', value: avgCarbs, color: 'chart-3', icon: '🌾', gradient: 'from-chart-3/20 to-chart-3/5' },
            { label: 'Avg Fat', value: avgFat, color: 'chart-4', icon: '🥑', gradient: 'from-chart-4/20 to-chart-4/5' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
              <div className="relative p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-muted-foreground">{stat.label}</div>
                  <div className="text-lg">{stat.icon}</div>
                </div>
                <div className={`text-2xl font-bold text-${stat.color}`}>
                  {stat.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{dataKeys.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-border/50 p-4 bg-gradient-to-br from-card to-secondary/10">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '14px', paddingTop: '15px', fontWeight: 600 }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey={dataKeys.protein}
                stackId="1"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#colorProtein)"
                name="Protein"
                filter="url(#glow)"
              />
              <Area
                type="monotone"
                dataKey={dataKeys.carbs}
                stackId="1"
                stroke="#F59E0B"
                strokeWidth={3}
                fill="url(#colorCarbs)"
                name="Carbs"
                filter="url(#glow)"
              />
              <Area
                type="monotone"
                dataKey={dataKeys.fat}
                stackId="1"
                stroke="#8B5CF6"
                strokeWidth={3}
                fill="url(#colorFat)"
                name="Fat"
                filter="url(#glow)"
              />
              {/* Dynamic calorie target line - shows each day's specific target */}
              {viewMode === 'calories' && (
                <Line
                  type="monotone"
                  dataKey="caloriesTarget"
                  stroke="#EF4444"
                  strokeWidth={3}
                  strokeDasharray="8 8"
                  dot={false}
                  name="Target"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
