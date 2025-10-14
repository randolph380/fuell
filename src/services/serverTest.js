/**
 * Server Connection Test
 * 
 * Simple test to verify server connectivity and API endpoints
 */

import ServerStorageService from './serverStorage';

class ServerTest {
  
  /**
   * Test basic server connectivity
   */
  static async testServerConnection() {
    try {
      console.log('🧪 Testing server connection...');
      
      // Test with a dummy user ID
      await ServerStorageService.setUserId('test_user_123');
      
      // Test getting meals (should return empty array for new user)
      const meals = await ServerStorageService.getMeals();
      console.log('✅ Server connection successful');
      console.log(`📊 Found ${meals.length} meals on server`);
      
      return {
        success: true,
        message: 'Server connection successful',
        mealsCount: meals.length
      };
    } catch (error) {
      console.error('❌ Server connection failed:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Test meal creation and retrieval
   */
  static async testMealOperations() {
    try {
      console.log('🧪 Testing meal operations...');
      
      // Create a test meal
      const testMeal = {
        id: Date.now().toString(),
        name: 'Test Meal',
        calories: 500,
        protein: 25,
        carbs: 50,
        fat: 20,
        timestamp: Date.now(),
        date: new Date().toDateString(),
        extendedMetrics: {
          fiber: 10,
          caffeine: 50,
          freshProduce: 100
        }
      };

      // Save meal to server
      const mealId = await ServerStorageService.saveMeal(testMeal);
      console.log('✅ Test meal saved to server:', mealId);

      // Retrieve meals from server
      const serverMeals = await ServerStorageService.getMeals();
      const savedMeal = serverMeals.find(m => m.id === testMeal.id);
      
      if (savedMeal) {
        console.log('✅ Test meal retrieved from server');
        
        // Clean up - delete test meal
        await ServerStorageService.deleteMeal(mealId);
        console.log('✅ Test meal deleted from server');
        
        return {
          success: true,
          message: 'Meal operations successful',
          mealId: mealId
        };
      } else {
        throw new Error('Test meal not found on server');
      }
    } catch (error) {
      console.error('❌ Meal operations failed:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Test targets operations
   */
  static async testTargetsOperations() {
    try {
      console.log('🧪 Testing targets operations...');
      
      // Test targets
      const testTargets = {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 80,
        processedPercent: 30,
        fiber: 25,
        caffeine: 200,
        freshProduce: 500
      };

      // Save targets to server
      await ServerStorageService.saveTargets(testTargets);
      console.log('✅ Test targets saved to server');

      // Retrieve targets from server
      const serverTargets = await ServerStorageService.getTargets();
      
      if (serverTargets && serverTargets.calories === testTargets.calories) {
        console.log('✅ Test targets retrieved from server');
        return {
          success: true,
          message: 'Targets operations successful',
          targets: serverTargets
        };
      } else {
        throw new Error('Test targets not found on server');
      }
    } catch (error) {
      console.error('❌ Targets operations failed:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests() {
    console.log('🚀 Starting server tests...');
    
    const results = {
      connection: await this.testServerConnection(),
      meals: await this.testMealOperations(),
      targets: await this.testTargetsOperations()
    };

    const allSuccessful = Object.values(results).every(result => result.success);
    
    console.log('📊 Test Results:', results);
    console.log(allSuccessful ? '✅ All tests passed!' : '❌ Some tests failed');
    
    return {
      success: allSuccessful,
      results: results
    };
  }
}

export default ServerTest;
