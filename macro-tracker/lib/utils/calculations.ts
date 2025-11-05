import { FoodItem, MacroValues, MacroProgress } from '@/types/macros';

// CRITICAL: Formula = (quantity_grams * nutrient_per_100g) / 100
export function calculateMacros(food: FoodItem, quantityG: number): MacroValues {
  const factor = quantityG / 100;

  return {
    calories: Number((food.calories_per_100g * factor).toFixed(2)),
    protein: Number((food.protein_per_100g * factor).toFixed(2)),
    carbs: Number((food.carbs_per_100g * factor).toFixed(2)),
    fat: Number((food.fat_per_100g * factor).toFixed(2))
  };
}

export function calculateProgress(current: number, target: number): MacroProgress {
  const percentage = target > 0 ? (current / target) * 100 : 0;

  let status: 'under' | 'on-track' | 'over';
  if (percentage < 90) status = 'under';
  else if (percentage <= 110) status = 'on-track';
  else status = 'over';

  return {
    current: Number(current.toFixed(2)),
    target: Number(target.toFixed(2)),
    percentage: Number(percentage.toFixed(1)),
    status
  };
}
