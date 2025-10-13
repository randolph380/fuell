import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Text, View } from 'react-native';
import { ClerkWrapper } from './src/components/ClerkWrapper';
import { Colors } from './src/constants/colors';
import CameraScreen from './src/screens/CameraScreen';
import EditTargetsScreen from './src/screens/EditTargetsScreen';
import TrendsScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import SavedMealsScreen from './src/screens/SavedMealsScreen';
import SignInScreen from './src/screens/SignInScreen';
import SimpleBackupScreen from './src/screens/SimpleBackupScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
            height: 60, // Reduced from default ~90px
          },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16, // Reduced from 17
            letterSpacing: -0.4,
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'Fuell',
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: Colors.textInverse, fontSize: 16, fontWeight: '600', letterSpacing: -0.4 }}>Fuell</Text>
                <Ionicons name="flash" size={14} color={Colors.textInverse} style={{ marginLeft: 4 }} />
              </View>
            )
          }}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{ title: 'Analyze meal' }}
        />
        <Stack.Screen 
          name="Trends" 
          component={TrendsScreen}
          options={{ title: 'Trends' }}
        />
        <Stack.Screen 
          name="SavedMeals" 
          component={SavedMealsScreen}
          options={{ title: 'Saved Meals' }}
        />
        <Stack.Screen 
          name="EditTargets" 
          component={EditTargetsScreen}
          options={{ title: 'Edit Targets' }}
        />
        <Stack.Screen 
          name="Backup" 
          component={SimpleBackupScreen}
          options={{ title: 'Backup & Restore' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ClerkWrapper signInComponent={<SignInScreen />}>
      <AppNavigator />
    </ClerkWrapper>
  );
}
