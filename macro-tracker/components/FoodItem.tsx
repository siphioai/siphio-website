'use client';

import { MealItem } from '@/types/macros';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface FoodItemProps {
  item: MealItem;
  onUpdate: () => void;
}

export function FoodItem({ item, onUpdate }: FoodItemProps) {
  const supabase = createClient();

  const handleDelete = async () => {
    await supabase.from('meal_items').delete().eq('id', item.id);
    onUpdate();
  };

  return (
    <div className="flex justify-between items-start p-3 bg-secondary/30 rounded-lg border border-border/30 hover:border-border transition-colors">
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1">{item.food_item?.name}</h4>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="font-medium">{item.quantity_g}g</span>
          <span className="text-primary font-semibold">{item.calories.toFixed(0)} cal</span>
          <span>P: {item.protein.toFixed(1)}g</span>
          <span>C: {item.carbs.toFixed(1)}g</span>
          <span>F: {item.fat.toFixed(1)}g</span>
        </div>
      </div>
      <Button onClick={handleDelete} variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );
}
