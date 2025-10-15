import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import HybridStorageService from '../services/hybridStorage';
import ServerTest from '../services/serverTest';

const ServerTestScreen = ({ navigation }) => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await ServerTest.runAllTests();
      setTestResults(results);
      
      if (results.success) {
        Alert.alert('Success!', 'All server tests passed! 🎉');
      } else {
        Alert.alert('Tests Failed', 'Some tests failed. Check console for details.');
      }
    } catch (error) {
      Alert.alert('Error', 'Test execution failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const testHybridStorage = async () => {
    try {
      console.log('🧪 Starting Hybrid Storage Test...');
      
      // Test 1: Set user ID
      console.log('👤 Setting test user ID...');
      await HybridStorageService.setUserId('test_user_123');
      const userId = await HybridStorageService.getUserId();
      console.log('✅ User ID set:', userId);
      
      // Test 2: Get initial meals count
      console.log('📊 Getting initial meals...');
      const initialMeals = await HybridStorageService.getMeals();
      console.log('📊 Initial meals count:', initialMeals.length);
      console.log('📊 Initial meals:', initialMeals.map(m => ({ id: m.id, name: m.name })));
      
      // Test 3: Create test meal
      const testMeal = {
        id: Date.now().toString(),
        name: 'Hybrid Test Meal',
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: 15,
        timestamp: Date.now(),
        date: new Date().toDateString(),
        extendedMetrics: {
          fiber: 5,
          caffeine: 25,
          freshProduce: 50
        }
      };
      console.log('🍽️ Test meal created:', testMeal);
      
      // Test 4: Save meal
      console.log('💾 Saving test meal...');
      const saveResult = await HybridStorageService.saveMeal(testMeal);
      console.log('💾 Save result:', saveResult);
      
      // Test 5: Retrieve meals after save
      console.log('📥 Retrieving meals after save...');
      const mealsAfterSave = await HybridStorageService.getMeals();
      console.log('📥 Meals after save:', mealsAfterSave.length);
      console.log('📥 Meals after save:', mealsAfterSave.map(m => ({ id: m.id, name: m.name })));
      
      // Test 6: Find our test meal
      const savedTestMeal = mealsAfterSave.find(m => m.id === testMeal.id);
      console.log('🔍 Found test meal:', savedTestMeal);
      
      // Test 7: Test meal update
      console.log('✏️ Testing meal update...');
      const updatedMeal = { ...savedTestMeal, name: 'Updated Test Meal', calories: 400 };
      const updateResult = await HybridStorageService.updateMeal(testMeal.id, updatedMeal);
      console.log('✏️ Update result:', updateResult);
      
      // Test 8: Verify update
      const mealsAfterUpdate = await HybridStorageService.getMeals();
      const updatedTestMeal = mealsAfterUpdate.find(m => m.id === testMeal.id);
      console.log('✅ Updated meal:', updatedTestMeal);
      
      // Test 9: Test meal deletion
      console.log('🗑️ Testing meal deletion...');
      const deleteResult = await HybridStorageService.deleteMeal(testMeal.id);
      console.log('🗑️ Delete result:', deleteResult);
      
      // Test 10: Verify deletion
      const mealsAfterDelete = await HybridStorageService.getMeals();
      console.log('📥 Meals after delete:', mealsAfterDelete.length);
      const deletedMeal = mealsAfterDelete.find(m => m.id === testMeal.id);
      console.log('✅ Meal deleted:', deletedMeal === undefined);
      
      // Summary
      const summary = {
        initialCount: initialMeals.length,
        afterSaveCount: mealsAfterSave.length,
        afterUpdateCount: mealsAfterUpdate.length,
        afterDeleteCount: mealsAfterDelete.length,
        saveWorked: mealsAfterSave.length > initialMeals.length,
        updateWorked: updatedTestMeal?.name === 'Updated Test Meal',
        deleteWorked: deletedMeal === undefined,
        testMealFound: !!savedTestMeal,
        testMealName: savedTestMeal?.name
      };
      
      console.log('📋 Test Summary:', summary);
      
      Alert.alert(
        'Hybrid Storage Test Results',
        `Initial: ${summary.initialCount}\n` +
        `After Save: ${summary.afterSaveCount}\n` +
        `After Update: ${summary.afterUpdateCount}\n` +
        `After Delete: ${summary.afterDeleteCount}\n\n` +
        `Save: ${summary.saveWorked ? '✅' : '❌'}\n` +
        `Update: ${summary.updateWorked ? '✅' : '❌'}\n` +
        `Delete: ${summary.deleteWorked ? '✅' : '❌'}\n` +
        `Meal Name: ${summary.testMealName || 'Not Found'}`
      );
      
    } catch (error) {
      console.error('❌ Hybrid Storage Test Failed:', error);
      Alert.alert('Error', 'Hybrid storage test failed: ' + error.message);
    }
  };

  const getStorageStatus = () => {
    const status = HybridStorageService.getStorageStatus();
    return `Server: ${status.serverEnabled ? 'ON' : 'OFF'}\nSync on Login: ${status.syncOnLogin ? 'ON' : 'OFF'}\nSync on Save: ${status.syncOnSave ? 'ON' : 'OFF'}`;
  };

  const runStorageDiagnostics = async () => {
    try {
      console.log('🔍 Running Storage Diagnostics...');
      
      // Get current user ID
      const userId = await HybridStorageService.getUserId();
      console.log('👤 Current User ID:', userId);
      
      // Get storage status
      const status = HybridStorageService.getStorageStatus();
      console.log('⚙️ Storage Status:', status);
      
      // Get all meals
      const allMeals = await HybridStorageService.getMeals();
      console.log('🍽️ All Meals Count:', allMeals.length);
      console.log('🍽️ All Meals:', allMeals.map(m => ({ 
        id: m.id, 
        name: m.name, 
        calories: m.calories,
        hasName: !!m.name,
        nameLength: m.name?.length 
      })));
      
      // Get saved meals
      const savedMeals = await HybridStorageService.getSavedMeals();
      console.log('💾 Saved Meals Count:', savedMeals.length);
      
      // Get user preferences
      const preferences = await HybridStorageService.getUserPreferences();
      console.log('⚙️ User Preferences:', preferences);
      
      // Check for meals with missing names
      const mealsWithMissingNames = allMeals.filter(m => !m.name || m.name === 'Meal');
      console.log('⚠️ Meals with missing names:', mealsWithMissingNames.length);
      console.log('⚠️ Meals with missing names:', mealsWithMissingNames.map(m => ({ id: m.id, name: m.name })));
      
      // Summary
      const diagnostics = {
        userId: userId,
        serverEnabled: status.serverEnabled,
        totalMeals: allMeals.length,
        savedMeals: savedMeals.length,
        mealsWithMissingNames: mealsWithMissingNames.length,
        hasPreferences: Object.keys(preferences).length > 0,
        mealNames: allMeals.map(m => m.name),
        uniqueNames: [...new Set(allMeals.map(m => m.name))],
        allNamesAreMeal: allMeals.every(m => m.name === 'Meal' || !m.name)
      };
      
      console.log('📋 Diagnostics Summary:', diagnostics);
      
      Alert.alert(
        'Storage Diagnostics',
        `User ID: ${diagnostics.userId || 'None'}\n` +
        `Server: ${diagnostics.serverEnabled ? 'ON' : 'OFF'}\n` +
        `Total Meals: ${diagnostics.totalMeals}\n` +
        `Saved Meals: ${diagnostics.savedMeals}\n` +
        `Missing Names: ${diagnostics.mealsWithMissingNames}\n` +
        `Has Preferences: ${diagnostics.hasPreferences ? 'Yes' : 'No'}\n\n` +
        `Unique Names: ${diagnostics.uniqueNames.join(', ')}\n` +
        `All Names Are 'Meal': ${diagnostics.allNamesAreMeal ? 'Yes' : 'No'}`
      );
      
    } catch (error) {
      console.error('❌ Storage Diagnostics Failed:', error);
      Alert.alert('Error', 'Storage diagnostics failed: ' + error.message);
    }
  };

  const syncLocalMeals = async () => {
    try {
      console.log('🔄 Starting sync of local meals to server...');
      
      const result = await HybridStorageService.syncLocalMealsToServer();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete!',
          `Synced ${result.synced} of ${result.total} meals to server.\n` +
          `Failed: ${result.failed}`
        );
      } else {
        Alert.alert('Sync Failed', result.error);
      }
    } catch (error) {
      console.error('❌ Sync Failed:', error);
      Alert.alert('Error', 'Sync failed: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Server Integration Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Status</Text>
        <Text style={styles.statusText}>{getStorageStatus()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Tests</Text>
        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]} 
          onPress={runTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run Server Tests'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hybrid Storage Test</Text>
        <TouchableOpacity style={styles.button} onPress={testHybridStorage}>
          <Text style={styles.buttonText}>Test Hybrid Storage</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Diagnostics</Text>
        <TouchableOpacity style={styles.button} onPress={runStorageDiagnostics}>
          <Text style={styles.buttonText}>🔍 Run Diagnostics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Local Data</Text>
        <TouchableOpacity style={styles.button} onPress={syncLocalMeals}>
          <Text style={styles.buttonText}>🔄 Sync All Meals to Server</Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <Text style={styles.resultText}>
            Overall: {testResults.success ? '✅ PASSED' : '❌ FAILED'}
          </Text>
          <Text style={styles.resultText}>
            Connection: {testResults.results.connection.success ? '✅' : '❌'}
          </Text>
          <Text style={styles.resultText}>
            Meals: {testResults.results.meals.success ? '✅' : '❌'}
          </Text>
          <Text style={styles.resultText}>
            Targets: {testResults.results.targets.success ? '✅' : '❌'}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ServerTestScreen;
