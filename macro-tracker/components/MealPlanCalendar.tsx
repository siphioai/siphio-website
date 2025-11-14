'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MealPlan } from '@/types/chat';

interface MealPlanCalendarProps {
  mealPlan: MealPlan;
}

export function MealPlanCalendar({ mealPlan }: MealPlanCalendarProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Calculate status for a day's totals vs targets
  const getDayStatus = (totals: any, targets: any) => {
    const percentage = (totals.calories / targets.calories) * 100;
    if (percentage >= 95 && percentage <= 105) return 'on-track';
    if (percentage > 105) return 'over';
    return 'under';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    if (status === 'on-track') return 'text-chart-2';
    if (status === 'over') return 'text-destructive';
    return 'text-chart-3';
  };

  // Get status background
  const getStatusBg = (status: string) => {
    if (status === 'on-track') return 'bg-chart-2/10 border-chart-2/30';
    if (status === 'over') return 'bg-destructive/10 border-destructive/30';
    return 'bg-chart-3/10 border-chart-3/30';
  };

  // Get meal type icon
  const getMealIcon = (mealType: string) => {
    if (mealType === 'breakfast') return '🌅';
    if (mealType === 'lunch') return '🍽️';
    if (mealType === 'dinner') return '🌙';
    return '🍴';
  };

  // Navigation handlers
  const goToPreviousDay = () => {
    setCurrentDayIndex((prev) => (prev > 0 ? prev - 1 : mealPlan.days.length - 1));
  };

  const goToNextDay = () => {
    setCurrentDayIndex((prev) => (prev < mealPlan.days.length - 1 ? prev + 1 : 0));
  };

  const currentDay = mealPlan.days[currentDayIndex];
  const status = getDayStatus(currentDay.daily_totals, mealPlan.daily_target);
  const percentage = Math.round((currentDay.daily_totals.calories / mealPlan.daily_target.calories) * 100);

  return (
    <Card className="overflow-hidden relative border-2 mb-4">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 opacity-50" />

      <CardHeader className="relative border-b border-border/50 bg-gradient-to-r from-card to-secondary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-4xl">🗓️</span>
              Your Meal Plan
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Week of {new Date(mealPlan.week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Daily target badges */}
          <div className="flex gap-2 flex-wrap">
            <div className="px-3 py-1 rounded-full bg-chart-1/10 border border-chart-1/30 text-xs font-semibold text-chart-1">
              {mealPlan.daily_target.calories} cal
            </div>
            <div className="px-3 py-1 rounded-full bg-chart-2/10 border border-chart-2/30 text-xs font-semibold text-chart-2">
              {mealPlan.daily_target.protein}g protein
            </div>
            <div className="px-3 py-1 rounded-full bg-chart-3/10 border border-chart-3/30 text-xs font-semibold text-chart-3">
              {mealPlan.daily_target.carbs}g carbs
            </div>
            <div className="px-3 py-1 rounded-full bg-chart-4/10 border border-chart-4/30 text-xs font-semibold text-chart-4">
              {mealPlan.daily_target.fat}g fat
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pt-4 pb-3">
        {/* Current Day Content */}
        <div className="space-y-3">
          {/* Day header */}
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                {currentDay.day_name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {new Date(currentDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBg(status)} ${getStatusColor(status)}`}>
              {currentDay.daily_totals.calories} / {mealPlan.daily_target.calories} cal ({percentage}%)
            </div>
          </div>

          {/* Meals grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentDay.meals.map((meal, mealIdx) => (
              <div key={mealIdx} className="h-full flex flex-col p-3 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors">
                {/* Meal header - Fixed height for alignment */}
                <div className="flex items-start gap-2 mb-2 h-12">
                  <span className="text-xl">{getMealIcon(meal.meal_type)}</span>
                  <div className="flex-1">
                    <h4 className="font-bold leading-tight text-sm">{meal.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{meal.meal_type}</p>
                  </div>
                </div>

                {/* Foods list */}
                <div className="space-y-1.5 mb-2 flex-grow">
                  {meal.foods.map((food, foodIdx) => (
                    <div key={foodIdx} className="text-xs">
                      <div className="font-medium">{food.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {food.quantity_g}g • {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meal totals */}
                <div className="pt-2 border-t border-border/30 grid grid-cols-4 gap-1.5 text-center mt-auto">
                  <div>
                    <div className="text-xs text-muted-foreground">Cal</div>
                    <div className="font-bold text-xs">{meal.totals.calories}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">P</div>
                    <div className="font-bold text-xs text-chart-2">{meal.totals.protein}g</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">C</div>
                    <div className="font-bold text-xs text-chart-3">{meal.totals.carbs}g</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">F</div>
                    <div className="font-bold text-xs text-chart-4">{meal.totals.fat}g</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousDay}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Day {currentDayIndex + 1} of {mealPlan.days.length}
              </p>
              <div className="flex gap-1 mt-1 justify-center">
                {mealPlan.days.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentDayIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentDayIndex
                        ? 'bg-primary w-6'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to day ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextDay}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
