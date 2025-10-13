# Fuel App - Data Models Documentation

## Overview
This document defines the data structures, schemas, and storage patterns used throughout the Fuel app.

## User Authentication
```javascript
// User identification
const userId = string; // Clerk user ID
const userKey = `user_${userId}_${dataType}`; // Storage key pattern
```

## Core Data Models

### Meal Object
```javascript
const meal = {
  id: string,                    // Unique identifier
  name: string,                  // Meal name
  calories: number,             // Total calories
  protein: number,              // Protein in grams
  carbs: number,                // Carbohydrates in grams
  fat: number,                  // Fat in grams
  date: string,                 // ISO date string
  timestamp: string,            // ISO timestamp
  time: string,                // Display time (e.g., "12:30 PM")
  extendedMetrics: {           // Optional extended nutritional data
    processedPercent: number,   // Percentage of processed calories
    fiber: number,              // Fiber in grams
    ultraProcessedPercent: number, // Percentage of ultra-processed calories
    caffeine: number,           // Caffeine in mg
    freshProduce: number,       // Fresh produce in grams
    processedCalories: number,  // Processed calories
    ultraProcessedCalories: number // Ultra-processed calories
  }
};
```

### Daily Macros Object
```javascript
const dailyMacros = {
  [dateString]: {              // Key is date string (e.g., "Mon Jan 01 2024")
    calories: number,          // Total daily calories
    protein: number,           // Total daily protein
    carbs: number,             // Total daily carbs
    fat: number                // Total daily fat
  }
};
```

### Saved Meal Template
```javascript
const savedMeal = {
  id: string,                  // Unique identifier
  name: string,               // Template name
  calories: number,           // Template calories
  protein: number,            // Template protein
  carbs: number,              // Template carbs
  fat: number,                // Template fat
  createdAt: string,          // Creation timestamp
  updatedAt: string           // Last update timestamp
};
```

### User Preferences
```javascript
const userPreferences = {
  dailyCalorieGoal: number,    // Daily calorie target (default: 2000)
  dailyProteinGoal: number,    // Daily protein target (default: 150)
  dailyCarbsGoal: number,     // Daily carbs target (default: 250)
  dailyFatGoal: number,       // Daily fat target (default: 65)
  units: string               // Unit system ('metric' or 'imperial')
};
```

## Storage Keys

### Key Structure
```javascript
const KEYS = {
  MEALS: 'meals',             // User's meal history
  DAILY_MACROS: 'daily_macros', // Daily macro summaries
  SAVED_MEALS: 'saved_meals',  // Saved meal templates
  USER_PREFERENCES: 'user_preferences' // User settings
};

// Actual storage keys are prefixed with user ID
const userKey = `user_${userId}_${KEYS.MEALS}`;
```

### Storage Service Methods
```javascript
// Meal operations
StorageService.saveMeal(meal)
StorageService.getMeals()
StorageService.getMealsByDate(date)
StorageService.deleteMeal(mealId)
StorageService.updateMeal(mealId, updatedMeal)

// Daily macros operations
StorageService.saveDailyMacros(date, macros)
StorageService.getDailyMacros(date)
StorageService.getAllDailyMacros()

// Saved meals operations
StorageService.saveMealTemplate(mealTemplate)
StorageService.getSavedMeals()
StorageService.deleteSavedMeal(mealId)
StorageService.updateSavedMeal(mealId, updatedMeal)

// User preferences operations
StorageService.saveUserPreferences(preferences)
StorageService.getUserPreferences()

// Utility operations
StorageService.clearAllData()
StorageService.getStorageSize()
```

## Backup Data Structure

### JSON Backup Format
```javascript
const backupData = {
  version: string,             // Backup format version (e.g., "1.0.0")
  timestamp: string,          // ISO timestamp of backup creation
  userId: string,             // User ID who created backup
  data: {
    meals: Array<Meal>,       // All user meals
    dailyMacros: Object,      // All daily macro records
    savedMeals: Array<SavedMeal>, // All saved meal templates
    preferences: UserPreferences // User preferences
  }
};
```

### CSV Export Format (Meals Only)
```csv
# Fuel App - Meals Export
# Export Date: 1/15/2024
# Total Meals: 25

ID,Name,Calories,Protein,Carbs,Fat,Date,Timestamp,Processed%,Fiber,UltraProcessed%,Caffeine,FreshProduce,ProcessedCalories,UltraProcessedCalories
meal_123,Chicken Breast,250,45,0,8,2024-01-15,2024-01-15T12:30:00Z,10,2,5,0,150,25,12.5
```

## Data Validation

### Meal Validation
```javascript
const validateMeal = (meal) => {
  const required = ['id', 'name', 'calories', 'protein', 'carbs', 'fat'];
  return required.every(field => meal[field] !== undefined && meal[field] !== null);
};
```

### Date Handling
```javascript
// All dates stored as ISO strings
const dateString = new Date().toISOString();
const displayDate = new Date(dateString).toDateString();
const displayTime = new Date(dateString).toLocaleTimeString();
```

## Data Relationships

### User → Meals
- One user has many meals
- Meals are filtered by user ID
- Meals can be filtered by date

### User → Daily Macros
- One user has one daily macro record per date
- Daily macros are calculated from meals
- Can be manually overridden

### User → Saved Meals
- One user has many saved meal templates
- Templates can be used to create new meals
- Templates are user-specific

### User → Preferences
- One user has one preferences object
- Preferences affect UI display and calculations
- Preferences are user-specific

## Data Flow Patterns

### Adding a Meal
1. User inputs meal data
2. Validate meal data
3. Save to user's meal storage
4. Update daily macros for that date
5. Refresh UI with new data

### Backup Process
1. Collect all user data (meals, macros, saved meals, preferences)
2. Create backup object with metadata
3. Export as JSON (full backup) or CSV (meals only)
4. Save to device storage
5. Option to share file

### Restore Process
1. Validate backup file format
2. Verify user ID matches current user
3. Clear existing user data
4. Import backup data
5. Refresh UI with restored data

## Error Handling

### Storage Errors
```javascript
try {
  await StorageService.saveMeal(meal);
  return true;
} catch (error) {
  console.error('Error saving meal:', error);
  return false;
}
```

### Backup Errors
```javascript
try {
  const backupData = await SimpleBackup.createBackup();
  return backupData;
} catch (error) {
  console.error('Error creating backup:', error);
  throw new Error('Failed to create backup');
}
```

## Performance Considerations

### Data Size Limits
- AsyncStorage has size limits (typically 6MB)
- Monitor storage usage with `getStorageSize()`
- Implement data cleanup for old records if needed

### Efficient Queries
- Use date-based filtering for meals
- Cache frequently accessed data
- Implement pagination for large datasets

### Memory Management
- Clear unused data from memory
- Implement proper cleanup in useEffect
- Avoid storing large objects in state unnecessarily

## Migration Patterns

### Version Updates
```javascript
const migrateData = (oldData, newVersion) => {
  // Handle data structure changes
  // Add new fields with defaults
  // Remove deprecated fields
  return migratedData;
};
```

### Backup Compatibility
- Maintain backward compatibility
- Handle missing fields gracefully
- Provide migration paths for old backups
