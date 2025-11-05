'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLastNDays } from '@/lib/utils/date-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ViewMetric = 'all' | 'calories' | 'protein';
type Timeframe = '1' | '7' | '14' | '30' | '180';

export function WeeklyTrendChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMetric, setViewMetric] = useState<ViewMetric>('calories');
  const [timeframe, setTimeframe] = useState<Timeframe>('7');
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const days = parseInt(timeframe);
      const dates = getLastNDays(days);

      const { data: summaries } = await supabase
        .from('daily_summary')
        .select('*')
        .in('date', dates)
        .order('date');

      const chartData = dates.map(date => {
        const summary: any = summaries?.find((s: any) => s.date === date);
        return {
          date: days <= 14 ? date.substring(5) : date.substring(2), // MM-DD for short, YY-MM-DD for long
          fullDate: date,
          calories: summary?.total_calories || 0,
          protein: summary?.total_protein || 0,
          carbs: summary?.total_carbs || 0,
          fat: summary?.total_fat || 0,
          calTarget: summary?.calories_target || 0,
          proteinTarget: summary?.protein_target || 0
        };
      });

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [timeframe]);

  if (loading) {
    return (
      <Card className="overflow-hidden relative border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 via-transparent to-chart-3/5" />
        <CardHeader className="relative">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
            Macro Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-center h-80">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 border-4 border-chart-1 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading trends...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const avgCalories = Math.round(data.reduce((sum, d) => sum + d.calories, 0) / data.length) || 0;
  const avgProtein = Math.round(data.reduce((sum, d) => sum + d.protein, 0) / data.length) || 0;
  const avgCarbs = Math.round(data.reduce((sum, d) => sum + d.carbs, 0) / data.length) || 0;
  const avgFat = Math.round(data.reduce((sum, d) => sum + d.fat, 0) / data.length) || 0;

  const timeframeLabels: Record<Timeframe, string> = {
    '1': '1 Day',
    '7': '7 Days',
    '14': '14 Days',
    '30': '30 Days',
    '180': '6 Months'
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      const fullDate = dataPoint?.fullDate
        ? new Date(dataPoint.fullDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        : label;

      return (
        <div className="bg-card/95 backdrop-blur-md border-2 border-primary/20 rounded-2xl p-4 shadow-2xl">
          <p className="font-bold text-base mb-3 text-primary">{fullDate}</p>
          <div className="space-y-2">
            {payload.map((entry: any) => (
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
                  {Math.round(entry.value)}
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
      <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 via-transparent to-chart-3/5 animate-pulse opacity-30" />

      <CardHeader className="relative border-b border-border/50 bg-gradient-to-r from-card to-secondary/20">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Macro Trends
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {timeframeLabels[timeframe]} nutrition patterns
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMetric === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMetric('all')}
                className="font-semibold"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={viewMetric === 'calories' ? 'default' : 'outline'}
                onClick={() => setViewMetric('calories')}
                className="font-semibold"
              >
                🔥 Calories
              </Button>
              <Button
                size="sm"
                variant={viewMetric === 'protein' ? 'default' : 'outline'}
                onClick={() => setViewMetric('protein')}
                className="font-semibold"
              >
                💪 Protein
              </Button>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex flex-wrap gap-2">
            {(['1', '7', '14', '30', '180'] as Timeframe[]).map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={timeframe === tf ? 'default' : 'outline'}
                onClick={() => setTimeframe(tf)}
                className="font-semibold text-xs"
              >
                {timeframeLabels[tf]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pt-6 space-y-4">
        {/* Summary Stats with glassmorphism */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Avg Calories', value: avgCalories, unit: 'cal', color: 'chart-1', icon: '🔥', gradient: 'from-chart-1/20 to-chart-1/5' },
            { label: 'Avg Protein', value: avgProtein, unit: 'g', color: 'chart-2', icon: '💪', gradient: 'from-chart-2/20 to-chart-2/5' },
            { label: 'Avg Carbs', value: avgCarbs, unit: 'g', color: 'chart-3', icon: '🌾', gradient: 'from-chart-3/20 to-chart-3/5' },
            { label: 'Avg Fat', value: avgFat, unit: 'g', color: 'chart-4', icon: '🥑', gradient: 'from-chart-4/20 to-chart-4/5' }
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
                  <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-border/50 p-4 bg-gradient-to-br from-card to-secondary/10">
          <ResponsiveContainer width="100%" height={300}>
            {viewMetric === 'calories' || viewMetric === 'protein' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0170B9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0170B9" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="proteinGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  interval={parseInt(timeframe) > 30 ? 'preserveStartEnd' : 0}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={viewMetric === 'calories' ? 'calories' : 'protein'}
                  stroke={viewMetric === 'calories' ? '#0170B9' : '#10B981'}
                  strokeWidth={4}
                  fill={viewMetric === 'calories' ? 'url(#caloriesGradient)' : 'url(#proteinGradient)'}
                  name={viewMetric === 'calories' ? 'Calories' : 'Protein (g)'}
                  dot={{
                    fill: viewMetric === 'calories' ? '#0170B9' : '#10B981',
                    strokeWidth: 3,
                    r: parseInt(timeframe) <= 14 ? 5 : 3,
                    stroke: '#fff'
                  }}
                  activeDot={{
                    r: 8,
                    strokeWidth: 3,
                    fill: viewMetric === 'calories' ? '#0170B9' : '#10B981'
                  }}
                />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  interval={parseInt(timeframe) > 30 ? 'preserveStartEnd' : 0}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="calories"
                  stroke="#0170B9"
                  strokeWidth={4}
                  dot={{ fill: '#0170B9', strokeWidth: 3, r: parseInt(timeframe) <= 14 ? 5 : 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 3 }}
                  name="Calories"
                  filter="url(#shadow)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="protein"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: parseInt(timeframe) <= 14 ? 4 : 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                  name="Protein (g)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="carbs"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: parseInt(timeframe) <= 14 ? 4 : 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                  name="Carbs (g)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="fat"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: parseInt(timeframe) <= 14 ? 4 : 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                  name="Fat (g)"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
