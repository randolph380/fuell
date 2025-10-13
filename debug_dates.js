// Debug script to test date handling
const testDate = new Date('2024-01-15T10:30:00.000Z');

console.log('Original date:', testDate);
console.log('toISOString():', testDate.toISOString());
console.log('new Date(isoString):', new Date(testDate.toISOString()));
console.log('toDateString():', testDate.toDateString());
console.log('new Date(isoString).toDateString():', new Date(testDate.toISOString()).toDateString());

// Test the comparison logic from getMealsByDate
const mealDate = new Date(testDate.toISOString()).toDateString();
const targetDate = new Date(testDate).toDateString();

console.log('mealDate:', mealDate);
console.log('targetDate:', targetDate);
console.log('Are they equal?', mealDate === targetDate);
