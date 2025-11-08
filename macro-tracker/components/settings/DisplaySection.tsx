'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { toast } from 'sonner';

export function DisplaySection() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useUserSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    try {
      setTheme(newTheme === 'auto' ? 'system' : newTheme);
      if (settings) {
        await updateSettings({ theme: newTheme });
        toast.success('Theme updated');
      }
    } catch (error) {
      toast.error('Failed to update theme');
    }
  };

  const handleMeasurementChange = async (units: 'metric' | 'imperial') => {
    try {
      if (settings) {
        await updateSettings({ measurement_units: units });
        toast.success('Measurement units updated');
      }
    } catch (error) {
      toast.error('Failed to update measurement units');
    }
  };

  const handleFirstDayChange = async (day: string) => {
    try {
      if (settings) {
        await updateSettings({ first_day_of_week: parseInt(day) });
        toast.success('First day of week updated');
      }
    } catch (error) {
      toast.error('Failed to update first day of week');
    }
  };

  if (!mounted) return null;

  const currentTheme = theme === 'system' ? 'auto' : theme;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display</CardTitle>
        <CardDescription>Customize how the app looks and feels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="flex gap-2">
            <Button
              variant={currentTheme === 'light' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleThemeChange('light')}
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </Button>
            <Button
              variant={currentTheme === 'dark' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </Button>
            <Button
              variant={currentTheme === 'auto' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleThemeChange('auto')}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Auto
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="measurement-units">Measurement Units</Label>
          <Select
            value={settings?.measurement_units || 'metric'}
            onValueChange={(value: 'metric' | 'imperial') => handleMeasurementChange(value)}
          >
            <SelectTrigger id="measurement-units">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metric (kg, cm)</SelectItem>
              <SelectItem value="imperial">Imperial (lb, in)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="first-day">First Day of Week</Label>
          <Select
            value={settings?.first_day_of_week?.toString() || '0'}
            onValueChange={handleFirstDayChange}
          >
            <SelectTrigger id="first-day">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="2">Tuesday</SelectItem>
              <SelectItem value="3">Wednesday</SelectItem>
              <SelectItem value="4">Thursday</SelectItem>
              <SelectItem value="5">Friday</SelectItem>
              <SelectItem value="6">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
