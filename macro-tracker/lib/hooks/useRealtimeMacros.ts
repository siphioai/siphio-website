'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DailySummary } from '@/types/macros';
import { getTodayUTC } from '@/lib/utils/date-helpers';

export function useRealtimeMacros() {
  const [data, setData] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const today = getTodayUTC();

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      // First, try to get daily summary
      const { data: summary } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('date', today)
        .single();

      // If no daily summary exists, fetch goals from macro_goals and create initial summary
      if (!summary) {
        console.log('No daily summary found, fetching from macro_goals...');

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

          if (profile) {
            // Fetch user's goals for today
            const { data: goals } = await supabase
              .from('macro_goals')
              .select('*')
              .eq('user_id', profile.id)
              .eq('date', today)
              .single();

            if (goals) {
              console.log('Found goals, creating initial daily summary:', goals);

              // Create initial daily summary with user's goals
              const { data: newSummary } = await supabase
                .from('daily_summary')
                .insert({
                  user_id: profile.id,
                  date: today,
                  total_calories: 0,
                  total_protein: 0,
                  total_carbs: 0,
                  total_fat: 0,
                  calories_target: goals.calories_target,
                  protein_target: goals.protein_target,
                  carbs_target: goals.carbs_target,
                  fat_target: goals.fat_target,
                  has_logged: false
                })
                .select()
                .single();

              setData(newSummary);
            }
          }
        }
      } else {
        setData(summary);
      }

      setLoading(false);
    };

    fetchData();

    // CRITICAL: Real-time subscription
    const channel = supabase
      .channel('daily_summary_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_summary',
          filter: `date=eq.${today}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          setData(payload.new as DailySummary);
        }
      )
      .subscribe();

    // CRITICAL: Clean up channel on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [today]);

  return {
    current: {
      calories: data?.total_calories ?? 0,
      protein: data?.total_protein ?? 0,
      carbs: data?.total_carbs ?? 0,
      fat: data?.total_fat ?? 0
    },
    targets: {
      calories: data?.calories_target ?? 2000,
      protein: data?.protein_target ?? 150,
      carbs: data?.carbs_target ?? 200,
      fat: data?.fat_target ?? 65
    },
    loading
  };
}
