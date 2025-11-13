/**
 * =====================================================
 * SMART FOOD NAME PARSER
 * =====================================================
 * Intelligently parses USDA food descriptions into
 * meaningful, human-readable components
 */

export interface ParsedFoodName {
  baseName: string;
  cut?: string;
  preparation?: string;
  modifiers: string[];
  brand?: string;
  raw: string;
}

export interface FoodNameComponents {
  // Core identification
  baseName: string; // "chicken", "salmon", "rice"
  foodType: string; // "poultry", "fish", "grain"

  // Variations
  cut?: string; // "breast", "thigh", "fillet"
  preparation?: string; // "cooked", "grilled", "raw"

  // Modifiers
  skin?: 'with' | 'without' | null;
  bone?: 'with' | 'without' | null;
  origin?: string; // "atlantic", "wild", "organic"

  // Additional details
  modifiers: string[];
  brand?: string;

  // Original
  originalDescription: string;
}

// =====================================================
// LOOKUP TABLES
// =====================================================

const CUTS: Record<string, string> = {
  BREAST: 'Breast',
  THIGH: 'Thigh',
  WING: 'Wings',
  DRUMSTICK: 'Drumstick',
  LEG: 'Leg',
  WHOLE: 'Whole',
  GROUND: 'Ground',
  TENDERLOIN: 'Tenderloin',
  FILLET: 'Fillet',
  FILET: 'Fillet',
  STEAK: 'Steak',
  LOIN: 'Loin',
  SHOULDER: 'Shoulder',
  RIBS: 'Ribs',
  SHANK: 'Shank',
  FLANK: 'Flank',
  SIRLOIN: 'Sirloin',
  CHUCK: 'Chuck',
  ROUND: 'Round',
  BRISKET: 'Brisket',
};

const PREPARATIONS: Record<string, string> = {
  RAW: 'Raw',
  CKD: 'Cooked',
  COOKED: 'Cooked',
  RSTD: 'Roasted',
  ROASTED: 'Roasted',
  GRLD: 'Grilled',
  GRILLED: 'Grilled',
  BKD: 'Baked',
  BAKED: 'Baked',
  FRIED: 'Fried',
  'DEEP-FRIED': 'Deep-Fried',
  STWD: 'Stewed',
  STEWED: 'Stewed',
  BRSD: 'Braised',
  BRAISED: 'Braised',
  SMOKED: 'Smoked',
  STEAMED: 'Steamed',
  BOILED: 'Boiled',
  BROILED: 'Broiled',
  'PAN-FRIED': 'Pan-Fried',
  SAUTEED: 'Sautéed',
  POACHED: 'Poached',
  ROTISSERIE: 'Rotisserie',
};

const SKIN_MODIFIERS = {
  WITH_SKIN: ['WITH SKIN', 'SKIN ON', 'W/ SKIN'],
  WITHOUT_SKIN: ['WITHOUT SKIN', 'SKIN REMOVED', 'SKINLESS', 'W/O SKIN', 'NO SKIN'],
};

const BONE_MODIFIERS = {
  WITH_BONE: ['WITH BONE', 'BONE-IN', 'BONE IN'],
  WITHOUT_BONE: ['BONELESS', 'WITHOUT BONE', 'NO BONE'],
};

// Fish origins
const FISH_ORIGINS = [
  'ATLANTIC',
  'PACIFIC',
  'WILD',
  'FARMED',
  'SOCKEYE',
  'CHINOOK',
  'COHO',
  'PINK',
  'CHUM',
  'ALASKAN',
  'NORWEGIAN',
];

// Meat origins
const MEAT_ORIGINS = ['GRASS-FED', 'GRAIN-FED', 'ORGANIC', 'FREE-RANGE', 'PASTURE-RAISED'];

// =====================================================
// PARSING FUNCTIONS
// =====================================================

/**
 * Parse USDA food description into components
 */
export function parseUSDADescription(description: string): ParsedFoodName {
  const upper = description.toUpperCase();
  const parts = upper.split(',').map((p) => p.trim());

  // Base name is usually the first part
  let baseName = parts[0]?.toLowerCase() || '';

  // Clean up common USDA prefixes
  baseName = baseName
    .replace(/^(beef|pork|chicken|turkey|lamb|fish|salmon|tuna|cod|tilapia)\s*,?\s*/i, '$1')
    .trim();

  // Find cut
  let cut: string | undefined;
  for (const [key, value] of Object.entries(CUTS)) {
    if (upper.includes(key)) {
      cut = value;
      break;
    }
  }

  // Find preparation
  let preparation: string | undefined;
  for (const [key, value] of Object.entries(PREPARATIONS)) {
    if (upper.includes(key)) {
      preparation = value;
      break;
    }
  }

  // Modifiers
  const modifiers: string[] = [];

  // Check skin
  if (SKIN_MODIFIERS.WITH_SKIN.some((s) => upper.includes(s))) {
    modifiers.push('With Skin');
  } else if (SKIN_MODIFIERS.WITHOUT_SKIN.some((s) => upper.includes(s))) {
    modifiers.push('No Skin');
  }

  // Check bone
  if (BONE_MODIFIERS.WITH_BONE.some((b) => upper.includes(b))) {
    modifiers.push('Bone-In');
  } else if (BONE_MODIFIERS.WITHOUT_BONE.some((b) => upper.includes(b))) {
    modifiers.push('Boneless');
  }

  // Check fish/meat origins
  for (const origin of [...FISH_ORIGINS, ...MEAT_ORIGINS]) {
    if (upper.includes(origin)) {
      modifiers.push(capitalizeFirst(origin.toLowerCase()));
    }
  }

  return {
    baseName: capitalizeFirst(baseName),
    cut,
    preparation,
    modifiers,
    raw: description,
  };
}

/**
 * Create smart display name from parsed components
 */
export function createDisplayName(parsed: ParsedFoodName): string {
  const parts: string[] = [];

  // Base name
  parts.push(parsed.baseName);

  // Cut
  if (parsed.cut) {
    parts.push(parsed.cut);
  }

  // Modifiers in parentheses
  if (parsed.modifiers.length > 0) {
    parts.push(`(${parsed.modifiers.join(', ')})`);
  }

  // Preparation at the end with dash
  if (parsed.preparation) {
    parts.push(`- ${parsed.preparation}`);
  }

  return parts.join(' ');
}

/**
 * Create variation signature for deduplication
 */
export function createVariationSignature(parsed: ParsedFoodName): string {
  return [
    parsed.baseName.toLowerCase(),
    parsed.cut?.toLowerCase() || 'whole',
    parsed.preparation?.toLowerCase() || 'raw',
    parsed.modifiers.map((m) => m.toLowerCase()).join('-') || 'standard',
  ].join('|');
}

/**
 * Determine if two foods are the same variation
 */
export function isSameVariation(desc1: string, desc2: string): boolean {
  const parsed1 = parseUSDADescription(desc1);
  const parsed2 = parseUSDADescription(desc2);

  return createVariationSignature(parsed1) === createVariationSignature(parsed2);
}

/**
 * Extract brand from USDA description (if present)
 */
export function extractBrand(description: string): string | undefined {
  // USDA branded foods often have brand in quotes or all caps at start
  const brandMatch = description.match(/^([A-Z][A-Z\s&]+?),/);
  if (brandMatch && brandMatch[1].length < 30) {
    return capitalizeWords(brandMatch[1].trim());
  }
  return undefined;
}

/**
 * Determine food category from description
 */
export function categorizeFood(description: string): {
  category: string;
  subcategory?: string;
} {
  const upper = description.toUpperCase();

  // Protein - Meat
  if (
    upper.includes('CHICKEN') ||
    upper.includes('TURKEY') ||
    upper.includes('DUCK') ||
    upper.includes('GOOSE')
  ) {
    return { category: 'protein_meat', subcategory: 'poultry' };
  }
  if (
    upper.includes('BEEF') ||
    upper.includes('PORK') ||
    upper.includes('LAMB') ||
    upper.includes('VEAL')
  ) {
    return { category: 'protein_meat', subcategory: 'red_meat' };
  }

  // Protein - Fish
  if (
    upper.includes('SALMON') ||
    upper.includes('TUNA') ||
    upper.includes('TROUT') ||
    upper.includes('MACKEREL') ||
    upper.includes('SARDINE')
  ) {
    return { category: 'protein_fish', subcategory: 'fatty_fish' };
  }
  if (
    upper.includes('COD') ||
    upper.includes('TILAPIA') ||
    upper.includes('HALIBUT') ||
    upper.includes('FLOUNDER')
  ) {
    return { category: 'protein_fish', subcategory: 'white_fish' };
  }
  if (upper.includes('SHRIMP') || upper.includes('CRAB') || upper.includes('LOBSTER')) {
    return { category: 'protein_fish', subcategory: 'shellfish' };
  }

  // Protein - Eggs & Dairy
  if (upper.includes('EGG')) {
    return { category: 'protein_eggs_dairy', subcategory: 'eggs' };
  }
  if (
    upper.includes('MILK') ||
    upper.includes('YOGURT') ||
    upper.includes('CHEESE') ||
    upper.includes('COTTAGE')
  ) {
    return { category: 'protein_eggs_dairy', subcategory: 'dairy' };
  }

  // Vegetables
  if (
    upper.includes('SPINACH') ||
    upper.includes('KALE') ||
    upper.includes('LETTUCE') ||
    upper.includes('ARUGULA')
  ) {
    return { category: 'vegetables', subcategory: 'leafy_greens' };
  }
  if (
    upper.includes('BROCCOLI') ||
    upper.includes('CAULIFLOWER') ||
    upper.includes('CARROT') ||
    upper.includes('PEPPER')
  ) {
    return { category: 'vegetables', subcategory: 'cruciferous' };
  }

  // Fruits
  if (
    upper.includes('APPLE') ||
    upper.includes('BANANA') ||
    upper.includes('ORANGE') ||
    upper.includes('BERRY')
  ) {
    return { category: 'fruits' };
  }

  // Grains
  if (
    upper.includes('RICE') ||
    upper.includes('PASTA') ||
    upper.includes('BREAD') ||
    upper.includes('OATS')
  ) {
    return { category: 'grains' };
  }

  // Legumes
  if (
    upper.includes('BEANS') ||
    upper.includes('LENTIL') ||
    upper.includes('CHICKPEA') ||
    upper.includes('PEA')
  ) {
    return { category: 'legumes' };
  }

  // Nuts & Seeds
  if (
    upper.includes('ALMOND') ||
    upper.includes('WALNUT') ||
    upper.includes('CASHEW') ||
    upper.includes('SEED')
  ) {
    return { category: 'nuts_seeds' };
  }

  // Oils & Fats
  if (upper.includes('OIL') || upper.includes('BUTTER') || upper.includes('AVOCADO')) {
    return { category: 'oils_fats' };
  }

  return { category: 'other' };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
}

/**
 * Clean USDA description for better display
 */
export function cleanUSDADescription(description: string): string {
  const parsed = parseUSDADescription(description);
  return createDisplayName(parsed);
}

/**
 * Score relevance of a food result to a search query
 */
export function scoreRelevance(
  foodName: string,
  displayName: string,
  query: string,
  aliases: string[] = []
): number {
  const lowerQuery = query.toLowerCase();
  const lowerName = foodName.toLowerCase();
  const lowerDisplay = displayName.toLowerCase();

  // Exact match
  if (lowerName === lowerQuery || lowerDisplay === lowerQuery) {
    return 1.0;
  }

  // Alias exact match
  if (aliases.some((alias) => alias.toLowerCase() === lowerQuery)) {
    return 0.95;
  }

  // Starts with query
  if (lowerName.startsWith(lowerQuery) || lowerDisplay.startsWith(lowerQuery)) {
    return 0.9;
  }

  // Contains query as whole word
  const wordBoundary = new RegExp(`\\b${lowerQuery}\\b`);
  if (wordBoundary.test(lowerName) || wordBoundary.test(lowerDisplay)) {
    return 0.8;
  }

  // Contains query anywhere
  if (lowerName.includes(lowerQuery) || lowerDisplay.includes(lowerQuery)) {
    return 0.6;
  }

  // Partial word match
  const queryWords = lowerQuery.split(' ');
  const nameWords = lowerName.split(' ');
  const matchedWords = queryWords.filter((qw) => nameWords.some((nw) => nw.includes(qw)));

  if (matchedWords.length > 0) {
    return 0.4 * (matchedWords.length / queryWords.length);
  }

  return 0.0;
}
