'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { SmartQuantityHint } from '@/components/SmartQuantityHint';

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
  typical_quantity_g?: number;
  is_favorite?: boolean;
  log_count?: number;
  smart_score?: number;
}

interface QuickAddFoodProps {
  onAddFood: (foodItemId: string, quantity: number) => void;
}

export function QuickAddFood({ onAddFood }: QuickAddFoodProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<QuickFood[]>([]);
  const [favorites, setFavorites] = useState<QuickFood[]>([]);
  const [recents, setRecents] = useState<QuickFood[]>([]);
  const [selectedFood, setSelectedFood] = useState<QuickFood | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'recent'>('search');
  const supabase = createClient();

  useEffect(() => {
    loadSmartSuggestions();
    loadFavorites();
    loadRecents();
  }, []);

  // Real-time search as user types (debounced)
  useEffect(() => {
    if (!query.trim()) {
      // Show smart suggestions when empty
      setResults(smartSuggestions || []);
      setSearching(false);
      return;
    }

    // Show searching indicator immediately
    setSearching(true);

    // Debounce search by 400ms for smoother experience
    const timer = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(timer);
  }, [query, smartSuggestions]);

  const loadSmartSuggestions = async () => {
    try {
      const response = await fetch('/api/food-search/smart-suggestions');
      const data = await response.json();
      setSmartSuggestions(data.suggestions || []);

      // Auto-populate search results with smart suggestions
      if (activeTab === 'search' && !query) {
        setResults(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      let userId: string | null = null;

      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', authUser.id)
          .single();
        userId = userData?.id || null;
      } else {
        const { data: defaultUser } = await supabase
          .from('users')
          .select('id')
          .limit(1)
          .single();
        userId = defaultUser?.id || null;
      }

      if (!userId) return;

      const { data } = await supabase
        .from('user_favorites')
        .select(`
          food_item_id,
          last_quantity_g,
          food_items (*)
        `)
        .eq('user_id', userId)
        .order('favorited_at', { ascending: false })
        .limit(10);

      if (data) {
        setFavorites(data.map((fav: any) => ({
          ...fav.food_items,
          last_quantity_g: fav.last_quantity_g,
          is_favorite: true
        })));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadRecents = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      let userId: string | null = null;

      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', authUser.id)
          .single();
        userId = userData?.id || null;
      } else {
        const { data: defaultUser } = await supabase
          .from('users')
          .select('id')
          .limit(1)
          .single();
        userId = defaultUser?.id || null;
      }

      if (!userId) return;

      const { data } = await supabase
        .from('recent_foods')
        .select('*')
        .eq('user_id', userId)
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
    } catch (error) {
      console.error('Error loading recents:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      // Show smart suggestions when empty
      setResults(smartSuggestions || []);
      return;
    }

    setSearching(true);

    try {
      // Use unified search API (Postgres FTS + branded foods)
      const response = await fetch(`/api/food-search/unified?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.foods || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const triggerConfetti = (element: HTMLElement) => {
    // Get button position
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    // Fire confetti burst from the star button position
    confetti({
      particleCount: 40,
      angle: 90,
      spread: 360,
      origin: { x, y },
      colors: ['#FFD700', '#FFA500', '#FFFF00', '#FFE4B5'],
      startVelocity: 25,
      gravity: 0.8,
      drift: 0,
      ticks: 200,
      zIndex: 9999,
      disableForReducedMotion: false
    });
  };

  const toggleFavorite = async (foodItemId: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    // Check if already favorited first
    const isFavorite = favorites.some(f => f.id === foodItemId);

    // Trigger confetti immediately when adding to favorites (not when removing)
    if (!isFavorite && event?.currentTarget) {
      triggerConfetti(event.currentTarget);
    }

    try {
      // Try to get authenticated user first
      const { data: { user: authUser } } = await supabase.auth.getUser();

      let userId: string;

      if (authUser) {
        // Multi-user mode: lookup user by auth_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', authUser.id)
          .single();

        if (userError || !userData) {
          console.error('User lookup error:', userError);
          toast.error('Please log in to save favorites');
          return;
        }
        userId = userData.id;
      } else {
        // Single-user mode: get the default user
        const { data: defaultUser, error: defaultUserError } = await supabase
          .from('users')
          .select('id')
          .limit(1)
          .single();

        if (defaultUserError || !defaultUser) {
          console.error('No user found:', defaultUserError);
          toast.error('No user profile found');
          return;
        }
        userId = defaultUser.id;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('food_item_id', foodItemId);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            food_item_id: foodItemId,
            last_quantity_g: Number(quantity) || 100
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        toast.success('Added to favorites! ⭐');
      }

      await loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleQuickAdd = (food: QuickFood) => {
    // Smart quantity: Get user's typical amount
    const smartQty = food.typical_quantity_g || food.last_quantity_g || 100;

    setSelectedFood(food);
    setQuantity(smartQty.toString());
  };

  const handleAdd = async () => {
    if (selectedFood && Number(quantity) > 0) {
      await onAddFood(selectedFood.id, Number(quantity));

      // Update last quantity in favorites if it exists
      if (selectedFood.is_favorite) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: userData } = await supabase
              .from('users')
              .select('id')
              .eq('auth_id', authUser.id)
              .single();

            if (userData) {
              await supabase
                .from('user_favorites')
                .update({ last_quantity_g: Number(quantity) })
                .eq('user_id', userData.id)
                .eq('food_item_id', selectedFood.id);
            }
          }
        } catch (error) {
          console.error('Error updating favorite quantity:', error);
        }
      }

      setSelectedFood(null);
      setQuantity('100');
      loadRecents();
    }
  };

  const FoodCard = ({ food, showFavorite = true }: { food: QuickFood; showFavorite?: boolean }) => {
    // Prefer display_name over name for cleaner UI
    const displayName = (food as any).display_name || food.name;

    return (
      <Card
        className="p-4 cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all duration-150 relative group"
        onClick={() => handleQuickAdd(food)}
      >
        {showFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(food.id, e);
            }}
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <Star
              className={`w-4 h-4 ${food.is_favorite || favorites.some(f => f.id === food.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
            />
          </button>
        )}
        <h4 className="font-semibold text-sm mb-1 pr-8">{displayName}</h4>
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
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Start typing to search... (e.g., chicken, rice)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
          autoFocus
        />
        <Button onClick={handleSearch} disabled={searching} className="gap-2">
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
          <div key="search-results">
            <p className="text-xs text-muted-foreground mb-2">
              Found {results.length} result{results.length !== 1 ? 's' : ''} - Click to add
            </p>
            {results.map((food) => (
              <FoodCard key={food.id} food={{ ...food, is_favorite: favorites.some(f => f.id === food.id) }} />
            ))}
          </div>
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
                  onClick={(e) => toggleFavorite(selectedFood.id, e)}
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
              {selectedFood && (selectedFood.typical_quantity_g || selectedFood.last_quantity_g) && (
                <SmartQuantityHint
                  quantity={selectedFood.typical_quantity_g || selectedFood.last_quantity_g || 100}
                  source={selectedFood.is_favorite ? 'favorite' : 'last_used'}
                  logCount={selectedFood.log_count}
                />
              )}
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
