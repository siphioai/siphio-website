/**
 * TypeScript types for AI Nutrition Coach chat functionality
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    metrics?: Record<string, any>;
    toolUsed?: string;
  };
}

export interface ChatResponse {
  response: string;
  conversation_history: any[];  // Pydantic AI format - preserve exact structure
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  meal_plan?: MealPlan;  // Optional generated meal plan
}

export interface QuickAction {
  label: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Meal Plan Types
export interface Food {
  name: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Food[];
  totals: MacroTotals;
}

export interface MealPlanDay {
  date: string;
  day_name: string;
  meals: Meal[];
  daily_totals: MacroTotals;
}

export interface MealPlan {
  week_start: string;
  daily_target: MacroTotals;
  days: MealPlanDay[];
}
