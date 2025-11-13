import { createClient } from '@supabase/supabase-js';
import { simplifyFoodName } from '../lib/services/food-name-simplifier';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// IMPORTANT: Use SERVICE ROLE key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key from .env
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function backfillDisplayNames() {
  console.log('Starting smart backfill with IMPROVED TypeScript simplifier...');
  console.log('This will re-process ALL foods with the fixed patterns.\n');

  // Get ALL foods (re-process everything with improved logic)
  const { data: foods, error } = await supabase
    .from('food_items')
    .select('id, name, display_name');

  if (error) {
    console.error('Error fetching foods:', error);
    return;
  }

  console.log(`Found ${foods.length} foods to update`);

  // Process in batches of 100 for better performance
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);

    // Show examples first
    if (i === 0) {
      console.log('\nExample transformations:');
      batch.slice(0, 5).forEach(food => {
        const simplified = simplifyFoodName(food.name);
        console.log(`  "${food.name}" → "${simplified}"`);
      });
      console.log('');
    }

    // Update each food individually for better error handling
    for (const food of batch) {
      const simplified = simplifyFoodName(food.name);

      const { error: updateError } = await supabase
        .from('food_items')
        .update({ display_name: simplified })
        .eq('id', food.id);

      if (updateError) {
        console.error(`Error updating ${food.name}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log(`Progress: ${successCount}/${foods.length} (${Math.round(successCount/foods.length*100)}%)`);
  }

  console.log(`\n✅ Backfill complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);

  // Refresh materialized view
  console.log('\n🔄 Refreshing materialized view...');
  const { error: refreshError } = await supabase.rpc('refresh_smart_suggestions');

  if (refreshError) {
    console.error('Error refreshing view:', refreshError);
  } else {
    console.log('✅ Materialized view refreshed!');
  }
}

backfillDisplayNames();
