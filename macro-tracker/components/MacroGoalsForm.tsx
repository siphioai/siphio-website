'use client';

import { useState, useEffect } from 'react';
import { useDailyGoals } from '@/lib/hooks/useDailyGoals';
import { getTodayUTC } from '@/lib/utils/date-helpers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Target, Flame, TrendingUp } from 'lucide-react';

export function MacroGoalsForm() {
  const [open, setOpen] = useState(false);
  const { goals, updateGoals } = useDailyGoals();
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // State for macro goals
  const [calories, setCalories] = useState(2000);
  const [proteinPercent, setProteinPercent] = useState(30);
  const [carbsPercent, setCarbsPercent] = useState(40);
  const [fatPercent, setFatPercent] = useState(30);

  // Load existing goals when dialog opens
  useEffect(() => {
    if (open && goals) {
      setCalories(goals.calories_target);

      // Calculate percentages from grams
      const totalCals = goals.calories_target;
      const proteinCals = goals.protein_target * 4;
      const carbsCals = goals.carbs_target * 4;
      const fatCals = goals.fat_target * 9;

      setProteinPercent(Math.round((proteinCals / totalCals) * 100));
      setCarbsPercent(Math.round((carbsCals / totalCals) * 100));
      setFatPercent(Math.round((fatCals / totalCals) * 100));
    }
  }, [open, goals]);

  // Calculate grams from percentages
  const proteinGrams = Math.round((calories * (proteinPercent / 100)) / 4);
  const carbsGrams = Math.round((calories * (carbsPercent / 100)) / 4);
  const fatGrams = Math.round((calories * (fatPercent / 100)) / 9);

  // Calculate calories from macros
  const calculatedCalories = (proteinGrams * 4) + (carbsGrams * 4) + (fatGrams * 9);
  const totalPercent = proteinPercent + carbsPercent + fatPercent;

  const handleProteinChange = (value: number[]) => {
    const newProtein = value[0];
    const remaining = 100 - newProtein;
    const currentNonProtein = carbsPercent + fatPercent;

    if (currentNonProtein > 0) {
      const carbsRatio = carbsPercent / currentNonProtein;
      const fatRatio = fatPercent / currentNonProtein;

      setCarbsPercent(Math.round(remaining * carbsRatio));
      setFatPercent(Math.round(remaining * fatRatio));
    }

    setProteinPercent(newProtein);
  };

  const handleCarbsChange = (value: number[]) => {
    const newCarbs = value[0];
    const remaining = 100 - newCarbs;
    const currentNonCarbs = proteinPercent + fatPercent;

    if (currentNonCarbs > 0) {
      const proteinRatio = proteinPercent / currentNonCarbs;
      const fatRatio = fatPercent / currentNonCarbs;

      setProteinPercent(Math.round(remaining * proteinRatio));
      setFatPercent(Math.round(remaining * fatRatio));
    }

    setCarbsPercent(newCarbs);
  };

  const handleFatChange = (value: number[]) => {
    const newFat = value[0];
    const remaining = 100 - newFat;
    const currentNonFat = proteinPercent + carbsPercent;

    if (currentNonFat > 0) {
      const proteinRatio = proteinPercent / currentNonFat;
      const carbsRatio = carbsPercent / currentNonFat;

      setProteinPercent(Math.round(remaining * proteinRatio));
      setCarbsPercent(Math.round(remaining * carbsRatio));
    }

    setFatPercent(newFat);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateGoals({
        calories_target: calories,
        protein_target: proteinGrams,
        carbs_target: carbsGrams,
        fat_target: fatGrams,
        date: getTodayUTC()
      });

      // Show success message
      setShowSuccess(true);

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setOpen(false);
        setShowSuccess(false);
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving goals:', error);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="lg">
          <Target className="w-4 h-4" />
          Set Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Set Your Daily Macro Goals
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 pt-4">
          {/* Calories Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-chart-1" />
                <label className="text-sm font-semibold">Daily Calories</label>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-chart-1">{calories}</span>
                <span className="text-sm text-muted-foreground ml-1">cal</span>
              </div>
            </div>
            <Slider
              value={[calories]}
              onValueChange={(value) => setCalories(value[0])}
              min={1200}
              max={4000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1200 cal</span>
              <span>4000 cal</span>
            </div>
          </div>

          {/* Macro Split */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Macro Split</h3>
            </div>

            {/* Visual Split Bar */}
            <div className="h-16 rounded-xl overflow-hidden flex shadow-lg border-2 border-border">
              <div
                className="bg-gradient-to-br from-chart-2 to-chart-2/70 flex items-center justify-center text-white font-bold transition-all duration-300"
                style={{ width: `${proteinPercent}%` }}
              >
                {proteinPercent > 15 && `${proteinPercent}%`}
              </div>
              <div
                className="bg-gradient-to-br from-chart-3 to-chart-3/70 flex items-center justify-center text-white font-bold transition-all duration-300"
                style={{ width: `${carbsPercent}%` }}
              >
                {carbsPercent > 15 && `${carbsPercent}%`}
              </div>
              <div
                className="bg-gradient-to-br from-chart-4 to-chart-4/70 flex items-center justify-center text-white font-bold transition-all duration-300"
                style={{ width: `${fatPercent}%` }}
              >
                {fatPercent > 15 && `${fatPercent}%`}
              </div>
            </div>

            {/* Protein Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-chart-2 to-chart-2/70" />
                  <label className="text-sm font-semibold">Protein</label>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-chart-2">{proteinGrams}g</span>
                  <span className="text-sm text-muted-foreground ml-2">({proteinPercent}%)</span>
                </div>
              </div>
              <Slider
                value={[proteinPercent]}
                onValueChange={handleProteinChange}
                min={10}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            {/* Carbs Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-chart-3 to-chart-3/70" />
                  <label className="text-sm font-semibold">Carbs</label>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-chart-3">{carbsGrams}g</span>
                  <span className="text-sm text-muted-foreground ml-2">({carbsPercent}%)</span>
                </div>
              </div>
              <Slider
                value={[carbsPercent]}
                onValueChange={handleCarbsChange}
                min={10}
                max={65}
                step={1}
                className="w-full"
              />
            </div>

            {/* Fat Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-chart-4 to-chart-4/70" />
                  <label className="text-sm font-semibold">Fat</label>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-chart-4">{fatGrams}g</span>
                  <span className="text-sm text-muted-foreground ml-2">({fatPercent}%)</span>
                </div>
              </div>
              <Slider
                value={[fatPercent]}
                onValueChange={handleFatChange}
                min={15}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            {/* Total Check */}
            {totalPercent !== 100 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  ⚠️ Total: {totalPercent}% (should be 100%)
                </p>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="p-4 bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-xl border border-border">
            <h4 className="text-sm font-semibold mb-3">Daily Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-chart-1">{calories}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-chart-2">{proteinGrams}g</div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-chart-3">{carbsGrams}g</div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-chart-4">{fatGrams}g</div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 relative"
              size="lg"
              disabled={totalPercent !== 100 || saving}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : showSuccess ? (
                <>
                  <span className="mr-2">✓</span>
                  Goals Saved!
                </>
              ) : (
                'Save Goals'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
