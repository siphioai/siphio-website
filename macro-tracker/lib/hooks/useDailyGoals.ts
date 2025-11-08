'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MacroGoal } from '@/types/macros';
import { getTodayUTC } from '@/lib/utils/date-helpers';

export function useDailyGoals() {
  const [goals, setGoals] = useState<MacroGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchGoals = async () => {
    const today = getTodayUTC();
    const { data } = await supabase
      .from('macro_goals')
      .select('*')
      .eq('date', today)
      .single();

    setGoals(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const updateGoals = async (newGoals: Omit<MacroGoal, 'id' | 'user_id' | 'created_at'>) => {
    // Get default user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .single();

    if (!user) throw new Error('No user found');

    const userId = (user as any).id as string;

    // Update macro_goals table
    const { data, error } = await supabase
      .from('macro_goals')
      .upsert({
        user_id: userId,
        ...newGoals
      } as any, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    setGoals(data);

    // CRITICAL: Also update daily_summary targets for real-time updates
    // Check if daily_summary exists for today
    const { data: existingSummary, error: summaryFetchError } = await supabase
      .from('daily_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('date', newGoals.date)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no rows

    console.log('Checking existing summary:', { existingSummary, summaryFetchError });

    if (existingSummary) {
      // Update existing daily_summary with new targets
      console.log('Updating existing daily_summary with new targets:', newGoals);
      const { error: updateError } = await supabase
        .from('daily_summary')
        .update({
          calories_target: newGoals.calories_target,
          protein_target: newGoals.protein_target,
          carbs_target: newGoals.carbs_target,
          fat_target: newGoals.fat_target
        })
        .eq('user_id', userId)
        .eq('date', newGoals.date);

      if (updateError) {
        console.error('Error updating daily_summary:', updateError);
      } else {
        console.log('Successfully updated daily_summary - real-time should update UI');
      }
    } else {
      // Create new daily_summary with goals if it doesn't exist
      console.log('Creating new daily_summary with goals:', newGoals);
      const { error: insertError } = await supabase
        .from('daily_summary')
        .insert({
          user_id: userId,
          date: newGoals.date,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          calories_target: newGoals.calories_target,
          protein_target: newGoals.protein_target,
          carbs_target: newGoals.carbs_target,
          fat_target: newGoals.fat_target,
          has_logged: false
        });

      if (insertError) {
        console.error('Error inserting daily_summary:', insertError);
      } else {
        console.log('Successfully created daily_summary - real-time should update UI');
      }
    }

    return data;
  };

  return { goals, loading, updateGoals, refetch: fetchGoals };
}
