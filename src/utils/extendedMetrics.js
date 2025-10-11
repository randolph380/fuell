// Extended Metrics Utility Functions
// Handles additional nutritional metrics beyond basic macros (calories, protein, carbs, fat)

/**
 * Get color for processed food percentage based on NOVA classification impact
 * @param {number} percent - Percentage of calories from processed sources (0-100)
 * @returns {string} Color code
 */
export const getProcessedColor = (percent) => {
  if (percent <= 20) return '#10b981'; // Green - mostly whole foods
  if (percent <= 50) return '#f59e0b'; // Yellow/Amber - lightly processed
  if (percent <= 80) return '#f97316'; // Orange - moderately processed
  return '#ef4444'; // Red - highly processed
};

/**
 * Get label for processed food percentage
 * @param {number} percent - Percentage of calories from processed sources (0-100)
 * @returns {string} Descriptive label
 */
export const getProcessedLabel = (percent) => {
  if (percent <= 20) return 'Mostly whole foods';
  if (percent <= 50) return 'Lightly processed';
  if (percent <= 80) return 'Moderately processed';
  return 'Highly processed';
};

/**
 * Calculate aggregated processed percentage from multiple meals
 * @param {Array} meals - Array of meal objects
 * @returns {Object} { processedCalories, totalCalories, processedPercent }
 */
export const calculateAggregatedProcessed = (meals) => {
  if (!meals || meals.length === 0) {
    return { processedCalories: 0, totalCalories: 0, processedPercent: 0 };
  }

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const processedCalories = meals.reduce((sum, meal) => 
    sum + (meal.extendedMetrics?.processedCalories || 0), 0
  );

  const processedPercent = totalCalories > 0 
    ? Math.round((processedCalories / totalCalories) * 100) 
    : 0;

  return { processedCalories, totalCalories, processedPercent };
};

/**
 * Get default extended metrics object
 * @returns {Object} Default extended metrics with all fields set to null
 */
export const getDefaultExtendedMetrics = () => ({
  processedCalories: null,
  processedPercent: null,
  // Future metrics can be added here:
  // fiber: null,
  // sugar: null,
  // sodium: null,
  // saturatedFat: null,
});

/**
 * Merge extended metrics, keeping existing values if new ones are null
 * @param {Object} existing - Existing extended metrics
 * @param {Object} updated - New extended metrics
 * @returns {Object} Merged extended metrics
 */
export const mergeExtendedMetrics = (existing, updated) => {
  if (!existing && !updated) return null;
  if (!existing) return updated;
  if (!updated) return existing;

  return {
    ...existing,
    ...Object.entries(updated).reduce((acc, [key, value]) => {
      // Only overwrite if new value is not null/undefined
      if (value != null) {
        acc[key] = value;
      }
      return acc;
    }, {})
  };
};

/**
 * Validate extended metrics values
 * @param {Object} metrics - Extended metrics object
 * @returns {boolean} True if metrics are valid
 */
export const validateExtendedMetrics = (metrics) => {
  if (!metrics) return true; // null/undefined is valid (optional)

  // Processed calories should be non-negative if present
  if (metrics.processedCalories != null && metrics.processedCalories < 0) {
    return false;
  }

  // Processed percent should be 0-100 if present
  if (metrics.processedPercent != null && 
      (metrics.processedPercent < 0 || metrics.processedPercent > 100)) {
    return false;
  }

  return true;
};

/**
 * Format processed metric for display
 * @param {number} processedCalories - Calories from processed sources
 * @param {number} processedPercent - Percentage from processed sources
 * @returns {string} Formatted string
 */
export const formatProcessedMetric = (processedCalories, processedPercent) => {
  if (processedCalories == null || processedPercent == null) {
    return null;
  }

  return `${processedPercent}% processed (${processedCalories} kcal)`;
};

