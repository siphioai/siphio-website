'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Target, Flame, Apple, ChevronLeft, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Step = 'welcome' | 'goals';

interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState<MacroGoals>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });

  const handleSaveGoals = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Auth error:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }

      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('Authenticated user:', user.id);

      // Get the user's profile to get their user_id
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error(`Profile not found: ${profileError.message}. Your profile may still be creating. Please wait a moment and try again.`);
      }

      if (!profile) {
        throw new Error('Profile not found. Please try signing out and signing in again.');
      }

      console.log('User profile:', profile.id);

      // Update or insert macro goals for today
      const todayDate = new Date().toISOString().split('T')[0];
      console.log('Saving goals for date:', todayDate);

      const { data: goalData, error: goalsError } = await supabase
        .from('macro_goals')
        .upsert({
          user_id: profile.id,
          date: todayDate,
          calories_target: goals.calories,
          protein_target: goals.protein,
          carbs_target: goals.carbs,
          fat_target: goals.fat,
        }, {
          onConflict: 'user_id,date'
        })
        .select();

      if (goalsError) {
        console.error('Goals save error:', goalsError);
        throw new Error(`Failed to save goals: ${goalsError.message}`);
      }

      console.log('Goals saved successfully:', goalData);

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      console.error('Error saving goals:', error);
      alert(error.message || 'Failed to save goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMacroCalories = (protein: number, carbs: number, fat: number) => {
    return (protein * 4) + (carbs * 4) + (fat * 9);
  };

  const updateCaloriesFromMacros = (newProtein: number, newCarbs: number, newFat: number) => {
    const calculatedCalories = calculateMacroCalories(newProtein, newCarbs, newFat);
    setGoals({
      calories: calculatedCalories,
      protein: newProtein,
      carbs: newCarbs,
      fat: newFat,
    });
  };

  return (
    <div className="w-full max-w-2xl">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-8 md:p-12 shadow-2xl border-2">
              <div className="text-center space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <div>
                  <h1 className="text-4xl font-bold mb-3">
                    Welcome to{' '}
                    <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                      Macro Tracker
                    </span>
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Let's set up your personalized macro goals to get started!
                  </p>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Custom Goals</p>
                  </div>
                  <div className="p-4 rounded-xl bg-chart-2/5 border border-chart-2/20">
                    <Flame className="w-8 h-8 mx-auto mb-2 text-chart-2" />
                    <p className="text-sm font-medium">Track Progress</p>
                  </div>
                  <div className="p-4 rounded-xl bg-chart-3/5 border border-chart-3/20">
                    <Apple className="w-8 h-8 mx-auto mb-2 text-chart-3" />
                    <p className="text-sm font-medium">AI Insights</p>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  size="lg"
                  onClick={() => setStep('goals')}
                  className="w-full text-lg py-6 mt-6 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300"
                >
                  Set My Goals
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-8 md:p-12 shadow-2xl border-2">
              {/* Back button */}
              <button
                onClick={() => setStep('welcome')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Set Your Daily Goals</h2>
                  <p className="text-muted-foreground">
                    Customize your macro targets. You can change these anytime!
                  </p>
                </div>

                {/* Calories Display */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-chart-2/5 border-2 border-primary/30">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Daily Calories</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                        {goals.calories}
                      </span>
                      <span className="text-xl text-muted-foreground">cal</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Auto-calculated from macros below
                    </p>
                  </div>
                </div>

                {/* Macro Inputs */}
                <div className="space-y-4">
                  {/* Protein */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-chart-2"></span>
                        Protein (g)
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {goals.protein * 4} cal
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="50"
                        max="300"
                        step="5"
                        value={goals.protein}
                        onChange={(e) => updateCaloriesFromMacros(
                          parseInt(e.target.value),
                          goals.carbs,
                          goals.fat
                        )}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-chart-2"
                      />
                      <input
                        type="number"
                        value={goals.protein}
                        onChange={(e) => updateCaloriesFromMacros(
                          parseInt(e.target.value) || 0,
                          goals.carbs,
                          goals.fat
                        )}
                        className="w-20 px-3 py-2 rounded-lg border-2 border-border bg-background focus:border-chart-2 focus:ring-2 focus:ring-chart-2/20 outline-none text-center"
                      />
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-chart-3"></span>
                        Carbs (g)
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {goals.carbs * 4} cal
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="50"
                        max="400"
                        step="5"
                        value={goals.carbs}
                        onChange={(e) => updateCaloriesFromMacros(
                          goals.protein,
                          parseInt(e.target.value),
                          goals.fat
                        )}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-chart-3"
                      />
                      <input
                        type="number"
                        value={goals.carbs}
                        onChange={(e) => updateCaloriesFromMacros(
                          goals.protein,
                          parseInt(e.target.value) || 0,
                          goals.fat
                        )}
                        className="w-20 px-3 py-2 rounded-lg border-2 border-border bg-background focus:border-chart-3 focus:ring-2 focus:ring-chart-3/20 outline-none text-center"
                      />
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-chart-4"></span>
                        Fat (g)
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {goals.fat * 9} cal
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="30"
                        max="150"
                        step="5"
                        value={goals.fat}
                        onChange={(e) => updateCaloriesFromMacros(
                          goals.protein,
                          goals.carbs,
                          parseInt(e.target.value)
                        )}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-chart-4"
                      />
                      <input
                        type="number"
                        value={goals.fat}
                        onChange={(e) => updateCaloriesFromMacros(
                          goals.protein,
                          goals.carbs,
                          parseInt(e.target.value) || 0
                        )}
                        className="w-20 px-3 py-2 rounded-lg border-2 border-border bg-background focus:border-chart-4 focus:ring-2 focus:ring-chart-4/20 outline-none text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">
                    <strong>💡 Tip:</strong> Not sure what to set? The default values are a good starting point for most people. You can always adjust them later in settings.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  size="lg"
                  onClick={handleSaveGoals}
                  disabled={isLoading}
                  className="w-full text-lg py-6 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Start Tracking
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
