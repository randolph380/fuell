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
import StorageService from '../services/storage';
import { calculateAggregatedProcessed } from '../utils/extendedMetrics';

const TrendsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState('calories'); // calories, protein, carbs, fat, processed
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
    
    // Calculate for past 10 days
    for (let dayNum = 0; dayNum < 10; dayNum++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayNum);
      const dateKey = date.toDateString();
      
      const dayMeals = meals.filter(meal => {
        return new Date(meal.date).toDateString() === dateKey;
      });
      
      let dayTotal;
      if (macro === 'processed') {
        // Calculate processed % for the day
        const processedData = calculateAggregatedProcessed(dayMeals);
        dayTotal = processedData.processedPercent || 0;
      } else {
        dayTotal = dayMeals.reduce((acc, meal) => acc + (meal[macro] || 0), 0);
      }
      
      days.unshift({ value: dayTotal, dayNum: dayNum + 1 });
    }
    
    // Count days with actual data
    const daysWithData = days.filter(d => d.value > 0).length;
    
    // Only include moving average if we have at least 3 days of data
    const datasets = [
      { 
        data: days.map(d => d.value || 0),
        color: () => Colors.accent,
        strokeWidth: 3
      }
    ];
    
    if (daysWithData >= 3) {
      // Calculate 3-day moving average
      const movingAverage = days.map((day, index) => {
        if (index < 2) return day.value;
        
        const threeDaySum = days[index].value + days[index - 1].value + days[index - 2].value;
        return Math.round(threeDaySum / 3);
      });
      
      datasets.push({ 
        data: movingAverage,
        color: () => '#10b981',
        strokeWidth: 2
      });
    }
    
    return {
      labels: days.map(d => `${d.dayNum}`),
      datasets,
      hasMovingAverage: daysWithData >= 3
    };
  };

  const calculateMonthlyData = (meals, macro) => {
    const months = [];
    const today = new Date();
    
    // Calculate for past 10 months
    for (let monthNum = 0; monthNum < 10; monthNum++) {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - monthNum + 1, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth() - monthNum, 1);
      
      const monthMeals = meals.filter(meal => {
        const mealDate = new Date(meal.timestamp);
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
        let monthAverage;
        if (macro === 'processed') {
          // Calculate processed % average for the month
          const dailyProcessedPercents = Object.values(mealsByDate).map(dayMeals => {
            const processedData = calculateAggregatedProcessed(dayMeals);
            return processedData.processedPercent || 0;
          });
          monthAverage = Math.round(dailyProcessedPercents.reduce((a, b) => a + b, 0) / daysTracked);
        } else {
          const dailyTotals = Object.values(mealsByDate).map(dayMeals => {
            return dayMeals.reduce((acc, meal) => acc + (meal[macro] || 0), 0);
          });
          monthAverage = Math.round(dailyTotals.reduce((a, b) => a + b, 0) / daysTracked);
        }
        
        months.unshift({ average: monthAverage, monthNum: monthNum + 1 });
      } else {
        months.unshift({ average: 0, monthNum: monthNum + 1 });
      }
    }
    
    // Count months with actual data
    const monthsWithData = months.filter(m => m.average > 0).length;
    
    const datasets = [
      { 
        data: months.map(m => m.average || 0),
        color: () => Colors.accent,
        strokeWidth: 3
      }
    ];
    
    // Only include moving average if we have at least 3 months of data
    if (monthsWithData >= 3) {
      const movingAverage = months.map((month, index) => {
        if (index < 2) return month.average;
        
        const threeMonthSum = months[index].average + months[index - 1].average + months[index - 2].average;
        return Math.round(threeMonthSum / 3);
      });
      
      datasets.push({ 
        data: movingAverage,
        color: () => '#10b981',
        strokeWidth: 2
      });
    }
    
    return {
      labels: months.map(m => `${m.monthNum}`),
      datasets,
      hasMovingAverage: monthsWithData >= 3
    };
  };

  const calculateAveragesForPeriod = (meals, daysBack) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Filter meals within the period
    const periodMeals = meals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= startDate && mealDate <= today;
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
    
    // Calculate for past 10 weeks
    for (let weekNum = 0; weekNum < 10; weekNum++) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - (weekNum * 7));
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      
      const weekMeals = meals.filter(meal => {
        const mealDate = new Date(meal.timestamp);
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
        let weekAverage;
        if (macro === 'processed') {
          // Calculate processed % average for the week
          const dailyProcessedPercents = Object.values(mealsByDate).map(dayMeals => {
            const processedData = calculateAggregatedProcessed(dayMeals);
            return processedData.processedPercent || 0;
          });
          weekAverage = Math.round(dailyProcessedPercents.reduce((a, b) => a + b, 0) / daysTracked);
        } else {
          const dailyTotals = Object.values(mealsByDate).map(dayMeals => {
            return dayMeals.reduce((acc, meal) => acc + (meal[macro] || 0), 0);
          });
          weekAverage = Math.round(dailyTotals.reduce((a, b) => a + b, 0) / daysTracked);
        }
        
        weeks.unshift({ average: weekAverage, weekNum: weekNum + 1 });
      } else {
        weeks.unshift({ average: 0, weekNum: weekNum + 1 });
      }
    }
    
    // Count weeks with actual data
    const weeksWithData = weeks.filter(w => w.average > 0).length;
    
    const datasets = [
      { 
        data: weeks.map(w => w.average || 0),
        color: () => Colors.accent,
        strokeWidth: 3
      }
    ];
    
    // Only include moving average if we have at least 3 weeks of data
    if (weeksWithData >= 3) {
      const movingAverage = weeks.map((week, index) => {
        if (index < 2) return week.average;
        
        const threeWeekSum = weeks[index].average + weeks[index - 1].average + weeks[index - 2].average;
        return Math.round(threeWeekSum / 3);
      });
      
      datasets.push({ 
        data: movingAverage,
        color: () => '#10b981',
        strokeWidth: 2
      });
    }
    
    return {
      labels: weeks.map(w => `${w.weekNum}`), // Just numbers without "W" prefix
      datasets,
      hasMovingAverage: weeksWithData >= 3
    };
  };

  const loadTrends = async () => {
    try {
      const allMeals = await StorageService.getMeals();
      
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
    const labels = {
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Net Carbs',
      fat: 'Fat',
      processed: 'Processed %'
    };
    return labels[selectedMacro];
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
            data={chartData}
            width={Dimensions.get('window').width - 64}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
            withShadow={false}
          />
        </View>
        <Text style={styles.xAxisLabel}>{getPeriodLabel()}</Text>
        {chartData.hasMovingAverage && (
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
              <Text style={styles.legendText}>{getPeriodLabel()}ly Average</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>3-{getPeriodLabel()} Moving Avg.</Text>
            </View>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Macro Selection */}
        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>Metric</Text>
          <View style={styles.radioGroup}>
            {['calories', 'protein', 'carbs', 'fat', 'processed'].map((macro) => (
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
                  {macro === 'carbs' ? 'Net Carbs' : macro === 'processed' ? 'Processed %' : macro.charAt(0).toUpperCase() + macro.slice(1)}
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
  legendText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
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
});

export default TrendsScreen;
