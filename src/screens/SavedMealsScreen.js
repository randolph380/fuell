import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import MealCard from '../components/MealCard';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';
import HybridStorageService from '../services/hybridStorage';

const SavedMealsScreen = ({ navigation }) => {
  const [savedMeals, setSavedMeals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState(null);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editedValues, setEditedValues] = useState({});

  useEffect(() => {
    loadSavedMeals();
  }, []);

  const loadSavedMeals = async () => {
    try {
      const meals = await HybridStorageService.getSavedMeals();
      // Filter out any invalid meals (missing name or all zeros)
      const validMeals = meals.filter(meal => 
        meal.name && 
        meal.id && 
        (meal.calories > 0 || meal.protein > 0 || meal.carbs > 0 || meal.fat > 0)
      );
      console.log('Loaded saved meals:', validMeals);
      setSavedMeals(validMeals);
    } catch (error) {
      console.error('Error loading saved meals:', error);
    }
  };

  const loadSavedMealsFromLocal = async () => {
    try {
      console.log('🔄 Loading saved meals from LOCAL storage only...');
      const meals = await StorageService.getSavedMeals();
      // Filter out any invalid meals (missing name or all zeros)
      const validMeals = meals.filter(meal => 
        meal.name && 
        meal.id && 
        (meal.calories > 0 || meal.protein > 0 || meal.carbs > 0 || meal.fat > 0)
      );
      console.log('Loaded LOCAL saved meals:', validMeals);
      setSavedMeals(validMeals);
    } catch (error) {
      console.error('Error loading local saved meals:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedMeals();
    setRefreshing(false);
  };

  const deleteSavedMeal = async (mealId) => {
    console.log('🗑️ deleteSavedMeal function called with mealId:', mealId);
    
    // Use browser confirm for web compatibility
    const confirmed = window.confirm('Are you sure you want to delete this saved meal?');
    
    if (confirmed) {
      try {
        console.log('🗑️ User confirmed deletion, deleting saved meal from UI:', mealId);
        const success = await HybridStorageService.deleteSavedMeal(mealId);
        console.log('🗑️ Delete result:', success);
        
        if (success) {
          console.log('🗑️ Refreshing saved meals list...');
          await loadSavedMeals();
          console.log('🗑️ Saved meals list refreshed');
        } else {
          console.error('❌ Delete failed');
        }
      } catch (error) {
        console.error('❌ Error deleting saved meal:', error);
      }
    } else {
      console.log('🗑️ User cancelled deletion');
    }
  };





  const logSavedMeal = async (savedMeal) => {
    try {
      console.log('🔍 Logging saved meal with extended metrics:', {
        mealName: savedMeal.name,
        hasExtendedMetrics: !!savedMeal.extendedMetrics,
        extendedMetrics: savedMeal.extendedMetrics
      });
      
      const meal = {
        id: Date.now().toString(),
        name: savedMeal.name,
        calories: savedMeal.calories,
        protein: savedMeal.protein,
        carbs: savedMeal.carbs,
        fat: savedMeal.fat,
        timestamp: new Date().getTime(),
        date: new Date().toDateString(),
        extendedMetrics: savedMeal.extendedMetrics || null
      };

      console.log('🔍 Final meal object for logging:', {
        mealName: meal.name,
        hasExtendedMetrics: !!meal.extendedMetrics,
        extendedMetrics: meal.extendedMetrics
      });

      await HybridStorageService.saveMeal(meal);
      Alert.alert('Success', 'Meal logged successfully! 🎉');
      setExpandedMealId(null); // Collapse after logging
    } catch (error) {
      console.error('Error logging saved meal:', error);
      Alert.alert('Error', 'Failed to log meal');
    }
  };

  const startEditingMeal = (meal) => {
    setEditingMealId(meal.id);
    setEditedValues({
      name: meal.name,
      calories: meal.calories.toString(),
      protein: meal.protein.toString(),
      carbs: meal.carbs.toString(),
      fat: meal.fat.toString(),
      fiber: meal.extendedMetrics?.fiber?.toString() || '0',
      caffeine: meal.extendedMetrics?.caffeine?.toString() || '0',
      freshProduce: meal.extendedMetrics?.freshProduce?.toString() || '0',
      processedPercent: meal.extendedMetrics?.processedPercent?.toString() || '0',
      ultraProcessedPercent: meal.extendedMetrics?.ultraProcessedPercent?.toString() || '0'
    });
    setExpandedMealId(null);
  };

  const cancelEditing = () => {
    Keyboard.dismiss();
    setEditingMealId(null);
    setEditedValues({});
  };

  const saveEditedMeal = async (meal) => {
    try {
      // Validate name is not empty
      if (!editedValues.name || editedValues.name.trim() === '') {
        Alert.alert('Error', 'Meal name cannot be empty');
        return;
      }

      // Create updated extended metrics object
      const updatedExtendedMetrics = {
        ...meal.extendedMetrics,
        fiber: parseFloat(editedValues.fiber) || 0,
        caffeine: parseFloat(editedValues.caffeine) || 0,
        freshProduce: parseFloat(editedValues.freshProduce) || 0,
        processedPercent: parseFloat(editedValues.processedPercent) || 0,
        ultraProcessedPercent: parseFloat(editedValues.ultraProcessedPercent) || 0
      };

      const updatedMeal = {
        ...meal,
        name: editedValues.name.trim(),
        calories: parseInt(editedValues.calories) || meal.calories,
        protein: parseInt(editedValues.protein) || meal.protein,
        carbs: parseInt(editedValues.carbs) || meal.carbs,
        fat: parseInt(editedValues.fat) || meal.fat,
        extendedMetrics: updatedExtendedMetrics
      };
      
      console.log('💾 Updating saved meal:', {
        mealId: meal.id,
        updatedName: updatedMeal.name,
        updatedCalories: updatedMeal.calories
      });
      
      const updateResult = await HybridStorageService.updateSavedMeal(meal.id, updatedMeal);
      
      if (!updateResult) {
        throw new Error('Update operation returned false');
      }
      
      await loadSavedMeals();
      Keyboard.dismiss();
      setEditingMealId(null);
      setEditedValues({});
      Alert.alert('Success', '✅ Meal updated!');
    } catch (error) {
      console.error('❌ Failed to update saved meal:', error);
      Alert.alert('Error', `Failed to update meal: ${error.message}`);
    }
  };

  const toggleExpanded = (mealId) => {
    setExpandedMealId(expandedMealId === mealId ? null : mealId);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? 'height' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={true}
        bounces={true}
      >

      {savedMeals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>No saved meals yet</Text>
          <Text style={styles.emptySubtext}>
            Save meals from the camera screen to use them again later
          </Text>
        </View>
      ) : (
        <View style={styles.mealsSection}>
          {savedMeals.map((meal) => (
            <View key={meal.id} style={styles.savedMealContainer}>
              {editingMealId === meal.id ? (
                // Edit Mode - Inline editing interface
                <View style={styles.editCard}>
                  <View style={styles.editHeader}>
                    <Text style={styles.editTitle}>EDITING MEAL</Text>
                  </View>
                  
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Meal Name</Text>
                    <TextInput
                      style={[styles.editInput, styles.nameInput]}
                      value={editedValues.name}
                      onChangeText={(text) => setEditedValues({...editedValues, name: text})}
                      placeholder="Enter meal name"
                      placeholderTextColor={Colors.textTertiary}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      selectTextOnFocus
                      onSubmitEditing={() => {
                        // Focus next input or dismiss keyboard
                        Keyboard.dismiss();
                      }}
                      blurOnSubmit={false}
                    />
                  </View>
                  
                  <View style={styles.editRow}>
                    <Text style={styles.editLabel}>Calories (kcal)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editedValues.calories}
                      onChangeText={(text) => setEditedValues({...editedValues, calories: text})}
                      keyboardType="numeric"
                      selectTextOnFocus
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
                    />
                  </View>
                  
                  {/* Secondary Metrics Section */}
                  <View style={styles.secondaryMetricsSection}>
                    <Text style={styles.secondaryMetricsTitle}>Secondary Metrics</Text>
                    
                    <View style={styles.editRow}>
                      <Text style={styles.editLabel}>Fiber (g)</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editedValues.fiber}
                        onChangeText={(text) => setEditedValues({...editedValues, fiber: text})}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                    
                    <View style={styles.editRow}>
                      <Text style={styles.editLabel}>Caffeine (mg)</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editedValues.caffeine}
                        onChangeText={(text) => setEditedValues({...editedValues, caffeine: text})}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                    
                    <View style={styles.editRow}>
                      <Text style={styles.editLabel}>Fresh Produce (g)</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editedValues.freshProduce}
                        onChangeText={(text) => setEditedValues({...editedValues, freshProduce: text})}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                    
                    <View style={styles.editRow}>
                      <Text style={styles.editLabel}>Processed %</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editedValues.processedPercent}
                        onChangeText={(text) => setEditedValues({...editedValues, processedPercent: text})}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                    
                    <View style={styles.editRow}>
                      <Text style={styles.editLabel}>Ultra-processed %</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editedValues.ultraProcessedPercent}
                        onChangeText={(text) => setEditedValues({...editedValues, ultraProcessedPercent: text})}
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                  </View>
                  
                  <View style={styles.editActions}>
                    <TouchableOpacity 
                      style={[styles.editActionButton, styles.cancelButton]} 
                      onPress={cancelEditing}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.editActionButton, styles.deleteEditButton]} 
                      onPress={() => {
                        console.log('🗑️ Delete button clicked in edit mode for meal:', meal.id);
                        deleteSavedMeal(meal.id);
                      }}
                    >
                      <Text style={styles.deleteEditButtonText}>Delete</Text>
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
                // Normal Mode - Regular meal card with inline action buttons
                <View style={styles.mealCardWithActions}>
                  <MealCard
                    meal={{
                      name: meal.name,
                      calories: meal.calories,
                      protein: meal.protein,
                      carbs: meal.carbs,
                      fat: meal.fat,
                      time: 'Saved'
                    }}
                    onPress={() => toggleExpanded(meal.id)}
                    onDelete={() => deleteSavedMeal(meal.id)}
                  />
                  
                  {/* Action Buttons - Inside meal card */}
                  <View style={styles.inlineActionButtons}>
                    <TouchableOpacity 
                      style={styles.inlineEditButton} 
                      onPress={() => startEditingMeal(meal)}
                    >
                      <Ionicons name="create-outline" size={20} color={Colors.primary} />
                      <Text style={styles.inlineEditButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.inlineLogButton} 
                      onPress={() => logSavedMeal(meal)}
                    >
                      <Ionicons name="add-circle" size={20} color="#fff" />
                      <Text style={styles.inlineLogButtonText}>Log</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
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
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  mealsSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  savedMealContainer: {
    marginBottom: Spacing.base,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.xs / 2,
  },
  logActionButton: {
    backgroundColor: Colors.success,
  },
  editButton: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  deleteActionButton: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  actionButtonText: {
    fontSize: Typography.xs,
    fontWeight: '500',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingNormal,
  },
  editButtonText: {
    color: Colors.accent,
  },
  deleteButtonText: {
    color: Colors.error,
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
  nameInput: {
    textAlign: 'left',
    width: '100%',
    flex: 1,
    marginLeft: Spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: Spacing.base,
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  editActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
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
  secondaryMetricsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  secondaryMetricsTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacingTight,
  },
  deleteEditButton: {
    backgroundColor: Colors.error,
    ...Shadows.sm,
  },
  deleteEditButtonText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingNormal,
  },
  mealCardWithActions: {
    position: 'relative',
    marginBottom: Spacing.sm,
    paddingRight: 120, // Add padding to account for button width
  },
  inlineActionButtons: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    width: 120, // Total width for both buttons
  },
  inlineEditButton: {
    flex: 1,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    ...Shadows.sm,
  },
  inlineLogButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    ...Shadows.sm,
  },
  inlineEditButtonText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: Spacing.xs,
    letterSpacing: Typography.letterSpacingTight,
  },
  inlineLogButtonText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textInverse,
    marginTop: Spacing.xs,
    letterSpacing: Typography.letterSpacingTight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.md,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacingNormal,
  },
  emptySubtext: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    opacity: 0.7,
    letterSpacing: Typography.letterSpacingNormal,
  },
});

export default SavedMealsScreen;
