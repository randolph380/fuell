import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';

const MacroDisplay = ({ macros, processedPercent, ultraProcessedPercent, fiber }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };

  const hasExtendedMetrics = processedPercent != null || ultraProcessedPercent != null || (fiber != null && fiber > 0);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => hasExtendedMetrics && setIsExpanded(!isExpanded)}
      activeOpacity={hasExtendedMetrics ? 0.7 : 1}
    >
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
      
      {/* Expand/Collapse Indicator */}
      {hasExtendedMetrics && (
        <View style={styles.expandIndicator}>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={Colors.textTertiary} 
          />
        </View>
      )}
      
      {/* Extended Metrics - Collapsible */}
      {isExpanded && hasExtendedMetrics && (
        <View style={styles.extendedMetricsContainer}>
          <Text style={styles.extendedMetricsTitle}>Additional Metrics</Text>
          
          {processedPercent != null && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Processed calories</Text>
              <Text style={styles.metricValue}>{processedPercent}%</Text>
            </View>
          )}
          
          {ultraProcessedPercent != null && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Ultra-processed calories</Text>
              <Text style={styles.metricValue}>{ultraProcessedPercent}%</Text>
            </View>
          )}
          
          {fiber != null && fiber > 0 && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Fiber</Text>
              <Text style={styles.metricValue}>{formatNumber(fiber)}g</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
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
  expandIndicator: {
    marginTop: Spacing.sm,
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  extendedMetricsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  extendedMetricsTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    fontWeight: '500',
  },
  metricValue: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});

export default MacroDisplay;
