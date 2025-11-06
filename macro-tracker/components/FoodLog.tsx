'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickAddFood } from '@/components/QuickAddFood';
import { Trash2, Plus, ChevronDown, Coffee, Utensils, Moon, Cookie, Clock } from 'lucide-react';

interface MealItem {
  id: string;
  meal_id: string;
  food_item_id: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
  food_items: {
    name: string;
  } | null;
}

interface Meal {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string | null;
  created_at: string;
  meal_items: MealItem[];
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export function FoodLog() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const [addingToMealId, setAddingToMealId] = useState<string | null>(null);
  const [openMealTypeDropdown, setOpenMealTypeDropdown] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadMeals();

    // Set up real-time subscriptions for both meal_items AND meals tables
    const channel = supabase
      .channel('food_log_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_items',
        },
        (payload) => {
          console.log('🔔 meal_items update triggered!', payload);
          loadMeals();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
        },
        (payload) => {
          console.log('🔔 meals update triggered!', payload);
          loadMeals();
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMealTypeDropdown) {
        setOpenMealTypeDropdown(null);
      }
    };

    if (openMealTypeDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMealTypeDropdown]);

  const loadMeals = async () => {
    console.log('🔄 Loading meals...');
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today\'s date:', today);

    const { data: mealsData, error } = await supabase
      .from('meals')
      .select(`
        id,
        meal_type,
        name,
        created_at,
        meal_items (
          id,
          meal_id,
          food_item_id,
          quantity_g,
          calories,
          protein,
          carbs,
          fat,
          logged_at,
          food_items (name)
        )
      `)
      .eq('date', today)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error loading meals:', error);
      setMeals([]);
      setLoading(false);
      return;
    }

    console.log('✅ Loaded meals:', mealsData);
    console.log('📊 Total meals:', mealsData?.length || 0);
    (mealsData as Meal[])?.forEach((meal, i) => {
      console.log(`  Meal ${i + 1}: ${meal.meal_type}, items: ${meal.meal_items?.length || 0}`);
    });
    setMeals(mealsData || []);
    setLoading(false);
  };

  const handleAddFood = async (foodItemId: string, quantity: number, targetMealId?: string) => {
    try {
      console.log('🍔 handleAddFood called:', { foodItemId, quantity, targetMealId });
      const today = new Date().toISOString().split('T')[0];

      // Get user ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .single() as { data: { id: string } | null; error: any };

      if (userError || !user) {
        console.error('❌ Error getting user:', userError);
        return;
      }

      console.log('👤 User ID:', user.id);

      let mealId: string;

      // If a target meal ID is provided, use it directly (adding to existing meal)
      if (targetMealId) {
        console.log('📌 Using target meal ID:', targetMealId);
        mealId = targetMealId;
      } else {
        // Always create a new snack meal with current timestamp for top-level "Add Food"
        console.log('🆕 Creating new snack meal with current timestamp...');
        const { data: newMeal, error: createError } = (await supabase
          .from('meals')
          .insert({
            user_id: user.id,
            date: today,
            meal_type: 'snack' as MealType,
          } as any)
          .select('id')
          .single()) as { data: { id: string } | null; error: any };

        if (createError || !newMeal) {
          console.error('❌ Error creating meal:', createError);
          console.error('Full error details:', JSON.stringify(createError, null, 2));
          console.error('Attempted to insert:', { user_id: user.id, date: today, meal_type: 'snack' });
          return;
        }

        console.log('✅ New meal created:', newMeal.id);
        mealId = newMeal.id;
      }

      // Get food item details to calculate macros
      const { data: foodItem, error: foodError } = (await supabase
        .from('food_items')
        .select('*')
        .eq('id', foodItemId)
        .single()) as {
          data: {
            calories_per_100g: number;
            protein_per_100g: number;
            carbs_per_100g: number;
            fat_per_100g: number;
          } | null;
          error: any
        };

      if (foodError || !foodItem) {
        console.error('Error getting food item:', foodError);
        return;
      }

      const multiplier = quantity / 100;
      const calories = Number(foodItem.calories_per_100g) * multiplier;
      const protein = Number(foodItem.protein_per_100g) * multiplier;
      const carbs = Number(foodItem.carbs_per_100g) * multiplier;
      const fat = Number(foodItem.fat_per_100g) * multiplier;

      console.log('💾 Inserting meal item:', {
        meal_id: mealId,
        food_item_id: foodItemId,
        quantity_g: quantity,
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
      });

      const { error: insertError } = await supabase.from('meal_items').insert({
        meal_id: mealId,
        food_item_id: foodItemId,
        quantity_g: quantity,
        calories,
        protein,
        carbs,
        fat,
        logged_at: new Date().toISOString(),
      } as any);

      if (insertError) {
        console.error('❌ Error inserting meal item:', insertError);
        return;
      }

      console.log('✅ Food added successfully! Real-time should trigger now...');

      // Manually reload meals as backup (in case real-time is slow)
      await loadMeals();

      setShowSearch(false);
      setAddingToMealId(null);
    } catch (error) {
      console.error('Error in handleAddFood:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase.from('meal_items').delete().eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
    } else {
      // Refresh the meals list after deletion
      loadMeals();
    }
  };

  const handleChangeMealType = async (mealId: string, newMealType: MealType) => {
    const { error } = await supabase
      .from('meals')
      // @ts-expect-error - Database typing issue
      .update({ meal_type: newMealType })
      .eq('id', mealId);

    if (error) {
      console.error('Error updating meal type:', error);
    } else {
      // Refresh the meals list after update
      loadMeals();
    }
  };

  const toggleMealExpansion = (mealId: string) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mealId)) {
        newSet.delete(mealId);
      } else {
        newSet.add(mealId);
      }
      return newSet;
    });
  };

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return <Coffee className="w-5 h-5" />;
      case 'lunch':
        return <Utensils className="w-5 h-5" />;
      case 'dinner':
        return <Moon className="w-5 h-5" />;
      case 'snack':
        return <Cookie className="w-5 h-5" />;
    }
  };

  const getMealLabel = (mealType: MealType) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const getMealGradient = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return 'from-orange-500 to-yellow-500';
      case 'lunch':
        return 'from-green-500 to-emerald-500';
      case 'dinner':
        return 'from-blue-500 to-indigo-500';
      case 'snack':
        return 'from-purple-500 to-pink-500';
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden relative border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-chart-3/5" />
        <CardHeader className="relative">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-2 to-chart-3 bg-clip-text text-transparent">
            Today's Meals
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-center h-64">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 border-4 border-chart-2 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading your meals...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total items across all meals
  const totalItems = meals.reduce((sum, meal) => sum + (meal.meal_items?.length || 0), 0);

  // Calculate daily totals
  const dailyTotals = meals.reduce(
    (acc, meal) => {
      const mealItems = meal.meal_items || [];
      mealItems.forEach(item => {
        acc.calories += Number(item.calories);
        acc.protein += Number(item.protein);
        acc.carbs += Number(item.carbs);
        acc.fat += Number(item.fat);
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Sort meals by created_at for timeline order
  const sortedMeals = [...meals].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <Card className="overflow-hidden relative border-2">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 via-transparent to-chart-3/5 opacity-30" />

      <CardHeader className="relative border-b border-border/50 bg-gradient-to-r from-card to-secondary/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-chart-2 via-chart-3 to-chart-4 bg-clip-text text-transparent">
              Today's Meals
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} logged • {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
            </p>
          </div>
          <Button
            onClick={() => setShowSearch(!showSearch)}
            size="default"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Food
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative pt-6 space-y-4">
        {showSearch && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50 shadow-sm">
            <QuickAddFood onAddFood={handleAddFood} />
          </div>
        )}

        {meals.length === 0 && !showSearch ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-chart-2/20 to-chart-3/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No meals logged yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your nutrition by adding your first meal
            </p>
            <Button onClick={() => setShowSearch(true)} variant="default" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Meal
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="relative space-y-6">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-chart-2 via-chart-3 to-chart-4" />

              {sortedMeals.map((meal, mealIndex) => {
                const isExpanded = expandedMeals.has(meal.id);
                const mealItems = meal.meal_items || [];

                // Skip meals with no items
                if (mealItems.length === 0) return null;

                const mealTime = new Date(meal.created_at);
                const timeLabel = `${mealTime.getHours().toString().padStart(2, '0')}:${mealTime.getMinutes().toString().padStart(2, '0')}`;

                // Calculate meal totals
                const mealTotals = mealItems.reduce(
                  (acc, item) => ({
                    calories: acc.calories + Number(item.calories),
                    protein: acc.protein + Number(item.protein),
                    carbs: acc.carbs + Number(item.carbs),
                    fat: acc.fat + Number(item.fat),
                  }),
                  { calories: 0, protein: 0, carbs: 0, fat: 0 }
                );

                return (
                  <div key={meal.id} className="relative pl-16">
                    {/* Time badge */}
                    <div className="absolute left-0 top-0 flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center shadow-lg border-4 border-background">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Meal group card */}
                    <div className="space-y-2">
                      {/* Meal header with time and totals */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-foreground">{timeLabel}</span>

                          {/* Meal type dropdown */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMealTypeDropdown(openMealTypeDropdown === meal.id ? null : meal.id);
                              }}
                              className={`px-3 py-1 rounded-full bg-gradient-to-br ${getMealGradient(meal.meal_type)} flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer`}
                            >
                              <div className="text-white">
                                {getMealIcon(meal.meal_type)}
                              </div>
                              <span className="text-sm font-semibold text-white">
                                {meal.name || getMealLabel(meal.meal_type)}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${openMealTypeDropdown === meal.id ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown menu */}
                            {openMealTypeDropdown === meal.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-full ml-2 top-0 z-50 min-w-[160px] bg-card border-2 border-border rounded-xl shadow-xl overflow-hidden"
                              >
                                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                                  <button
                                    key={type}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChangeMealType(meal.id, type);
                                      setOpenMealTypeDropdown(null);
                                    }}
                                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-secondary/50 transition-colors ${
                                      meal.meal_type === type ? 'bg-secondary/30' : ''
                                    }`}
                                  >
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMealGradient(type)} flex items-center justify-center`}>
                                      <div className="text-white scale-75">
                                        {getMealIcon(type)}
                                      </div>
                                    </div>
                                    <span className="font-semibold text-sm">
                                      {getMealLabel(type)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {Math.round(mealTotals.calories)} cal • {Math.round(mealTotals.protein)}g P • {Math.round(mealTotals.carbs)}g C • {Math.round(mealTotals.fat)}g F
                        </div>
                      </div>

                      {/* Show items - collapsible only if more than 1 item */}
                      {mealItems.length > 1 ? (
                        <>
                          <button
                            onClick={() => toggleMealExpansion(meal.id)}
                            className="w-full p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all duration-200 flex items-center justify-between"
                          >
                            <span className="text-sm font-medium">
                              {mealItems.length} items logged
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Expandable food items */}
                          {isExpanded && (
                            <div className="space-y-2 mt-2">
                              {mealItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="group relative p-2.5 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm truncate">
                                          {item.food_items?.name || 'Unknown Food'}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                          {item.quantity_g}g
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="px-1.5 py-0.5 rounded bg-chart-1/10 text-chart-1 font-medium whitespace-nowrap">
                                          {Math.round(Number(item.calories))} cal
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2 font-medium whitespace-nowrap">
                                          {Math.round(Number(item.protein))}g P
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-chart-3/10 text-chart-3 font-medium whitespace-nowrap">
                                          {Math.round(Number(item.carbs))}g C
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-chart-4/10 text-chart-4 font-medium whitespace-nowrap">
                                          {Math.round(Number(item.fat))}g F
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              {/* Add another item section */}
                              {addingToMealId === meal.id ? (
                                <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50 shadow-sm">
                                  <QuickAddFood onAddFood={(foodItemId, quantity) => handleAddFood(foodItemId, quantity, meal.id)} />
                                </div>
                              ) : (
                                <Button
                                  onClick={() => setAddingToMealId(meal.id)}
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-2"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add another item
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Single item - display directly without collapsible */
                        mealItems.length === 1 && (
                          <div className="space-y-2">
                            {mealItems.map((item) => (
                              <div
                                key={item.id}
                                className="group relative p-2.5 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm truncate">
                                        {item.food_items?.name || 'Unknown Food'}
                                      </h4>
                                      <p className="text-xs text-muted-foreground">
                                        {item.quantity_g}g
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="px-1.5 py-0.5 rounded bg-chart-1/10 text-chart-1 font-medium whitespace-nowrap">
                                        {Math.round(Number(item.calories))} cal
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2 font-medium whitespace-nowrap">
                                        {Math.round(Number(item.protein))}g P
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-chart-3/10 text-chart-3 font-medium whitespace-nowrap">
                                        {Math.round(Number(item.carbs))}g C
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-chart-4/10 text-chart-4 font-medium whitespace-nowrap">
                                        {Math.round(Number(item.fat))}g F
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Add another item section */}
                            {addingToMealId === meal.id ? (
                              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50 shadow-sm">
                                <QuickAddFood onAddFood={(foodItemId, quantity) => handleAddFood(foodItemId, quantity, meal.id)} />
                              </div>
                            ) : (
                              <Button
                                onClick={() => setAddingToMealId(meal.id)}
                                variant="outline"
                                size="sm"
                                className="w-full gap-2"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add another item
                              </Button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Daily totals */}
            {totalItems > 0 && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-chart-2/10 border-2 border-primary/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Daily Total</span>
                  <div className="flex gap-4 text-sm font-bold">
                    <span className="text-chart-1">{Math.round(dailyTotals.calories)} cal</span>
                    <span className="text-chart-2">{Math.round(dailyTotals.protein)}g P</span>
                    <span className="text-chart-3">{Math.round(dailyTotals.carbs)}g C</span>
                    <span className="text-chart-4">{Math.round(dailyTotals.fat)}g F</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
