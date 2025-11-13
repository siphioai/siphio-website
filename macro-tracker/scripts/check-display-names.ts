import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDisplayNames() {
  const { data, error } = await supabase
    .from('food_items')
    .select('name, display_name')
    .ilike('name', '%chicken%')
    .ilike('name', '%thigh%')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n🔍 Chicken Thigh display names in database:\n');
  data.forEach(food => {
    console.log(`Name:         "${food.name}"`);
    console.log(`Display name: "${food.display_name}"`);
    console.log('');
  });
}

checkDisplayNames();
