/**
 * Refresh Display Names Script
 * Updates all food items with improved display_name using the fixed simplification rules
 */

import { createClient } from '@supabase/supabase-js';
import { simplifyFoodName } from '../lib/services/food-name-simplifier';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Use SERVICE ROLE key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function refreshDisplayNames() {
  console.log('🔄 Refreshing display names for all food items...\n');

  // Get all food items
  const { data: foods, error: fetchError } = await supabase
    .from('food_items')
    .select('id, name, display_name')
    .order('id');

  if (fetchError) {
    console.error('❌ Error fetching foods:', fetchError);
    return;
  }

  console.log(`📊 Found ${foods.length} food items to process\n`);

  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);

    const updates = batch.map(food => {
      const newDisplayName = simplifyFoodName(food.name);

      // Debug first few chicken items
      if (i === 0 && food.name.toLowerCase().includes('chicken') && food.name.toLowerCase().includes('thigh')) {
        console.log('\n🐛 DEBUG:');
        console.log(`  Name:    "${food.name}"`);
        console.log(`  Old:     "${food.display_name}"`);
        console.log(`  New:     "${newDisplayName}"`);
        console.log(`  Changed: ${newDisplayName !== food.display_name}`);
      }

      // Only update if display name changed
      if (newDisplayName !== food.display_name) {
        return {
          id: food.id,
          display_name: newDisplayName
        };
      }
      return null;
    }).filter(Boolean);

    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('food_items')
        .upsert(updates, { onConflict: 'id' });

      if (updateError) {
        console.error(`  ❌ Error updating batch:`, updateError);
        errors += updates.length;
      } else {
        updated += updates.length;

        // Show sample changes
        if (i === 0 && updates.length > 0) {
          const sample = batch.find(f => f.id === updates[0].id);
          console.log(`  Example change:`);
          console.log(`    Before: "${sample?.display_name}"`);
          console.log(`    After:  "${updates[0].display_name}"\n`);
        }
      }
    }

    unchanged += batch.length - (updates.length || 0);

    // Progress update
    const progress = Math.round(((i + batch.length) / foods.length) * 100);
    process.stdout.write(`\r  Progress: ${progress}% (${i + batch.length}/${foods.length}) `);
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('🎉 REFRESH COMPLETE!');
  console.log('='.repeat(60));
  console.log(`Total foods:     ${foods.length}`);
  console.log(`Updated:         ${updated}`);
  console.log(`Unchanged:       ${unchanged}`);
  console.log(`Errors:          ${errors}`);
  console.log('='.repeat(60));
}

refreshDisplayNames();
