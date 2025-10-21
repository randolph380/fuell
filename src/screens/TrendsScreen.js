import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
// Victory Native removed for iOS compatibility
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';
import HybridStorageService from '../services/hybridStorage';
import { calculateAggregatedProcessed, calculateAggregatedUltraProcessed } from '../utils/extendedMetrics';

// Metric configuration - same as original Trends
const METRICS = {
  calories: {
    label: 'Calories',
    displayLabel: 'Calories',
    extract: (meal) => meal.calories || 0,
    type: 'standard'
  },
  protein: {
    label: 'Protein',
    displayLabel: 'Protein',
    extract: (meal) => meal.protein || 0,
    type: 'standard'
  },
  carbs: {
    label: 'Net Carbs',
    displayLabel: 'Net Carbs',
    extract: (meal) => meal.carbs || 0,
    type: 'standard'
  },
  fat: {
    label: 'Fat',
    displayLabel: 'Fat',
    extract: (meal) => meal.fat || 0,
    type: 'standard'
  },
  fiber: {
    label: 'Fiber',
    displayLabel: 'Fiber',
    extract: (meal) => meal.extendedMetrics?.fiber || 0,
    type: 'extended'
  },
  processed: {
    label: 'Processed %',
    displayLabel: 'Processed %',
    extract: (meals) => calculateAggregatedProcessed(meals).processedPercent || 0,
    type: 'aggregated'
  },
  ultraProcessed: {
    label: 'Ultra-Processed %',
    displayLabel: 'Ultra-Processed %',
    extract: (meals) => calculateAggregatedUltraProcessed(meals).ultraProcessedPercent || 0,
    type: 'aggregated'
  },
  caffeine: {
    label: 'Caffeine',
    displayLabel: 'Caffeine',
    extract: (meal) => meal.extendedMetrics?.caffeine || 0,
    type: 'extended'
  },
  freshProduce: {
    label: 'Fruits & Vegetables',
    displayLabel: 'Fruits & Vegetables',
    extract: (meal) => meal.extendedMetrics?.freshProduce || 0,
    type: 'extended'
  }
};

const TrendsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState('calories');
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [chartData, setChartData] = useState([]);
  const [averageValue, setAverageValue] = useState(0);
  const [summaryStats, setSummaryStats] = useState({
    average: 0,
    trend: 'stable',
    daysTracked: 0,
    consistency: 0
  });

  useEffect(() => {
    loadTrends();
  }, [selectedMacro, selectedPeriod]);

  const calculateDailyData = (meals, macro) => {
    const days = [];
    const today = new Date();
    const metricConfig = METRICS[macro];
    
    // Calculate for past 10 days, EXCLUDING today
    for (let dayNum = 1; dayNum <= 10; dayNum++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayNum);
      const dateKey = date.toDateString();
      
      const dayMeals = meals.filter(meal => {
        const mealDate = new Date(meal.date);
        const mealDateOnly = new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return new Date(meal.date).toDateString() === dateKey && mealDateOnly < todayOnly;
      });
      
      const dayTotal = metricConfig.type === 'aggregated'
        ? metricConfig.extract(dayMeals)
        : dayMeals.reduce((sum, meal) => sum + metricConfig.extract(meal), 0);
      
      // Only include days that have actual meal entries
      if (dayMeals.length > 0) {
        const dayLabel = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        days.unshift({ 
          x: dayNum, 
          y: dayTotal, 
          label: dayLabel,
          date: dateKey
        });
      }
    }
    
    return days;
  };


  const calculateMonthlyData = (meals, macro) => {
    const months = [];
    const today = new Date();
    const metricConfig = METRICS[macro];
    
    // Calculate for past 10 months
    for (let monthNum = 0; monthNum < 10; monthNum++) {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - monthNum + 1, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth() - monthNum, 1);
      
      const monthMeals = meals.filter(meal => {
        const mealDate = new Date(meal.date);
        const mealDateOnly = new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return mealDate >= monthStart && mealDate <= monthEnd && mealDateOnly < todayOnly;
      });
      
      // Group by date and calculate daily totals
      const mealsByDate = {};
      monthMeals.forEach(meal => {
        const dateKey = new Date(meal.date).toDateString();
        if (!mealsByDate[dateKey]) {
          mealsByDate[dateKey] = [];
        }
        mealsByDate[dateKey].push(meal);
      });
      
      const daysTracked = Object.keys(mealsByDate).length;
      
      if (daysTracked > 0) {
        const dailyValues = Object.values(mealsByDate).map(dayMeals => {
          return metricConfig.type === 'aggregated'
            ? metricConfig.extract(dayMeals)
            : dayMeals.reduce((sum, meal) => sum + metricConfig.extract(meal), 0);
        });
        
        const monthAverage = Math.round(dailyValues.reduce((a, b) => a + b, 0) / daysTracked);
        
        const monthLabel = monthStart.toLocaleDateString('en-US', { 
          month: '2-digit', 
          year: 'numeric' 
        });
        
        months.unshift({ 
          x: monthNum + 1, 
          y: monthAverage, 
          label: monthLabel,
          daysTracked 
        });
      }
    }
    
    return months;
  };

  const loadTrends = async () => {
    try {
      console.log('Loading trends for TrendsScreen...');
      const allMeals = await HybridStorageService.getMeals();
      console.log('Meals loaded:', allMeals.length);
      
      let data;
      if (selectedPeriod === 'day') {
        data = calculateDailyData(allMeals, selectedMacro);
      } else {
        data = calculateMonthlyData(allMeals, selectedMacro);
      }
      
      // Calculate average from periods that have actual data (no zero entries)
      const periodsWithData = data.filter(d => d.y > 0);
      const average = periodsWithData.length > 0 
        ? Math.round(periodsWithData.reduce((sum, d) => sum + d.y, 0) / periodsWithData.length) 
        : 0;
      
      setAverageValue(average);
      setChartData(data);
      console.log('Chart data set:', data.length, 'points');
      
      // Calculate summary stats
      const daysTracked = data.filter(d => d.y > 0).length;
      const consistency = daysTracked > 0 ? Math.round((daysTracked / data.length) * 100) : 0;
      
      setSummaryStats({
        average,
        trend: 'stable', // Could implement trend calculation
        daysTracked,
        consistency
      });
      console.log('Summary stats:', { average, daysTracked, consistency });
    } catch (error) {
      console.error('Error loading trends:', error);
      // Set empty data to prevent crashes
      setChartData([]);
      setAverageValue(0);
      setSummaryStats({ average: 0, trend: 'stable', daysTracked: 0, consistency: 0 });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrends();
    setRefreshing(false);
  };

  const getMacroLabel = () => {
    return METRICS[selectedMacro]?.label || 'Unknown';
  };

  const getPeriodLabel = () => {
    const labels = {
      day: 'Day',
      week: 'Week',
      month: 'Month'
    };
    return labels[selectedPeriod];
  };

  const getAverageUnit = () => {
    const units = {
      calories: 'cal',
      protein: 'g',
      carbs: 'g',
      fat: 'g',
      fiber: 'g',
      processed: '%',
      ultraProcessed: '%',
      caffeine: 'mg',
      freshProduce: 'g'
    };
    return units[selectedMacro] || '';
  };

  const getChartTitle = () => {
    return `Average Daily ${getMacroLabel()} by ${getPeriodLabel()}`;
  };

  // Create average line data
  const averageLineData = chartData.map(d => ({ x: d.x, y: averageValue }));

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Chart Container */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{getChartTitle()}</Text>
        </View>
        
        {averageValue > 0 && (
          <View style={styles.averageLabel}>
            <Text style={styles.averageText}>
              Avg: {averageValue.toLocaleString()} {getAverageUnit()}
            </Text>
          </View>
        )}

        {/* Clean Data Visualization */}
        <View style={styles.chartWrapper}>
          <View style={styles.cleanChart}>
            {/* Data Points List */}
            <View style={styles.dataList}>
              {chartData.map((point, index) => {
                const maxValue = Math.max(...chartData.map(d => d.y), 1);
                const barWidth = maxValue > 0 ? (point.y / maxValue) * 100 : 0;
                const isAboveAverage = point.y > averageValue;
                
                return (
                  <View key={index} style={styles.cleanDataRow}>
                    <View style={styles.dataLabelContainer}>
                      <Text style={styles.cleanDataLabel}>{point.label}</Text>
                    </View>
                    <View style={styles.dataValueContainer}>
                      <Text style={styles.cleanDataValue}>{point.y.toLocaleString()}</Text>
                      <Text style={styles.cleanDataUnit}>{getAverageUnit()}</Text>
                    </View>
                    <View style={styles.cleanBarContainer}>
                      <View 
                        style={[
                          styles.cleanDataBar, 
                          { 
                            width: `${Math.min(barWidth, 100)}%`,
                            backgroundColor: isAboveAverage ? Colors.accent : Colors.primary
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Macro Selection */}
        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>Metric</Text>
          <View style={styles.radioGroup}>
            {Object.keys(METRICS).map((macro) => (
              <TouchableOpacity
                key={macro}
                style={[
                  styles.radioButton,
                  selectedMacro === macro && styles.radioButtonSelected
                ]}
                onPress={() => setSelectedMacro(macro)}
              >
                <Text style={[
                  styles.radioButtonText,
                  selectedMacro === macro && styles.radioButtonTextSelected
                ]}>
                  {METRICS[macro].displayLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Period Selection */}
        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>Time Period</Text>
          <View style={styles.radioGroup}>
            {['day', 'month'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.radioButton,
                  selectedPeriod === period && styles.radioButtonSelected
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.radioButtonText,
                  selectedPeriod === period && styles.radioButtonTextSelected
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chartContainer: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
  },
  chartHeader: {
    marginBottom: Spacing.sm,
  },
  chartTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingNormal,
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  averageLabel: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  averageText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingNormal,
  },
  controlsContainer: {
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.base,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
  },
  controlSection: {
    marginBottom: Spacing.lg,
  },
  controlLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacingNormal,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  radioButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSubtle,
  },
  radioButtonSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  radioButtonText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  radioButtonTextSelected: {
    color: Colors.textInverse,
  },
  summaryStats: {
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    marginTop: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  webFallback: {
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.base,
    padding: Spacing.lg,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  webFallbackTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  webFallbackText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  dataPreview: {
    marginTop: Spacing.base,
    width: '100%',
  },
  dataPoint: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.sm,
  },
  simpleChart: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
  },
  chartSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.base,
    fontWeight: '500',
  },
  dataList: {
    marginBottom: Spacing.base,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dataLabel: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  dataValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: Spacing.base,
  },
  dataValue: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  dataUnit: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  barContainer: {
    width: 80,
    height: 8,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  dataBar: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  averageIndicator: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'center',
  },
  averageIndicatorText: {
    fontSize: Typography.sm,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  cleanChart: {
    width: '100%',
    padding: Spacing.xs,
  },
  cleanDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.xs,
  },
  dataLabelContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  cleanDataLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  cleanDataValue: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cleanDataUnit: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  cleanBarContainer: {
    flex: 2,
    height: 8,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  cleanDataBar: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
});

export default TrendsScreen;
