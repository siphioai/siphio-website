'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MealPlanCalendar } from '@/components/MealPlanCalendar';
import { MealPlan } from '@/types/chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, Calendar, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Extended MealPlan type with database metadata
interface MealPlanWithMetadata extends MealPlan {
  id: string;
  created_at: string;
}

export default function MealPlansPage() {
  const [mealPlans, setMealPlans] = useState<MealPlanWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchMealPlans();

    // Set up real-time subscription for meal plan updates
    const channel = supabase
      .channel('meal-plans-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'meal_plans',
        },
        (payload) => {
          console.log('Meal plan change detected:', payload);
          // Refetch meal plans when any change is detected
          fetchMealPlans();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMealPlans() {
    try {
      setLoading(true);
      setError(null);

      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Please sign in to view your meal plans');
        return;
      }

      // Look up the user_id from the users table (not the auth_id)
      const { data: userData, error: userLookupError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userLookupError || !userData) {
        console.error('Error looking up user:', userLookupError);
        setError('Failed to load user data');
        return;
      }

      const userId = (userData as { id: string }).id;
      console.log('Auth ID:', user.id);
      console.log('User ID:', userId);

      // Fetch meal plans from database using the correct user_id
      const { data, error: fetchError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('Fetching meal plans for user:', userId);
      console.log('Raw database response:', data);
      console.log('Fetch error:', fetchError);

      if (fetchError) {
        console.error('Error fetching meal plans:', fetchError);
        setError('Failed to load meal plans');
        return;
      }

      if (data) {
        // Transform database rows to MealPlan format
        // Database has: { id, user_id, week_start_date, plan_data: MealPlan, created_at }
        // We need to extract plan_data and add metadata
        const transformedPlans = data.map((row: any) => ({
          ...row.plan_data,  // Extract the actual meal plan from JSONB
          id: row.id,         // Add database ID
          created_at: row.created_at,  // Add creation timestamp
          week_start: row.plan_data.week_start || row.week_start_date  // Ensure week_start exists
        }));
        setMealPlans(transformedPlans);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <div className="h-10 w-64 mb-2 bg-muted animate-pulse rounded" />
          <div className="h-6 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-96 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Meal Plans</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchMealPlans} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Meal Plans
          </h1>
          <p className="text-muted-foreground">
            Your AI-generated personalized meal plans
          </p>
        </div>

        <Card className="border-dashed border-2">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>No Meal Plans Yet</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Get started by asking the AI Nutrition Coach to create a personalized 7-day meal plan for you!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <Button onClick={() => router.push('/')}>
              <Plus className="w-4 h-4 mr-2" />
              Generate Your First Meal Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Your Meal Plans
        </h1>
        <p className="text-muted-foreground">
          AI-generated personalized meal plans tailored to your macro targets
        </p>
      </div>

      {/* Meal Plans List */}
      <div className="space-y-6 mb-8">
        {mealPlans.map((plan) => (
          <div key={plan.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Week of {new Date(plan.week_start).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h2>
              <div className="text-sm text-muted-foreground">
                Created {new Date(plan.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <MealPlanCalendar mealPlan={plan} />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center gap-4">
        <Button onClick={fetchMealPlans} variant="outline" size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={() => router.push('/')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Generate New Meal Plan
        </Button>
      </div>
    </div>
  );
}
