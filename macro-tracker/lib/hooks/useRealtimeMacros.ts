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
      const { data: summary } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('date', today)
        .single();

      setData(summary);
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
