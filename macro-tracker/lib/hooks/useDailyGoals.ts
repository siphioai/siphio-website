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
    return data;
  };

  return { goals, loading, updateGoals, refetch: fetchGoals };
}
