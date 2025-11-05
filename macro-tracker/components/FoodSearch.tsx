'use client';

import { useState } from 'react';
import { FoodItem } from '@/types/macros';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FoodSearchProps {
  onSelectFood: (food: FoodItem, quantityG: number) => void;
}

export function FoodSearch({ onSelectFood }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    const response = await fetch(`/api/usda?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    setResults(data.foods || []);
    setSearching(false);
  };

  const handleAdd = () => {
    if (selectedFood && Number(quantity) > 0) {
      onSelectFood(selectedFood, Number(quantity));
      setSelectedFood(null);
      setQuantity('100');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search foods (e.g., chicken breast, basmati rice)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={searching || !query.trim()}>
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-2">
            Found {results.length} result{results.length !== 1 ? 's' : ''} - Click to add
          </p>
          {results.map((food) => (
            <Card
              key={food.id}
              className="p-4 cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all duration-150"
              onClick={() => setSelectedFood(food)}
            >
              <h4 className="font-semibold text-sm mb-1">{food.name}</h4>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="font-medium">Per 100g:</span>
                <span className="text-primary font-semibold">{food.calories_per_100g} cal</span>
                <span>P: {food.protein_per_100g}g</span>
                <span>C: {food.carbs_per_100g}g</span>
                <span>F: {food.fat_per_100g}g</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedFood} onOpenChange={() => setSelectedFood(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add {selectedFood?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFood && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Per 100g</p>
                <div className="flex gap-3 text-sm">
                  <span className="font-semibold text-primary">{selectedFood.calories_per_100g} cal</span>
                  <span>P: {selectedFood.protein_per_100g}g</span>
                  <span>C: {selectedFood.carbs_per_100g}g</span>
                  <span>F: {selectedFood.fat_per_100g}g</span>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-semibold mb-2 block">Quantity (grams)</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                placeholder="Enter grams"
                autoFocus
              />
            </div>
            <Button onClick={handleAdd} className="w-full" size="lg" disabled={!Number(quantity) || Number(quantity) <= 0}>
              Add to Meal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
