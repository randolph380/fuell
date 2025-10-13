import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';

const STORAGE_KEY = '@macro_targets';

// Default targets (WHO Recommendations - matching EditTargetsScreen)
const DEFAULT_TARGETS = {
  calories: { enabled: true, min: null, max: 2000, type: 'target', hasTarget: true },
  protein: { enabled: true, min: 50, max: null, type: 'target', hasTarget: true },
  carbs: { enabled: true, min: 225, max: 325, type: 'info', hasTarget: true },
  fat: { enabled: true, min: 44, max: 78, type: 'info', hasTarget: true },
  processedPercent: { enabled: true, min: null, max: 10, type: 'limit', hasTarget: true },
  ultraProcessedPercent: { enabled: true, min: null, max: 10, type: 'limit', hasTarget: true },
  caffeine: { enabled: true, min: null, max: 400, type: 'limit', hasTarget: true },
  fiber: { enabled: true, min: 25, max: null, type: 'target', hasTarget: true },
  freshProduce: { enabled: true, min: 400, max: 800, type: 'target', hasTarget: true },
};

const MacroDisplay = ({ macros, processedPercent, ultraProcessedPercent, fiber, caffeine, freshProduce }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);

  // Load targets from storage when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTargets();
    }, [])
  );

  const loadTargets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTargets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };
  
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

  // Universal function to generate status text for any metric
  const getStatusText = (current, min, max, unit = '', isLimit = false) => {
    const curr = current || 0;
    
    // Both min and max specified
    if (min && max) {
      if (isLimit) {
        // For limits (like processed, ultra-processed, caffeine as limit)
        if (curr > max) {
          return { text: `Over ${formatNumber(max)}${unit} limit`, style: 'warning' };
        } else if (curr >= min) {
          return { text: `${formatNumber(min)}-${formatNumber(max)}${unit} range`, style: 'achieved' };
        } else {
          return { text: `${formatNumber(min)}-${formatNumber(max)}${unit} range`, style: 'status' };
        }
      } else {
        // For targets (like fiber, fruits & veg)
        if (curr >= max) {
          return { text: `${formatNumber(min)}-${formatNumber(max)}${unit} range (optimal reached)`, style: 'achieved' };
        } else if (curr >= min) {
          return { text: `${formatNumber(min)}-${formatNumber(max)}${unit} range (minimum met)`, style: 'achieved' };
        } else {
          return { text: `${formatNumber(min)}-${formatNumber(max)}${unit} range`, style: 'status' };
        }
      }
    }
    
    // Only max specified
    if (max) {
      if (isLimit) {
        // Limit: stay under max
        if (curr > max) {
          return { text: `Over ${formatNumber(max)}${unit} limit`, style: 'warning' };
        } else {
          return { text: `${formatNumber(curr)}/${formatNumber(max)}${unit}${curr <= max ? ' ✓' : ''}`, style: 'status' };
        }
      } else {
        // Target: reach max
        if (curr >= max) {
          return { text: `${formatNumber(max)}${unit} target met`, style: 'achieved' };
        } else {
          return { text: `${formatNumber(curr)}/${formatNumber(max)}${unit}`, style: 'status' };
        }
      }
    }
    
    // Only min specified
    if (min) {
      if (curr >= min) {
        return { text: `${formatNumber(min)}${unit} target met`, style: 'achieved' };
      } else {
        return { text: `${formatNumber(curr)}/${formatNumber(min)}${unit}`, style: 'status' };
      }
    }
    
    return { text: '', style: 'status' };
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
        {targets.calories.enabled && (
          <View style={styles.calorieSection}>
            <Text style={styles.calorieValue}>{formatNumber(macros.calories)}</Text>
            <Text style={styles.calorieLabel}>Calories</Text>
            {targets.calories.hasTarget && (targets.calories.min || targets.calories.max) && (() => {
              const statusInfo = getStatusText(macros.calories, targets.calories.min, targets.calories.max, '');
              return (
                <>
                  <ProgressBar 
                    current={macros.calories || 0} 
                    target={targets.calories.max || targets.calories.min}
                    color={Colors.primary}
                  />
                  <Text style={styles.progressText}>{statusInfo.text}</Text>
                </>
              );
            })()}
          </View>
        )}

        {/* Other Macros - Right Half Stacked */}
        <View style={styles.rightMacrosSection}>
          {/* Protein */}
          {targets.protein.enabled && (
            <View style={styles.macroRow}>
              <View style={styles.macroRowContent}>
                <Text style={styles.macroRowLabel}>Protein</Text>
                <Text style={styles.macroRowValue}>{formatNumber(macros.protein)}g</Text>
              </View>
              {targets.protein.hasTarget && (targets.protein.min || targets.protein.max) && (() => {
                const statusInfo = getStatusText(macros.protein, targets.protein.min, targets.protein.max, 'g');
                return (
                  <>
                    <ProgressBar 
                      current={macros.protein || 0} 
                      target={targets.protein.max || targets.protein.min}
                      color={Colors.dataProtein}
                    />
                    <Text style={styles.macroRowProgress}>{statusInfo.text}</Text>
                  </>
                );
              })()}
            </View>
          )}

          {/* Net Carbs */}
          {targets.carbs.enabled && (
            <View style={styles.macroRow}>
              <View style={styles.macroRowContent}>
                <Text style={styles.macroRowLabel}>Net Carbs</Text>
                <Text style={styles.macroRowValue}>{formatNumber(macros.carbs)}g</Text>
              </View>
              {targets.carbs.hasTarget && (targets.carbs.min || targets.carbs.max) && (() => {
                const statusInfo = getStatusText(macros.carbs, targets.carbs.min, targets.carbs.max, 'g');
                return (
                  <>
                    <ProgressBar 
                      current={macros.carbs || 0} 
                      target={targets.carbs.max || targets.carbs.min}
                      color={Colors.dataCarbs}
                    />
                    <Text style={styles.macroRowProgress}>{statusInfo.text}</Text>
                  </>
                );
              })()}
            </View>
          )}

          {/* Fat */}
          {targets.fat.enabled && (
            <View style={styles.macroRow}>
              <View style={styles.macroRowContent}>
                <Text style={styles.macroRowLabel}>Fat</Text>
                <Text style={styles.macroRowValue}>{formatNumber(macros.fat)}g</Text>
              </View>
              {targets.fat.hasTarget && (targets.fat.min || targets.fat.max) && (() => {
                const statusInfo = getStatusText(macros.fat, targets.fat.min, targets.fat.max, 'g');
                return (
                  <>
                    <ProgressBar 
                      current={macros.fat || 0} 
                      target={targets.fat.max || targets.fat.min}
                      color={Colors.dataFat}
                    />
                    <Text style={styles.macroRowProgress}>{statusInfo.text}</Text>
                  </>
                );
              })()}
            </View>
          )}
        </View>
      </View>

      {/* Expand/Collapse Indicator */}
      <View style={styles.expandIndicator}>
        <Text style={styles.expandText}>Additional Metrics</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.textSecondary} 
        />
      </View>

      {/* Additional Metrics - Collapsible */}
      {isExpanded && (
        <View style={styles.additionalMetricsSection}>
          {/* LIMITS SECTION */}
          {(targets.processedPercent.enabled || targets.ultraProcessedPercent.enabled || targets.caffeine.enabled) && (
            <Text style={styles.sectionHeader}>Limits</Text>
          )}
          
          {/* Processed Calories */}
          {targets.processedPercent.enabled && (
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Processed calories</Text>
                <Text style={[
                  styles.metricValue,
                  targets.processedPercent.hasTarget && targets.processedPercent.max
                    ? { color: getLimitStatus(processedPercent || 0, targets.processedPercent.max).color }
                    : { color: Colors.textPrimary }
                ]}>
                  {processedPercent ?? 0}%
                </Text>
              </View>
              {targets.processedPercent.hasTarget && (targets.processedPercent.min || targets.processedPercent.max) && (() => {
                const statusInfo = getStatusText(processedPercent, targets.processedPercent.min, targets.processedPercent.max, '%', true);
                return (
                  <>
                    <ProgressBar 
                      current={processedPercent || 0} 
                      target={targets.processedPercent.max || targets.processedPercent.min}
                      color={getLimitStatus(processedPercent || 0, targets.processedPercent.max || targets.processedPercent.min).color}
                    />
                    <Text style={statusInfo.style === 'warning' ? styles.warningText : statusInfo.style === 'achieved' ? styles.achievedText : styles.statusText}>
                      {statusInfo.text}
                    </Text>
                  </>
                );
              })()}
            </View>
          )}

          {/* Ultra-Processed Calories */}
          {targets.ultraProcessedPercent.enabled && (
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Ultra-processed calories</Text>
                <Text style={[
                  styles.metricValue,
                  targets.ultraProcessedPercent.hasTarget && targets.ultraProcessedPercent.max
                    ? { color: getLimitStatus(ultraProcessedPercent || 0, targets.ultraProcessedPercent.max).color }
                    : { color: Colors.textPrimary }
                ]}>
                  {ultraProcessedPercent ?? 0}%
                </Text>
              </View>
              {targets.ultraProcessedPercent.hasTarget && (targets.ultraProcessedPercent.min || targets.ultraProcessedPercent.max) && (() => {
                const statusInfo = getStatusText(ultraProcessedPercent, targets.ultraProcessedPercent.min, targets.ultraProcessedPercent.max, '%', true);
                return (
                  <>
                    <ProgressBar 
                      current={ultraProcessedPercent || 0} 
                      target={targets.ultraProcessedPercent.max || targets.ultraProcessedPercent.min}
                      color={getLimitStatus(ultraProcessedPercent || 0, targets.ultraProcessedPercent.max || targets.ultraProcessedPercent.min).color}
                    />
                    <Text style={statusInfo.style === 'warning' ? styles.warningText : statusInfo.style === 'achieved' ? styles.achievedText : styles.statusText}>
                      {statusInfo.text}
                    </Text>
                  </>
                );
              })()}
            </View>
          )}

          {/* Caffeine */}
          {targets.caffeine.enabled && (
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Caffeine</Text>
                <Text style={[
                  styles.metricValue,
                  targets.caffeine.hasTarget && targets.caffeine.max
                    ? { color: getLimitStatus(caffeine || 0, targets.caffeine.max).color }
                    : { color: Colors.textPrimary }
                ]}>
                  {formatNumber(caffeine)}mg
                </Text>
              </View>
              {targets.caffeine.hasTarget && (targets.caffeine.min || targets.caffeine.max) && (() => {
                const statusInfo = getStatusText(caffeine, targets.caffeine.min, targets.caffeine.max, 'mg', true);
                return (
                  <>
                    <ProgressBar 
                      current={caffeine || 0} 
                      target={targets.caffeine.max || targets.caffeine.min}
                      color={getLimitStatus(caffeine || 0, targets.caffeine.max || targets.caffeine.min).color}
                    />
                    <Text style={statusInfo.style === 'warning' ? styles.warningText : statusInfo.style === 'achieved' ? styles.achievedText : styles.statusText}>
                      {statusInfo.text}
                    </Text>
                  </>
                );
              })()}
            </View>
          )}

          {/* TARGETS SECTION */}
          {(targets.fiber.enabled || targets.freshProduce.enabled) && (
            <Text style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>Targets</Text>
          )}
          
          {/* Fiber */}
          {targets.fiber.enabled && (
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Fiber</Text>
                <Text style={[
                  styles.metricValue,
                  targets.fiber.hasTarget && (targets.fiber.min || targets.fiber.max)
                    ? { color: getTargetStatus(fiber || 0, targets.fiber.min || targets.fiber.max).color }
                    : { color: Colors.textPrimary }
                ]}>
                  {formatNumber(fiber)}g
                </Text>
              </View>
              {targets.fiber.hasTarget && (targets.fiber.min || targets.fiber.max) && (() => {
                const statusInfo = getStatusText(fiber, targets.fiber.min, targets.fiber.max, 'g', false);
                return (
                  <>
                    <ProgressBar 
                      current={fiber || 0} 
                      target={targets.fiber.max || targets.fiber.min}
                      color={getTargetStatus(fiber || 0, targets.fiber.max || targets.fiber.min).color}
                    />
                    <Text style={statusInfo.style === 'achieved' ? styles.achievedText : styles.statusText}>
                      {statusInfo.text}
                    </Text>
                  </>
                );
              })()}
            </View>
          )}

          {/* Fruits & Vegetables */}
          {targets.freshProduce.enabled && (
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Fruits & vegetables</Text>
                <Text style={[
                  styles.metricValue,
                  targets.freshProduce.hasTarget && (targets.freshProduce.min || targets.freshProduce.max)
                    ? { color: getTargetStatus(freshProduce || 0, targets.freshProduce.min || targets.freshProduce.max).color }
                    : { color: Colors.textPrimary }
                ]}>
                  {formatNumber(freshProduce)}g
                </Text>
              </View>
              {targets.freshProduce.hasTarget && (targets.freshProduce.min || targets.freshProduce.max) && (() => {
                const statusInfo = getStatusText(freshProduce, targets.freshProduce.min, targets.freshProduce.max, 'g', false);
                return (
                  <>
                    <ProgressBar 
                      current={freshProduce || 0} 
                      target={targets.freshProduce.max || targets.freshProduce.min}
                      color={getTargetStatus(freshProduce || 0, targets.freshProduce.max || targets.freshProduce.min).color}
                    />
                    <Text style={statusInfo.style === 'achieved' ? styles.achievedText : styles.statusText}>
                      {statusInfo.text}
                    </Text>
                  </>
                );
              })()}
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
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
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
