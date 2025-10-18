/**
 * Server Storage Service
 * 
 * Handles communication with the cloud server for data storage
 * Works alongside local StorageService for incremental migration
 */

const API_BASE_URL = 'https://fuell.onrender.com/api';

class ServerStorageService {
  
  /**
   * Get user ID from Clerk
   */
  static async getUserId() {
    // This will be set by the app when user logs in
    return this.currentUserId;
  }

  /**
   * Set current user ID
   */
  static async setUserId(userId) {
    this.currentUserId = userId;
  }

  /**
   * Make API request with error handling
   */
  static async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      console.log(`🌐 Server request: ${method} ${url}`, data);
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log(`✅ Server response:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Server request failed:`, error);
      throw error;
    }
  }

  /**
   * Save meal to server
   */
  static async saveMeal(meal) {
    try {
      console.log('🔍 ServerStorageService.saveMeal called with:', {
        mealId: meal.id,
        mealName: meal.name,
        hasExtendedMetrics: !!meal.extendedMetrics
      });
      
      const userId = await this.getUserId();
      console.log('👤 User ID from getUserId():', userId);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Convert meal to server format
      const serverMeal = {
        id: meal.id,
        user_id: userId,
        date: meal.date,
        name: meal.name || 'Meal',
        food_items: meal.foodItems || [],
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        processed_calories: meal.extendedMetrics?.processedCalories,
        processed_percent: meal.extendedMetrics?.processedPercent,
        ultra_processed_calories: meal.extendedMetrics?.ultraProcessedCalories,
        ultra_processed_percent: meal.extendedMetrics?.ultraProcessedPercent,
        fiber: meal.extendedMetrics?.fiber,
        caffeine: meal.extendedMetrics?.caffeine,
        fresh_produce: meal.extendedMetrics?.freshProduce,
        image_url: meal.imageUrl
      };

      console.log('🔍 Server meal extended metrics:', {
        hasExtendedMetrics: !!meal.extendedMetrics,
        extendedMetrics: meal.extendedMetrics,
        processedCalories: serverMeal.processed_calories,
        processedPercent: serverMeal.processed_percent,
        fiber: serverMeal.fiber,
        caffeine: serverMeal.caffeine,
        freshProduce: serverMeal.fresh_produce
      });

      console.log('🌐 Making server request with data:', {
        endpoint: '/user/meals',
        method: 'POST',
        userId: serverMeal.user_id,
        mealName: serverMeal.name
      });

      const result = await this.makeRequest('/user/meals', 'POST', serverMeal);
      console.log('✅ Server response:', result);
      return result.meal_id;
    } catch (error) {
      console.error('❌ Error saving meal to server:', error);
      throw error;
    }
  }

  /**
   * Get all meals from server
   */
  static async getMeals() {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await this.makeRequest(`/user/meals?user_id=${userId}`, 'GET');
      
      // Convert server format to app format
      return result.meals.map(serverMeal => ({
        id: serverMeal.id.toString(),
        name: serverMeal.name || 'Meal',
        calories: parseFloat(serverMeal.calories) || 0,
        protein: parseFloat(serverMeal.protein) || 0,
        carbs: parseFloat(serverMeal.carbs) || 0,
        fat: parseFloat(serverMeal.fat) || 0,
        timestamp: new Date(serverMeal.created_at).getTime(),
        date: serverMeal.date,
        extendedMetrics: {
          processedCalories: parseFloat(serverMeal.processed_calories) || 0,
          processedPercent: parseFloat(serverMeal.processed_percent) || 0,
          ultraProcessedCalories: parseFloat(serverMeal.ultra_processed_calories) || 0,
          ultraProcessedPercent: parseFloat(serverMeal.ultra_processed_percent) || 0,
          fiber: parseFloat(serverMeal.fiber) || 0,
          caffeine: parseFloat(serverMeal.caffeine) || 0,
          freshProduce: parseFloat(serverMeal.fresh_produce) || 0
        },
        imageUrl: serverMeal.image_url
      }));
    } catch (error) {
      console.error('Error getting meals from server:', error);
      throw error;
    }
  }

  /**
   * Update meal on server
   */
  static async updateMeal(mealId, meal) {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const serverMeal = {
        user_id: userId,
        date: meal.date,
        name: meal.name || 'Meal',
        food_items: meal.foodItems || [],
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        processed_calories: meal.extendedMetrics?.processedCalories,
        processed_percent: meal.extendedMetrics?.processedPercent,
        ultra_processed_calories: meal.extendedMetrics?.ultraProcessedCalories,
        ultra_processed_percent: meal.extendedMetrics?.ultraProcessedPercent,
        fiber: meal.extendedMetrics?.fiber,
        caffeine: meal.extendedMetrics?.caffeine,
        fresh_produce: meal.extendedMetrics?.freshProduce,
        image_url: meal.imageUrl
      };

      return await this.makeRequest(`/user/meals/${mealId}`, 'PUT', serverMeal);
    } catch (error) {
      console.error('Error updating meal on server:', error);
      throw error;
    }
  }

  /**
   * Delete meal from server
   */
  static async deleteMeal(mealId) {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      return await this.makeRequest(`/user/meals/${mealId}`, 'DELETE', { user_id: userId });
    } catch (error) {
      console.error('Error deleting meal from server:', error);
      throw error;
    }
  }

  /**
   * Save user targets to server
   */
  static async saveTargets(targets) {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const serverTargets = {
        user_id: userId,
        calories: targets.calories,
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat,
        processed_percent: targets.processedPercent,
        fiber: targets.fiber,
        caffeine: targets.caffeine,
        fresh_produce: targets.freshProduce
      };

      return await this.makeRequest('/user/targets', 'PUT', serverTargets);
    } catch (error) {
      console.error('Error saving targets to server:', error);
      throw error;
    }
  }

  /**
   * Get user targets from server
   */
  static async getTargets() {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await this.makeRequest(`/user/targets?user_id=${userId}`, 'GET');
      
      if (result.targets) {
        return {
          calories: result.targets.calories,
          protein: result.targets.protein,
          carbs: result.targets.carbs,
          fat: result.targets.fat,
          processedPercent: result.targets.processed_percent,
          fiber: result.targets.fiber,
          caffeine: result.targets.caffeine,
          freshProduce: result.targets.fresh_produce
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting targets from server:', error);
      throw error;
    }
  }

  /**
   * Sync all data from server to local storage
   */
  static async syncFromServer() {
    try {
      console.log('🔄 Syncing data from server...');
      
      // Get meals from server
      const serverMeals = await this.getMeals();
      
      // Get targets from server
      const serverTargets = await this.getTargets();
      
      // Import to local storage (this will be implemented in StorageService)
      const StorageService = require('./storage');
      
      // Clear existing local data
      await StorageService.clearAllData();
      
      // Save server meals to local storage
      for (const meal of serverMeals) {
        await StorageService.saveMeal(meal);
      }
      
      // Save server targets to local storage
      if (serverTargets) {
        await StorageService.saveUserPreferences({ targets: serverTargets });
      }
      
      console.log('✅ Server sync completed');
      return { meals: serverMeals, targets: serverTargets };
    } catch (error) {
      console.error('❌ Server sync failed:', error);
      throw error;
    }
  }

  /**
   * Save saved meal template to server
   */
  static async saveSavedMeal(savedMeal) {
    try {
      console.log('🔍 ServerStorageService.saveSavedMeal called with:', {
        mealId: savedMeal.id,
        mealName: savedMeal.name,
        hasExtendedMetrics: !!savedMeal.extendedMetrics
      });
      
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Convert saved meal to server format
      const serverSavedMeal = {
        id: savedMeal.id,
        user_id: userId,
        name: savedMeal.name || 'Saved Meal',
        calories: savedMeal.calories,
        protein: savedMeal.protein,
        carbs: savedMeal.carbs,
        fat: savedMeal.fat,
        processed_calories: savedMeal.extendedMetrics?.processedCalories,
        processed_percent: savedMeal.extendedMetrics?.processedPercent,
        ultra_processed_calories: savedMeal.extendedMetrics?.ultraProcessedCalories,
        ultra_processed_percent: savedMeal.extendedMetrics?.ultraProcessedPercent,
        fiber: savedMeal.extendedMetrics?.fiber,
        caffeine: savedMeal.extendedMetrics?.caffeine,
        fresh_produce: savedMeal.extendedMetrics?.freshProduce,
        is_template: true  // Mark as saved meal template
      };

      const result = await this.makeRequest('/user/saved-meals', 'POST', serverSavedMeal);
      console.log('✅ Saved meal template saved to server:', result);
      return result.saved_meal_id;
    } catch (error) {
      console.error('Error saving saved meal template:', error);
      throw error;
    }
  }

  /**
   * Get saved meal templates from server
   */
  static async getSavedMeals() {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await this.makeRequest(`/user/saved-meals?user_id=${userId}`, 'GET');
      
      // Convert server format to app format
      return result.saved_meals.map(serverSavedMeal => ({
        id: serverSavedMeal.id.toString(),
        name: serverSavedMeal.name || 'Saved Meal',
        calories: parseFloat(serverSavedMeal.calories) || 0,
        protein: parseFloat(serverSavedMeal.protein) || 0,
        carbs: parseFloat(serverSavedMeal.carbs) || 0,
        fat: parseFloat(serverSavedMeal.fat) || 0,
        createdAt: serverSavedMeal.created_at,
        updatedAt: serverSavedMeal.updated_at,
        extendedMetrics: {
          processedCalories: parseFloat(serverSavedMeal.processed_calories) || 0,
          processedPercent: parseFloat(serverSavedMeal.processed_percent) || 0,
          ultraProcessedCalories: parseFloat(serverSavedMeal.ultra_processed_calories) || 0,
          ultraProcessedPercent: parseFloat(serverSavedMeal.ultra_processed_percent) || 0,
          fiber: parseFloat(serverSavedMeal.fiber) || 0,
          caffeine: parseFloat(serverSavedMeal.caffeine) || 0,
          freshProduce: parseFloat(serverSavedMeal.fresh_produce) || 0
        }
      }));
    } catch (error) {
      console.error('Error getting saved meals from server:', error);
      throw error;
    }
  }

  /**
   * Update saved meal template on server
   */
  static async updateSavedMeal(savedMealId, savedMeal) {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const serverSavedMeal = {
        name: savedMeal.name || 'Saved Meal',
        calories: savedMeal.calories,
        protein: savedMeal.protein,
        carbs: savedMeal.carbs,
        fat: savedMeal.fat,
        processed_calories: savedMeal.extendedMetrics?.processedCalories,
        processed_percent: savedMeal.extendedMetrics?.processedPercent,
        ultra_processed_calories: savedMeal.extendedMetrics?.ultraProcessedCalories,
        ultra_processed_percent: savedMeal.extendedMetrics?.ultraProcessedPercent,
        fiber: savedMeal.extendedMetrics?.fiber,
        caffeine: savedMeal.extendedMetrics?.caffeine,
        fresh_produce: savedMeal.extendedMetrics?.freshProduce
      };

      const result = await this.makeRequest(`/user/saved-meals/${savedMealId}`, 'PUT', serverSavedMeal);
      console.log('✅ Saved meal template updated on server');
      return result;
    } catch (error) {
      console.error('Error updating saved meal template:', error);
      throw error;
    }
  }

  /**
   * Delete saved meal template from server
   */
  static async deleteSavedMeal(savedMealId) {
    try {
      const result = await this.makeRequest(`/user/saved-meals/${savedMealId}`, 'DELETE');
      console.log('✅ Saved meal template deleted from server');
      return result;
    } catch (error) {
      console.error('Error deleting saved meal template:', error);
      throw error;
    }
  }

  /**
   * Sync all data from local storage to server
   */
  static async syncToServer() {
    try {
      console.log('🔄 Syncing data to server...');
      
      const StorageService = require('./storage');
      
      // Get all local meals
      const localMeals = await StorageService.getMeals();
      
      // Get all local saved meals
      const localSavedMeals = await StorageService.getSavedMeals();
      
      // Get local targets
      const localPreferences = await StorageService.getUserPreferences();
      const localTargets = localPreferences?.targets;
      
      // Save all meals to server
      for (const meal of localMeals) {
        try {
          await this.saveMeal(meal);
        } catch (error) {
          console.error(`Failed to sync meal ${meal.id}:`, error);
        }
      }
      
      // Save all saved meals to server
      for (const savedMeal of localSavedMeals) {
        try {
          await this.saveSavedMeal(savedMeal);
        } catch (error) {
          console.error(`Failed to sync saved meal ${savedMeal.id}:`, error);
        }
      }
      
      // Save targets to server
      if (localTargets) {
        try {
          await this.saveTargets(localTargets);
        } catch (error) {
          console.error('Failed to sync targets:', error);
        }
      }
      
      console.log('✅ Local sync to server completed');
      return { meals: localMeals, savedMeals: localSavedMeals, targets: localTargets };
    } catch (error) {
      console.error('❌ Local sync to server failed:', error);
      throw error;
    }
  }
}

export default ServerStorageService;
