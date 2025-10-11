import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ClerkWrapper } from './src/components/ClerkWrapper';
import { Colors } from './src/constants/colors';
import CameraScreen from './src/screens/CameraScreen';
import TrendsScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import SavedMealsScreen from './src/screens/SavedMealsScreen';
import SignInScreen from './src/screens/SignInScreen';

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
          },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
            letterSpacing: -0.4,
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Fuell' }}
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
