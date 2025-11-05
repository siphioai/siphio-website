import { z } from 'zod';

export interface MacroGoal {
  id: string;
  user_id: string;
  calories_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  date: string; // ISO date string (YYYY-MM-DD)
  created_at: string;
}

export interface FoodItem {
  id: string;
  usda_fdc_id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size_g?: number;
  category?: string;
  last_synced: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  name?: string;
  created_at: string;
  meal_items?: MealItem[]; // Joined data
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_item_id: string;
  food_item?: FoodItem; // Joined data
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  calories_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fat_target?: number;
  has_logged: boolean;
  updated_at: string;
}

export interface MacroProgress {
  current: number;
  target: number;
  percentage: number;
  status: 'under' | 'on-track' | 'over';
}

export interface DailyProgress {
  date: string;
  calories: MacroProgress;
  protein: MacroProgress;
  carbs: MacroProgress;
  fat: MacroProgress;
}

// Calculation result type
export interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Zod validation schemas
export const MacroGoalSchema = z.object({
  calories_target: z.number().int().positive(),
  protein_target: z.number().int().nonnegative(),
  carbs_target: z.number().int().nonnegative(),
  fat_target: z.number().int().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD
});

export const MealItemSchema = z.object({
  food_item_id: z.string().uuid(),
  quantity_g: z.number().positive()
});
