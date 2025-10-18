/**
 * Hybrid Storage Service
 * 
 * Combines local storage with server storage for seamless data management
 * Provides fallback to local storage when server is unavailable
 * Enables incremental migration from local-only to server-based storage
 */

import ServerStorageService from './serverStorage';
import StorageService from './storage';

class HybridStorageService {
  
  // Configuration flags
  static USE_SERVER_STORAGE = true;   // Toggle server storage on/off
  static SYNC_ON_LOGIN = true;        // Sync from server on login
  static SYNC_ON_SAVE = true;         // Sync to server on save
  static FALLBACK_TO_LOCAL = true;    // Use local storage if server fails

  /**
   * Set user ID for both local and server storage
   */
  static async setUserId(userId) {
    await StorageService.setUserId(userId);
    await ServerStorageService.setUserId(userId);
  }

  /**
   * Get user ID
   */
  static async getUserId() {
    return await StorageService.getUserId();
  }

  /**
   * Save meal with hybrid storage
   */
  static async saveMeal(meal) {
    try {
      console.log('🔄 HybridStorage saving meal:', {
        id: meal.id,
        name: meal.name,
        hasName: !!meal.name,
        nameLength: meal.name?.length
      });

      // Always save to local storage first
      const localSuccess = await StorageService.saveMeal(meal);
      
      if (!localSuccess) {
        throw new Error('Failed to save meal locally');
      }

      // Try to save to server if enabled
      console.log('🔍 Server storage config:', {
        USE_SERVER_STORAGE: this.USE_SERVER_STORAGE,
        SYNC_ON_SAVE: this.SYNC_ON_SAVE,
        FALLBACK_TO_LOCAL: this.FALLBACK_TO_LOCAL
      });
      
      if (this.USE_SERVER_STORAGE && this.SYNC_ON_SAVE) {
        console.log('🌐 Attempting to save to server...');
        try {
          await ServerStorageService.saveMeal(meal);
          console.log('✅ Meal saved to server with name:', meal.name);
        } catch (serverError) {
          console.warn('⚠️ Server save failed, using local storage only:', serverError);
          
          if (!this.FALLBACK_TO_LOCAL) {
            throw serverError;
          }
        }
      } else {
        console.log('❌ Server storage disabled or sync disabled');
      }

      return true;
    } catch (error) {
      console.error('Error saving meal:', error);
      return false;
    }
  }

  /**
   * Get meals with hybrid storage
   */
  static async getMeals() {
    try {
      // If server storage is enabled, try to get from server first
      if (this.USE_SERVER_STORAGE) {
        try {
          const serverMeals = await ServerStorageService.getMeals();
          console.log('✅ Meals loaded from server:', serverMeals.map(m => ({ id: m.id, name: m.name })));
          return serverMeals;
        } catch (serverError) {
          console.warn('⚠️ Server load failed, using local storage:', serverError);
        }
      }

      // Fallback to local storage
      const localMeals = await StorageService.getMeals();
      console.log('✅ Meals loaded from local storage:', localMeals.map(m => ({ id: m.id, name: m.name })));
      return localMeals;
    } catch (error) {
      console.error('Error getting meals:', error);
      return [];
    }
  }

  /**
   * Get meals by date with hybrid storage
   */
  static async getMealsByDate(date) {
    try {
      const allMeals = await this.getMeals();
      const dateString = date.toDateString();
      return allMeals.filter(meal => meal.date === dateString);
    } catch (error) {
      console.error('Error getting meals by date:', error);
      return [];
    }
  }

  /**
   * Update meal with hybrid storage
   */
  static async updateMeal(mealId, updatedMeal) {
    try {
      console.log('✏️ Updating meal:', mealId);
      
      // Update in local storage
      const localSuccess = await StorageService.updateMeal(mealId, updatedMeal);
      
      if (!localSuccess) {
        throw new Error('Failed to update meal in local storage');
      }

      // Try to update on server if enabled
      if (this.USE_SERVER_STORAGE && this.SYNC_ON_SAVE) {
        try {
          await ServerStorageService.updateMeal(mealId, updatedMeal);
          console.log('✅ Meal updated on server');
        } catch (serverError) {
          console.warn('⚠️ Server update failed:', serverError);
          
          if (!this.FALLBACK_TO_LOCAL) {
            throw serverError;
          }
        }
      }

      console.log('✅ Meal updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating meal:', error);
      return false;
    }
  }

  /**
   * Delete meal with hybrid storage
   */
  static async deleteMeal(mealId) {
    try {
      console.log('🗑️ Deleting meal:', mealId);
      
      // Delete from local storage first
      const localSuccess = await StorageService.deleteMeal(mealId);
      
      if (!localSuccess) {
        throw new Error('Failed to delete meal from local storage');
      }

      // Try to delete from server if enabled
      if (this.USE_SERVER_STORAGE && this.SYNC_ON_SAVE) {
        try {
          await ServerStorageService.deleteMeal(mealId);
          console.log('✅ Meal deleted from server');
        } catch (serverError) {
          console.warn('⚠️ Server delete failed:', serverError);
          
          if (!this.FALLBACK_TO_LOCAL) {
            throw serverError;
          }
        }
      }

      console.log('✅ Meal deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      return false;
    }
  }

  /**
   * Save user preferences with hybrid storage
   */
  static async saveUserPreferences(preferences) {
    try {
      // Save to local storage
      await StorageService.saveUserPreferences(preferences);

      // Try to save targets to server if enabled
      if (this.USE_SERVER_STORAGE && preferences.targets && this.SYNC_ON_SAVE) {
        try {
          await ServerStorageService.saveTargets(preferences.targets);
          console.log('✅ Targets saved to server');
        } catch (serverError) {
          console.warn('⚠️ Server targets save failed:', serverError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  }

  /**
   * Get user preferences with hybrid storage
   */
  static async getUserPreferences() {
    try {
      // If server storage is enabled, try to get targets from server
      if (this.USE_SERVER_STORAGE) {
        try {
          const serverTargets = await ServerStorageService.getTargets();
          if (serverTargets) {
            const localPreferences = await StorageService.getUserPreferences();
            return {
              ...localPreferences,
              targets: serverTargets
            };
          }
        } catch (serverError) {
          console.warn('⚠️ Server targets load failed:', serverError);
        }
      }

      // Fallback to local storage
      return await StorageService.getUserPreferences();
    } catch (error) {
      console.error('Error getting preferences:', error);
      return {};
    }
  }

  /**
   * Sync all data from server (on login)
   */
  static async syncFromServer() {
    if (!this.USE_SERVER_STORAGE || !this.SYNC_ON_LOGIN) {
      console.log('🔄 Server sync disabled');
      return;
    }

    try {
      console.log('🔄 Syncing data from server...');
      const result = await ServerStorageService.syncFromServer();
      console.log('✅ Server sync completed');
      return result;
    } catch (error) {
      console.error('❌ Server sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync all data to server (manual sync)
   */
  static async syncToServer() {
    if (!this.USE_SERVER_STORAGE) {
      console.log('🔄 Server sync disabled');
      return;
    }

    try {
      console.log('🔄 Syncing data to server...');
      const result = await ServerStorageService.syncToServer();
      console.log('✅ Local sync to server completed');
      return result;
    } catch (error) {
      console.error('❌ Local sync to server failed:', error);
      throw error;
    }
  }

  /**
   * Clear all data (both local and server)
   */
  static async clearAllData() {
    try {
      // Clear local storage
      await StorageService.clearAllData();

      // Try to clear server data if enabled
      if (this.USE_SERVER_STORAGE) {
        try {
          // Get all meals and delete them from server
          const meals = await StorageService.getMeals();
          for (const meal of meals) {
            try {
              await ServerStorageService.deleteMeal(meal.id);
            } catch (error) {
              console.warn(`Failed to delete meal ${meal.id} from server:`, error);
            }
          }
          console.log('✅ Server data cleared');
        } catch (serverError) {
          console.warn('⚠️ Server clear failed:', serverError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Sync all local meals to server
   */
  static async syncLocalMealsToServer() {
    try {
      console.log('🔄 Starting sync of local meals to server...');
      
      // Get all local meals
      const localMeals = await StorageService.getMeals();
      console.log(`📊 Found ${localMeals.length} local meals to sync`);
      
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const meal of localMeals) {
        try {
          await ServerStorageService.saveMeal(meal);
          syncedCount++;
          console.log(`✅ Synced meal: ${meal.name} (${meal.id})`);
        } catch (error) {
          failedCount++;
          console.warn(`❌ Failed to sync meal: ${meal.name} (${meal.id})`, error);
        }
      }
      
      console.log(`📊 Sync complete: ${syncedCount} synced, ${failedCount} failed`);
      
      return {
        success: true,
        total: localMeals.length,
        synced: syncedCount,
        failed: failedCount
      };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get storage status
   */
  static getStorageStatus() {
    return {
      serverEnabled: this.USE_SERVER_STORAGE,
      syncOnLogin: this.SYNC_ON_LOGIN,
      syncOnSave: this.SYNC_ON_SAVE,
      fallbackToLocal: this.FALLBACK_TO_LOCAL
    };
  }

  /**
   * Toggle server storage on/off
   */
  static setServerStorage(enabled) {
    this.USE_SERVER_STORAGE = enabled;
    console.log(`🔄 Server storage ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle sync settings
   */
  static setSyncSettings(settings) {
    this.SYNC_ON_LOGIN = settings.syncOnLogin ?? this.SYNC_ON_LOGIN;
    this.SYNC_ON_SAVE = settings.syncOnSave ?? this.SYNC_ON_SAVE;
    this.FALLBACK_TO_LOCAL = settings.fallbackToLocal ?? this.FALLBACK_TO_LOCAL;
    console.log('🔄 Sync settings updated:', settings);
  }

  // Additional methods needed for compatibility with existing app

  /**
   * Get all daily macros (for trends/history)
   */
  static async getAllDailyMacros() {
    try {
      return await StorageService.getAllDailyMacros();
    } catch (error) {
      console.error('Error getting daily macros:', error);
      return {};
    }
  }

  /**
   * Get saved meals (templates) with hybrid storage
   */
  static async getSavedMeals() {
    try {
      // If server storage is enabled, try to get from server first
      if (this.USE_SERVER_STORAGE) {
        try {
          const serverSavedMeals = await ServerStorageService.getSavedMeals();
          console.log('✅ Saved meals loaded from server:', serverSavedMeals.map(m => ({ id: m.id, name: m.name })));
          return serverSavedMeals;
        } catch (serverError) {
          console.warn('⚠️ Server load failed, using local storage:', serverError);
        }
      }

      // Fallback to local storage
      const localSavedMeals = await StorageService.getSavedMeals();
      console.log('✅ Saved meals loaded from local storage:', localSavedMeals.map(m => ({ id: m.id, name: m.name })));
      return localSavedMeals;
    } catch (error) {
      console.error('Error getting saved meals:', error);
      return [];
    }
  }

  /**
   * Save meal template with hybrid storage
   */
  static async saveMealTemplate(meal) {
    try {
      console.log('🔄 HybridStorage saving meal template:', {
        id: meal.id,
        name: meal.name,
        hasName: !!meal.name,
        nameLength: meal.name?.length
      });

      // Always save to local storage first
      const localSuccess = await StorageService.saveMealTemplate(meal);
      
      if (!localSuccess) {
        throw new Error('Failed to save meal template locally');
      }

      // Try to save to server if enabled
      if (this.USE_SERVER_STORAGE && this.SYNC_ON_SAVE) {
        console.log('🌐 Attempting to save saved meal to server...');
        try {
          await ServerStorageService.saveSavedMeal(meal);
          console.log('✅ Saved meal template saved to server with name:', meal.name);
        } catch (serverError) {
          console.warn('⚠️ Server save failed, using local storage only:', serverError);
          
          if (!this.FALLBACK_TO_LOCAL) {
            throw serverError;
          }
        }
      } else {
        console.log('❌ Server storage disabled or sync disabled for saved meals');
      }

      return true;
    } catch (error) {
      console.error('Error saving meal template:', error);
      return false;
    }
  }

  /**
   * Update saved meal template with hybrid storage
   */
  static async updateSavedMeal(mealId, updatedMeal) {
    try {
      console.log('✏️ Updating saved meal template:', mealId);
      
      // Update in local storage
      const localSuccess = await StorageService.updateSavedMeal(mealId, updatedMeal);
      
      if (!localSuccess) {
        throw new Error('Failed to update saved meal in local storage');
      }

      // Try to update on server if enabled
      if (this.USE_SERVER_STORAGE && this.SYNC_ON_SAVE) {
        try {
          await ServerStorageService.updateSavedMeal(mealId, updatedMeal);
          console.log('✅ Saved meal template updated on server');
        } catch (serverError) {
          console.warn('⚠️ Server update failed:', serverError);
          
          if (!this.FALLBACK_TO_LOCAL) {
            throw serverError;
          }
        }
      }

      console.log('✅ Saved meal template updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating saved meal:', error);
      return false;
    }
  }

  /**
   * Delete saved meal template with hybrid storage
   */
  static async deleteSavedMeal(mealId) {
    try {
      console.log('🗑️ Deleting saved meal template:', mealId);
      
      // Delete from local storage first
      const localSuccess = await StorageService.deleteSavedMeal(mealId);
      
      if (!localSuccess) {
        throw new Error('Failed to delete saved meal from local storage');
      }

      // Try to delete from server if enabled
      if (this.USE_SERVER_STORAGE && this.SYNC_ON_SAVE) {
        try {
          await ServerStorageService.deleteSavedMeal(mealId);
          console.log('✅ Saved meal template deleted from server');
        } catch (serverError) {
          console.warn('⚠️ Server delete failed:', serverError);
          
          if (!this.FALLBACK_TO_LOCAL) {
            throw serverError;
          }
        }
      }

      console.log('✅ Saved meal template deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting saved meal:', error);
      return false;
    }
  }

  /**
   * Clear user ID
   */
  static async clearUserId() {
    try {
      return await StorageService.clearUserId();
    } catch (error) {
      console.error('Error clearing user ID:', error);
      return false;
    }
  }
}

export default HybridStorageService;
