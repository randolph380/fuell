# Fuel App - Prompt Engineering Strategy Documentation

## Overview

This document outlines the comprehensive prompt engineering strategy used in the Fuel macro tracking app. The system leverages Claude AI (Sonnet 4.5) for food analysis through sophisticated prompt engineering techniques that ensure accurate, consistent, and user-friendly macro estimation.

## 🎯 Core Strategy Principles

### 1. **Database-Driven Accuracy**
- **Per-Item Retrieval**: Forces AI to identify foods and match against databases (USDA FDC, Open Food Facts, restaurant menus)
- **Source Attribution**: Always cites data sources for transparency and accuracy
- **No Guessing Policy**: Unmatched items are clearly flagged with higher uncertainty

### 2. **Scientific Validation**
- **Atwater Constraints**: Enforces energy balance validation |calories - (4×carbs + 4×protein + 9×fat)| ≤ 10
- **Automatic Rescaling**: Identifies least certain macro and adjusts to fit constraints
- **Cooking Method Multipliers**: Scientific multipliers for oil absorption and water loss

### 3. **Enhanced Portion Estimation**
- **Reference Object Detection**: Actively looks for credit cards, forks, plates, hands for size calibration
- **Multi-Angle Analysis**: Uses different image angles to triangulate portion size
- **Density Conversion**: Food class → density mapping for volume to weight conversion

### 4. **Context-Aware Prompting**
- **Dynamic Context Building**: Prompts adapt based on user input type (images, text, multiple images)
- **Meal Preparation Context**: Different prompts for restaurant vs. home-cooked vs. packaged meals
- **Multi-Image Intelligence**: Specialized handling for nutrition labels, scales, and food photos

### 5. **Confidence & Active Queries**
- **Per-Item Confidence**: Rates each food item separately (0-1 scale)
- **Active Queries**: Triggers targeted questions when overall certainty <0.6
- **Source Tracking**: Provides data sources and confidence levels for transparency

### 6. **Structured Output Control**
- **JSON Schema Enforcement**: Strict formatting requirements for consistent data extraction
- **Fallback Mechanisms**: Multiple parsing strategies (JSON → regex → manual extraction)
- **Validation Layers**: Built-in data validation and error handling

### 7. **Conversational Refinement**
- **Iterative Improvement**: Users can refine estimates through natural conversation
- **Context Preservation**: Maintains conversation history for coherent interactions
- **Confidence Scoring**: Transparent uncertainty communication to users

## 🚀 Enhanced Features (Latest Update)

### **Per-Item Database Retrieval System**
- **USDA FDC Matching**: Primary source for whole foods with exact nutritional data
- **Open Food Facts**: Packaged and branded food items with barcode data
- **Restaurant Databases**: Chain restaurant menu items with standardized nutrition
- **Source Attribution**: Always cites data source for transparency
- **Unmatched Handling**: Clearly flags items with no database match and higher uncertainty

### **Enhanced Portion Estimation**
- **Reference Object Detection**: Actively looks for credit cards (3.375" × 2.125"), forks (7-8"), plates (10-12")
- **Multi-Angle Analysis**: Uses different image angles to triangulate portion size
- **Density Conversion Table**: Food class → density mapping for volume to weight conversion
- **3D Volume Estimation**: Uses depth perception cues and cross-references between images

### **Recipe Decomposition & Cooking Methods**
- **Ingredient Breakdown**: Identifies base ingredients, cooking methods, and added fats/oils
- **Cooking Method Multipliers**:
  - **Frying**: +15-25% oil absorption, +5-10% water loss
  - **Grilling**: +5-10% oil absorption, +10-15% water loss
  - **Steaming**: No oil, +5-10% water gain
  - **Sautéing**: +10-15% oil absorption, +5-10% water loss
- **Default Templates**: Common dish templates (fried rice, stir-fry, pasta with sauce)
- **User Overrides**: Allows user to specify cooking method if unclear

### **Hard Consistency Checks (Atwater Constraints)**
- **Energy Balance Validation**: |calories - (4×carbs + 4×protein + 9×fat)| ≤ 10 calories
- **Automatic Rescaling**: Identifies least certain macro and rescales to fit constraint
- **Clarification Requests**: Asks user for clarification if rescaling >20% of any macro
- **Scientific Accuracy**: Ensures all estimates follow established nutritional science

### **Confidence & Active Query System**
- **Per-Item Confidence**: Rates each food item separately (0-1 scale)
- **Overall Certainty**: Calculates weighted average of all items
- **Active Queries**: If overall certainty <0.6, asks ONE targeted question
- **Source Tracking**: Provides data sources and confidence levels for transparency

## 📋 Prompt Architecture

### **Primary Prompt Types**

#### 1. **Initial Analysis Prompt**
**Purpose**: First-time food analysis from images/text
**Location**: `src/services/api.js` lines 121-277

**Key Components**:
- **Per-Item Database Retrieval**: Forces identification and database matching for each food item
- **Enhanced Portion Estimation**: Reference object detection and multi-angle analysis
- **Recipe Decomposition**: Ingredient breakdown with cooking method multipliers
- **Atwater Constraint Validation**: Scientific energy balance enforcement
- **Confidence & Active Queries**: Per-item confidence scoring and targeted questions
- **Context Detection**: Multi-image vs. single-item analysis
- **Preparation Context**: Restaurant, home-cooked, or packaged meal handling
- **NOVA Classification**: Scientific food processing level assessment
- **Extended Metrics**: Fiber, caffeine, fresh produce, processed food percentages

#### 2. **Refinement Prompt**
**Purpose**: Iterative improvement based on user feedback
**Location**: `src/services/api.js` lines 407-480

**Key Components**:
- **Conversation History**: Maintains context across multiple exchanges
- **Confidence Updates**: Adjusts certainty based on new information
- **Mathematical Transparency**: Shows calculation steps for user verification
- **Portion Ratio Handling**: Applies fractional consumption (half, quarter, etc.)

#### 3. **System Prompts**
**Purpose**: Underlying behavior and response formatting
**Location**: `src/services/api.js` lines 407-480

**Key Components**:
- **Response Style**: Concise, informative, conversational
- **Formatting Requirements**: Strict JSON output structure
- **Error Handling**: Graceful failure and user guidance
- **Certainty Communication**: Transparent confidence scoring

## 🔧 Technical Implementation

### **Prompt Construction Pipeline**

```javascript
// 1. Context Detection
const multiImageInstructions = isMultipleDishes ? 
  `**USER INDICATED: MULTIPLE ITEMS (sum for this meal)**` :
  `**USER INDICATED: ONE ITEM (with labels, scale, or multiple angles)**`;

// 2. Preparation Context
const preparationContext = mealPreparation ? 
  `**MEAL PREPARATION CONTEXT: ${mealPreparation.toUpperCase()}**` : '';

// 3. Core Analysis Instructions
const initialPrompt = `Let's analyze this meal! I'll give you my best estimate.
${multiImageInstructions}
${preparationContext}
[Detailed analysis instructions...]`;

// 4. Message Content Assembly
const messageContent = [
  { type: 'image', source: { type: 'base64', data: imageData } },
  { type: 'text', text: textContent }
];
```

### **Response Parsing Strategy**

```javascript
// 1. Primary: JSON Extraction
const jsonMatch = text.match(/\*\*NUTRITION_DATA:\*\*\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);

// 2. Fallback: Legacy Regex
const caloriesMatch = text.match(/Calories:\s*([\d,]+)\s*kcal/i);

// 3. Validation & Error Handling
if (typeof data.calories !== 'number') {
  return this._extractNutritionDataLegacy(text);
}
```

## 🎨 Prompt Engineering Techniques

### **1. Few-Shot Learning**
**Implementation**: Examples embedded in prompts for complex scenarios
```javascript
**Example response format:**
"Looking at your hot pot plates:
- Small plate of noodles (~80g) → 120 cal
- 6 thin beef slices (~60g) → 150 cal  
- Mixed vegetables (~100g) → 40 cal
Total: 310 calories. Mostly NOVA 1 (fresh ingredients) with minimal processing."
```

### **2. Chain-of-Thought Reasoning**
**Implementation**: Step-by-step calculation transparency
```javascript
**PORTION RATIO HANDLING:**
- If user mentions eating a fraction in description (e.g., "had half this bread", "ate 1/3", "quarter of this"), apply that exact ratio to ALL macros
- Examples: "had half this bread" = calculate full bread portion from image, then multiply by 0.5
- Always show the math: "Full portion: 300 cal → Half portion: 300 × 0.5 = 150 cal"
```

### **3. Context Switching**
**Implementation**: Dynamic prompt adaptation based on input type
```javascript
if (hasImages && foodDescription) {
  // Images + text context
  textContent = `**USER PROVIDED INFORMATION:** "${foodDescription}"
  [Context-aware instructions...]`;
} else if (hasImages) {
  // Images only
  textContent = initialPrompt;
} else {
  // TEXT ONLY - no image
  textContent = `${initialPrompt}\n\n⚠️ NO IMAGES PROVIDED - User text description only`;
}
```

### **4. Structured Output Control**
**Implementation**: Strict JSON schema enforcement
```javascript
**NUTRITION_DATA:**
\`\`\`json
{
  "title": "[EXACTLY 2 words - e.g. Chocolate Cookie, Grilled Chicken, Yogurt Berries]",
  "certainty": #,
  "calories": ###,
  "protein": ###,
  "fat": ###,
  "carbs": ###,
  "fiber": ###,
  "caffeine": ###,
  "freshProduce": ###,
  "processed": {
    "percent": ##,
    "calories": ###
  },
  "ultraProcessed": {
    "percent": ##,
    "calories": ###
  }
}
\`\`\`
```

## 🧠 Advanced Prompting Strategies

### **1. NOVA Classification System**
**Purpose**: Scientific food processing level assessment
**Implementation**: Multi-tier decision tree with edge case handling

```javascript
**NOVA 1 (0% processed) - Unprocessed/Minimally Processed:**
- Can you make this at home with basic cooking (boiling, grilling, steaming)?
- Examples: fresh fruit, plain rice, grilled chicken, steamed vegetables, plain yogurt
- Key test: ONE ingredient + basic preparation

**NOVA 4 (100% processed) - Ultra-Processed:**
- Industrial formulations with 5+ ingredients including additives
- Contains substances NEVER used in home cooking
- Examples: sodas, chips, instant noodles, packaged snacks, shelf-stable desserts
- Key test: Look for modified starches, emulsifiers, stabilizers, flavor enhancers, preservatives, artificial colors
```

### **2. Portion Size Calibration**
**Purpose**: Accurate visual portion estimation
**Implementation**: Reference-based sizing with uncertainty communication

```javascript
**PORTION SIZE ESTIMATION (CRITICAL):**
- COUNT individual pieces when visible: "4 dumplings", "6 shrimp", "3 slices of bread"
- Estimate WEIGHT, not volume: thin meat slices ≠ thick steaks, small bowls ≠ large bowls
- Use visual references to calibrate portion sizes:
  * Compare to utensils, plates, hands visible in frame
  * Small appetizer plate (6-8 inches): typically 100-250 calories
  * Standard dinner plate (10-12 inches): typically 400-800 calories
  * Palm-sized protein: ~100-150g meat/fish
  * Fist-sized carbs: ~150-200g cooked grain/pasta
```

### **3. Restaurant-Specific Intelligence**
**Purpose**: Enhanced accuracy for commercial food
**Implementation**: Chain-specific knowledge and portion adjustments

```javascript
**RESTAURANT MEAL ANALYSIS:**
- **RESTAURANT IDENTIFICATION:** Try to identify the restaurant chain or type from visual cues
- Look for: logos, packaging, distinctive plating, menu items, restaurant-specific dishes
- **RESTAURANT-SPECIFIC KNOWLEDGE:** Use your knowledge of restaurant chains and their typical:
  * Portion sizes (restaurant portions are often 1.5-2x larger than home servings)
  * Cooking methods (more oil, butter, salt, sugar than home cooking)
  * Hidden ingredients (cooking oils, sauces, seasonings, marinades)
```

## 🔄 Conversation Management

### **Conversation History Structure**
```javascript
const conversationHistory = [
  {
    role: 'user',
    content: 'I had half of this bread'
  },
  {
    role: 'assistant', 
    content: 'Perfect! Scale was tared, so 200g is yogurt weight. Math: (200/170) × 150 = 176 cal. Plus 30 cal berries = 206 total.'
  }
];
```

### **Refinement Prompt System**
```javascript
const refinementSystem = `The user provided additional information! Let's refine the estimate.

IMPORTANT: 
- Your certainty should INCREASE (or stay the same) with MORE information
- Update macros based on the new information
- Be concise and direct - get to the point quickly
- REMEMBER: If you saw multiple images (label, scale, etc.), use ALL that data
- If you have exact label data + scale weights, you should have HIGH certainty
```

## 📊 Output Formatting & Parsing

### **Structured Response Format**
```javascript
**Analyzing:** [State what you received - e.g., "2 images + text description", "3 images", "text description only"]

[Your brief conversational analysis - 2-3 sentences max. Mention NOVA classification naturally.]

**CERTAINTY RATING:**
Rate your confidence in this estimate (0-10 scale):
- 8-10: Exact data available (nutrition labels, precise weights, clear portions)
- 6-7: Good visual clarity, standard portions, familiar foods
- 4-5: Partial ambiguity (hidden ingredients, unclear portions, unfamiliar preparation)
- 0-3: High uncertainty (blurry images, unusual foods, no size reference)

**NUTRITION_DATA:**
```json
{
  "title": "[EXACTLY 2 words]",
  "certainty": #,
  "calories": ###,
  "protein": ###,
  "fat": ###,
  "carbs": ###,
  "fiber": ###,
  "caffeine": ###,
  "freshProduce": ###,
  "processed": {
    "percent": ##,
    "calories": ###
  },
  "ultraProcessed": {
    "percent": ##,
    "calories": ###
  }
}
```
```

### **Multi-Layer Parsing Strategy**
```javascript
// 1. Primary: JSON Block Extraction
const jsonMatch = text.match(/\*\*NUTRITION_DATA:\*\*\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);

// 2. Fallback: Legacy Regex Patterns
const caloriesMatch = text.match(/Calories:\s*([\d,]+)\s*kcal/i);

// 3. Validation & Error Handling
if (typeof data.calories !== 'number') {
  console.warn('⚠️ Invalid JSON structure, falling back to regex');
  return this._extractNutritionDataLegacy(text);
}
```

## 🎯 Performance Optimization

### **Token Management**
- **Max Tokens**: 3000 for initial analysis, 3000 for refinement
- **Model Selection**: Claude Sonnet 4.5 for optimal performance/cost balance
- **Context Optimization**: Dynamic prompt sizing based on input complexity

### **Error Handling**
```javascript
// User-friendly error messages
if (errorMessage.includes('overloaded') || errorMessage.includes('Overloaded')) {
  throw new Error('Claude is currently overloaded. Please wait a moment and try again.');
}
```

### **Response Caching**
- **Conversation State**: Maintains context across refinement cycles
- **Macro Persistence**: Preserves estimates during conversation
- **Error Recovery**: Graceful fallback to previous estimates

## 🔧 Extensibility Framework

### **Adding New Metrics**
**Process**: Follow the EXTENDED_METRICS_TEMPLATE.md pattern
1. **Define Metric**: Name, units, estimation guidelines
2. **Update Prompts**: Add to both initial and refinement prompts
3. **Update JSON Schema**: Include in NUTRITION_DATA structure
4. **Update Parsing**: Add to extraction logic

### **Example: Adding Sugar Metric**
```javascript
**SUGAR:**
Estimate total sugar content in grams based on the food components.
- Use nutrition label data if visible in images
- Otherwise estimate using standard sugar content for common foods
- Include both natural and added sugars
- Round to nearest gram
```

## 📈 Quality Assurance

### **Certainty Scoring System**
```javascript
**CERTAINTY RATING:**
Rate your confidence in this estimate (0-10 scale):
- 8-10: Exact data available (nutrition labels, precise weights, clear portions)
- 6-7: Good visual clarity, standard portions, familiar foods
- 4-5: Partial ambiguity (hidden ingredients, unclear portions, unfamiliar preparation)
- 0-3: High uncertainty (blurry images, unusual foods, no size reference)
```

### **Validation Layers**
1. **JSON Structure Validation**: Required fields present and correct types
2. **Range Validation**: Reasonable macro values (calories > 0, etc.)
3. **Consistency Checks**: Processed % >= Ultra-processed %
4. **Title Validation**: Filter out invalid titles (analysis instructions, etc.)

### **User Feedback Integration**
- **Clarifying Questions**: Ask for missing critical information
- **Confidence Communication**: Transparent uncertainty levels
- **Refinement Opportunities**: Clear paths for improvement

## 🚀 Future Enhancements

### **Advanced Prompting Techniques**
1. **Multi-Modal Chain-of-Thought**: Step-by-step visual reasoning
2. **Dynamic Few-Shot Examples**: Context-specific examples
3. **Uncertainty Quantification**: Probabilistic confidence intervals
4. **Domain-Specific Knowledge**: Restaurant menu databases

### **Performance Optimizations**
1. **Prompt Compression**: More efficient context usage
2. **Response Streaming**: Real-time analysis updates
3. **Caching Strategies**: Common food database
4. **Batch Processing**: Multiple image analysis

### **User Experience Improvements**
1. **Progressive Disclosure**: Gradual information revelation
2. **Interactive Refinement**: Real-time adjustment interface
3. **Confidence Visualization**: Visual uncertainty indicators
4. **Educational Content**: Learning from AI explanations

## 📚 Best Practices

### **Prompt Design Principles**
1. **Clarity**: Unambiguous instructions and examples
2. **Consistency**: Standardized formatting and terminology
3. **Completeness**: Cover all edge cases and scenarios
4. **Conciseness**: Efficient token usage without information loss

### **Error Prevention**
1. **Input Validation**: Check for required fields before API calls
2. **Graceful Degradation**: Fallback strategies for parsing failures
3. **User Communication**: Clear error messages and recovery paths
4. **Logging**: Comprehensive error tracking for debugging

### **Maintenance Guidelines**
1. **Version Control**: Track prompt changes and their impact
2. **A/B Testing**: Compare prompt variations for effectiveness
3. **User Feedback**: Incorporate real-world usage patterns
4. **Performance Monitoring**: Track accuracy and response times

## 🎯 Success Metrics

### **Accuracy Metrics**
- **Macro Estimation Accuracy**: ±10% of actual values
- **Certainty Calibration**: High confidence = high accuracy
- **User Satisfaction**: Refinement success rate
- **Processing Time**: <30 seconds for analysis

### **User Experience Metrics**
- **Conversation Success Rate**: % of successful refinements
- **Error Recovery**: % of failed analyses that recover
- **User Engagement**: Average conversation length
- **Feature Adoption**: Usage of extended metrics

---

## 📝 Implementation Checklist

### **For New Features**
- [ ] Define prompt requirements and edge cases
- [ ] Draft prompt additions following established patterns
- [ ] Update JSON schema in both initial and refinement prompts
- [ ] Add parsing logic for new fields
- [ ] Test with various input scenarios
- [ ] Validate error handling and fallbacks
- [ ] Update documentation

### **For Prompt Improvements**
- [ ] Identify specific accuracy or UX issues
- [ ] Design targeted prompt modifications
- [ ] Test with representative examples
- [ ] Measure impact on accuracy and user experience
- [ ] Deploy with monitoring
- [ ] Document changes and rationale

---

**This prompt engineering strategy represents a sophisticated approach to AI-powered food analysis, balancing accuracy, user experience, and technical feasibility. The system's modular design allows for continuous improvement while maintaining reliability and consistency.**
