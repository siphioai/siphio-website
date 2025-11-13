/**
 * Food Name Simplification Service
 * Transforms raw USDA names into clean, user-friendly names
 *
 * Examples:
 * "Chicken, broilers or fryers, breast, meat only, cooked, roasted"
 *   → "Chicken Breast (roasted)"
 *
 * "Beef, ground, 93% lean meat / 7% fat, raw"
 *   → "Ground Beef 93/7"
 *
 * "Rice, white, long-grain, cooked"
 *   → "White Rice (cooked)"
 */

import { createClient } from '@supabase/supabase-js';

interface SimplificationRule {
  pattern: RegExp;
  transform: (match: RegExpMatchArray) => string;
  priority: number;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// 50+ transformation rules covering common patterns
const SIMPLIFICATION_RULES: SimplificationRule[] = [
  // Chicken patterns (priority: 10) - Enhanced to catch ALL variations including dark/white meat
  {
    pattern: /chicken(?:,?\s*broilers or fryers)?(?:,?\s*(?:dark|white)\s+meat)?(?:,?\s+meat)?(?:,?\s+meat only)?(?:,?\s*)?(breast|thigh|drumstick|leg|wing|tender)s?,?\s*(?:meat only)?(?:,?\s*and skin)?(?:,?\s*)?(cooked|raw|roasted|grilled|baked|broiled|fried)?/i,
    transform: (m) => {
      const cut = capitalize(m[1]);
      const prep = m[2] ? ` (${m[2]})` : '';
      return `Chicken ${cut}${prep}`;
    },
    priority: 10
  },
  // Generic chicken (priority: 9) - For items without specific cut
  {
    pattern: /^chicken,?\s*(?:broilers or fryers)?(?:,?\s+meat)?(?:,?\s+whole)?(?!.*(?:breast|thigh|drumstick|leg|wing|tender|noodle|soup|broth|stock))/i,
    transform: () => 'Chicken',
    priority: 9
  },

  // Ground meat patterns (priority: 9)
  {
    pattern: /(beef|turkey|chicken|pork),?\s*ground,?\s*(\d+)%?\s*lean(?:\s*meat)?\s*\/?\s*(\d+)%?\s*fat/i,
    transform: (m) => {
      const meat = capitalize(m[1]);
      return `Ground ${meat} ${m[2]}/${m[3]}`;
    },
    priority: 9
  },

  // Beef cut patterns (priority: 9)
  {
    pattern: /beef,?\s*(?:choice|select|prime)?,?\s*(?:top|bottom)?\s*(tenderloin|ribeye|sirloin|strip|t-bone|porterhouse|flank|skirt|brisket|chuck|round)(?:\s+steak|\s+roast)?,?\s*(raw|cooked|grilled|roasted)?/i,
    transform: (m) => {
      const cut = capitalize(m[1]);
      const prep = m[2] ? ` (${m[2]})` : '';
      return `Beef ${cut}${prep}`;
    },
    priority: 9
  },

  // Pork cut patterns (priority: 9)
  {
    pattern: /pork,?\s*(chop|tenderloin|loin|shoulder|ribs?|belly|ham)s?,?\s*(raw|cooked|grilled|roasted|smoked)?/i,
    transform: (m) => {
      const cut = capitalize(m[1]);
      const prep = m[2] ? ` (${m[2]})` : '';
      return `Pork ${cut}${prep}`;
    },
    priority: 9
  },

  // Fish patterns (priority: 8)
  {
    pattern: /(salmon|tuna|tilapia|cod|mahi|trout|halibut|snapper),?\s*(fillet|steak)?,?\s*(cooked|raw|baked|grilled)?/i,
    transform: (m) => {
      const fish = capitalize(m[1]);
      const cut = m[2] ? ` ${capitalize(m[2])}` : '';
      const prep = m[3] ? ` (${m[3]})` : '';
      return `${fish}${cut}${prep}`;
    },
    priority: 8
  },

  // Rice products (priority: 8) - Handle rice-based snacks separately
  {
    pattern: /(?:snacks?,?)?\s*rice\s+(crackers?|cakes?)/i,
    transform: (m) => `Rice ${capitalize(m[1])}`,
    priority: 8
  },

  // Rice patterns - variation 1: "Wild rice, cooked"
  {
    pattern: /^(wild|brown|white|basmati|jasmine|arborio|sushi)\s+rice,?\s*(long-grain|short-grain|medium-grain)?,?\s*(cooked|raw|boiled|steamed)?/i,
    transform: (m) => {
      const type = capitalize(m[1]);
      const prep = m[3] ? ` (${m[3]})` : '';
      return `${type} Rice${prep}`;
    },
    priority: 7
  },

  // Rice patterns - variation 2: "Rice, white, long-grain, cooked"
  {
    pattern: /^rice,?\s+(white|brown|basmati|jasmine|wild|arborio|sushi)(?:\s+rice)?,?\s*(long-grain|short-grain|medium-grain)?,?\s*(cooked|raw|boiled|steamed)?/i,
    transform: (m) => {
      const type = capitalize(m[1]);
      const prep = m[3] ? ` (${m[3]})` : '';
      return `${type} Rice${prep}`;
    },
    priority: 7
  },

  // Pasta patterns (priority: 7)
  {
    pattern: /pasta,?\s*(whole-wheat|enriched)?,?\s*(cooked|dry|uncooked)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) + ' ' : '';
      const prep = m[2] ? ` (${m[2]})` : '';
      return `${type}Pasta${prep}`;
    },
    priority: 7
  },

  // Vegetable patterns (priority: 6)
  {
    pattern: /(broccoli|spinach|kale|carrots|zucchini|asparagus|green beans|cauliflower),?\s*(cooked|raw|steamed|boiled)?/i,
    transform: (m) => {
      const veg = capitalize(m[1]);
      const prep = m[2] ? ` (${m[2]})` : '';
      return `${veg}${prep}`;
    },
    priority: 6
  },

  // Potato patterns (priority: 6)
  {
    pattern: /potatoes?,?\s*(sweet|white|red|russet)?,?\s*(baked|boiled|roasted|mashed)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) + ' ' : '';
      const prep = m[2] ? ` (${m[2]})` : '';
      return `${type}Potato${prep}`;
    },
    priority: 6
  },

  // Eggs (priority: 5)
  {
    pattern: /egg,?\s*whole,?\s*(cooked|raw|boiled|fried|scrambled)?/i,
    transform: (m) => {
      const prep = m[1] ? ` (${m[1]})` : '';
      return `Egg${prep}`;
    },
    priority: 5
  },

  // Yogurt (priority: 4)
  {
    pattern: /yogurt,?\s*(greek|plain)?,?\s*(nonfat|low-fat|whole milk)?/i,
    transform: (m) => {
      const style = m[1] ? capitalize(m[1]) + ' ' : '';
      const fat = m[2] ? ` (${m[2]})` : '';
      return `${style}Yogurt${fat}`;
    },
    priority: 4
  },

  // Milk (priority: 4)
  {
    pattern: /milk,?\s*(whole|skim|1%|2%|nonfat)?,?\s*(cow's?|almond|soy|oat)?/i,
    transform: (m) => {
      const fat = m[1] ? capitalize(m[1]) + ' ' : '';
      const type = m[2] ? capitalize(m[2]) + ' ' : '';
      return `${fat}${type}Milk`;
    },
    priority: 4
  },

  // Cheese (priority: 3)
  {
    pattern: /cheese,?\s*(cheddar|mozzarella|parmesan|feta|swiss|provolone|gouda)?,?\s*(shredded|block|sliced)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) + ' ' : '';
      const form = m[2] ? ` (${m[2]})` : '';
      return `${type}Cheese${form}`;
    },
    priority: 3
  },

  // Bread (priority: 3)
  {
    pattern: /bread,?\s*(white|wheat|whole wheat|rye|sourdough)?,?\s*(sliced|loaf)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) + ' ' : '';
      const form = m[2] ? ` (${m[2]})` : '';
      return `${type}Bread${form}`;
    },
    priority: 3
  },

  // Oats (priority: 3)
  {
    pattern: /oats?,?\s*(rolled|steel-cut|instant)?,?\s*(cooked|dry)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) + ' ' : '';
      const prep = m[2] ? ` (${m[2]})` : '';
      return `${type}Oats${prep}`;
    },
    priority: 3
  },

  // Beans (priority: 3)
  {
    pattern: /beans?,?\s*(black|kidney|pinto|navy|chickpeas|lentils)?,?\s*(cooked|canned|dry)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) + ' ' : '';
      const prep = m[2] ? ` (${m[2]})` : '';
      return `${type}Beans${prep}`;
    },
    priority: 3
  },

  // Nuts (priority: 3)
  {
    pattern: /nuts?,?\s*(almonds?|walnuts?|pecans?|cashews?|peanuts?)?,?\s*(roasted|raw|salted)?/i,
    transform: (m) => {
      const type = m[1] ? capitalize(m[1]) : 'Mixed Nuts';
      const prep = m[2] ? ` (${m[2]})` : '';
      return `${type}${prep}`;
    },
    priority: 3
  },

  // Fruits (priority: 2)
  {
    pattern: /(apple|banana|orange|strawberr(?:y|ies)|blueberr(?:y|ies)|grape|mango|pineapple),?\s*(fresh|frozen|dried)?/i,
    transform: (m) => {
      const fruit = capitalize(m[1]);
      const prep = m[2] ? ` (${m[2]})` : '';
      return `${fruit}${prep}`;
    },
    priority: 2
  },

  // Generic fallback: Remove trailing commas and extra info
  {
    pattern: /^([^,]+),\s*.+$/,
    transform: (m) => m[1].trim(),
    priority: 1
  }
];

export function simplifyFoodName(usdaName: string): string {
  if (!usdaName) return '';

  // Sort rules by priority (highest first)
  const sortedRules = [...SIMPLIFICATION_RULES].sort((a, b) => b.priority - a.priority);

  // Try each rule in order
  for (const rule of sortedRules) {
    const match = usdaName.match(rule.pattern);
    if (match) {
      const simplified = rule.transform(match);
      // Clean up any double spaces or trailing punctuation
      return simplified.replace(/\s+/g, ' ').replace(/[,;]+$/, '').trim();
    }
  }

  // No rule matched, return cleaned original
  return usdaName
    .split(',')[0]  // Take first part before comma
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Batch process all foods in database
 * Run as migration or background job
 */
export async function backfillDisplayNames(supabaseUrl: string, supabaseKey: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: foods, error } = await supabase
    .from('food_items')
    .select('id, name')
    .is('display_name', null);

  if (error) throw error;

  console.log(`Backfilling display names for ${foods.length} foods...`);

  const updates = foods.map(food => ({
    id: food.id,
    display_name: simplifyFoodName(food.name)
  }));

  // Batch update (500 at a time)
  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await supabase.from('food_items').upsert(batch);
    console.log(`Progress: ${i + batch.length}/${updates.length}`);
  }

  console.log('Backfill complete!');
}
