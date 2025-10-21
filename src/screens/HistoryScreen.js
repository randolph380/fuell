import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';
import HybridStorageService from '../services/hybridStorage';
import { calculateAggregatedProcessed, calculateAggregatedUltraProcessed } from '../utils/extendedMetrics';

// Metric configuration - add new metrics here!
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
    type: 'aggregated'  // Special: operates on meal array
  },
  ultraProcessed: {
    label: 'Ultra-Processed %',
    displayLabel: 'Ultra-Processed %',
    extract: (meals) => calculateAggregatedUltraProcessed(meals).ultraProcessedPercent || 0,
    type: 'aggregated'  // Special: operates on meal array
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
  const [selectedMacro, setSelectedMacro] = useState('calories'); // calories, protein, carbs, fat, processed, fiber
  const [selectedPeriod, setSelectedPeriod] = useState('day'); // day, week, month
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { data: [], color: () => '#001f3f', strokeWidth: 3 },
      { data: [], color: () => '#10b981', strokeWidth: 2 }
    ]
  });
  const [summaryStats, setSummaryStats] = useState({
    average: 0,
    trend: 'stable', // 'up', 'down', 'stable'
    daysTracked: 0,
    consistency: 0
  });
  const [averageValue, setAverageValue] = useState(0);

  useEffect(() => {
    loadTrends();
  }, [selectedMacro, selectedPeriod]);

  const calculateDailyData = (meals, macro) => {
    const days = [];
    const today = new Date();
    const metricConfig = METRICS[macro];
    
    // Calculate for past 10 days, EXCLUDING today (start from yesterday)
    for (let dayNum = 1; dayNum <= 10; dayNum++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayNum);
      const dateKey = date.toDateString();
      
      const dayMeals = meals.filter(meal => {
        return new Date(meal.date).toDateString() === dateKey;
      });
      
      // Generic extraction based on metric type
      const dayTotal = metricConfig.type === 'aggregated'
        ? metricConfig.extract(dayMeals)  // Pass whole array for aggregated metrics
        : dayMeals.reduce((sum, meal) => sum + metricConfig.extract(meal), 0);  // Sum individual meals
      
      // Create a more descriptive label
      const dayLabel = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      days.unshift({ value: dayTotal, dayNum: dayNum + 1, label: dayLabel });
    }
    
    return {
      labels: days.map(d => d.label),
      datasets: [
        { 
          data: days.map(d => d.value || 0),
          color: () => 'transparent',
          strokeWidth: 0
        }
      ]
    };
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
        const mealDate = new Date(meal.timestamp);
        const mealDateOnly = new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // Always exclude today from all calculations
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
        // Generic calculation: get daily values, then average
        const dailyValues = Object.values(mealsByDate).map(dayMeals => {
          return metricConfig.type === 'aggregated'
            ? metricConfig.extract(dayMeals)  // Aggregated: operate on day's meals
            : dayMeals.reduce((sum, meal) => sum + metricConfig.extract(meal), 0);  // Standard: sum individual meals
        });
        
        const monthAverage = Math.round(dailyValues.reduce((a, b) => a + b, 0) / daysTracked);
        
        // Create month label (MM/YYYY format)
        const monthLabel = monthStart.toLocaleDateString('en-US', { 
          month: '2-digit', 
          year: 'numeric' 
        });
        
        months.unshift({ average: monthAverage, monthNum: monthNum + 1, label: monthLabel });
      } else {
        // Create month label even for empty months (MM/YYYY format)
        const monthLabel = monthStart.toLocaleDateString('en-US', { 
          month: '2-digit', 
          year: 'numeric' 
        });
        months.unshift({ average: 0, monthNum: monthNum + 1, label: monthLabel });
      }
    }
    
    return {
      labels: months.map(m => m.label),
      datasets: [
        { 
          data: months.map(m => m.average || 0),
          color: () => 'transparent',
          strokeWidth: 0
        }
      ]
    };
  };

  const calculateAveragesForPeriod = (meals, daysBack) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Filter meals within the period, EXCLUDING current day (assume it's in progress)
    const periodMeals = meals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      const mealDateOnly = new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return mealDate >= startDate && mealDateOnly < todayOnly; // Exclude current day
    });
    
    // Group meals by date to count unique days tracked
    const mealsByDate = {};
    periodMeals.forEach(meal => {
      const dateKey = new Date(meal.date).toDateString();
      if (!mealsByDate[dateKey]) {
        mealsByDate[dateKey] = [];
      }
      mealsByDate[dateKey].push(meal);
    });
    
    const daysTracked = Object.keys(mealsByDate).length;
    
    if (daysTracked === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, daysTracked: 0 };
    }
    
    // Calculate daily totals for each tracked day
    const dailyTotals = Object.values(mealsByDate).map(dayMeals => {
      return dayMeals.reduce((acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    });
    
    // Calculate averages across tracked days
    const totals = dailyTotals.reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    return {
      calories: Math.round(totals.calories / daysTracked),
      protein: Math.round(totals.protein / daysTracked),
      carbs: Math.round(totals.carbs / daysTracked),
      fat: Math.round(totals.fat / daysTracked),
      daysTracked
    };
  };

  const calculateWeeklyData = (meals, macro) => {
    const weeks = [];
    const today = new Date();
    const metricConfig = METRICS[macro];
    
    // Calculate for past 10 weeks
    for (let weekNum = 0; weekNum < 10; weekNum++) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - (weekNum * 7));
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      
      const weekMeals = meals.filter(meal => {
        const mealDate = new Date(meal.timestamp);
        const mealDateOnly = new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // Always exclude today from all calculations
        return mealDate >= weekStart && mealDate <= weekEnd && mealDateOnly < todayOnly;
      });
      
      // Group by date and calculate daily totals
      const mealsByDate = {};
      weekMeals.forEach(meal => {
        const dateKey = new Date(meal.date).toDateString();
        if (!mealsByDate[dateKey]) {
          mealsByDate[dateKey] = [];
        }
        mealsByDate[dateKey].push(meal);
      });
      
      const daysTracked = Object.keys(mealsByDate).length;
      
      if (daysTracked > 0) {
        // Generic calculation: get daily values, then average
        const dailyValues = Object.values(mealsByDate).map(dayMeals => {
          return metricConfig.type === 'aggregated'
            ? metricConfig.extract(dayMeals)  // Aggregated: operate on day's meals
            : dayMeals.reduce((sum, meal) => sum + metricConfig.extract(meal), 0);  // Standard: sum individual meals
        });
        
        const weekAverage = Math.round(dailyValues.reduce((a, b) => a + b, 0) / daysTracked);
        
        // Create week range label (shorter format)
        const weekStartLabel = weekStart.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        const weekEndLabel = weekEnd.toLocaleDateString('en-US', { 
          day: 'numeric' 
        });
        const weekLabel = `${weekStartLabel}-${weekEndLabel}`;
        
        weeks.unshift({ average: weekAverage, weekNum: weekNum + 1, label: weekLabel });
      } else {
        // Create week range label even for empty weeks (shorter format)
        const weekStartLabel = weekStart.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        const weekEndLabel = weekEnd.toLocaleDateString('en-US', { 
          day: 'numeric' 
        });
        const weekLabel = `${weekStartLabel}-${weekEndLabel}`;
        weeks.unshift({ average: 0, weekNum: weekNum + 1, label: weekLabel });
      }
    }
    
    return {
      labels: weeks.map(w => w.label),
      datasets: [
        { 
          data: weeks.map(w => w.average || 0),
          color: () => 'transparent',
          strokeWidth: 0
        }
      ]
    };
  };

  const loadTrends = async () => {
    try {
      const allMeals = await HybridStorageService.getMeals();
      
      let data;
      if (selectedPeriod === 'day') {
        data = calculateDailyData(allMeals, selectedMacro);
      } else if (selectedPeriod === 'week') {
        data = calculateWeeklyData(allMeals, selectedMacro);
      } else {
        data = calculateMonthlyData(allMeals, selectedMacro);
      }
      
      // Calculate average excluding zero values
      const values = data.datasets[0].data;
      const nonZeroValues = values.filter(val => val > 0);
      const average = nonZeroValues.length > 0 ? Math.round(nonZeroValues.reduce((sum, val) => sum + val, 0) / nonZeroValues.length) : 0;
      setAverageValue(average);
      
      // Add average line to chart data
      const averageLineData = new Array(values.length).fill(average);
      data.datasets.push({
        data: averageLineData,
        color: () => '#007AFF', // Blue color for average line
        strokeWidth: 2,
        strokeDashArray: [5, 5], // Dashed line
        withDots: false // Remove dots from average line
      });
      
      setChartData(data);
    } catch (error) {
      console.error('Error loading trends:', error);
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

  // Function to create clean Y-axis labels (multiples of 10 only)
  const formatYLabel = (value) => {
    if (value === 0) return '0';
    
    // Force all Y-axis labels to be multiples of 10
    return Math.round(value / 10) * 10;
  };

  // Function to create clean chart data with proper Y-axis scaling
  const createCleanChartData = (data) => {
    if (!data || !data.datasets || !data.datasets[0]) return data;
    
    const values = data.datasets[0].data;
    const maxValue = Math.max(...values);
    
    // Determine Y-axis step based on max value
    let yAxisStep;
    if (maxValue >= 1000) {
      yAxisStep = 100;
    } else if (maxValue >= 100) {
      yAxisStep = 10;
    } else {
      yAxisStep = 1;
    }
    
    // Create clean Y-axis labels
    const yAxisLabels = [];
    for (let i = 0; i <= Math.ceil(maxValue / yAxisStep) * yAxisStep; i += yAxisStep) {
      yAxisLabels.push(i);
    }
    
    return {
      ...data,
      yAxisStep,
      yAxisLabels
    };
  };

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
        {/* VERSION 1 */}
        <View style={styles.chartVersion}>
          <Text style={styles.versionTitle}>Version 1: width-60, height-280, padding-15</Text>
          <View style={[styles.chartShiftContainer, {paddingHorizontal: 15, paddingBottom: Spacing.lg}]}>
            <LineChart
              data={createCleanChartData(chartData)}
              width={Dimensions.get('window').width - 60}
              height={280}
              verticalLabelRotation={-90}
              horizontalLabelRotation={0}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              formatYLabel: formatYLabel,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '0',
                stroke: '#001f3f',
                fill: '#001f3f'
              },
              propsForBackgroundLines: {
                stroke: '#e5e5e5',
                strokeWidth: 1,
                strokeDasharray: '0',
              },
            }}
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
            withShadow={false}
            bezier={false}
            withScrollableDot={false}
            withHorizontalLines={true}
            withVerticalLines={true}
            withLine={true}
          />
          </View>
        </View>

        {/* VERSION 2 */}
        <View style={styles.chartVersion}>
          <Text style={styles.versionTitle}>Version 2: width-40, height-320, padding-20</Text>
          <View style={[styles.chartShiftContainer, {paddingHorizontal: 20, paddingBottom: Spacing.xl}]}>
            <LineChart
              data={createCleanChartData(chartData)}
              width={Dimensions.get('window').width - 40}
              height={320}
              verticalLabelRotation={-90}
              horizontalLabelRotation={0}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                formatYLabel: formatYLabel,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '0',
                  stroke: '#001f3f',
                  fill: '#001f3f'
                },
                propsForBackgroundLines: {
                  stroke: '#e5e5e5',
                  strokeWidth: 1,
                  strokeDasharray: '0',
                },
              }}
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              bezier={false}
              withScrollableDot={false}
              withHorizontalLines={true}
              withVerticalLines={true}
              withLine={true}
            />
          </View>
        </View>

        {/* VERSION 3 */}
        <View style={styles.chartVersion}>
          <Text style={styles.versionTitle}>Version 3: width-80, height-260, padding-10</Text>
          <View style={[styles.chartShiftContainer, {paddingHorizontal: 10, paddingBottom: Spacing.base}]}>
            <LineChart
              data={createCleanChartData(chartData)}
              width={Dimensions.get('window').width - 80}
              height={260}
              verticalLabelRotation={-90}
              horizontalLabelRotation={0}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                formatYLabel: formatYLabel,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '0',
                  stroke: '#001f3f',
                  fill: '#001f3f'
                },
                propsForBackgroundLines: {
                  stroke: '#e5e5e5',
                  strokeWidth: 1,
                  strokeDasharray: '0',
                },
              }}
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              bezier={false}
              withScrollableDot={false}
              withHorizontalLines={true}
              withVerticalLines={true}
              withLine={true}
            />
          </View>
        </View>

        {/* VERSION 4 */}
        <View style={styles.chartVersion}>
          <Text style={styles.versionTitle}>Version 4: width-50, height-300, padding-25</Text>
          <View style={[styles.chartShiftContainer, {paddingHorizontal: 25, paddingBottom: Spacing.xl}]}>
            <LineChart
              data={createCleanChartData(chartData)}
              width={Dimensions.get('window').width - 50}
              height={300}
              verticalLabelRotation={-90}
              horizontalLabelRotation={0}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                formatYLabel: formatYLabel,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '0',
                  stroke: '#001f3f',
                  fill: '#001f3f'
                },
                propsForBackgroundLines: {
                  stroke: '#e5e5e5',
                  strokeWidth: 1,
                  strokeDasharray: '0',
                },
              }}
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              bezier={false}
              withScrollableDot={false}
              withHorizontalLines={true}
              withVerticalLines={true}
              withLine={true}
            />
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
            {['day', 'week', 'month'].map((period) => (
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
  chartShiftContainer: {
    marginLeft: 0,
    paddingHorizontal: 15,
    paddingBottom: Spacing.lg,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  yAxisLabelContainer: {
    position: 'absolute',
    left: -5,
    top: '50%',
    zIndex: 10,
  },
  yAxisText: {
    fontSize: Typography.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  chart: {
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  xAxisLabel: {
    fontSize: Typography.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },
  averageLabel: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  averageText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingNormal,
  },
  chartVersion: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
  },
  versionTitle: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
    textAlign: 'center',
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
});

export default TrendsScreen;
