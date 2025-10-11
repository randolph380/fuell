import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';

// Health Guidelines (Default targets)
const GUIDELINES = {
  calories: { target: 2000, label: 'Daily target' },
  protein: { min: 100, label: 'Minimum' },
  carbs: { min: 225, max: 325, label: 'Range' },
  fat: { min: 44, max: 78, label: 'Range' },
  // Limits (warning when exceeded)
  processedPercent: { limit: 20, label: 'Limit' },
  ultraProcessedPercent: { limit: 15, label: 'Limit' },
  caffeine: { limit: 400, label: 'Safe limit' },
  // Targets (encourage to reach)
  fiber: { min: 30, label: 'Daily target' },
  freshProduce: { min: 400, optimal: 800, label: 'Minimum/Optimal' },
};

const MacroDisplay = ({ macros, processedPercent, ultraProcessedPercent, fiber, caffeine, freshProduce }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatNumber = (num) => {
    return num ? Math.round(num).toLocaleString() : '0';
  };

  // Calculate progress percentages
  const getProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  // Get status for limits (red/orange when over)
  const getLimitStatus = (current, limit) => {
    const percent = (current / limit) * 100;
    if (percent > 100) return { color: '#d65c3b', status: 'over' };
    if (percent > 80) return { color: '#f4c542', status: 'high' };
    return { color: '#4a9fa8', status: 'good' };
  };

  // Get status for targets (green when achieved)
  const getTargetStatus = (current, target) => {
    const percent = (current / target) * 100;
    if (percent >= 100) return { color: '#2d8659', status: 'achieved' };
    if (percent >= 75) return { color: '#4a9fa8', status: 'close' };
    return { color: '#6c757d', status: 'progress' };
  };

  // Progress bar component
  const ProgressBar = ({ current, target, color, showPercentage = false }) => {
    const progress = Math.min((current / target) * 100, 100);
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.9}
    >
      {/* Main Macros Section */}
      <View style={styles.mainMacrosSection}>
        {/* Calories - Left Half */}
        <View style={styles.calorieSection}>
          <Text style={styles.calorieValue}>{formatNumber(macros.calories)}</Text>
          <Text style={styles.calorieLabel}>Calories</Text>
          <ProgressBar 
            current={macros.calories || 0} 
            target={GUIDELINES.calories.target}
            color={Colors.primary}
          />
          <Text style={styles.progressText}>
            {formatNumber(macros.calories)}/{formatNumber(GUIDELINES.calories.target)}
          </Text>
        </View>

        {/* Other Macros - Right Half Stacked */}
        <View style={styles.rightMacrosSection}>
          {/* Protein */}
          <View style={styles.macroRow}>
            <View style={styles.macroRowContent}>
              <Text style={styles.macroRowLabel}>Protein</Text>
              <Text style={styles.macroRowValue}>{formatNumber(macros.protein)}g</Text>
            </View>
            <ProgressBar 
              current={macros.protein || 0} 
              target={GUIDELINES.protein.min}
              color={Colors.dataProtein}
            />
            <Text style={styles.macroRowProgress}>
              {formatNumber(macros.protein)}/{GUIDELINES.protein.min}g
            </Text>
          </View>

          {/* Net Carbs */}
          <View style={styles.macroRow}>
            <View style={styles.macroRowContent}>
              <Text style={styles.macroRowLabel}>Net Carbs</Text>
              <Text style={styles.macroRowValue}>{formatNumber(macros.carbs)}g</Text>
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroRow}>
            <View style={styles.macroRowContent}>
              <Text style={styles.macroRowLabel}>Fat</Text>
              <Text style={styles.macroRowValue}>{formatNumber(macros.fat)}g</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Expand/Collapse Indicator */}
      <View style={styles.expandIndicator}>
        <Text style={styles.expandText}>Additional Metrics</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={18} 
          color={Colors.textTertiary} 
        />
      </View>

      {/* Additional Metrics - Collapsible */}
      {isExpanded && (
        <View style={styles.additionalMetricsSection}>
          {/* LIMITS SECTION */}
          <Text style={styles.sectionHeader}>Limits</Text>
          
          {/* Processed Calories */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Processed calories</Text>
              <Text style={[
                styles.metricValue,
                { color: getLimitStatus(processedPercent || 0, GUIDELINES.processedPercent.limit).color }
              ]}>
                {processedPercent ?? 0}%
              </Text>
            </View>
            <ProgressBar 
              current={processedPercent || 0} 
              target={GUIDELINES.processedPercent.limit}
              color={getLimitStatus(processedPercent || 0, GUIDELINES.processedPercent.limit).color}
            />
            {(processedPercent || 0) > GUIDELINES.processedPercent.limit ? (
              <Text style={styles.warningText}>Over {GUIDELINES.processedPercent.limit}% limit</Text>
            ) : (
              <Text style={styles.statusText}>
                {formatNumber(GUIDELINES.processedPercent.limit - (processedPercent || 0))}% under limit
              </Text>
            )}
          </View>

          {/* Ultra-Processed Calories */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Ultra-processed calories</Text>
              <Text style={[
                styles.metricValue,
                { color: getLimitStatus(ultraProcessedPercent || 0, GUIDELINES.ultraProcessedPercent.limit).color }
              ]}>
                {ultraProcessedPercent ?? 0}%
              </Text>
            </View>
            <ProgressBar 
              current={ultraProcessedPercent || 0} 
              target={GUIDELINES.ultraProcessedPercent.limit}
              color={getLimitStatus(ultraProcessedPercent || 0, GUIDELINES.ultraProcessedPercent.limit).color}
            />
            {(ultraProcessedPercent || 0) > GUIDELINES.ultraProcessedPercent.limit ? (
              <Text style={styles.warningText}>Over {GUIDELINES.ultraProcessedPercent.limit}% limit</Text>
            ) : (
              <Text style={styles.statusText}>
                {formatNumber(GUIDELINES.ultraProcessedPercent.limit - (ultraProcessedPercent || 0))}% under limit
              </Text>
            )}
          </View>

          {/* Caffeine */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Caffeine</Text>
              <Text style={[
                styles.metricValue,
                { color: getLimitStatus(caffeine || 0, GUIDELINES.caffeine.limit).color }
              ]}>
                {formatNumber(caffeine)}mg
              </Text>
            </View>
            <ProgressBar 
              current={caffeine || 0} 
              target={GUIDELINES.caffeine.limit}
              color={getLimitStatus(caffeine || 0, GUIDELINES.caffeine.limit).color}
            />
            <Text style={styles.statusText}>
              {formatNumber(caffeine)}/{GUIDELINES.caffeine.limit}mg
              {(caffeine || 0) <= GUIDELINES.caffeine.limit && ' ✓'}
            </Text>
          </View>

          {/* TARGETS SECTION */}
          <Text style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>Targets</Text>
          
          {/* Fiber */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Fiber</Text>
              <Text style={[
                styles.metricValue,
                { color: getTargetStatus(fiber || 0, GUIDELINES.fiber.min).color }
              ]}>
                {formatNumber(fiber)}g
              </Text>
            </View>
            <ProgressBar 
              current={fiber || 0} 
              target={GUIDELINES.fiber.min}
              color={getTargetStatus(fiber || 0, GUIDELINES.fiber.min).color}
            />
            {(fiber || 0) >= GUIDELINES.fiber.min ? (
              <Text style={styles.achievedText}>✓ Target met</Text>
            ) : (
              <Text style={styles.statusText}>
                {formatNumber(fiber)}/{GUIDELINES.fiber.min}g ({formatNumber(GUIDELINES.fiber.min - (fiber || 0))}g to go)
              </Text>
            )}
          </View>

          {/* Fruits & Vegetables */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Fruits & vegetables</Text>
              <Text style={[
                styles.metricValue,
                { color: getTargetStatus(freshProduce || 0, GUIDELINES.freshProduce.min).color }
              ]}>
                {formatNumber(freshProduce)}g
              </Text>
            </View>
            <ProgressBar 
              current={freshProduce || 0} 
              target={GUIDELINES.freshProduce.min}
              color={getTargetStatus(freshProduce || 0, GUIDELINES.freshProduce.min).color}
            />
            {(freshProduce || 0) >= GUIDELINES.freshProduce.min ? (
              <Text style={styles.achievedText}>
                ✓ Minimum met ({formatNumber(GUIDELINES.freshProduce.optimal - (freshProduce || 0))}g to optimal)
              </Text>
            ) : (
              <Text style={styles.statusText}>
                {formatNumber(freshProduce)}/{GUIDELINES.freshProduce.min}g ({formatNumber(GUIDELINES.freshProduce.min - (freshProduce || 0))}g to minimum)
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundElevated,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
    overflow: 'hidden',
  },
  mainMacrosSection: {
    flexDirection: 'row',
    padding: Spacing.lg,
  },
  calorieSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: '300',
    color: Colors.primary,
    letterSpacing: -2,
    marginBottom: Spacing.xs,
  },
  calorieLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  progressText: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontWeight: '400',
  },
  rightMacrosSection: {
    flex: 1,
    paddingLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  macroRow: {
    marginBottom: Spacing.sm,
  },
  macroRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  macroRowLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  macroRowValue: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  macroRowProgress: {
    fontSize: Typography.xs - 1,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontWeight: '400',
  },
  progressBarContainer: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  expandIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSubtle,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  expandText: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  additionalMetricsSection: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  metricCard: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  metricValue: {
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  statusText: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontWeight: '400',
  },
  warningText: {
    fontSize: Typography.xs,
    color: '#d65c3b',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  achievedText: {
    fontSize: Typography.xs,
    color: '#2d8659',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
});

export default MacroDisplay;
