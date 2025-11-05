'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FoodSearch } from './FoodSearch';
import { FoodItem as FoodItemComponent } from './FoodItem';
import { MealItem, MealType, FoodItem } from '@/types/macros';
import { createClient } from '@/lib/supabase/client';
import { calculateMacros } from '@/lib/utils/calculations';
import { getTodayUTC } from '@/lib/utils/date-helpers';

interface MealSectionProps {
  mealType: MealType;
  items: MealItem[];
  onUpdate: () => void;
}

export function MealSection({ mealType, items, onUpdate }: MealSectionProps) {
  const [showSearch, setShowSearch] = useState(false);
  const supabase = createClient();

  const handleAddFood = async (food: FoodItem, quantityG: number) => {
    try {
      console.log('Adding food:', food.name, quantityG);

      // Calculate macros for this quantity
      const macros = calculateMacros(food, quantityG);
      console.log('Calculated macros:', macros);

      // Get or create meal
      const today = getTodayUTC();
      console.log('Today:', today);

      const { data: user, error: userError } = await supabase.from('users').select('id').single();
      if (userError) {
        console.error('User fetch error:', userError);
        alert('Error fetching user: ' + userError.message);
        return;
      }
      if (!user) {
        console.error('No user found');
        alert('No user found in database');
        return;
      }

      const userId = (user as any).id as string;
      console.log('User ID:', userId);

      let { data: meal, error: mealFetchError } = await supabase
        .from('meals')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('meal_type', mealType)
        .single();

      if (mealFetchError && mealFetchError.code !== 'PGRST116') {
        console.error('Meal fetch error:', mealFetchError);
      }

      if (!meal) {
        console.log('Creating new meal...');
        const { data: newMeal, error: mealInsertError } = await supabase
          .from('meals')
          .insert({ user_id: userId, date: today, meal_type: mealType } as any)
          .select('id')
          .single();

        if (mealInsertError) {
          console.error('Meal insert error:', mealInsertError);
          alert('Error creating meal: ' + mealInsertError.message);
          return;
        }
        meal = newMeal;
        console.log('New meal created:', meal);
      }

      if (!meal) {
        console.error('Failed to get or create meal');
        alert('Failed to create meal');
        return;
      }

      const mealId = (meal as any).id as string;
      console.log('Meal ID:', mealId, 'Food ID:', food.id);

      // Insert meal item
      const { error: insertError } = await supabase.from('meal_items').insert({
        meal_id: mealId,
        food_item_id: food.id,
        quantity_g: quantityG,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat
      } as any);

      if (insertError) {
        console.error('Meal item insert error:', insertError);
        alert('Error adding food: ' + insertError.message);
        return;
      }

      console.log('Food added successfully!');
      setShowSearch(false);
      onUpdate();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Unexpected error: ' + (error as Error).message);
    }
  };

  const totalMacros = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="capitalize text-xl font-bold">{mealType}</span>
          <Button
            onClick={() => setShowSearch(!showSearch)}
            size="sm"
            variant={showSearch ? "outline" : "default"}
          >
            {showSearch ? 'Cancel' : '+ Add Food'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showSearch && (
          <div className="mb-4 p-4 bg-secondary/50 rounded-lg border border-border">
            <FoodSearch onSelectFood={handleAddFood} />
          </div>
        )}

        {items.length === 0 && !showSearch && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No foods logged yet</p>
            <p className="text-xs mt-1">Click "Add Food" to get started</p>
          </div>
        )}

        {items.map((item) => (
          <FoodItemComponent key={item.id} item={item} onUpdate={onUpdate} />
        ))}

        {items.length > 0 && (
          <div className="pt-4 mt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm text-muted-foreground">Total</span>
              <div className="flex gap-4 text-sm font-medium">
                <span className="text-primary">{totalMacros.calories.toFixed(0)} cal</span>
                <span className="text-chart-2">P: {totalMacros.protein.toFixed(1)}g</span>
                <span className="text-chart-3">C: {totalMacros.carbs.toFixed(1)}g</span>
                <span className="text-chart-4">F: {totalMacros.fat.toFixed(1)}g</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
