'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Clock, Search } from 'lucide-react';

interface FoodItem {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface QuickFood extends FoodItem {
  last_quantity_g?: number;
  is_favorite?: boolean;
}

interface QuickAddFoodProps {
  onAddFood: (foodItemId: string, quantity: number) => void;
}

export function QuickAddFood({ onAddFood }: QuickAddFoodProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [favorites, setFavorites] = useState<QuickFood[]>([]);
  const [recents, setRecents] = useState<QuickFood[]>([]);
  const [selectedFood, setSelectedFood] = useState<QuickFood | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'recent'>('search');
  const supabase = createClient();

  useEffect(() => {
    loadFavorites();
    loadRecents();
  }, []);

  const loadFavorites = async () => {
    const { data: user } = await supabase.from('users').select('id').single();
    if (!user) return;

    const { data } = await supabase
      .from('user_favorites')
      .select(`
        food_item_id,
        last_quantity_g,
        food_items (*)
      `)
      .eq('user_id', user.id)
      .order('favorited_at', { ascending: false })
      .limit(10);

    if (data) {
      setFavorites(data.map((fav: any) => ({
        ...fav.food_items,
        last_quantity_g: fav.last_quantity_g,
        is_favorite: true
      })));
    }
  };

  const loadRecents = async () => {
    const { data: user } = await supabase.from('users').select('id').single();
    if (!user) return;

    const { data } = await supabase
      .from('recent_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(10);

    if (data) {
      setRecents(data.map((item: any) => ({
        id: item.food_item_id,
        name: item.name,
        calories_per_100g: item.calories_per_100g,
        protein_per_100g: item.protein_per_100g,
        carbs_per_100g: item.carbs_per_100g,
        fat_per_100g: item.fat_per_100g,
        last_quantity_g: item.last_quantity_g
      })));
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    const response = await fetch(`/api/usda?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    setResults(data.foods || []);
    setSearching(false);
    setActiveTab('search');
  };

  const toggleFavorite = async (foodItemId: string) => {
    const { data: user } = await supabase.from('users').select('id').single();
    if (!user) return;

    const isFavorite = favorites.some(f => f.id === foodItemId);

    if (isFavorite) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('food_item_id', foodItemId);
    } else {
      await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          food_item_id: foodItemId,
          last_quantity_g: Number(quantity) || 100
        });
    }

    loadFavorites();
  };

  const handleQuickAdd = (food: QuickFood) => {
    setSelectedFood(food);
    setQuantity((food.last_quantity_g || 100).toString());
  };

  const handleAdd = async () => {
    if (selectedFood && Number(quantity) > 0) {
      await onAddFood(selectedFood.id, Number(quantity));

      // Update last quantity in favorites if it exists
      if (selectedFood.is_favorite) {
        const { data: user } = await supabase.from('users').select('id').single();
        if (user) {
          await supabase
            .from('user_favorites')
            .update({ last_quantity_g: Number(quantity) })
            .eq('user_id', user.id)
            .eq('food_item_id', selectedFood.id);
        }
      }

      setSelectedFood(null);
      setQuantity('100');
      loadRecents();
    }
  };

  const FoodCard = ({ food, showFavorite = true }: { food: QuickFood; showFavorite?: boolean }) => (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all duration-150 relative group"
      onClick={() => handleQuickAdd(food)}
    >
      {showFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(food.id);
          }}
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <Star
            className={`w-4 h-4 ${food.is_favorite || favorites.some(f => f.id === food.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        </button>
      )}
      <h4 className="font-semibold text-sm mb-1 pr-8">{food.name}</h4>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Per 100g:</span>
        <span className="text-primary font-semibold">{food.calories_per_100g} cal</span>
        <span>P: {food.protein_per_100g}g</span>
        <span>C: {food.carbs_per_100g}g</span>
        <span>F: {food.fat_per_100g}g</span>
      </div>
      {food.last_quantity_g && (
        <p className="text-xs text-muted-foreground mt-1">Last used: {food.last_quantity_g}g</p>
      )}
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search foods (e.g., chicken breast, basmati rice)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={searching || !query.trim()} className="gap-2">
          <Search className="w-4 h-4" />
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
            activeTab === 'search'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Search
          {activeTab === 'search' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
            activeTab === 'favorites'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="w-4 h-4 inline mr-2" />
          Favorites ({favorites.length})
          {activeTab === 'favorites' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
            activeTab === 'recent'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Recent ({recents.length})
          {activeTab === 'recent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activeTab === 'search' && results.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Found {results.length} result{results.length !== 1 ? 's' : ''} - Click to add
            </p>
            {results.map((food) => (
              <FoodCard key={food.id} food={{ ...food, is_favorite: favorites.some(f => f.id === food.id) }} />
            ))}
          </>
        )}

        {activeTab === 'favorites' && (
          favorites.length > 0 ? (
            favorites.map((food) => (
              <FoodCard key={food.id} food={food} showFavorite={false} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No favorites yet</p>
              <p className="text-xs">Click the star icon to add favorites</p>
            </div>
          )
        )}

        {activeTab === 'recent' && (
          recents.length > 0 ? (
            recents.map((food, index) => (
              <FoodCard key={`${food.id}-${index}`} food={{ ...food, is_favorite: favorites.some(f => f.id === food.id) }} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent foods</p>
              <p className="text-xs">Foods you log will appear here</p>
            </div>
          )
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={!!selectedFood} onOpenChange={() => setSelectedFood(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              Add {selectedFood?.name}
              {selectedFood && (
                <button
                  onClick={() => toggleFavorite(selectedFood.id)}
                  className="ml-auto p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${selectedFood.is_favorite || favorites.some(f => f.id === selectedFood.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                  />
                </button>
              )}
            </DialogTitle>
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
