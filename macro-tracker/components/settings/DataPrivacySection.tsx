'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function DataPrivacySection() {
  const supabase = createClient();

  const handleExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) throw new Error('User data not found');

      const userId = (userData as any).id;

      // Get all user-related data
      const [
        { data: goals },
        { data: logs },
        { data: settings },
      ] = await Promise.all([
        supabase.from('daily_goals').select('*').eq('user_id', userId),
        supabase.from('food_logs').select('*').eq('user_id', userId),
        supabase.from('user_settings').select('*').eq('user_id', userId),
      ]);

      const exportData = {
        user: userData,
        goals: goals || [],
        logs: logs || [],
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
      toast.error(error.message || 'Failed to export data');
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
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
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
