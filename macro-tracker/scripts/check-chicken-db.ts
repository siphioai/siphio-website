import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

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

async function checkChickenVariety() {
  console.log('🔍 Checking chicken variety in database...\n');

  const { data, error } = await supabase
    .from('food_items')
    .select('name, display_name, calories_per_100g')
    .ilike('name', '%chicken%')
    .not('name', 'ilike', '%noodle%')
    .not('name', 'ilike', '%soup%')
    .not('name', 'ilike', '%broth%')
    .order('name')
    .limit(50);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} chicken items\n`);

  const cutCounts = {
    breast: 0,
    thigh: 0,
    wing: 0,
    drumstick: 0,
    leg: 0,
    tender: 0,
    whole: 0,
    other: 0
  };

  data.forEach(item => {
    const name = item.name.toLowerCase();
    if (name.includes('thigh')) cutCounts.thigh++;
    else if (name.includes('wing')) cutCounts.wing++;
    else if (name.includes('drumstick')) cutCounts.drumstick++;
    else if (name.includes('tender')) cutCounts.tender++;
    else if (name.includes('leg') && !name.includes('leghorn')) cutCounts.leg++;
    else if (name.includes('breast')) cutCounts.breast++;
    else if (name.includes('whole')) cutCounts.whole++;
    else cutCounts.other++;
  });

  console.log('📊 Cut distribution:');
  Object.entries(cutCounts).forEach(([cut, count]) => {
    if (count > 0) {
      const emoji = count > 0 ? '✅' : '❌';
      console.log(`  ${emoji} ${cut}: ${count}`);
    }
  });

  console.log('\n📝 Sample chicken items (showing variety):');

  // Show examples of each cut type
  const examples = {
    breast: data.find(i => i.name.toLowerCase().includes('breast')),
    thigh: data.find(i => i.name.toLowerCase().includes('thigh')),
    wing: data.find(i => i.name.toLowerCase().includes('wing')),
    drumstick: data.find(i => i.name.toLowerCase().includes('drumstick')),
    leg: data.find(i => i.name.toLowerCase().includes('leg') && !i.name.toLowerCase().includes('leghorn'))
  };

  Object.entries(examples).forEach(([cut, item]) => {
    if (item) {
      console.log(`\n  ${cut.toUpperCase()}:`);
      console.log(`    Original: "${item.name}"`);
      console.log(`    Display:  "${item.display_name}"`);
      console.log(`    Macros: ${item.calories_per_100g} cal`);
    } else {
      console.log(`\n  ${cut.toUpperCase()}: ❌ NOT FOUND IN DATABASE`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSIS:');

  if (cutCounts.thigh === 0 && cutCounts.wing === 0 && cutCounts.drumstick === 0) {
    console.log('⚠️  PROBLEM IDENTIFIED: Database only contains CHICKEN BREAST items!');
    console.log('   This explains why search only shows "Chicken Breast" results.');
    console.log('\n💡 SOLUTION: You need to import more chicken varieties from USDA.');
    console.log('   The current USDA import might be incomplete or filtered.');
  } else {
    console.log('✅ Database has variety - checking if search/display is working correctly...');
  }
  console.log('='.repeat(80));
}

checkChickenVariety();
