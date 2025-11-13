/**
 * =====================================================
 * FOOD SEARCH COMPONENT (HYBRID VERSION)
 * =====================================================
 * Enhanced food search using the new hybrid search system
 * Features:
 * - Fast curated food search
 * - USDA fallback for rare foods
 * - Clean, semantic food names
 * - Analytics tracking
 * - Better result display with variation details
 */

'use client';

import { useState, useEffect } from 'react';
import { FoodItem } from '@/types/macros';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Database, Clock } from 'lucide-react';

interface FoodSearchResult {
  id?: string;
  fdc_id?: number;
  name: string;
  display_name: string;
  category: string;
  subcategory?: string;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories_per_100g: number;
  fiber_per_100g?: number;
  variation_type?: string;
  preparation?: string;
  modifiers?: string[];
  serving_sizes?: Array<{
    unit: string;
    grams: number;
    display: string;
  }>;
  source: 'curated' | 'usda';
  relevance_score?: number;
  verified?: boolean;
}

interface SearchResponse {
  success: boolean;
  foods: FoodSearchResult[];
  total: number;
  source: 'curated' | 'usda' | 'hybrid';
  curated_count: number;
  usda_count: number;
  search_duration_ms: number;
}

interface FoodSearchProps {
  onSelectFood: (food: FoodItem, quantityG: number) => void;
  userId?: string;
}

export function FoodSearchHybrid({ onSelectFood, userId }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [selectedUnit, setSelectedUnit] = useState<string>('g');
  const [searching, setSearching] = useState(false);
  const [searchMeta, setSearchMeta] = useState<{
    duration: number;
    source: string;
    curatedCount: number;
    usdaCount: number;
  } | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setSearchMeta(null);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim() || query.length < 2) return;

    setSearching(true);

    try {
      const response = await fetch('/api/food-search/hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit: 20,
          includeUSDA: true,
          userId: userId,
        }),
      });

      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(data.foods);
        setSearchMeta({
          duration: data.search_duration_ms,
          source: data.source,
          curatedCount: data.curated_count,
          usdaCount: data.usda_count,
        });
      } else {
        console.error('Search failed:', data);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = async (food: FoodSearchResult, position: number) => {
    setSelectedFood(food);

    // Track selection for analytics
    try {
      await fetch('/api/food/track-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          userId: userId,
          foodId: food.id,
          fdcId: food.fdc_id,
          position: position + 1, // 1-indexed
        }),
      });
    } catch (error) {
      console.error('Failed to track selection:', error);
    }
  };

  const handleAdd = () => {
    if (!selectedFood || Number(quantity) <= 0) return;

    // Convert to FoodItem format
    const foodItem: FoodItem = {
      id: selectedFood.id || selectedFood.fdc_id?.toString() || '',
      name: selectedFood.name,
      display_name: selectedFood.display_name,
      calories_per_100g: selectedFood.calories_per_100g,
      protein_per_100g: selectedFood.protein_per_100g,
      carbs_per_100g: selectedFood.carbs_per_100g,
      fat_per_100g: selectedFood.fat_per_100g,
    };

    // Convert quantity to grams if using a serving size
    let quantityInGrams = Number(quantity);
    if (selectedUnit !== 'g' && selectedFood.serving_sizes) {
      const servingSize = selectedFood.serving_sizes.find((s) => s.unit === selectedUnit);
      if (servingSize) {
        quantityInGrams = servingSize.grams * Number(quantity);
      }
    }

    onSelectFood(foodItem, quantityInGrams);
    setSelectedFood(null);
    setQuantity('100');
    setSelectedUnit('g');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      protein_meat: 'bg-red-500/10 text-red-700 border-red-200',
      protein_fish: 'bg-blue-500/10 text-blue-700 border-blue-200',
      protein_eggs_dairy: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      vegetables: 'bg-green-500/10 text-green-700 border-green-200',
      fruits: 'bg-purple-500/10 text-purple-700 border-purple-200',
      grains: 'bg-amber-500/10 text-amber-700 border-amber-200',
      legumes: 'bg-orange-500/10 text-orange-700 border-orange-200',
      nuts_seeds: 'bg-brown-500/10 text-brown-700 border-brown-200',
      oils_fats: 'bg-yellow-600/10 text-yellow-800 border-yellow-300',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search foods (e.g., chicken breast, salmon, rice)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Search Metadata */}
      {searchMeta && results.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{searchMeta.duration}ms</span>
          </div>
          {searchMeta.curatedCount > 0 && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{searchMeta.curatedCount} curated</span>
            </div>
          )}
          {searchMeta.usdaCount > 0 && (
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>{searchMeta.usdaCount} from USDA</span>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-2">
            Found {results.length} result{results.length !== 1 ? 's' : ''} - Click to add
          </p>
          {results.map((food, index) => (
            <Card
              key={food.id || food.fdc_id || index}
              className="p-4 cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all duration-150"
              onClick={() => handleSelectFood(food, index)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm flex-1">{food.display_name}</h4>
                <div className="flex items-center gap-1">
                  {food.source === 'curated' && food.verified && (
                    <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(food.category)}`}>
                    {food.category.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Variation Details */}
              {(food.preparation || food.modifiers) && (
                <div className="flex gap-2 mb-2 text-xs text-muted-foreground">
                  {food.preparation && <span>• {food.preparation}</span>}
                  {food.modifiers && food.modifiers.length > 0 && (
                    <span>• {food.modifiers.join(', ')}</span>
                  )}
                </div>
              )}

              {/* Macros */}
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="font-medium">Per 100g:</span>
                <span className="text-primary font-semibold">{food.calories_per_100g} cal</span>
                <span>P: {food.protein_per_100g}g</span>
                <span>C: {food.carbs_per_100g}g</span>
                <span>F: {food.fat_per_100g}g</span>
                {food.fiber_per_100g !== undefined && food.fiber_per_100g > 0 && (
                  <span>Fiber: {food.fiber_per_100g}g</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {query.length >= 2 && !searching && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No foods found for "{query}"</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}

      {/* Loading State */}
      {searching && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Searching...</p>
        </div>
      )}

      {/* Add Food Dialog */}
      <Dialog open={!!selectedFood} onOpenChange={() => setSelectedFood(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add {selectedFood?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFood && (
              <>
                {/* Nutrition Info */}
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Per 100g</p>
                  <div className="flex gap-3 text-sm">
                    <span className="font-semibold text-primary">
                      {selectedFood.calories_per_100g} cal
                    </span>
                    <span>P: {selectedFood.protein_per_100g}g</span>
                    <span>C: {selectedFood.carbs_per_100g}g</span>
                    <span>F: {selectedFood.fat_per_100g}g</span>
                  </div>
                </div>

                {/* Serving Sizes (if available) */}
                {selectedFood.serving_sizes && selectedFood.serving_sizes.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Serving Size</label>
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="g">Grams</option>
                      {selectedFood.serving_sizes.map((serving) => (
                        <option key={serving.unit} value={serving.unit}>
                          {serving.display} ({serving.grams}g)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Quantity Input */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Quantity ({selectedUnit === 'g' ? 'grams' : selectedUnit})
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    step={selectedUnit === 'g' ? '1' : '0.5'}
                    placeholder={`Enter ${selectedUnit === 'g' ? 'grams' : 'quantity'}`}
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleAdd}
                  className="w-full"
                  size="lg"
                  disabled={!Number(quantity) || Number(quantity) <= 0}
                >
                  Add to Meal
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
