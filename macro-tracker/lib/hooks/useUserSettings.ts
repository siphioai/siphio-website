import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserSettings } from '@/types/database';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user_id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) throw userError;

      // Get or create settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', (userData as any).id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      // If no settings exist, create them
      if (!settingsData) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: (userData as any).id })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings as any);
      } else {
        setSettings(settingsData as any);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      if (!settings) throw new Error('No settings loaded');

      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      // Refresh settings
      await fetchSettings();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) throw new Error('User not found');

      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', (userData as any).id);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateUserProfile,
    refetch: fetchSettings,
  };
}
