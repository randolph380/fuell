// Script to add sample meals to the previous 10 days
// Run this in your app or use it as reference

const sampleMeals = [
  // Breakfast options
  { name: "Scrambled Eggs", calories: 280, protein: 24, carbs: 4, fat: 18 },
  { name: "Oatmeal Bowl", calories: 320, protein: 12, carbs: 54, fat: 8 },
  { name: "Greek Yogurt", calories: 180, protein: 20, carbs: 15, fat: 4 },
  { name: "Protein Pancakes", calories: 350, protein: 28, carbs: 42, fat: 10 },
  { name: "Avocado Toast", calories: 380, protein: 14, carbs: 36, fat: 22 },
  
  // Lunch options
  { name: "Grilled Chicken", calories: 420, protein: 48, carbs: 8, fat: 18 },
  { name: "Turkey Sandwich", calories: 450, protein: 32, carbs: 48, fat: 14 },
  { name: "Salmon Salad", calories: 480, protein: 38, carbs: 18, fat: 28 },
  { name: "Chicken Wrap", calories: 520, protein: 42, carbs: 44, fat: 20 },
  { name: "Tuna Bowl", calories: 390, protein: 36, carbs: 32, fat: 12 },
  
  // Dinner options
  { name: "Steak Dinner", calories: 650, protein: 52, carbs: 24, fat: 38 },
  { name: "Pasta Bolognese", calories: 580, protein: 34, carbs: 62, fat: 22 },
  { name: "Grilled Salmon", calories: 520, protein: 46, carbs: 14, fat: 32 },
  { name: "Chicken Stir-fry", calories: 480, protein: 42, carbs: 38, fat: 18 },
  { name: "Turkey Burger", calories: 540, protein: 44, carbs: 42, fat: 20 },
  
  // Snacks
  { name: "Protein Shake", calories: 220, protein: 32, carbs: 12, fat: 4 },
  { name: "Apple Slices", calories: 120, protein: 1, carbs: 28, fat: 0 },
  { name: "Almonds", calories: 180, protein: 6, carbs: 8, fat: 16 },
  { name: "Protein Bar", calories: 240, protein: 20, carbs: 22, fat: 8 },
  { name: "Greek Yogurt", calories: 150, protein: 18, carbs: 12, fat: 3 },
];

// Generate meals for the past 10 days
export const generateSampleMeals = () => {
  const meals = [];
  const today = new Date();
  
  for (let daysAgo = 1; daysAgo <= 10; daysAgo++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    // Random number of meals per day (2-4)
    const mealsPerDay = Math.floor(Math.random() * 3) + 2;
    
    for (let mealIndex = 0; mealIndex < mealsPerDay; mealIndex++) {
      // Pick a random meal from the sample list
      const randomMeal = sampleMeals[Math.floor(Math.random() * sampleMeals.length)];
      
      // Set time based on meal number (breakfast, lunch, dinner, snack)
      const hour = 7 + (mealIndex * 5); // 7am, 12pm, 5pm, 10pm
      date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
      
      // Random portion size (0.5x to 2x)
      const portionSize = [0.5, 0.75, 1, 1, 1, 1.5, 2][Math.floor(Math.random() * 7)];
      
      meals.push({
        id: `${date.getTime()}-${mealIndex}`,
        name: randomMeal.name + (portionSize !== 1 ? ` (${portionSize}x)` : ''),
        calories: Math.round(randomMeal.calories * portionSize),
        protein: Math.round(randomMeal.protein * portionSize),
        carbs: Math.round(randomMeal.carbs * portionSize),
        fat: Math.round(randomMeal.fat * portionSize),
        timestamp: date.getTime(),
        date: date.toDateString(),
        portionSize: portionSize,
        baseMacros: {
          calories: randomMeal.calories,
          protein: randomMeal.protein,
          carbs: randomMeal.carbs,
          fat: randomMeal.fat
        }
      });
    }
  }
  
  return meals;
};

// Console output for manual copying
console.log('Sample meals for past 10 days:');
console.log(JSON.stringify(generateSampleMeals(), null, 2));


