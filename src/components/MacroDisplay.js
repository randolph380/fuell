import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';

const MacroDisplay = ({ macros, processedPercent }) => {
  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };

  return (
    <View style={styles.container}>
      <View style={styles.macroGrid}>
        <View style={[styles.macroItem, styles.calorieItem]}>
          <Text style={[styles.macroValue, styles.calorieValue]}>{formatNumber(macros.calories)}</Text>
          <Text style={styles.macroLabel}>Calories</Text>
          <Text style={styles.macroUnit}>(kcal)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, styles.proteinValue]}>{formatNumber(macros.protein)}</Text>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroUnit}>(g)</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, styles.carbsValue]}>{formatNumber(macros.carbs)}</Text>
          <Text style={styles.macroLabel}>Net Carbs</Text>
          <Text style={styles.macroUnit}>(g)</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={[styles.macroValue, styles.fatValue]}>{formatNumber(macros.fat)}</Text>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroUnit}>(g)</Text>
        </View>
      </View>
      
      {/* Processed Food Metric */}
      {processedPercent != null && (
        <View style={styles.processedBadge}>
          <Text style={styles.processedText}>
            {processedPercent}% of calories from processed sources
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundElevated,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
  },
  title: {
    fontSize: Typography.xs,
    fontWeight: '600',
    marginBottom: Spacing.base,
    textAlign: 'center',
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingWide,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  calorieItem: {
    flex: 1.2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.sm,
  },
  macroValue: {
    fontSize: Typography.xxl,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingTight,
    marginBottom: 2,
  },
  calorieValue: {
    color: Colors.primary,
    fontSize: Typography.xxxl,
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
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  macroUnit: {
    fontSize: Typography.xs - 1,
    color: Colors.textTertiary,
    letterSpacing: Typography.letterSpacingNormal,
    fontWeight: '400',
    marginTop: 1,
  },
  processedBadge: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.base,
    alignSelf: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  processedText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
    textAlign: 'center',
  },
});

export default MacroDisplay;
