import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  // Current user ID (set by app on login)
  static currentUserId = null;
  static USER_ID_KEY = 'current_user_id';

  // Set the current user ID and persist it
  static async setUserId(userId) {
    this.currentUserId = userId;
    try {
      await AsyncStorage.setItem(this.USER_ID_KEY, userId);
      console.log('User ID persisted:', userId);
    } catch (error) {
      console.error('Error persisting user ID:', error);
    }
  }

  // Get the current user ID (from memory or AsyncStorage)
  static async getUserId() {
    if (this.currentUserId) {
      return this.currentUserId;
    }
    
    try {
      const userId = await AsyncStorage.getItem(this.USER_ID_KEY);
      if (userId) {
        this.currentUserId = userId;
        console.log('User ID retrieved from storage:', userId);
      }
      return userId;
    } catch (error) {
      console.error('Error retrieving user ID:', error);
      return null;
    }
  }

  // Clear the current user ID (on logout)
  static async clearUserId() {
    this.currentUserId = null;
    try {
      await AsyncStorage.removeItem(this.USER_ID_KEY);
      console.log('User ID cleared');
    } catch (error) {
      console.error('Error clearing user ID:', error);
    }
  }

  // Get user-specific key
  static async getUserKey(key) {
    const userId = await this.getUserId();
    if (!userId) {
      // Fallback to global key if no user (shouldn't happen with auth)
      return key;
    }
    return `user_${userId}_${key}`;
  }

  // Keys for AsyncStorage (will be prefixed with user ID)
  static KEYS = {
    MEALS: 'meals',
    DAILY_MACROS: 'daily_macros',
    SAVED_MEALS: 'saved_meals',
    USER_PREFERENCES: 'user_preferences',
  };

  // Meal storage methods
  static async saveMeal(meal) {
    try {
      const meals = await this.getMeals();
      const updatedMeals = [...meals, meal];
      const key = await this.getUserKey(this.KEYS.MEALS);
      await AsyncStorage.setItem(key, JSON.stringify(updatedMeals));
      return true;
    } catch (error) {
      console.error('Error saving meal:', error);
      return false;
    }
  }

  static async getMeals() {
    try {
      const key = await this.getUserKey(this.KEYS.MEALS);
      const meals = await AsyncStorage.getItem(key);
      return meals ? JSON.parse(meals) : [];
    } catch (error) {
      console.error('Error getting meals:', error);
      return [];
    }
  }

  static async getMealsByDate(date) {
    try {
      const meals = await this.getMeals();
      const targetDate = new Date(date).toDateString();
      return meals.filter(meal => 
        new Date(meal.date).toDateString() === targetDate
      );
    } catch (error) {
      console.error('Error getting meals by date:', error);
      return [];
    }
  }

  static async deleteMeal(mealId) {
    try {
      const meals = await this.getMeals();
      const updatedMeals = meals.filter(meal => meal.id !== mealId);
      const key = await this.getUserKey(this.KEYS.MEALS);
      await AsyncStorage.setItem(key, JSON.stringify(updatedMeals));
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      return false;
    }
  }

  static async updateMeal(mealId, updatedMeal) {
    try {
      const meals = await this.getMeals();
      const updatedMeals = meals.map(meal => 
        meal.id === mealId ? { ...meal, ...updatedMeal } : meal
      );
      const key = await this.getUserKey(this.KEYS.MEALS);
      await AsyncStorage.setItem(key, JSON.stringify(updatedMeals));
      return true;
    } catch (error) {
      console.error('Error updating meal:', error);
      return false;
    }
  }

  // Daily macros storage methods
  static async saveDailyMacros(date, macros) {
    try {
      const dailyMacros = await this.getAllDailyMacros();
      const dateKey = new Date(date).toDateString();
      dailyMacros[dateKey] = macros;
      const key = await this.getUserKey(this.KEYS.DAILY_MACROS);
      await AsyncStorage.setItem(key, JSON.stringify(dailyMacros));
      return true;
    } catch (error) {
      console.error('Error saving daily macros:', error);
      return false;
    }
  }

  static async getDailyMacros(date) {
    try {
      const dailyMacros = await this.getAllDailyMacros();
      const dateKey = new Date(date).toDateString();
      return dailyMacros[dateKey] || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    } catch (error) {
      console.error('Error getting daily macros:', error);
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }
  }

  static async getAllDailyMacros() {
    try {
      const key = await this.getUserKey(this.KEYS.DAILY_MACROS);
      const dailyMacros = await AsyncStorage.getItem(key);
      return dailyMacros ? JSON.parse(dailyMacros) : {};
    } catch (error) {
      console.error('Error getting all daily macros:', error);
      return {};
    }
  }

  // Saved meals storage methods
  static async saveMealTemplate(mealTemplate) {
    try {
      const savedMeals = await this.getSavedMeals();
      const updatedSavedMeals = [...savedMeals, mealTemplate];
      const key = await this.getUserKey(this.KEYS.SAVED_MEALS);
      await AsyncStorage.setItem(key, JSON.stringify(updatedSavedMeals));
      return true;
    } catch (error) {
      console.error('Error saving meal template:', error);
      return false;
    }
  }

  static async getSavedMeals() {
    try {
      const key = await this.getUserKey(this.KEYS.SAVED_MEALS);
      const savedMeals = await AsyncStorage.getItem(key);
      return savedMeals ? JSON.parse(savedMeals) : [];
    } catch (error) {
      console.error('Error getting saved meals:', error);
      return [];
    }
  }

  static async deleteSavedMeal(mealId) {
    try {
      const savedMeals = await this.getSavedMeals();
      const updatedSavedMeals = savedMeals.filter(meal => meal.id !== mealId);
      const key = await this.getUserKey(this.KEYS.SAVED_MEALS);
      await AsyncStorage.setItem(key, JSON.stringify(updatedSavedMeals));
      return true;
    } catch (error) {
      console.error('Error deleting saved meal:', error);
      return false;
    }
  }

  static async updateSavedMeal(mealId, updatedMeal) {
    try {
      const savedMeals = await this.getSavedMeals();
      const updatedSavedMeals = savedMeals.map(meal => 
        meal.id === mealId ? { ...meal, ...updatedMeal } : meal
      );
      const key = await this.getUserKey(this.KEYS.SAVED_MEALS);
      await AsyncStorage.setItem(key, JSON.stringify(updatedSavedMeals));
      return true;
    } catch (error) {
      console.error('Error updating saved meal:', error);
      return false;
    }
  }

  // User preferences storage methods
  static async saveUserPreferences(preferences) {
    try {
      const key = await this.getUserKey(this.KEYS.USER_PREFERENCES);
      await AsyncStorage.setItem(key, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  }

  static async getUserPreferences() {
    try {
      const key = await this.getUserKey(this.KEYS.USER_PREFERENCES);
      const preferences = await AsyncStorage.getItem(key);
      return preferences ? JSON.parse(preferences) : {
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 150,
        dailyCarbsGoal: 250,
        dailyFatGoal: 65,
        units: 'metric'
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 150,
        dailyCarbsGoal: 250,
        dailyFatGoal: 65,
        units: 'metric'
      };
    }
  }

  // Utility methods
  static async clearAllData() {
    try {
      const keys = await Promise.all([
        this.getUserKey(this.KEYS.MEALS),
        this.getUserKey(this.KEYS.DAILY_MACROS),
        this.getUserKey(this.KEYS.SAVED_MEALS),
        this.getUserKey(this.KEYS.USER_PREFERENCES)
      ]);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  static async getStorageSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);
      let totalSize = 0;
      
      data.forEach(([key, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error getting storage size:', error);
      return 0;
    }
  }
}

export default StorageService;

