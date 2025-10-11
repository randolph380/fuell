import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';

const MealCard = ({ meal, onPress, onDelete, onSave, onEdit }) => {
  const [showActions, setShowActions] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowActions(!showActions);
    }
  };

  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };

  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => onDelete && onDelete(meal)}
      >
        <Animated.View
          style={[
            styles.deleteActionContent,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Ionicons name="trash-outline" size={24} color={Colors.textInverse} />
          <Text style={styles.deleteActionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const cardContent = (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.mealTime}>{meal.time}</Text>
      </View>
      <View style={styles.macroContainer}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{formatNumber(meal.calories)}</Text>
          <Text style={styles.macroLabel}>KCAL</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, styles.proteinValue]}>{formatNumber(meal.protein)}</Text>
          <Text style={styles.macroLabel}>PROTEIN</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, styles.carbsValue]}>{formatNumber(meal.carbs)}</Text>
          <Text style={styles.macroLabel}>CARBS</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, styles.fatValue]}>{formatNumber(meal.fat)}</Text>
          <Text style={styles.macroLabel}>FAT</Text>
        </View>
      </View>
      
      {showActions && (
        <View style={styles.expandedContainer}>
          {/* Extended Metrics Section */}
          {meal.extendedMetrics && Object.keys(meal.extendedMetrics).length > 0 && (
            <View style={styles.extendedMetricsContainer}>
              <Text style={styles.extendedMetricsTitle}>Additional Metrics</Text>
              {meal.extendedMetrics.processedPercent != null && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Processed calories</Text>
                  <Text style={styles.metricValue}>{meal.extendedMetrics.processedPercent}%</Text>
                </View>
              )}
            {meal.extendedMetrics.fiber != null && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Fiber</Text>
                <Text style={styles.metricValue}>{meal.extendedMetrics.fiber}g</Text>
              </View>
            )}
            {meal.extendedMetrics.ultraProcessedPercent != null && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Ultra-processed calories</Text>
                <Text style={styles.metricValue}>{meal.extendedMetrics.ultraProcessedPercent}%</Text>
              </View>
            )}
            {/* Future metrics can be added here */}
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]} 
              onPress={() => {
                onEdit(meal);
                setShowActions(false);
              }}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.accent} />
              <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
            </TouchableOpacity>
          )}
          {onSave && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]} 
              onPress={() => {
                onSave(meal);
                setShowActions(false);
              }}
            >
              <Ionicons name="bookmark-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]} 
              onPress={() => {
                onDelete(meal);
                setShowActions(false);
              }}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Only allow swipe-to-delete if onDelete is provided
  if (onDelete) {
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        {cardContent}
      </Swipeable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundElevated,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mealName: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingTight,
    flex: 1,
  },
  mealTime: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    letterSpacing: Typography.letterSpacingNormal,
    marginLeft: Spacing.sm,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingTight,
    marginBottom: 2,
  },
  proteinValue: {
    color: Colors.primary,
  },
  carbsValue: {
    color: Colors.primary,
  },
  fatValue: {
    color: Colors.primary,
  },
  macroLabel: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    letterSpacing: Typography.letterSpacingWide,
    fontWeight: '500',
  },
  expandedContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  extendedMetricsContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  extendedMetricsTitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingWide,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  metricLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingTight,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  editButton: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  saveButton: {
    backgroundColor: Colors.accent,
  },
  deleteButton: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  editButtonText: {
    color: Colors.accent,
  },
  actionButtonText: {
    fontSize: Typography.xs,
    fontWeight: '500',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingNormal,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.base,
    marginLeft: Spacing.sm,
    overflow: 'hidden',
  },
  deleteActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    height: '100%',
  },
  deleteActionText: {
    color: Colors.textInverse,
    fontSize: Typography.xs,
    fontWeight: '600',
    marginTop: Spacing.xs,
    letterSpacing: Typography.letterSpacingNormal,
  },
});

export default MealCard;
