# Enhanced AI System Documentation

## Overview

The Fuel app now features a significantly enhanced AI system that provides much more accurate macro estimation through database-driven analysis, scientific validation, and intelligent portion estimation.

## 🎯 Key Improvements

### 1. **Per-Item Database Retrieval**
**What it does**: Forces the AI to identify each food item and attempt to match it against authoritative databases.

**Databases Used**:
- **USDA FDC**: Primary source for whole foods (fruits, vegetables, meats, grains)
- **Open Food Facts**: Packaged and branded food items with barcode data
- **Restaurant Menus**: Chain restaurant menu items with standardized nutrition

**Benefits**:
- Eliminates guessing and estimation errors
- Provides exact nutritional data when available
- Clear source attribution for transparency
- Flags unmatched items for user verification

### 2. **Enhanced Portion Estimation**
**What it does**: Uses reference objects and multi-angle analysis for accurate portion sizing.

**Reference Objects**:
- **Credit Card** (3.375" × 2.125") - Most reliable reference
- **Fork** (7-8 inches) - Very common in food photos
- **Standard Dinner Plate** (10-12 inches) - Common serving context
- **Hand/Palm** - For protein portion estimation

**Multi-Angle Analysis**:
- Uses different image angles to triangulate portion size
- Cross-references measurements between images
- Uses depth perception cues for 3D volume estimation

**Density Conversion**:
- **Proteins**: 0.8-1.0 g/cm³ (chicken, beef, fish)
- **Starches**: 0.6-0.8 g/cm³ (rice, pasta, bread)
- **Vegetables**: 0.3-0.5 g/cm³ (leafy greens, broccoli)
- **Fats**: 0.9-1.0 g/cm³ (oils, butter, cheese)

### 3. **Recipe Decomposition & Cooking Methods**
**What it does**: Parses complex meals into ingredients and applies scientific cooking method multipliers.

**Cooking Method Multipliers**:
- **Frying**: +15-25% oil absorption, +5-10% water loss
- **Grilling**: +5-10% oil absorption, +10-15% water loss
- **Steaming**: No oil, +5-10% water gain
- **Sautéing**: +10-15% oil absorption, +5-10% water loss

**Default Templates**:
- **Fried Rice**: Base rice + vegetables + protein + 2-3 tbsp oil
- **Stir-fry**: Base vegetables + protein + 1-2 tbsp oil
- **Pasta with sauce**: Base pasta + sauce ingredients + cooking oil

### 4. **Hard Consistency Checks (Atwater Constraints)**
**What it does**: Enforces scientific energy balance validation.

**Formula**: |calories - (4×carbs + 4×protein + 9×fat)| ≤ 10 calories

**Automatic Rescaling**:
- Identifies least certain macro and rescales to fit constraint
- If rescaling >20% of any macro, asks user for clarification
- Ensures all estimates follow established nutritional science

### 5. **Confidence & Active Query System**
**What it does**: Provides transparency and engages users when accuracy is uncertain.

**Per-Item Confidence** (0-1 scale):
- **0.9-1.0**: Exact database match with precise portion
- **0.7-0.8**: Good database match with estimated portion
- **0.5-0.6**: No database match, visual estimation only
- **0.0-0.4**: High uncertainty, multiple interpretations

**Active Queries**:
- If overall certainty <0.6, asks ONE targeted question
- Examples: "Is this white rice or fried rice?", "Was this cooked with oil or steamed?"
- Questions designed to change outcome most significantly

## 📊 Enhanced Response Structure

The AI now returns much more detailed information:

```json
{
  "title": "Grilled Chicken Rice",
  "certainty": 8,
  "calories": 510,
  "protein": 46,
  "fat": 12,
  "carbs": 45,
  "fiber": 2,
  "caffeine": 0,
  "freshProduce": 150,
  "processed": {
    "percent": 15,
    "calories": 77
  },
  "ultraProcessed": {
    "percent": 0,
    "calories": 0
  },
  "foodItems": [
    {
      "name": "Grilled Chicken Breast",
      "weight": 150,
      "calories": 250,
      "protein": 46,
      "carbs": 0,
      "fat": 5,
      "confidence": 0.9,
      "source": "USDA FDC: Grilled Chicken Breast (100g)",
      "matched": true
    },
    {
      "name": "White Rice",
      "weight": 200,
      "calories": 260,
      "protein": 5,
      "carbs": 56,
      "fat": 0.5,
      "confidence": 0.7,
      "source": "Estimated: No database match",
      "matched": false
    }
  ],
  "atwaterCheck": {
    "passed": true,
    "calculatedCalories": 510,
    "difference": 0
  },
  "activeQuery": null
}
```

## 🔧 Technical Implementation

### Prompt Engineering Strategy
- **Database-First Approach**: Always attempts database matching before estimation
- **Scientific Validation**: Enforces Atwater constraints on all estimates
- **Reference Object Detection**: Actively looks for size references in images
- **Cooking Method Analysis**: Applies scientific multipliers based on preparation method
- **Confidence Scoring**: Provides transparency on accuracy and sources

### Response Processing
- **Enhanced JSON Structure**: Supports new fields for detailed analysis
- **Fallback Mechanisms**: Multiple parsing strategies for reliability
- **Data Validation**: Built-in checks for consistency and accuracy
- **Source Attribution**: Always tracks and displays data sources

## 🎯 User Benefits

### Accuracy Improvements
- **Database Matching**: Uses authoritative nutritional data when available
- **Scientific Validation**: Ensures all estimates follow nutritional science
- **Better Portion Detection**: Reference objects provide more accurate sizing
- **Cooking Method Awareness**: Accounts for oil absorption and water loss

### Transparency
- **Source Attribution**: Users know where data comes from
- **Confidence Indicators**: Clear indication of estimate reliability
- **Active Queries**: System asks for clarification when needed
- **Scientific Validation**: Users can trust the accuracy of estimates

### User Experience
- **Targeted Questions**: Only asks questions that significantly improve accuracy
- **Source Tracking**: Builds trust through transparency
- **Confidence Scoring**: Users understand estimate reliability
- **Scientific Accuracy**: Reliable results users can depend on

## 🚀 Future Enhancements

### Potential Improvements
- **Machine Learning**: Learn from user corrections to improve accuracy
- **Barcode Scanning**: Direct integration with Open Food Facts database
- **Restaurant Integration**: Real-time menu data from restaurant APIs
- **User Feedback Loop**: Incorporate user corrections into future estimates

### Advanced Features
- **Nutritional Goal Tracking**: Align estimates with user's dietary goals
- **Allergen Detection**: Identify potential allergens in food items
- **Dietary Restriction Awareness**: Account for specific dietary needs
- **Cultural Food Recognition**: Better handling of international cuisines

## 📈 Impact Summary

The enhanced AI system provides:
- **Significantly improved accuracy** through database matching
- **Better portion estimation** through reference object detection
- **Scientific validation** through Atwater constraint enforcement
- **Enhanced transparency** through source attribution and confidence scoring
- **Better user experience** through targeted questions and clear feedback

This represents a major advancement in the accuracy and reliability of macro tracking, providing users with trustworthy, scientifically-validated nutritional data.
