import HybridHybridStorageService from '../services/hybridStorage';

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
];

export const addSampleMealsForPast6Months = async () => {
  const meals = [];
  const today = new Date();
  const sixMonthsAgo = 180; // ~6 months
  
  // Create some realistic trends:
  // - More consistent tracking in recent months
  // - Gradual increase in protein intake over time
  // - Weekend cheat days with higher calories
  
  for (let daysAgo = 1; daysAgo <= sixMonthsAgo; daysAgo++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Skip some days randomly (more skips in older data to show improving consistency)
    const skipProbability = daysAgo > 90 ? 0.4 : daysAgo > 30 ? 0.2 : 0.1;
    if (Math.random() < skipProbability) continue;
    
    // More meals on weekends, fewer on older data
    let mealsPerDay;
    if (isWeekend) {
      mealsPerDay = Math.floor(Math.random() * 2) + 3; // 3-4 meals
    } else {
      mealsPerDay = Math.floor(Math.random() * 2) + 2; // 2-3 meals
    }
    
    // Reduce meals for older data
    if (daysAgo > 90) {
      mealsPerDay = Math.max(2, mealsPerDay - 1);
    }
    
    for (let mealIndex = 0; mealIndex < mealsPerDay; mealIndex++) {
      // Pick a random meal from the sample list
      const randomMeal = sampleMeals[Math.floor(Math.random() * sampleMeals.length)];
      
      // Set time based on meal number (breakfast, lunch, dinner, snack)
      const baseTimes = [7, 12, 17, 21]; // 7am, 12pm, 5pm, 9pm
      const hour = baseTimes[mealIndex] || 20;
      const minute = Math.floor(Math.random() * 60);
      date.setHours(hour, minute, 0, 0);
      
      // Portion sizes - trend toward more consistent portions over time
      let portionSizes;
      if (daysAgo > 90) {
        // Older data: more variable portions
        portionSizes = [0.5, 0.75, 1, 1, 1.5, 2, 2.5];
      } else {
        // Recent data: more consistent
        portionSizes = [0.75, 1, 1, 1, 1, 1.5];
      }
      
      // Weekend bonus: larger portions
      if (isWeekend) {
        portionSizes = portionSizes.map(p => p * 1.2);
      }
      
      const portionSize = portionSizes[Math.floor(Math.random() * portionSizes.length)];
      
      // Protein trend: gradually increase protein over time (fitness improvement)
      const proteinMultiplier = 1 + ((sixMonthsAgo - daysAgo) / sixMonthsAgo) * 0.3; // Up to 30% more protein over time
      
      meals.push({
        id: `${date.getTime()}-${mealIndex}`,
        name: randomMeal.name,
        calories: Math.round(randomMeal.calories * portionSize),
        protein: Math.round(randomMeal.protein * portionSize * proteinMultiplier),
        carbs: Math.round(randomMeal.carbs * portionSize),
        fat: Math.round(randomMeal.fat * portionSize),
        timestamp: date.getTime(),
        date: date.toDateString(),
        portionSize: portionSize,
        baseMacros: {
          calories: randomMeal.calories,
          protein: Math.round(randomMeal.protein * proteinMultiplier),
          carbs: randomMeal.carbs,
          fat: randomMeal.fat
        }
      });
    }
  }
  
  // Save all meals
  console.log(`Generated ${meals.length} meals for past 6 months`);
  for (const meal of meals) {
    await HybridStorageService.saveMeal(meal);
  }
  
  return meals.length;
};

// Keep the old function name for backward compatibility
export const addSampleMealsForPast10Days = addSampleMealsForPast6Months;

export const addSampleSavedMeals = async () => {
  const savedMeals = [
    {
      id: Date.now().toString() + '-1',
      name: "Morning Protein",
      calories: 300,
      protein: 40,
      carbs: 20,
      fat: 8
    },
    {
      id: Date.now().toString() + '-2',
      name: "Post Workout",
      calories: 450,
      protein: 48,
      carbs: 42,
      fat: 12
    },
    {
      id: Date.now().toString() + '-3',
      name: "Quick Lunch",
      calories: 520,
      protein: 38,
      carbs: 52,
      fat: 18
    }
  ];
  
  for (const meal of savedMeals) {
    await HybridStorageService.saveMealTemplate(meal);
  }
  
  return savedMeals.length;
};

