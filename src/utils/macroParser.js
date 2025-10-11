// Utility functions for parsing and processing macro data

class MacroParser {
  // Parse nutritional data from various sources
  static parseNutritionalData(data) {
    if (!data || typeof data !== 'object') {
      return this.getDefaultMacros();
    }

    return {
      calories: this.parseNumber(data.calories) || 0,
      protein: this.parseNumber(data.protein) || 0,
      carbs: this.parseNumber(data.carbs) || 0,
      fat: this.parseNumber(data.fat) || 0,
      fiber: this.parseNumber(data.fiber) || 0,
      sugar: this.parseNumber(data.sugar) || 0,
      sodium: this.parseNumber(data.sodium) || 0,
    };
  }

  // Parse number from various formats
  static parseNumber(value) {
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      // Remove common units and parse
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  }

  // Calculate macro percentages
  static calculateMacroPercentages(macros) {
    const totalCalories = macros.calories;
    
    if (totalCalories === 0) {
      return {
        proteinPercent: 0,
        carbsPercent: 0,
        fatPercent: 0,
      };
    }

    // Protein: 4 calories per gram
    // Carbs: 4 calories per gram  
    // Fat: 9 calories per gram
    const proteinCalories = macros.protein * 4;
    const carbsCalories = macros.carbs * 4;
    const fatCalories = macros.fat * 9;

    return {
      proteinPercent: Math.round((proteinCalories / totalCalories) * 100),
      carbsPercent: Math.round((carbsCalories / totalCalories) * 100),
      fatPercent: Math.round((fatCalories / totalCalories) * 100),
    };
  }

  // Calculate remaining macros for the day
  static calculateRemainingMacros(dailyGoal, consumed) {
    return {
      calories: Math.max(0, dailyGoal.calories - consumed.calories),
      protein: Math.max(0, dailyGoal.protein - consumed.protein),
      carbs: Math.max(0, dailyGoal.carbs - consumed.carbs),
      fat: Math.max(0, dailyGoal.fat - consumed.fat),
    };
  }

  // Calculate progress percentage
  static calculateProgress(consumed, goal) {
    if (goal.calories === 0) return 0;
    
    return {
      calories: Math.min(100, Math.round((consumed.calories / goal.calories) * 100)),
      protein: Math.min(100, Math.round((consumed.protein / goal.protein) * 100)),
      carbs: Math.min(100, Math.round((consumed.carbs / goal.carbs) * 100)),
      fat: Math.min(100, Math.round((consumed.fat / goal.fat) * 100)),
    };
  }

  // Validate macro data
  static validateMacros(macros) {
    const errors = [];
    
    if (macros.calories < 0) {
      errors.push('Calories cannot be negative');
    }
    
    if (macros.protein < 0) {
      errors.push('Protein cannot be negative');
    }
    
    if (macros.carbs < 0) {
      errors.push('Carbs cannot be negative');
    }
    
    if (macros.fat < 0) {
      errors.push('Fat cannot be negative');
    }

    // Check for reasonable limits
    if (macros.calories > 10000) {
      errors.push('Calories seem unusually high');
    }
    
    if (macros.protein > 1000) {
      errors.push('Protein seems unusually high');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Format macros for display
  static formatMacros(macros, precision = 1) {
    return {
      calories: Math.round(macros.calories),
      protein: macros.protein.toFixed(precision),
      carbs: macros.carbs.toFixed(precision),
      fat: macros.fat.toFixed(precision),
    };
  }

  // Convert between units
  static convertUnits(macros, fromUnit, toUnit) {
    if (fromUnit === toUnit) return macros;
    
    // Convert between metric and imperial if needed
    // For now, assuming all data is in metric (grams)
    return macros;
  }

  // Calculate BMI (if weight and height are provided)
  static calculateBMI(weight, height) {
    if (!weight || !height) return null;
    
    // BMI = weight(kg) / height(m)^2
    const heightInMeters = height / 100; // Convert cm to meters
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  }

  // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
  static calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age || !gender) return null;
    
    if (gender.toLowerCase() === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  }

  // Calculate TDEE (Total Daily Energy Expenditure)
  static calculateTDEE(bmr, activityLevel) {
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    };
    
    const multiplier = activityMultipliers[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  }

  // Get default macro values
  static getDefaultMacros() {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };
  }

  // Sum multiple macro objects
  static sumMacros(macroArray) {
    return macroArray.reduce((total, macros) => {
      return {
        calories: total.calories + (macros.calories || 0),
        protein: total.protein + (macros.protein || 0),
        carbs: total.carbs + (macros.carbs || 0),
        fat: total.fat + (macros.fat || 0),
        fiber: total.fiber + (macros.fiber || 0),
        sugar: total.sugar + (macros.sugar || 0),
        sodium: total.sodium + (macros.sodium || 0),
      };
    }, this.getDefaultMacros());
  }
}

export default MacroParser;


