import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ServerTest from '../services/serverTest';
import HybridStorageService from '../services/hybridStorage';

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
      // Set a test user ID
      await HybridStorageService.setUserId('test_user_123');
      
      // Test saving a meal
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

      await HybridStorageService.saveMeal(testMeal);
      Alert.alert('Success', 'Hybrid storage test completed! Check console for details.');
    } catch (error) {
      Alert.alert('Error', 'Hybrid storage test failed: ' + error.message);
    }
  };

  const getStorageStatus = () => {
    const status = HybridStorageService.getStorageStatus();
    return `Server: ${status.serverEnabled ? 'ON' : 'OFF'}\nSync on Login: ${status.syncOnLogin ? 'ON' : 'OFF'}\nSync on Save: ${status.syncOnSave ? 'ON' : 'OFF'}`;
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
