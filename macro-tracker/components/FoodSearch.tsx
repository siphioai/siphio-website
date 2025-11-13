'use client';

import { useState, useEffect } from 'react';
import { FoodItem } from '@/types/macros';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Package } from 'lucide-react';

interface FoodSearchProps {
  onSelectFood: (food: FoodItem, quantityG: number) => void;
  userId?: string;
}

export function FoodSearch({ onSelectFood, userId }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [searching, setSearching] = useState(false);

  // Live Search with debouncing
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      handleSearch();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim() || query.length < 2) return;

    try {
      const response = await fetch('/api/food-search/hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit: 20,
          userId: userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.foods || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = () => {
    if (selectedFood && Number(quantity) > 0) {
      // Convert hybrid API response to FoodItem format
      const foodItem: FoodItem = {
        id: selectedFood.id || selectedFood.fdc_id?.toString() || '',
        name: selectedFood.name || selectedFood.display_name || '',
        display_name: selectedFood.display_name || selectedFood.name || '',
        calories_per_100g: selectedFood.calories_per_100g || 0,
        protein_per_100g: selectedFood.protein_per_100g || 0,
        carbs_per_100g: selectedFood.carbs_per_100g || 0,
        fat_per_100g: selectedFood.fat_per_100g || 0,
        fiber_per_100g: selectedFood.fiber_per_100g || 0,
      };

      onSelectFood(foodItem, Number(quantity));

      // Track selection analytics if userId is provided
      if (userId && selectedFood.id) {
        fetch('/api/food/track-selection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query.trim(),
            foodId: selectedFood.id,
            position: results.findIndex(r => r.id === selectedFood.id) + 1,
          }),
        }).catch(err => console.error('Failed to track selection:', err));
      }

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
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <Search className="h-3 w-3" />
            Found {results.length} result{results.length !== 1 ? 's' : ''} - Click to add
          </p>
          {results.map((food) => (
            <Card
              key={food.id || food.fdc_id}
              className="p-4 cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all duration-150"
              onClick={() => setSelectedFood(food)}
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-sm">{food.display_name || food.name}</h4>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Edamam
                  </Badge>
                  {food.brand && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {food.brand}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="font-medium">Per 100g:</span>
                <span className="text-primary font-semibold">{food.calories_per_100g} cal</span>
                <span>P: {food.protein_per_100g}g</span>
                <span>C: {food.carbs_per_100g}g</span>
                <span>F: {food.fat_per_100g}g</span>
              </div>
              {food.variation_type && (
                <p className="text-xs text-muted-foreground mt-1">
                  {food.variation_type} • {food.preparation || 'raw'}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedFood} onOpenChange={() => setSelectedFood(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add {selectedFood?.display_name || selectedFood?.name}</DialogTitle>
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
