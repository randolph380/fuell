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
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // day, week, month
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { data: [], color: () => Colors.accent, strokeWidth: 3 },
      { data: [], color: () => '#10b981', strokeWidth: 2 }
    ]
  });

  useEffect(() => {
    loadTrends();
  }, [selectedMacro, selectedPeriod]);

  const calculateDailyData = (meals, macro) => {
    const days = [];
    const today = new Date();
    const metricConfig = METRICS[macro];
    
    // Calculate for past 10 days, EXCLUDING today (dayNum starts at 1, not 0)
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
      
      days.unshift({ value: dayTotal, dayNum: dayNum + 1 });
    }
    
    return {
      labels: days.map(d => `${d.dayNum}`),
      datasets: [
        { 
          data: days.map(d => d.value || 0),
          color: () => Colors.accent,
          strokeWidth: 3
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
        // For current month (monthNum === 0), exclude current day
        if (monthNum === 0) {
          return mealDate >= monthStart && mealDateOnly < todayOnly;
        }
        return mealDate >= monthStart && mealDate <= monthEnd;
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
        months.unshift({ average: monthAverage, monthNum: monthNum + 1 });
      } else {
        months.unshift({ average: 0, monthNum: monthNum + 1 });
      }
    }
    
    return {
      labels: months.map(m => `${m.monthNum}`),
      datasets: [
        { 
          data: months.map(m => m.average || 0),
          color: () => Colors.accent,
          strokeWidth: 3
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
        // For current week (weekNum === 0), exclude current day
        if (weekNum === 0) {
          return mealDate >= weekStart && mealDateOnly < todayOnly;
        }
        return mealDate >= weekStart && mealDate <= weekEnd;
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
        weeks.unshift({ average: weekAverage, weekNum: weekNum + 1 });
      } else {
        weeks.unshift({ average: 0, weekNum: weekNum + 1 });
      }
    }
    
    return {
      labels: weeks.map(w => `${w.weekNum}`), // Just numbers without "W" prefix
      datasets: [
        { 
          data: weeks.map(w => w.average || 0),
          color: () => Colors.accent,
          strokeWidth: 3
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

  const getChartTitle = () => {
    return `Average Daily ${getMacroLabel()} by ${getPeriodLabel()}`;
  };

  // Function to create clean Y-axis labels (multiples of 10, 100, 1000)
  const formatYLabel = (value) => {
    if (value === 0) return '0';
    
    // Determine the scale based on the value
    if (value >= 1000) {
      return Math.round(value / 100) * 100; // Round to nearest 100
    } else if (value >= 100) {
      return Math.round(value / 10) * 10; // Round to nearest 10
    } else {
      return Math.round(value); // Round to nearest whole number
    }
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
        <Text style={styles.chartTitle}>{getChartTitle()}</Text>
        <View style={styles.chartShiftContainer}>
          <LineChart
            data={createCleanChartData(chartData)}
            width={Dimensions.get('window').width - 64}
            height={220}
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
                r: '4',
                strokeWidth: '2',
                stroke: Colors.accent
              },
              propsForBackgroundLines: {
                stroke: '#e5e5e5',
                strokeWidth: 1,
                strokeDasharray: '0',
              }
            }}
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
            withShadow={false}
            // Remove bezier to eliminate line connections
          />
        </View>
        <Text style={styles.xAxisLabel}>{getPeriodLabel()}</Text>
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
  chartTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingNormal,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  chartShiftContainer: {
    marginLeft: -20,
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
    transform: [{ rotate: '-90deg' }, { translateY: -40 }],
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
