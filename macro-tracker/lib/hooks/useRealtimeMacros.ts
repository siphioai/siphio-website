'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DailySummary } from '@/types/macros';
import { getTodayUTC } from '@/lib/utils/date-helpers';

export function useRealtimeMacros() {
  const [data, setData] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const supabase = createClient();
  const today = getTodayUTC();

  // Expose refresh function globally so other components can trigger it
  useEffect(() => {
    (window as any).refreshMacros = () => {
      console.log('Manual refresh triggered');
      setRefreshTrigger(prev => prev + 1);
    };
    return () => {
      delete (window as any).refreshMacros;
    };
  }, []);

  useEffect(() => {
    let userId: string | null = null;

    // Initial fetch
    const fetchData = async () => {
      console.log('Fetching daily summary for date:', today);

      // First, get the user ID
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Multi-user mode: lookup user by auth_id
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', authUser.id)
          .single();
        userId = userData?.id || null;
      } else {
        // Single-user mode: get the default user
        const { data: defaultUser } = await supabase
          .from('users')
          .select('id')
          .limit(1)
          .single();
        userId = defaultUser?.id || null;
      }

      if (!userId) {
        console.error('No user found');
        setLoading(false);
        return;
      }

      console.log('Found user ID:', userId);

      // Try to get daily summary for this specific user
      const { data: summary } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      console.log('Found summary:', summary);

      // If no daily summary exists, fetch goals from macro_goals and create initial summary
      if (!summary) {
        console.log('No daily summary found, fetching from macro_goals...');

        // Fetch user's goals for today
        const { data: goals } = await supabase
          .from('macro_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();

        if (goals) {
          console.log('Found goals, creating initial daily summary:', goals);

          // Create initial daily summary with user's goals
          const { data: newSummary, error: insertError } = await supabase
            .from('daily_summary')
            .insert({
              user_id: userId,
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

          if (insertError) {
            console.error('Error creating daily summary:', insertError);
          } else {
            console.log('Created new daily summary:', newSummary);
            setData(newSummary);
          }
        } else {
          console.log('No goals found for today');
        }
      } else {
        console.log('Using existing summary');
        setData(summary);
      }

      setLoading(false);
    };

    fetchData();

    // CRITICAL: Real-time subscription - must wait for userId to be set
    const setupRealtimeSubscription = async () => {
      // Wait for userId to be available
      if (!userId) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single();
          userId = userData?.id || null;
        } else {
          const { data: defaultUser } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .single();
          userId = defaultUser?.id || null;
        }
      }

      if (!userId) {
        console.error('Cannot setup realtime: No user found');
        return null;
      }

      console.log('Setting up realtime subscription for user:', userId, 'date:', today);

      const channel = supabase
        .channel('daily_summary_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_summary',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔥 Real-time update received:', payload);
            console.log('Payload type:', payload.eventType);
            console.log('New data:', payload.new);

            // Only update if the change is for today's date
            const newData = payload.new as DailySummary;
            if (newData && newData.date === today) {
              console.log('✅ Updating state with new data');
              setData(newData);
            } else {
              console.log('⏭️  Skipping update - not for today');
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      return channel;
    };

    const channelPromise = setupRealtimeSubscription();

    // CRITICAL: Clean up channel on unmount
    return () => {
      channelPromise.then(channel => {
        if (channel) {
          console.log('Cleaning up realtime channel');
          supabase.removeChannel(channel);
        }
      });
    };
  }, [today, refreshTrigger]);

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
