import { searchFoods } from '../lib/api/usda';

(async () => {
  console.log('🔍 Testing search for "chicken"...\n');

  const results = await searchFoods('chicken');

  console.log(`Found ${results.length} results:\n`);

  results.forEach((food, idx) => {
    console.log(`${idx + 1}. ${food.display_name || food.name}`);
    console.log(`   Cal: ${food.calories_per_100g} | P: ${food.protein_per_100g}g | C: ${food.carbs_per_100g}g | F: ${food.fat_per_100g}g`);
    console.log('');
  });
})();
