import { createClient } from '@supabase/supabase-js';
import { simplifyFoodName } from '../lib/services/food-name-simplifier';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function backfillDisplayNames() {
  console.log('Starting backfill of display names...');

  const { data: foods, error } = await supabase
    .from('food_items')
    .select('id, name')
    .is('display_name', null);

  if (error) {
    console.error('Error fetching foods:', error);
    return;
  }

  console.log(`Found ${foods.length} foods without display names`);

  const updates = foods.map(food => ({
    id: food.id,
    display_name: simplifyFoodName(food.name)
  }));

  // Batch update (500 at a time)
  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const { error: updateError } = await supabase
      .from('food_items')
      .upsert(batch);

    if (updateError) {
      console.error(`Error updating batch ${i / batchSize + 1}:`, updateError);
    } else {
      console.log(`Progress: ${i + batch.length}/${updates.length}`);
    }
  }

  console.log('Backfill complete!');
}

backfillDisplayNames();
