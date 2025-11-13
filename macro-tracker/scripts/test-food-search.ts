/**
 * =====================================================
 * FOOD SEARCH SYSTEM TESTING SCRIPT
 * =====================================================
 * Comprehensive testing for the hybrid food search system
 *
 * Usage:
 *   npm run test-search
 */

import { searchFoods, getFoodById } from '../lib/services/hybrid-food-search';
import {
  parseUSDADescription,
  createDisplayName,
  categorizeFood,
} from '../lib/services/food-name-parser';

// =====================================================
// TEST QUERIES
// =====================================================

const TEST_QUERIES = [
  // Proteins
  { query: 'chicken', expected_min: 5, description: 'Should return diverse chicken variations' },
  {
    query: 'chicken breast',
    expected_min: 3,
    description: 'Should prioritize chicken breast variations',
  },
  { query: 'salmon', expected_min: 5, description: 'Should return salmon variations' },
  { query: 'beef', expected_min: 5, description: 'Should return beef cuts' },
  { query: 'eggs', expected_min: 3, description: 'Should return egg variations' },

  // Vegetables
  {
    query: 'broccoli',
    expected_min: 2,
    description: 'Should return broccoli (raw, cooked)',
  },
  { query: 'spinach', expected_min: 2, description: 'Should return spinach variations' },

  // Grains
  { query: 'rice', expected_min: 3, description: 'Should return rice types' },
  { query: 'oats', expected_min: 2, description: 'Should return oat variations' },

  // Edge cases
  { query: 'ab', expected_min: 0, description: 'Short query should still work' },
  { query: 'xyz123', expected_min: 0, description: 'Non-existent food should return empty' },
];

// =====================================================
// TEST FUNCTIONS
// =====================================================

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function testSearch(
  query: string,
  expectedMin: number,
  description: string
): Promise<TestResult> {
  console.log(`\n🔍 Testing: "${query}" - ${description}`);

  try {
    const startTime = Date.now();
    const result = await searchFoods(query, { limit: 10 });
    const duration = Date.now() - startTime;

    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   📊 Results: ${result.foods.length} foods`);
    console.log(`   🎯 Source: ${result.source}`);
    console.log(`   ✓ Curated: ${result.curated_count}, USDA: ${result.usda_count}`);

    // Show first 3 results
    if (result.foods.length > 0) {
      console.log('   📋 Top results:');
      result.foods.slice(0, 3).forEach((food, i) => {
        console.log(
          `      ${i + 1}. ${food.display_name} - ${food.calories_per_100g} cal, ${food.protein_per_100g}g P (${food.source})`
        );
      });
    }

    // Validation
    const passed = result.foods.length >= expectedMin && duration < 2000; // Should be under 2s

    return {
      passed,
      message: passed
        ? `✅ PASS: Found ${result.foods.length} results in ${duration}ms`
        : `❌ FAIL: Expected ${expectedMin}+ results, got ${result.foods.length}`,
      details: {
        query,
        resultCount: result.foods.length,
        duration,
        source: result.source,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { query, error },
    };
  }
}

function testParser(description: string): TestResult {
  console.log(`\n🧪 Testing parser: "${description}"`);

  const parsed = parseUSDADescription(description);
  const displayName = createDisplayName(parsed);
  const { category, subcategory } = categorizeFood(description);

  console.log('   Original:', description);
  console.log('   Base name:', parsed.baseName);
  console.log('   Display name:', displayName);
  console.log('   Cut:', parsed.cut || 'N/A');
  console.log('   Preparation:', parsed.preparation || 'N/A');
  console.log('   Modifiers:', parsed.modifiers.join(', ') || 'None');
  console.log('   Category:', category, subcategory ? `(${subcategory})` : '');

  // Basic validation
  const passed = displayName.length > 0 && displayName !== description;

  return {
    passed,
    message: passed
      ? '✅ PASS: Successfully parsed and simplified'
      : '❌ FAIL: Parser did not transform description',
    details: { parsed, displayName, category, subcategory },
  };
}

async function testFoodRetrieval(
  id: string,
  source: 'curated' | 'usda'
): Promise<TestResult> {
  console.log(`\n📖 Testing food retrieval: ID=${id}, source=${source}`);

  try {
    const food = await getFoodById(id, source);

    if (!food) {
      return {
        passed: false,
        message: '❌ FAIL: Food not found',
        details: { id, source },
      };
    }

    console.log('   ✓ Found:', food.display_name);
    console.log(
      `   ✓ Macros: ${food.protein_per_100g}g P, ${food.carbs_per_100g}g C, ${food.fat_per_100g}g F, ${food.calories_per_100g} cal`
    );

    return {
      passed: true,
      message: '✅ PASS: Successfully retrieved food',
      details: food,
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { id, source, error },
    };
  }
}

// =====================================================
// TEST RUNNER
// =====================================================

async function runTests() {
  console.log('🚀 FOOD SEARCH SYSTEM TESTING');
  console.log('=' .repeat(60));

  const results: TestResult[] = [];

  // Test 1: Name Parser
  console.log('\n📦 PHASE 1: Name Parser Tests');
  console.log('-'.repeat(60));

  const parserTests = [
    'CHICKEN,BROILERS OR FRYERS,BREAST,MEAT ONLY,CKD,RSTD',
    'SALMON,ATLANTIC,FARMED,CKD,DRY HEAT',
    'BEEF,GROUND,85% LEAN MEAT / 15% FAT,RAW',
    'EGG,WHOLE,COOKED,SCRAMBLED',
  ];

  for (const desc of parserTests) {
    const result = testParser(desc);
    results.push(result);
  }

  // Test 2: Search Functionality
  console.log('\n🔍 PHASE 2: Search Tests');
  console.log('-'.repeat(60));

  for (const test of TEST_QUERIES) {
    const result = await testSearch(test.query, test.expected_min, test.description);
    results.push(result);

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Test 3: Food Retrieval (if curated DB has data)
  console.log('\n📖 PHASE 3: Food Retrieval Tests');
  console.log('-'.repeat(60));

  // Try to get a popular food (this might fail if DB is empty)
  // results.push(await testFoodRetrieval('some-uuid', 'curated'));

  // Test 4: Performance
  console.log('\n⚡ PHASE 4: Performance Tests');
  console.log('-'.repeat(60));

  const perfQuery = 'chicken breast';
  const iterations = 5;
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await searchFoods(perfQuery, { limit: 10 });
    durations.push(Date.now() - startTime);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  console.log(`   Average search time: ${avgDuration.toFixed(2)}ms`);
  console.log(`   Min: ${Math.min(...durations)}ms, Max: ${Math.max(...durations)}ms`);

  const perfPassed = avgDuration < 1000; // Should be under 1 second on average
  results.push({
    passed: perfPassed,
    message: perfPassed
      ? `✅ PASS: Average search time ${avgDuration.toFixed(2)}ms`
      : `❌ FAIL: Average search time ${avgDuration.toFixed(2)}ms (too slow)`,
    details: { avgDuration, durations },
  });

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total tests: ${total}`);
  console.log(`✅ Passed: ${passed} (${passRate}%)`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.message}`);
      });
  }

  console.log('\n' + (failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
