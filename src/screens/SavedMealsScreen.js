import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import StorageService from '../services/storage';

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
      const meals = await StorageService.getSavedMeals();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedMeals();
    setRefreshing(false);
  };

  const deleteSavedMeal = async (mealId) => {
    Alert.alert(
      'Delete Saved Meal',
      'Are you sure you want to delete this saved meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteSavedMeal(mealId);
            await loadSavedMeals();
          }
        }
      ]
    );
  };

  const logSavedMeal = async (savedMeal) => {
    try {
      const meal = {
        id: Date.now().toString(),
        name: savedMeal.name,
        calories: savedMeal.calories,
        protein: savedMeal.protein,
        carbs: savedMeal.carbs,
        fat: savedMeal.fat,
        timestamp: new Date().getTime(),
        date: new Date().toDateString()
      };

      await StorageService.saveMeal(meal);
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
      calories: meal.calories.toString(),
      protein: meal.protein.toString(),
      carbs: meal.carbs.toString(),
      fat: meal.fat.toString()
    });
    setExpandedMealId(null);
  };

  const cancelEditing = () => {
    setEditingMealId(null);
    setEditedValues({});
  };

  const saveEditedMeal = async (meal) => {
    try {
      const updatedMeal = {
        ...meal,
        calories: parseInt(editedValues.calories) || meal.calories,
        protein: parseInt(editedValues.protein) || meal.protein,
        carbs: parseInt(editedValues.carbs) || meal.carbs,
        fat: parseInt(editedValues.fat) || meal.fat
      };
      
      await StorageService.updateSavedMeal(meal.id, updatedMeal);
      await loadSavedMeals();
      setEditingMealId(null);
      setEditedValues({});
      Alert.alert('Success', '✅ Macros updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update macros');
    }
  };

  const toggleExpanded = (mealId) => {
    setExpandedMealId(expandedMealId === mealId ? null : mealId);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
                    <Text style={styles.editTitle}>EDITING: {meal.name}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  editActions: {
    flexDirection: 'row',
    marginTop: Spacing.base,
    justifyContent: 'space-between',
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
