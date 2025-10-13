import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import StorageService from './storage';

/**
 * Simple Backup Service - No Cloud Sync
 * 
 * Provides basic backup/restore functionality without complex cloud integration
 * Uses existing StorageService and simple file operations
 */
class SimpleBackup {
  
  // Backup directory in project folder
  static BACKUP_DIR = '/Users/randolphlopez/MacroTracker/backups/';
  
  /**
   * Create a backup of all user data
   * @returns {Promise<Object>} Backup data
   */
  static async createBackup() {
    try {
      const userId = await StorageService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get all user data
      const [meals, dailyMacros, savedMeals, preferences] = await Promise.all([
        StorageService.getMeals(),
        StorageService.getAllDailyMacros(),
        StorageService.getSavedMeals(),
        StorageService.getUserPreferences()
      ]);

      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        userId: userId,
        data: {
          meals,
          dailyMacros,
          savedMeals,
          preferences
        }
      };

      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Export backup to file
   * @returns {Promise<string>} File path
   */
  static async exportToFile() {
    try {
      const backupData = await this.createBackup();
      const fileName = `fuel_backup_${backupData.userId}_${Date.now()}.json`;
      const filePath = `${this.BACKUP_DIR}${fileName}`;
      
      // Ensure backup directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.BACKUP_DIR, { intermediates: true });
      }
      
      // Write backup file
      await FileSystem.writeAsStringAsync(
        filePath, 
        JSON.stringify(backupData, null, 2)
      );
      
      console.log('Backup exported to:', filePath);
      return filePath;
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  }

  /**
   * Share backup file
   * @param {string} filePath - Path to backup file
   * @returns {Promise<boolean>} Success status
   */
  static async shareBackup(filePath) {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing not available on this device');
      }
      await Sharing.shareAsync(filePath);
      return true;
    } catch (error) {
      console.error('Error sharing backup:', error);
      throw error;
    }
  }

  /**
   * Import backup from file
   * @param {string} filePath - Path to backup file
   * @returns {Promise<boolean>} Success status
   */
  static async importFromFile(filePath) {
    try {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const backupData = JSON.parse(fileContent);
      
      // Validate backup data
      if (!backupData || !backupData.data || !backupData.userId) {
        throw new Error('Invalid backup file format');
      }

      const currentUserId = await StorageService.getUserId();
      if (backupData.userId !== currentUserId) {
        throw new Error('Backup file is for a different user account');
      }

      // Clear existing data
      await StorageService.clearAllData();

      // Import data
      const { meals, dailyMacros, savedMeals, preferences } = backupData.data;

      // Import meals
      if (meals && Array.isArray(meals)) {
        for (const meal of meals) {
          await StorageService.saveMeal(meal);
        }
      }

      // Import daily macros
      if (dailyMacros && typeof dailyMacros === 'object') {
        for (const [date, macros] of Object.entries(dailyMacros)) {
          await StorageService.saveDailyMacros(date, macros);
        }
      }

      // Import saved meals
      if (savedMeals && Array.isArray(savedMeals)) {
        for (const savedMeal of savedMeals) {
          await StorageService.saveMealTemplate(savedMeal);
        }
      }

      // Import preferences
      if (preferences && typeof preferences === 'object') {
        await StorageService.saveUserPreferences(preferences);
      }

      console.log('Backup imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing backup:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   * @returns {Promise<Object>} Backup stats
   */
  static async getBackupStats() {
    try {
      const [meals, savedMeals, dailyMacros, preferences] = await Promise.all([
        StorageService.getMeals(),
        StorageService.getSavedMeals(),
        StorageService.getAllDailyMacros(),
        StorageService.getUserPreferences()
      ]);

      return {
        totalMeals: meals.length,
        savedMeals: savedMeals.length,
        dailyRecords: Object.keys(dailyMacros).length,
        hasPreferences: Object.keys(preferences).length > 0
      };
    } catch (error) {
      console.error('Error getting backup stats:', error);
      return {
        totalMeals: 0,
        savedMeals: 0,
        dailyRecords: 0,
        hasPreferences: false
      };
    }
  }
}

export default SimpleBackup;
