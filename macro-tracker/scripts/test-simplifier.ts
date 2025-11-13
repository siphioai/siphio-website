import { simplifyFoodName } from '../lib/services/food-name-simplifier';

const testNames = [
  "Chicken, broilers or fryers, dark meat, thigh, meat only, raw",
  "Chicken, broilers or fryers, breast, meat and skin, raw",
  "Chicken, broilers or fryers, wing, meat and skin, cooked, fried, batter",
  "Chicken, broilers or fryers, drumstick, meat and skin, cooked, roasted",
  "Chicken, broilers or fryers, leg, meat and skin, cooked, roasted"
];

console.log('🧪 Testing food name simplification:\n');

testNames.forEach(name => {
  const simplified = simplifyFoodName(name);
  console.log(`Original:   "${name}"`);
  console.log(`Simplified: "${simplified}"`);
  console.log('');
});
