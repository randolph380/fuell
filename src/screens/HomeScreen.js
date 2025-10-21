import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import DateNavigator from '../components/DateNavigator';
import MacroDisplay from '../components/MacroDisplay';
import MealCard from '../components/MealCard';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';
import HybridStorageService from '../services/hybridStorage';
import DateHelpers from '../utils/dateHelpers';
import { calculateAggregatedProcessed, calculateAggregatedUltraProcessed } from '../utils/extendedMetrics';

const HomeScreen = ({ navigation, route }) => {
  const { signOut } = useAuth();
  const { user } = useUser();
  
  // Get target date from route params or default to today
  const initialDate = route.params?.targetDate ? new Date(route.params.targetDate) : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [meals, setMeals] = useState([]);
  const [dailyMacros, setDailyMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [dailyProcessedPercent, setDailyProcessedPercent] = useState(null);
  const [dailyUltraProcessedPercent, setDailyUltraProcessedPercent] = useState(null);
  const [dailyFiber, setDailyFiber] = useState(0);
  const [dailyCaffeine, setDailyCaffeine] = useState(0);
  const [dailyFreshProduce, setDailyFreshProduce] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [portionSize, setPortionSize] = useState('1');

  useEffect(() => {
    // Wait for user to be loaded before loading meals
    if (user?.id) {
      loadMeals();
    }
  }, [currentDate, user?.id]);

  // Auto-update to today when app opens (if no specific target date)
  useEffect(() => {
    const today = new Date();
    const isCurrentDateToday = currentDate.toDateString() === today.toDateString();
    
    // Only auto-update if we're not on today's date and there's no specific target date
    // This handles the case where the app was opened yesterday and is opened again today
    if (!isCurrentDateToday && !route.params?.targetDate) {
      console.log('DEBUG - Auto-updating to today on mount:', today.toDateString());
      setCurrentDate(today);
    }
  }, []); // Run once on mount

  // Handle route params changes (when returning from CameraScreen with target date)
  useEffect(() => {
    if (route.params?.targetDate) {
      const newDate = new Date(route.params.targetDate);
      console.log('DEBUG - Route params changed, setting date to:', newDate.toDateString());
      setCurrentDate(newDate);
    }
  }, [route.params?.targetDate]);

  // Reload meals when screen comes into focus (e.g., after logging a meal)
  useFocusEffect(
    useCallback(() => {
      console.log('DEBUG - useFocusEffect triggered, currentDate:', currentDate.toDateString());
      if (user?.id) {
        loadMeals();
      }
    }, [user?.id]) // Remove currentDate dependency to ensure it always runs on focus
  );


  const loadMeals = async () => {
    try {
      // Ensure user ID is set in storage before loading meals
      if (user?.id) {
        await HybridStorageService.setUserId(user.id);
      }
      
      const dateMeals = await HybridStorageService.getMealsByDate(currentDate);
      
      // Debug: Log meal names
      console.log('DEBUG - Loaded meals:', dateMeals.map(m => ({ name: m.name, id: m.id })));
      
      // Sort meals by timestamp - most recent first
      const sortedMeals = dateMeals.sort((a, b) => b.timestamp - a.timestamp);
      setMeals(sortedMeals);
      
      // Calculate daily totals
      const totals = dateMeals.reduce((acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      setDailyMacros(totals);
      
      // Calculate processed food percentage for the day
      const processedData = calculateAggregatedProcessed(dateMeals);
      setDailyProcessedPercent(processedData.processedPercent);
      
      // Calculate ultra-processed food percentage for the day
      const ultraProcessedData = calculateAggregatedUltraProcessed(dateMeals);
      setDailyUltraProcessedPercent(ultraProcessedData.ultraProcessedPercent);
      
      // Calculate total fiber for the day
      const totalFiber = dateMeals.reduce((sum, meal) => 
        sum + (meal.extendedMetrics?.fiber || 0), 0);
      setDailyFiber(totalFiber);
      
      // Calculate total caffeine for the day
      const totalCaffeine = dateMeals.reduce((sum, meal) => 
        sum + (meal.extendedMetrics?.caffeine || 0), 0);
      setDailyCaffeine(totalCaffeine);
      
      // Calculate total fresh produce for the day
      const totalFreshProduce = dateMeals.reduce((sum, meal) => 
        sum + (meal.extendedMetrics?.freshProduce || 0), 0);
      setDailyFreshProduce(totalFreshProduce);
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const deleteMeal = async (meal) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ UI: Deleting meal:', meal.id, meal.name);
            const success = await HybridStorageService.deleteMeal(meal.id);
            if (success) {
              console.log('✅ UI: Meal deleted successfully');
              await loadMeals();
            } else {
              console.error('❌ UI: Failed to delete meal');
              Alert.alert('Error', 'Failed to delete meal. Please try again.');
            }
          }
        }
      ]
    );
  };

  const saveMealAsTemplate = async (meal) => {
    try {
      const template = {
        id: Date.now().toString(),
        name: meal.name,
        calories: meal.baseMacros?.calories || meal.calories,
        protein: meal.baseMacros?.protein || meal.protein,
        carbs: meal.baseMacros?.carbs || meal.carbs,
        fat: meal.baseMacros?.fat || meal.fat,
        extendedMetrics: meal.extendedMetrics || null
      };
      await HybridStorageService.saveMealTemplate(template);
      Alert.alert('Success', 'Meal saved as template!');
    } catch (error) {
      console.error('Error saving meal template:', error);
      Alert.alert('Error', 'Failed to save meal template');
    }
  };

  const startEditingMeal = (meal) => {
    // Store base values (before portion multiplication)
    const baseMeal = meal.baseMacros || {
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat
    };
    
    setEditingMealId(meal.id);
    setEditedValues({
      calories: baseMeal.calories.toString(),
      protein: baseMeal.protein.toString(),
      carbs: baseMeal.carbs.toString(),
      fat: baseMeal.fat.toString()
    });
    setPortionSize(meal.portionSize?.toString() || '1');
  };

  const cancelEditing = () => {
    setEditingMealId(null);
    setEditedValues({});
    setPortionSize('1');
  };

  const saveEditedMeal = async (meal) => {
    try {
      const portion = parseFloat(portionSize) || 1;
      const baseCalories = parseInt(editedValues.calories) || meal.calories;
      const baseProtein = parseInt(editedValues.protein) || meal.protein;
      const baseCarbs = parseInt(editedValues.carbs) || meal.carbs;
      const baseFat = parseInt(editedValues.fat) || meal.fat;
      
      const updatedMeal = {
        ...meal,
        calories: Math.round(baseCalories * portion),
        protein: Math.round(baseProtein * portion),
        carbs: Math.round(baseCarbs * portion),
        fat: Math.round(baseFat * portion),
        portionSize: portion,
        baseMacros: {
          calories: baseCalories,
          protein: baseProtein,
          carbs: baseCarbs,
          fat: baseFat
        }
      };
      
      // Update the meal in storage
      await HybridStorageService.updateMeal(meal.id, updatedMeal);
      
      await loadMeals();
      setEditingMealId(null);
      setEditedValues({});
      setPortionSize('1');
      Alert.alert('Success', '✅ Meal updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update meal');
    }
  };

  const navigateToCamera = () => {
    navigation.navigate('Camera', { targetDate: currentDate.toISOString() });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await HybridStorageService.clearUserId();
            await signOut();
          }
        }
      ]
    );
  };

  const formatMealTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isToday = DateHelpers.isToday(currentDate);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
      {/* Date Navigator with Hamburger Menu */}
      <DateNavigator 
        currentDate={currentDate} 
        onDateChange={handleDateChange}
        navigation={navigation}
      />

      {/* Daily Totals */}
      <MacroDisplay macros={dailyMacros} processedPercent={dailyProcessedPercent} ultraProcessedPercent={dailyUltraProcessedPercent} fiber={dailyFiber} caffeine={dailyCaffeine} freshProduce={dailyFreshProduce} />

      {/* Action Buttons Row */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.addNewMealButton} onPress={navigateToCamera}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.addNewMealText}>
            {isToday ? 'Add New Meal' : `Add New Meal`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.savedMealsButton} onPress={() => navigation.navigate('SavedMeals')}>
          <Ionicons name="bookmark" size={20} color={Colors.primary} />
          <Text style={styles.savedMealsText}>Saved Meals</Text>
        </TouchableOpacity>
      </View>


      {/* Meals List */}
      <View style={styles.mealsSection}>
        <Text style={styles.sectionTitle}>
          {isToday ? "Today's Meals" : DateHelpers.formatDate(currentDate, 'short')}
        </Text>
        
        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textTertiary} style={{ opacity: 0.3, marginBottom: Spacing.md }} />
            <Text style={styles.emptyText}>No meals logged yet</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={navigateToCamera}>
              <Text style={styles.emptyButtonText}>Add Your First Meal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealContainer}>
              {editingMealId === meal.id ? (
                // Edit Mode - Inline editing
                <View style={styles.editCard}>
                  <View style={styles.editHeader}>
                    <Text style={styles.editTitle}>EDITING: {meal.name}</Text>
                  </View>
                  
                  {/* Portion Size */}
                  <View style={styles.portionRow}>
                    <Text style={styles.portionLabel}>Portion Size</Text>
                    <View style={styles.portionInputContainer}>
                      <TextInput
                        style={styles.portionInput}
                        value={portionSize}
                        onChangeText={setPortionSize}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        returnKeyType="done"
                        blurOnSubmit={true}
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                      <Text style={styles.portionX}>x</Text>
                    </View>
                  </View>
                  
                  {/* Base Macros (per 1x portion) */}
                  <Text style={styles.baseMacrosLabel}>Base Values (1x portion):</Text>
                  
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Calories (kcal)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editedValues.calories}
                      onChangeText={(text) => setEditedValues({...editedValues, calories: text})}
                      keyboardType="numeric"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Protein (g)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editedValues.protein}
                      onChangeText={(text) => setEditedValues({...editedValues, protein: text})}
                      keyboardType="numeric"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Carbs (g)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editedValues.carbs}
                      onChangeText={(text) => setEditedValues({...editedValues, carbs: text})}
                      keyboardType="numeric"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Fat (g)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editedValues.fat}
                      onChangeText={(text) => setEditedValues({...editedValues, fat: text})}
                      keyboardType="numeric"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  
                  {/* Preview of final values */}
                  {portionSize && parseFloat(portionSize) !== 1 && (
                    <View style={styles.previewContainer}>
                      <Text style={styles.previewTitle}>Final values ({portionSize}x):</Text>
                      <Text style={styles.previewText}>
                        {Math.round((parseInt(editedValues.calories) || 0) * parseFloat(portionSize))} cal | {' '}
                        {Math.round((parseInt(editedValues.protein) || 0) * parseFloat(portionSize))}g protein | {' '}
                        {Math.round((parseInt(editedValues.carbs) || 0) * parseFloat(portionSize))}g carbs | {' '}
                        {Math.round((parseInt(editedValues.fat) || 0) * parseFloat(portionSize))}g fat
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.editActions}>
                    <TouchableOpacity 
                      style={[styles.editActionButton, styles.cancelButton]} 
                      onPress={cancelEditing}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.editActionButton, styles.saveEditButton]} 
                      onPress={() => saveEditedMeal(meal)}
                    >
                      <Text style={styles.saveEditButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Normal Mode
                <MealCard
                  meal={{
                    id: meal.id,
                    name: meal.name + (meal.portionSize && meal.portionSize !== 1 ? ` (${meal.portionSize}x)` : ''),
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                    time: formatMealTime(meal.timestamp),
                    extendedMetrics: meal.extendedMetrics
                  }}
                  onDelete={deleteMeal}
                  onSave={saveMealAsTemplate}
                  onEdit={() => startEditingMeal(meal)}
                />
              )}
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '600',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingTight,
    marginBottom: Spacing.xs,
  },
  headerDate: {
    fontSize: Typography.sm,
    color: Colors.textInverse,
    opacity: 0.8,
    letterSpacing: Typography.letterSpacingNormal,
  },
  addMealButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    ...Shadows.sm,
  },
  addMealText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
    marginLeft: Spacing.sm,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  addNewMealButton: {
    backgroundColor: Colors.primary,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.base,
    ...Shadows.sm,
  },
  addNewMealText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
    marginLeft: Spacing.sm,
  },
  savedMealsButton: {
    backgroundColor: Colors.backgroundElevated,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  savedMealsText: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
    marginLeft: Spacing.sm,
  },
  mealsSection: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacingWide,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
    letterSpacing: Typography.letterSpacingNormal,
  },
  emptyButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    ...Shadows.sm,
  },
  emptyButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
  },
  mealContainer: {
    marginBottom: Spacing.md,
  },
  editCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.accent,
    ...Shadows.base,
  },
  editHeader: {
    marginBottom: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  editTitle: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingTight,
  },
  portionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  portionLabel: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  portionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portionInput: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.lg,
    textAlign: 'center',
    width: 70,
    backgroundColor: Colors.backgroundSubtle,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  portionX: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.accent,
    marginLeft: Spacing.sm,
  },
  baseMacrosLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacingWide,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  editLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    flex: 1,
    letterSpacing: Typography.letterSpacingNormal,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.base,
    textAlign: 'center',
    width: 100,
    backgroundColor: Colors.backgroundSubtle,
    color: Colors.textPrimary,
  },
  previewContainer: {
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  previewTitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.info,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacingWide,
  },
  previewText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: Spacing.base,
    gap: Spacing.md,
  },
  editActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  saveEditButton: {
    backgroundColor: Colors.accent,
    ...Shadows.sm,
  },
  saveEditButtonText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingNormal,
  },
});

export default HomeScreen;
