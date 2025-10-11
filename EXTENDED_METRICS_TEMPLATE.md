# Extended Metrics Template

This document provides a step-by-step recipe for adding new secondary nutrition metrics to the app.

## Overview

The app uses a flexible JSON-based system to track unlimited nutrition metrics beyond the core macros (calories, protein, carbs, fat). Current extended metrics: **processed %**, **ultra-processed %**, **fiber**.

---

## Step-by-Step Process

### **Step 1: Define the Metric**

**First, we discuss:**
- Metric name (e.g., "fiber", "sugar", "sodium")
- Units (e.g., "g", "mg", "%")
- How Claude should estimate it
- Any special guidelines or edge cases

**Example:**
```
Metric: Fiber
Units: grams (g)
Estimation: Based on whole grains, vegetables, fruits, legumes, nuts, seeds
Guidelines: Use standard fiber content for common foods, round to nearest gram
```

---

### **Step 2: Draft the Prompt Addition**

**File:** `src/services/api.js`

**Location:** Add description in the main prompt section (around line 70-90, before "CRITICAL FORMATTING REQUIREMENTS")

**Template:**
```javascript
**[METRIC NAME]:**
[Description of what to estimate]
- [Guideline 1]
- [Guideline 2]
- [Any special considerations]
```

**Example (Fiber):**
```javascript
**FIBER:**
Estimate dietary fiber in grams. Focus on:
- Whole grains, vegetables, fruits, legumes, nuts, seeds
- Use standard fiber content for common foods
- Round to nearest gram
```

**⚠️ IMPORTANT: Review this prompt addition with the user before implementing!**

---

### **Step 3: Update JSON Structure in Prompts**

**Files:** `src/services/api.js` (2 locations)
- Initial analysis prompt (around line 99-112)
- Refinement prompt (around line 285-298)

**Before:**
```javascript
**NUTRITION_DATA:**
\`\`\`json
{
  "calories": ###,
  "protein": ###,
  "fat": ###,
  "carbs": ###,
  "processed": {
    "percent": ##,
    "calories": ###
  }
}
\`\`\`
```

**After:**
```javascript
**NUTRITION_DATA:**
\`\`\`json
{
  "calories": ###,
  "protein": ###,
  "fat": ###,
  "carbs": ###,
  "fiber": ###,  // ← ADD THIS
  "processed": {
    "percent": ##,
    "calories": ###
  }
}
\`\`\`
```

**Update both prompts in the same way!**

Also update the CRITICAL section to mention the new field:
```javascript
- JSON must be parseable and include all fields including fiber
```

---

### **Step 4: Update JSON Extraction Logic**

**File:** `src/services/api.js`
**Function:** `extractNutritionData()` (around line 372-387)

**Before:**
```javascript
// Extract extended metrics if present
let extendedMetrics = null;
if (data.processed && 
    (typeof data.processed.percent === 'number' || typeof data.processed.calories === 'number')) {
  extendedMetrics = {
    processedCalories: typeof data.processed.calories === 'number' ? data.processed.calories : null,
    processedPercent: typeof data.processed.percent === 'number' ? data.processed.percent : null
  };
  console.log('📊 Extracted extended metrics:', extendedMetrics);
} else {
  console.warn('⚠️ No valid processed food data found in JSON');
}
```

**After:**
```javascript
// Extract extended metrics if present
let extendedMetrics = null;
const hasProcessed = data.processed && 
    (typeof data.processed.percent === 'number' || typeof data.processed.calories === 'number');
const hasFiber = typeof data.fiber === 'number';  // ← ADD THIS

if (hasProcessed || hasFiber) {  // ← UPDATE CONDITION
  extendedMetrics = {
    processedCalories: data.processed?.calories ?? null,
    processedPercent: data.processed?.percent ?? null,
    fiber: hasFiber ? data.fiber : null  // ← ADD THIS
  };
  console.log('📊 Extracted extended metrics:', extendedMetrics);
} else {
  console.warn('⚠️ No valid extended metrics found in JSON');
}
```

**Pattern for any metric:**
```javascript
const has[MetricName] = typeof data.[metricField] === 'number';
// Add to condition: if (hasProcessed || hasFiber || has[MetricName])
// Add to object: [metricField]: has[MetricName] ? data.[metricField] : null
```

---

### **Step 5: Display in Meal Card (Expanded View)**

**File:** `src/components/MealCard.js`
**Location:** Inside the `extendedMetricsContainer` (around line 80-92)

**Before:**
```javascript
{meal.extendedMetrics.processedPercent != null && (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>Processed calories</Text>
    <Text style={styles.metricValue}>{meal.extendedMetrics.processedPercent}%</Text>
  </View>
)}
{/* Future metrics can be added here */}
```

**After:**
```javascript
{meal.extendedMetrics.processedPercent != null && (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>Processed calories</Text>
    <Text style={styles.metricValue}>{meal.extendedMetrics.processedPercent}%</Text>
  </View>
)}
{meal.extendedMetrics.fiber != null && (  // ← ADD THIS
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>Fiber</Text>
    <Text style={styles.metricValue}>{meal.extendedMetrics.fiber}g</Text>
  </View>
)}
{/* Future metrics can be added here */}
```

**Template:**
```javascript
{meal.extendedMetrics.[metricField] != null && (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>[Display Name]</Text>
    <Text style={styles.metricValue}>{meal.extendedMetrics.[metricField]}[unit]</Text>
  </View>
)}
```

---

### **Step 6: Display in Chat (Sticky Bottom Macros)**

**File:** `src/screens/CameraScreen.js`
**Location:** Extended Metrics Row (around line 638-645)

**Before:**
```javascript
{/* Extended Metrics Row */}
{currentExtendedMetrics?.processedPercent != null && (
  <View style={styles.extendedMetricsRow}>
    <Text style={styles.extendedMetricText}>
      {currentExtendedMetrics.processedPercent}% processed
    </Text>
  </View>
)}
```

**After (single metric on same line):**
```javascript
{/* Extended Metrics Row */}
{(currentExtendedMetrics?.processedPercent != null || currentExtendedMetrics?.fiber != null) && (
  <View style={styles.extendedMetricsRow}>
    {currentExtendedMetrics?.processedPercent != null && (
      <Text style={styles.extendedMetricText}>
        {currentExtendedMetrics.processedPercent}% processed
      </Text>
    )}
    {currentExtendedMetrics?.fiber != null && (
      <Text style={[styles.extendedMetricText, currentExtendedMetrics?.processedPercent != null && { marginLeft: Spacing.base }]}>
        {currentExtendedMetrics.fiber}g fiber
      </Text>
    )}
  </View>
)}
```

**Template for additional metrics:**
```javascript
{currentExtendedMetrics?.[metricField] != null && (
  <Text style={[styles.extendedMetricText, { marginLeft: Spacing.base }]}>
    {currentExtendedMetrics.[metricField]}[unit] [label]
  </Text>
)}
```

---

### **Step 7: Add to Home Screen Daily Totals**

**File:** `src/screens/HomeScreen.js`

**Add state for the metric:**
```javascript
const [dailyFiber, setDailyFiber] = useState(0);  // ← ADD THIS
```

**Calculate daily total in `loadMeals()` (after calculating processed %):**
```javascript
// Calculate total fiber for the day
const totalFiber = dateMeals.reduce((sum, meal) => 
  sum + (meal.extendedMetrics?.fiber || 0), 0);
setDailyFiber(totalFiber);
```

**Pass to MacroDisplay component:**
```javascript
<MacroDisplay macros={dailyMacros} processedPercent={dailyProcessedPercent} fiber={dailyFiber} />
```

---

### **Step 8: Update MacroDisplay Component**

**File:** `src/components/MacroDisplay.js`

**Update component signature:**
```javascript
const MacroDisplay = ({ macros, processedPercent, fiber }) => {  // ← ADD fiber
```

**Update the extended metrics display:**
```javascript
{/* Extended Metrics */}
{(processedPercent != null || (fiber != null && fiber > 0)) && (
  <View style={styles.extendedMetricsContainer}>
    {processedPercent != null && (
      <Text style={styles.extendedMetricText}>
        {processedPercent}% of calories from processed sources
      </Text>
    )}
    {fiber != null && fiber > 0 && (
      <Text style={styles.extendedMetricText}>
        {formatNumber(fiber)}g fiber
      </Text>
    )}
  </View>
)}
```

**Note:** Metrics will be left-aligned and stacked vertically in the gray container.

---

### **Step 9: Update Chat Sticky Macros Alignment**

**File:** `src/screens/CameraScreen.js`
**Style:** `extendedMetricsRow` (around line 933)

**Ensure left alignment (not centered):**
```javascript
extendedMetricsRow: {
  marginTop: Spacing.sm,
  paddingTop: Spacing.sm,
  borderTopWidth: 1,
  borderTopColor: Colors.borderLight,
  flexDirection: 'row',  // ← ADD THIS (not 'center')
  alignItems: 'center',
},
```

**Result:** Metrics align to the left side of the sticky macros card, not centered.

---

### **Step 10: Add to Trends Page (Optional)**

If you want to plot the metric over time on the Trends page:

**File:** `src/screens/HistoryScreen.js`

**Simply add to the METRICS configuration object at the top of the file:**

```javascript
const METRICS = {
  // ... existing metrics
  fiber: {
    label: 'Fiber',
    displayLabel: 'Fiber',
    extract: (meal) => meal.extendedMetrics?.fiber || 0,
    type: 'extended'  // or 'standard' if it's a core macro
  }
};
```

**That's it!** The metric will automatically:
- ✅ Appear in the radio buttons
- ✅ Be calculated correctly for days/weeks/months
- ✅ Show the right label on the chart
- ✅ Handle moving averages

**Metric Types:**
- `'standard'`: Core macros stored directly on meal (e.g., `meal.calories`)
- `'extended'`: Metrics in `extendedMetrics` object (e.g., `meal.extendedMetrics.fiber`)
- `'aggregated'`: Metrics that need special calculation (e.g., processed % uses `calculateAggregatedProcessed`)

**No other code changes needed!** The calculation functions are fully generic.

---

### **Step 11: Test & Commit**

1. **Check for syntax errors:**
   ```bash
   # Look for linter errors
   npx eslint src/services/api.js src/components/MealCard.js src/screens/CameraScreen.js
   ```

2. **Test the feature:**
   - Enable debug toggle
   - Analyze a meal
   - Verify JSON contains the new field
   - Check console logs show extraction
   - Verify display in chat sticky macros
   - Verify display in expanded meal card

3. **Commit:**
   ```bash
   git add -A
   git commit -m "Feature: Add [metric name] tracking as secondary metric

   Added [metric name] estimation to Claude prompts and JSON structure.
   Displays in meal cards (Additional Metrics) and chat sticky macros.
   Extracted and stored in extendedMetrics.
   
   [Any specific notes about the metric]"
   ```

---

## Quick Reference: Files to Update

| Step | File | Location | What to Change |
|------|------|----------|----------------|
| 2 | `src/services/api.js` | Lines 70-90 | Add metric description |
| 3 | `src/services/api.js` | Lines 99-112, 285-298 | Add field to JSON structure (2 places) |
| 4 | `src/services/api.js` | Lines 372-387 | Add extraction logic |
| 5 | `src/components/MealCard.js` | Lines 80-92 | Add display row |
| 6 | `src/screens/CameraScreen.js` | Lines 638-645 | Add to sticky macros |
| 7 | `src/screens/HomeScreen.js` | Multiple | Add daily aggregation |
| 8 | `src/components/MacroDisplay.js` | Multiple | Update to display metric |
| 9 | `src/screens/CameraScreen.js` | Line 933 | Fix alignment (left, not center) |
| 10 | `src/screens/HistoryScreen.js` | Multiple | (Optional) Add to Trends page |

---

## Example Metrics to Add

**Fiber** (already defined above)

**Sugar:**
```javascript
**SUGAR:**
Estimate total sugars in grams. Include:
- Natural sugars (fruits, dairy)
- Added sugars (processed foods, sweeteners)
- Round to nearest gram
```

**Sodium:**
```javascript
**SODIUM:**
Estimate sodium content in milligrams. Consider:
- Processed foods, restaurant dishes (typically high sodium)
- Fresh, whole foods (typically low sodium)
- Use standard sodium values for common foods
```

**Saturated Fat:**
```javascript
**SATURATED FAT:**
Estimate saturated fat in grams (subset of total fat). Focus on:
- Animal products (meat, dairy, butter)
- Tropical oils (coconut, palm)
- Processed/fried foods
```

---

## Important Notes

1. **Always test with debug toggle ON first** to verify JSON structure
2. **Storage is automatic** - `extendedMetrics` object is stored with meals
3. **Backwards compatible** - Old meals without new metrics still work
4. **No UI changes needed for new metrics** - Just add to the list
5. **Console logs help debugging** - Check extraction success
6. **Metric ordering** - Order in meal card matches order added to code

---

## Troubleshooting

**Metric not showing in meal card:**
- Check if `extendedMetrics` object exists on meal
- Verify the field name matches exactly
- Check console logs for extraction warnings

**Metric not extracting from JSON:**
- Enable debug toggle to see raw JSON
- Verify Claude is returning the field
- Check extraction logic validation (typeof === 'number')
- Look for typos in field names

**Syntax errors:**
- Check for semicolons inside template literals (backticks)
- Verify all string quotes are properly closed
- Run linter to catch issues early

---

## Future Enhancements

**Add to Trends Page:**
If you want to plot a metric over time, update `src/screens/HistoryScreen.js`:
1. Add to `selectedMacro` options
2. Add to `getMacroLabel()` function
3. Handle in calculation functions (like processed %)

**Add to MacroDisplay (Home Page):**
If metric should show in daily totals, update `src/screens/HomeScreen.js` and `src/components/MacroDisplay.js`

---

## Summary

This template ensures consistency and makes it easy to add unlimited nutrition metrics without breaking existing functionality. The JSON-based system is robust, scalable, and user-friendly.

**Key principle:** Each metric is optional, independently tracked, and displayed only when present.

