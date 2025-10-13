import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';

const STORAGE_KEY = '@macro_targets';

// WHO Recommendations (World Health Organization guidelines)
const WHO_TARGETS = {
  calories: { enabled: true, min: null, max: 2000, type: 'target', hasTarget: true },
  protein: { enabled: true, min: 50, max: null, type: 'target', hasTarget: true }, // WHO: 0.8g per kg body weight (~50g for average adult)
  carbs: { enabled: true, min: 225, max: 325, type: 'info', hasTarget: true }, // WHO: 45-65% of calories (225-325g for 2000 cal)
  fat: { enabled: true, min: 44, max: 78, type: 'info', hasTarget: true }, // WHO: 20-35% of calories (44-78g for 2000 cal)
  processedPercent: { enabled: true, min: null, max: 10, type: 'limit', hasTarget: true }, // WHO: minimize processed foods
  ultraProcessedPercent: { enabled: true, min: null, max: 10, type: 'limit', hasTarget: true }, // WHO: avoid ultra-processed
  caffeine: { enabled: true, min: null, max: 400, type: 'limit', hasTarget: true }, // WHO/FDA: <400mg safe for adults
  fiber: { enabled: true, min: 25, max: null, type: 'target', hasTarget: true }, // WHO: 25g minimum
  freshProduce: { enabled: true, min: 400, max: 800, type: 'target', hasTarget: true }, // WHO: 400g minimum, 800g optimal
};

// High Protein (1g protein per lb body weight, ~180lb person)
const HIGH_PROTEIN_TARGETS = {
  calories: { enabled: true, min: null, max: 2200, type: 'target', hasTarget: true },
  protein: { enabled: true, min: 180, max: null, type: 'target', hasTarget: true }, // 1g per lb (180lb person)
  carbs: { enabled: true, min: 150, max: 250, type: 'info', hasTarget: true }, // Moderate carbs
  fat: { enabled: true, min: 50, max: 80, type: 'info', hasTarget: true }, // Moderate fat
  processedPercent: { enabled: true, min: null, max: 20, type: 'limit', hasTarget: true },
  ultraProcessedPercent: { enabled: true, min: null, max: 15, type: 'limit', hasTarget: true },
  caffeine: { enabled: true, min: null, max: 400, type: 'limit', hasTarget: true },
  fiber: { enabled: true, min: 30, max: null, type: 'target', hasTarget: true },
  freshProduce: { enabled: true, min: 400, max: 800, type: 'target', hasTarget: true },
};

// Athlete (endurance runner needs)
const ATHLETE_TARGETS = {
  calories: { enabled: true, min: 2500, max: 3500, type: 'target', hasTarget: true }, // Higher calorie needs
  protein: { enabled: true, min: 120, max: 160, type: 'target', hasTarget: true }, // 1.2-1.7g per kg (for 70kg athlete)
  carbs: { enabled: true, min: 350, max: 500, type: 'info', hasTarget: true }, // High carbs for glycogen stores
  fat: { enabled: true, min: 70, max: 120, type: 'info', hasTarget: true }, // Moderate-high fat
  processedPercent: { enabled: true, min: null, max: 25, type: 'limit', hasTarget: true }, // More flexible
  ultraProcessedPercent: { enabled: true, min: null, max: 20, type: 'limit', hasTarget: true },
  caffeine: { enabled: true, min: null, max: 600, type: 'limit', hasTarget: true }, // Athletes often use more caffeine
  fiber: { enabled: true, min: 35, max: null, type: 'target', hasTarget: true }, // Higher fiber needs
  freshProduce: { enabled: true, min: 600, max: 1000, type: 'target', hasTarget: true }, // More fruits/veg for recovery
};

// Default targets (WHO Recommendations as default)
const DEFAULT_TARGETS = WHO_TARGETS;

const METRIC_INFO = {
  calories: { label: 'Calories', unit: 'kcal', section: 'main' },
  protein: { label: 'Protein', unit: 'g', section: 'main' },
  carbs: { label: 'Net Carbs', unit: 'g', section: 'main' },
  fat: { label: 'Fat', unit: 'g', section: 'main' },
  processedPercent: { label: 'Processed Calories', unit: '%', section: 'limits' },
  ultraProcessedPercent: { label: 'Ultra-Processed Calories', unit: '%', section: 'limits' },
  caffeine: { label: 'Caffeine', unit: 'mg', section: 'limits' },
  fiber: { label: 'Fiber', unit: 'g', section: 'targets' },
  freshProduce: { label: 'Fruits & Vegetables', unit: 'g', section: 'targets' },
};

const EditTargetsScreen = ({ navigation }) => {
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTargets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTargets = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
      Alert.alert('Success', 'Targets saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving targets:', error);
      Alert.alert('Error', 'Failed to save targets');
    }
  };

  const updateTarget = (metric, field, value) => {
    setTargets(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [field]: value
      }
    }));
  };

  const toggleTracking = (metric) => {
    setTargets(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        enabled: !prev[metric].enabled
      }
    }));
  };

  const applyPreset = (presetName) => {
    let preset;
    switch (presetName) {
      case 'who':
        preset = WHO_TARGETS;
        break;
      case 'highProtein':
        preset = HIGH_PROTEIN_TARGETS;
        break;
      case 'athlete':
        preset = ATHLETE_TARGETS;
        break;
      default:
        return;
    }
    setTargets({ ...preset });
    Alert.alert('Preset Applied', `${presetName === 'who' ? 'WHO Recommendations' : presetName === 'highProtein' ? 'High Protein' : 'Athlete'} targets have been applied. Scroll down to review and customize.`);
  };

  const toggleHasTarget = (metric) => {
    setTargets(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        hasTarget: !prev[metric].hasTarget
      }
    }));
  };

  const renderMetricCard = (metric) => {
    const target = targets[metric];
    const info = METRIC_INFO[metric];
    
    return (
      <View key={metric} style={styles.metricCard}>
        {/* Header with toggle */}
        <View style={styles.metricHeader}>
          <View style={styles.metricTitleRow}>
            <Text style={styles.metricLabel}>{info.label}</Text>
            <Text style={styles.metricUnit}>({info.unit})</Text>
          </View>
          <Switch
            value={target.enabled}
            onValueChange={() => toggleTracking(metric)}
            trackColor={{ false: Colors.borderLight, true: Colors.accentLight }}
            thumbColor={target.enabled ? Colors.accent : Colors.textTertiary}
          />
        </View>

        {/* Target inputs (only if enabled) */}
        {target.enabled && (
          <View style={styles.metricInputs}>
            {/* Has Target Toggle */}
            <TouchableOpacity 
              style={styles.hasTargetToggle}
              onPress={() => toggleHasTarget(metric)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={target.hasTarget ? "checkbox" : "square-outline"} 
                size={20} 
                color={target.hasTarget ? Colors.accent : Colors.textTertiary} 
              />
              <Text style={styles.hasTargetText}>Set target/limit</Text>
            </TouchableOpacity>

            {/* Min/Max Inputs */}
            {target.hasTarget && (
              <View style={styles.minMaxRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Min</Text>
                  <TextInput
                    style={styles.input}
                    value={target.min?.toString() || ''}
                    onChangeText={(text) => updateTarget(metric, 'min', text ? parseInt(text) : null)}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={Colors.textTertiary}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Max</Text>
                  <TextInput
                    style={styles.input}
                    value={target.max?.toString() || ''}
                    onChangeText={(text) => updateTarget(metric, 'max', text ? parseInt(text) : null)}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={Colors.textTertiary}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSection = (sectionKey, title, metrics) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {metrics.map(metric => renderMetricCard(metric))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const mainMetrics = Object.keys(METRIC_INFO).filter(k => METRIC_INFO[k].section === 'main');
  const limitMetrics = Object.keys(METRIC_INFO).filter(k => METRIC_INFO[k].section === 'limits');
  const targetMetrics = Object.keys(METRIC_INFO).filter(k => METRIC_INFO[k].section === 'targets');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Preset Selector */}
        <View style={styles.presetSection}>
          <Text style={styles.presetTitle}>Quick Start Presets</Text>
          <Text style={styles.presetSubtitle}>Choose a starting point, then customize below</Text>
          
          <View style={styles.presetButtons}>
            {/* WHO Recommendations */}
            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => applyPreset('who')}
              activeOpacity={0.7}
            >
              <View style={styles.presetIconContainer}>
                <Ionicons name="medkit-outline" size={28} color={Colors.accent} />
              </View>
              <Text style={styles.presetCardTitle}>WHO Recommendations</Text>
              <Text style={styles.presetCardDescription}>
                Balanced nutrition based on World Health Organization guidelines
              </Text>
            </TouchableOpacity>

            {/* High Protein */}
            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => applyPreset('highProtein')}
              activeOpacity={0.7}
            >
              <View style={styles.presetIconContainer}>
                <Ionicons name="barbell-outline" size={28} color={Colors.accent} />
              </View>
              <Text style={styles.presetCardTitle}>High Protein</Text>
              <Text style={styles.presetCardDescription}>
                1g protein per lb body weight for muscle building (180lb reference)
              </Text>
            </TouchableOpacity>

            {/* Athlete */}
            <TouchableOpacity 
              style={styles.presetCard}
              onPress={() => applyPreset('athlete')}
              activeOpacity={0.7}
            >
              <View style={styles.presetIconContainer}>
                <Ionicons name="flame-outline" size={28} color={Colors.accent} />
              </View>
              <Text style={styles.presetCardTitle}>Athlete</Text>
              <Text style={styles.presetCardDescription}>
                High calorie & carbs for endurance training and recovery
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info Header */}
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color={Colors.accent} />
          <Text style={styles.infoText}>
            Customize individual metrics below. All data is still recorded—this only affects what's displayed.
          </Text>
        </View>

        {/* Main Macros */}
        {renderSection('main', 'Main Macros', mainMetrics)}

        {/* Limits */}
        {renderSection('limits', 'Limits (Warnings)', limitMetrics)}

        {/* Targets */}
        {renderSection('targets', 'Daily Targets', targetMetrics)}

        {/* Bottom padding for save button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveTargets}>
          <Text style={styles.saveButtonText}>Save Targets</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100, // Extra space for save button
  },
  presetSection: {
    marginBottom: Spacing.lg,
  },
  presetTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacingNormal,
  },
  presetSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    letterSpacing: Typography.letterSpacingNormal,
  },
  presetButtons: {
    gap: Spacing.md,
  },
  presetCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
  },
  presetIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  presetCardTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacingNormal,
  },
  presetCardDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.4,
    letterSpacing: Typography.letterSpacingNormal,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  infoHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.info,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.xs * 1.5,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingWide,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  metricCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  metricLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  metricUnit: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  metricInputs: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  hasTargetToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  hasTargetText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  minMaxRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacingWide,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.base,
    textAlign: 'center',
    backgroundColor: Colors.backgroundSubtle,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.base,
    ...Shadows.lg,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    ...Shadows.sm,
  },
  saveButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingNormal,
  },
});

export default EditTargetsScreen;

