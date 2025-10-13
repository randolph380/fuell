import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from './storage';

/**
 * Simple Backup Service - No Cloud Sync
 * 
 * Provides basic backup/restore functionality without complex cloud integration
 * Uses existing StorageService and simple file operations
 */
class SimpleBackup {
  
  // Use device document directory for backups
  static BACKUP_DIR = FileSystem.documentDirectory + 'backups/';
  
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
   * @param {string} format - 'json' or 'csv'
   * @returns {Promise<string>} File path
   */
  static async exportToFile(format = 'json') {
    try {
      const backupData = await this.createBackup();
      const timestamp = Date.now();
      
      if (format === 'csv') {
        const fileName = `fuel_backup_${backupData.userId}_${timestamp}.csv`;
        const filePath = `${this.BACKUP_DIR}${fileName}`;
        
        // Ensure backup directory exists
        const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(this.BACKUP_DIR, { intermediates: true });
        }
        
        // Convert to CSV
        const csvContent = this.convertToCSV(backupData);
        await FileSystem.writeAsStringAsync(filePath, csvContent);
        
        console.log('CSV backup exported to:', filePath);
        return filePath;
      } else {
        const fileName = `fuel_backup_${backupData.userId}_${timestamp}.json`;
        const filePath = `${this.BACKUP_DIR}${fileName}`;
        
        // Ensure backup directory exists
        const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(this.BACKUP_DIR, { intermediates: true });
        }
        
        // Write JSON backup file
        await FileSystem.writeAsStringAsync(
          filePath, 
          JSON.stringify(backupData, null, 2)
        );
        
        console.log('JSON backup exported to:', filePath);
        return filePath;
      }
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  }

  /**
   * Convert backup data to CSV format (meals only for easier plotting)
   * @param {Object} backupData - Backup data object
   * @returns {string} CSV content
   */
  static convertToCSV(backupData) {
    const { meals } = backupData.data;
    
    let csvContent = '';
    
    // Add basic metadata
    csvContent += '# Fuel App - Meals Export\n';
    csvContent += `# Export Date: ${new Date(backupData.timestamp).toLocaleDateString()}\n`;
    csvContent += `# Total Meals: ${meals ? meals.length : 0}\n`;
    csvContent += '\n';
    
    // Add meals data only (for easier plotting and analysis)
    csvContent += 'ID,Name,Calories,Protein,Carbs,Fat,Date,Timestamp,Processed%,Fiber,UltraProcessed%,Caffeine,FreshProduce,ProcessedCalories,UltraProcessedCalories\n';
    if (meals && Array.isArray(meals)) {
      meals.forEach(meal => {
        const date = new Date(meal.timestamp || meal.date).toISOString().split('T')[0];
        const extended = meal.extendedMetrics || {};
        csvContent += `${meal.id},${meal.name || ''},${meal.calories || 0},${meal.protein || 0},${meal.carbs || 0},${meal.fat || 0},${date},${meal.timestamp || ''},${extended.processedPercent || ''},${extended.fiber || ''},${extended.ultraProcessedPercent || ''},${extended.caffeine || ''},${extended.freshProduce || ''},${extended.processedCalories || ''},${extended.ultraProcessedCalories || ''}\n`;
      });
    }
    
    return csvContent;
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

      // Import data directly to avoid duplicates and ensure correct structure
      const { meals, dailyMacros, savedMeals, preferences } = backupData.data;

      // Import meals directly
      if (meals && Array.isArray(meals)) {
        const mealsKey = await StorageService.getUserKey(StorageService.KEYS.MEALS);
        await AsyncStorage.setItem(mealsKey, JSON.stringify(meals));
      }

      // Import daily macros directly
      if (dailyMacros && typeof dailyMacros === 'object') {
        const dailyMacrosKey = await StorageService.getUserKey(StorageService.KEYS.DAILY_MACROS);
        await AsyncStorage.setItem(dailyMacrosKey, JSON.stringify(dailyMacros));
      }

      // Import saved meals directly
      if (savedMeals && Array.isArray(savedMeals)) {
        const savedMealsKey = await StorageService.getUserKey(StorageService.KEYS.SAVED_MEALS);
        await AsyncStorage.setItem(savedMealsKey, JSON.stringify(savedMeals));
      }

      // Import preferences directly
      if (preferences && typeof preferences === 'object') {
        const preferencesKey = await StorageService.getUserKey(StorageService.KEYS.USER_PREFERENCES);
        await AsyncStorage.setItem(preferencesKey, JSON.stringify(preferences));
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
