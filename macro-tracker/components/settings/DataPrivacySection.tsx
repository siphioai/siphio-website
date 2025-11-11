'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/lib/errors';

export function DataPrivacySection() {
  const supabase = createClient();
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setExporting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (!userData) throw new Error('User data not found');

      const userId = (userData as any).id;

      // Get all user-related data with correct table names
      const [
        { data: macroGoals },
        { data: meals },
        { data: dailySummary },
        { data: favorites },
        { data: settings },
      ] = await Promise.all([
        supabase.from('macro_goals').select('*').eq('user_id', userId),
        supabase.from('meals').select('*').eq('user_id', userId),
        supabase.from('daily_summary').select('*').eq('user_id', userId),
        supabase.from('user_favorites').select('*').eq('user_id', userId),
        supabase.from('user_settings').select('*').eq('user_id', userId),
      ]);

      // Query meal_items via meals relationship (no direct user_id)
      const mealIds = meals?.map((m: any) => m.id) || [];
      let mealItems: any[] = [];

      if (mealIds.length > 0) {
        const { data: items } = await supabase
          .from('meal_items')
          .select('*')
          .in('meal_id', mealIds);
        mealItems = items || [];
      }

      const exportData = {
        user: userData,
        macro_goals: macroGoals || [],
        meals: meals || [],
        meal_items: mealItems || [],
        daily_summary: dailySummary || [],
        favorites: favorites || [],
        settings: settings || [],
        exportedAt: new Date().toISOString(),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `siphio-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error(getUserFriendlyError(error));
    } finally {
      setExporting(false);
    }
  };

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      toast.success('Local cache cleared');
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data & Privacy</CardTitle>
        <CardDescription>Manage your data and privacy settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Export Your Data</p>
            <p className="text-xs text-muted-foreground">
              Download all your data in JSON format
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData} disabled={exporting}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Clear Local Cache</p>
            <p className="text-xs text-muted-foreground">
              Remove cached data from your browser
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearCache}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="pt-4 space-y-2 border-t">
          <p className="text-sm font-medium">Privacy & Terms</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:underline">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
