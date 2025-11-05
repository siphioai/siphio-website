'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateUTC, getTodayUTC } from '@/lib/utils/date-helpers';
import { subDays, parseISO } from 'date-fns';

export function useStreakData() {
  const [streak, setStreak] = useState(0);
  const [calendarData, setCalendarData] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStreakData = async () => {
      // Fetch last 90 days of data
      const startDate = formatDateUTC(subDays(new Date(), 90));

      const { data } = await supabase
        .from('daily_summary')
        .select('date, has_logged')
        .gte('date', startDate)
        .order('date', { ascending: false });

      if (!data) {
        setLoading(false);
        return;
      }

      // Build calendar data
      const calendar: Record<string, boolean> = {};
      data.forEach((day: any) => {
        calendar[day.date] = day.has_logged;
      });
      setCalendarData(calendar);

      // Calculate current streak
      let currentStreak = 0;
      const today = getTodayUTC();
      let checkDate = today;

      while (calendar[checkDate]) {
        currentStreak++;
        checkDate = formatDateUTC(subDays(parseISO(checkDate), 1));
      }

      setStreak(currentStreak);
      setLoading(false);
    };

    fetchStreakData();
  }, []);

  return { streak, calendarData, loading };
}
