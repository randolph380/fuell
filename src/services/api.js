// Claude API service for macro analysis
const API_BASE_URL = 'http://192.168.5.171:5000/api';

class ClaudeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async analyzeMealImage(imageData, foodDescription = '', additionalImages = [], isMultipleDishes = false) {
    try {
      // Build context-specific instructions based on user's selection
      const multiImageInstructions = isMultipleDishes ? 
        `**YOU ARE ANALYZING: MULTIPLE SEPARATE DISHES**

The user has indicated these images show DIFFERENT, SEPARATE meals/dishes:

**How to analyze:**
1. Look at EACH image independently
2. Identify what food is in EACH image (e.g., Image 1: grilled chicken, Image 2: rice bowl, Image 3: salad)
3. Calculate macros for EACH dish separately
4. Show your breakdown for each individual dish
5. Then ADD all macros together for the final total

**Example approach:**
- Image 1 (Chicken breast): 200g grilled chicken = 330 cal, 62g protein, 0g carbs, 7g fat
- Image 2 (Rice): 150g white rice = 195 cal, 4g protein, 43g carbs, 0g fat  
- Image 3 (Salad): Mixed greens with dressing = 80 cal, 2g protein, 8g carbs, 5g fat
- **TOTAL: 605 cal, 68g protein, 51g carbs, 12g fat**` 
        : 
        `**YOU ARE ANALYZING: ONE SINGLE DISH**

The user has indicated these images all relate to the SAME meal:

**How to analyze:**
1. Look at ALL images together - they provide different information about ONE dish
2. Images might show:
   - Nutrition label of an ingredient
   - Scale measurement showing weight
   - The assembled dish
   - Individual components or additions
3. COMBINE all information from all images to analyze THIS ONE MEAL
4. If you see multiple scale readings with DIFFERENT weights, this means:
   - LARGER weight = TOTAL combined weight
   - SMALLER weight = ONE component measured separately
   - SUBTRACT smaller from larger to find the other component
   - Example: 360g total, 214g yogurt alone → berries = 360g - 214g = 146g

**Example approach:**
- Image 1: Bowl on scale showing 360g total
- Image 2: Yogurt nutrition label (120 cal per 170g serving)
- Image 3: Just yogurt on scale showing 214g
- **Analysis**: Yogurt (214g) + berries (360g - 214g = 146g) = ONE dish with combined macros`;

      const initialPrompt = `Let's analyze this meal! I'll give you my best estimate.

${multiImageInstructions}

**SCALE/WEIGHT ASSUMPTION:**
- ASSUME the scale is TARED (zeroed) - the weight shown is ONLY the food, not the container
- ALWAYS ask the user to confirm if the scale was tared when you see a scale

**CALORIE ESTIMATION PHILOSOPHY:**
- Strive for ACCURACY - use exact data when available (labels, scales, measurements)
- When uncertain about portions or hidden ingredients (oils, butter, sauces), err 5-10% higher rather than under
- Examples: If chicken looks 6-7 oz, estimate 7 oz. If oil was likely used, include it.

**RESPONSE STYLE:**
- Be concise but informative - get to the point quickly
- Use short sentences and bullet points
- Skip unnecessary elaboration
- Focus on the key facts and calculations

**PROCESSED FOOD CLASSIFICATION:**
Use the NOVA classification system to estimate processed food percentage:
- NOVA 1 (0% processed): Unprocessed/minimally processed foods
- NOVA 2 (100% processed): Processed culinary ingredients  
- NOVA 3 (70% processed): Processed foods
- NOVA 4 (100% processed): Ultra-processed foods

For each component, assign the appropriate NOVA group and calculate the weighted processed calories.

**FIBER:**
Estimate dietary fiber in grams based on the food components.
- Use nutrition label data if visible in images
- Otherwise estimate using standard fiber content
- Round to nearest gram

**ULTRA-PROCESSED FOOD:**
Estimate the percentage of calories from ultra-processed foods (NOVA Group 4 only).
- NOVA 4 includes: Industrial formulations with 5+ ingredients, additives, preservatives
- Examples: packaged snacks, sodas, instant meals, processed meats, sweetened cereals
- Report as percentage of total calories from NOVA 4 foods only

**CAFFEINE:**
Estimate caffeine content in milligrams based on the food/beverage components.
- Use nutrition label data if visible in images
- Otherwise estimate using standard caffeine content
- Round to nearest 5mg

**FRESH PRODUCE:**
Estimate total grams of fresh fruits and vegetables (combined).
- Include: fresh or frozen fruits and vegetables (raw or cooked), legumes
- Exclude: potatoes and other starchy tubers (cassava, yams)
- Exclude: fruit juice, dried fruit
- Round to nearest 10g

**CRITICAL FORMATTING REQUIREMENTS:**
YOU MUST format your response EXACTLY as shown below:

**Title:** [EXACTLY 2 words - e.g. "Chocolate Cookie", "Grilled Chicken", "Yogurt Berries"]

[Your brief conversational analysis - 2-3 sentences max. Mention NOVA classification naturally.]

I have [low/medium/high] certainty on this estimate.

[Optional: ONE question if critical info missing]

**NUTRITION_DATA:**
\`\`\`json
{
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

CRITICAL:
- Start with **Title:** on first line
- Keep analysis conversational and brief
- End with valid JSON in the NUTRITION_DATA code block
- JSON must be parseable and include all fields`;

      let messageContent = [];
      
      // Add main image if provided
      if (imageData) {
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageData
          }
        });
      }
      
      // Add additional images (e.g., nutrition labels)
      if (additionalImages && additionalImages.length > 0) {
        additionalImages.forEach(imgData => {
          messageContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imgData
            }
          });
        });
      }
      
      // Add text content with context based on input type
      let textContent = initialPrompt;
      
      const hasImages = imageData || (additionalImages && additionalImages.length > 0);
      
      if (hasImages && foodDescription) {
        // Images + text context
        textContent = `**USER PROVIDED INFORMATION:** "${foodDescription}"

The user has provided text alongside the images. This text may contain valuable information such as:
- Weights or measurements (e.g., "0.8 pounds", "200g") - if provided, use this as your primary measurement data
- Restaurant or brand names - helps with more accurate estimates
- Cooking methods or preparation details - important for calorie calculations
- Additional context about ingredients or portions

Analyze the images AND incorporate the user's text information into your estimate. If the user provides a specific weight, use it for your calculations rather than trying to visually estimate.

${initialPrompt}`;
        if (additionalImages && additionalImages.length > 0) {
          const totalImages = (imageData ? 1 : 0) + additionalImages.length;
          textContent += `\n\n📊 ANALYZING ${totalImages} IMAGES - Look at them in order! They likely show: nutrition label → scale weight → final dish. Calculate step by step using the data from each image AND the user's provided information above.`;
        }
      } else if (hasImages) {
        // Images only
        textContent = initialPrompt;
        if (additionalImages && additionalImages.length > 0) {
          const totalImages = (imageData ? 1 : 0) + additionalImages.length;
          textContent += `\n\n📊 ANALYZING ${totalImages} IMAGES - Look at them in order! They likely show: nutrition label → scale weight → final dish. Use the nutrition label values and scale measurements to calculate exact macros. Show your work step by step.`;
        }
      } else {
        // TEXT ONLY - no image
        textContent = `${initialPrompt}\n\n⚠️ NO IMAGES PROVIDED - User text description only: "${foodDescription}"\n\nIMPORTANT: Respond as if analyzing a text description. Do NOT use visual language like "appears", "visible", "looks like", "seems to be". Use definitive language: "This is...", "This contains...", "Based on this description..."`;
      }
      
      messageContent.push({
        type: 'text',
        text: textContent
      });

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 3000,
          messages: [
            {
              role: 'user',
              content: messageContent
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.error?.type || 'API request failed';
        
        // Provide user-friendly error messages
        if (errorMessage.includes('overloaded') || errorMessage.includes('Overloaded')) {
          throw new Error('Claude is currently overloaded. Please wait a moment and try again.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;
      
      // Parse nutrition data (macros + extended metrics) from response
      const nutritionData = this.extractNutritionData(assistantMessage);
      
      return {
        response: assistantMessage,
        macros: nutritionData.macros,
        extendedMetrics: nutritionData.extendedMetrics
      };
    } catch (error) {
      console.error('Error analyzing meal image:', error);
      throw error;
    }
  }

  async refineAnalysis(conversationHistory) {
    try {
      // conversationHistory already includes the new user message

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 3000,
          messages: conversationHistory,
          system: `The user provided additional information! Let's refine the estimate.

IMPORTANT: 
- Your certainty should INCREASE (or stay the same) with MORE information
- Update macros based on the new information
- Be concise and direct - get to the point quickly
- REMEMBER: If you saw multiple images (label, scale, etc.), use ALL that data
- If you have exact label data + scale weights, you should have HIGH certainty
- SCALE ASSUMPTION: If tared, use weight as-is. If NOT tared, subtract container weight.

CALORIE ESTIMATION:
- With new info, recalculate for ACCURACY
- When uncertain about hidden ingredients (oils, butter, sauces), include them with 5-10% buffer
- Example: If butter was used but amount unclear, estimate 1-1.5 tbsp (realistic but generous)

RESPONSE STYLE:
- Be brief and direct - no rambling
- Use short sentences
- Focus on key updates and math
- Skip unnecessary elaboration

PROCESSED FOOD (NOVA):
- Update your NOVA classification if new information changes it
- Recalculate processed calories and percent based on new details
- If user clarifies ingredients/preparation, adjust NOVA groups accordingly

**CRITICAL FORMATTING REQUIREMENTS:**
YOU MUST format your response EXACTLY as shown below:

**Title:** [Keep same 2-word title from before]

[Your brief update - acknowledge new info, show key math if needed. 2-3 sentences max.]

Example: "Perfect! Scale was tared, so 200g is yogurt weight. Math: (200/170) × 150 = 176 cal. Plus 30 cal berries = 206 total."

I have [low/medium/high] certainty on this estimate.

[ONE question only if critical detail missing, otherwise skip entirely]

**NUTRITION_DATA:**
\`\`\`json
{
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

CRITICAL:
- Start with **Title:** on first line
- Keep update brief and conversational
- End with valid JSON in the NUTRITION_DATA code block
- JSON must be parseable and include all fields`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.error?.type || 'API request failed';
        
        // Provide user-friendly error messages
        if (errorMessage.includes('overloaded') || errorMessage.includes('Overloaded')) {
          throw new Error('Claude is currently overloaded. Please wait a moment and try again.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;
      
      // Parse nutrition data (macros + extended metrics) from response
      const nutritionData = this.extractNutritionData(assistantMessage);
      
      return {
        response: assistantMessage,
        macros: nutritionData.macros,
        extendedMetrics: nutritionData.extendedMetrics
      };
    } catch (error) {
      console.error('Error refining analysis:', error);
      throw error;
    }
  }

  extractNutritionData(text) {
    try {
      // Strategy: Extract JSON from NUTRITION_DATA code block
      // This is more robust than regex and scales infinitely
      
      // Look for JSON block in ```json ``` or ```
      const jsonMatch = text.match(/\*\*NUTRITION_DATA:\*\*\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
      
      if (!jsonMatch) {
        console.warn('⚠️ No NUTRITION_DATA JSON block found, falling back to regex');
        return this._extractNutritionDataLegacy(text);
      }
      
      const jsonString = jsonMatch[1].trim();
      console.log('📦 Extracted JSON string:', jsonString);
      const data = JSON.parse(jsonString);
      console.log('📦 Parsed JSON data:', JSON.stringify(data, null, 2));
      
      // Validate required fields
      if (typeof data.calories !== 'number' || 
          typeof data.protein !== 'number' || 
          typeof data.fat !== 'number' || 
          typeof data.carbs !== 'number') {
        console.warn('⚠️ Invalid JSON structure, missing required fields');
        return this._extractNutritionDataLegacy(text);
      }
      
      // Build response
      const macros = {
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat
      };
      
      // Extract extended metrics if present
      let extendedMetrics = null;
      const hasProcessed = data.processed && 
          (typeof data.processed.percent === 'number' || typeof data.processed.calories === 'number');
      const hasUltraProcessed = data.ultraProcessed && 
          (typeof data.ultraProcessed.percent === 'number' || typeof data.ultraProcessed.calories === 'number');
      const hasFiber = typeof data.fiber === 'number';
      const hasCaffeine = typeof data.caffeine === 'number';
      const hasFreshProduce = typeof data.freshProduce === 'number';
      
      if (hasProcessed || hasUltraProcessed || hasFiber || hasCaffeine || hasFreshProduce) {
        extendedMetrics = {
          processedCalories: data.processed?.calories ?? null,
          processedPercent: data.processed?.percent ?? null,
          ultraProcessedCalories: data.ultraProcessed?.calories ?? null,
          ultraProcessedPercent: data.ultraProcessed?.percent ?? null,
          fiber: hasFiber ? data.fiber : null,
          caffeine: hasCaffeine ? data.caffeine : null,
          freshProduce: hasFreshProduce ? data.freshProduce : null
        };
        console.log('📊 Extracted extended metrics:', extendedMetrics);
      } else {
        console.warn('⚠️ No valid extended metrics found in JSON');
      }
      
      console.log('✅ Successfully extracted nutrition data from JSON:');
      console.log('  Macros:', macros);
      if (extendedMetrics) {
        console.log('  Extended metrics:', extendedMetrics);
      }
      
      return { macros, extendedMetrics };
      
    } catch (error) {
      console.error('❌ JSON parsing failed:', error.message);
      console.log('Falling back to legacy regex extraction');
      return this._extractNutritionDataLegacy(text);
    }
  }

  // Legacy fallback for backwards compatibility
  _extractNutritionDataLegacy(text) {
    // Get the last 1500 characters where the final values should be
    const endOfText = text.slice(-1500);
    
    // Find the Macros: section specifically
    const macrosSection = endOfText.match(/\*\*Macros:\*\*\s*([\s\S]*?)(?:\*\*Processed Food:\*\*|$)/i);
    const macrosText = macrosSection ? macrosSection[1] : endOfText;
    
    // Extract basic macros (required)
    const caloriesMatch = macrosText.match(/[-•\s]*Calories:\s*([\d,]+)\s*kcal/i);
    const proteinMatch = macrosText.match(/[-•\s]*Protein:\s*([\d,]+)\s*g(?!\s*x)/i);
    const fatMatch = macrosText.match(/[-•\s]*Fat:\s*([\d,]+)\s*g(?!\s*x)/i);
    const carbsMatch = macrosText.match(/[-•\s]*(?:Net\s+)?Carbs:\s*([\d,]+)\s*g(?!\s*x)/i);
    
    const calories = caloriesMatch ? parseInt(caloriesMatch[1].replace(/,/g, '')) : null;
    const protein = proteinMatch ? parseInt(proteinMatch[1].replace(/,/g, '')) : null;
    const fat = fatMatch ? parseInt(fatMatch[1].replace(/,/g, '')) : null;
    const carbs = carbsMatch ? parseInt(carbsMatch[1].replace(/,/g, '')) : null;
    
    // Extract extended metrics (optional)
    const processedCalMatch = endOfText.match(/[-•\s]*Processed\s+calories:\s*([\d,]+)\s*kcal/i);
    const processedPercentMatch = endOfText.match(/[-•\s]*Processed\s+percent:\s*([\d,]+)%/i);
    
    const processedCalories = processedCalMatch ? parseInt(processedCalMatch[1].replace(/,/g, '')) : null;
    const processedPercent = processedPercentMatch ? parseInt(processedPercentMatch[1].replace(/,/g, '')) : null;
    
    const extendedMetrics = (processedCalories !== null || processedPercent !== null) ? {
      processedCalories,
      processedPercent
    } : null;
    
    if (calories === null || protein === null || fat === null || carbs === null) {
      console.warn('⚠️ Failed to parse macros from text');
      return { macros: null, extendedMetrics: null };
    }
    
    return {
      macros: { calories, protein, carbs, fat },
      extendedMetrics
    };
  }

  // Legacy fallback method - no longer used
  _extractMacrosOld(text) {
    // Look for the Macros: section with various formatting (**, ##, or plain)
    const macrosSection = text.match(/(?:\*\*Macros:\*\*|##\s*Macros:|Macros:)\s*([\s\S]*?)(?:\n\n|$)/i);
    
    if (macrosSection) {
      const macrosText = macrosSection[1];
      
      const caloriesMatch = macrosText.match(/[-\s]*Calories:\s*([\d,]+)(?:-[\d,]+)?\s*kcal/i);
      const proteinMatch = macrosText.match(/[-\s]*Protein:\s*([\d,]+)(?:-[\d,]+)?\s*g/i);
      const fatMatch = macrosText.match(/[-\s]*Fat:\s*([\d,]+)(?:-[\d,]+)?\s*g/i);
      const carbsMatch = macrosText.match(/[-\s]*(?:Net\s+)?Carbs:\s*([\d,]+)(?:-[\d,]+)?\s*g/i);
      
      const calories = caloriesMatch ? parseInt(caloriesMatch[1].replace(/,/g, '')) : null;
      const protein = proteinMatch ? parseInt(proteinMatch[1].replace(/,/g, '')) : null;
      const fat = fatMatch ? parseInt(fatMatch[1].replace(/,/g, '')) : null;
      const carbs = carbsMatch ? parseInt(carbsMatch[1].replace(/,/g, '')) : null;
      
      if (calories !== null && protein !== null && fat !== null && carbs !== null) {
        return { calories, protein, carbs, fat };
      }
    }
    
    // Final fallback
    console.warn('⚠️ Using final fallback extraction');
    const caloriesMatch = text.match(/Calories:\s*([\d,]+)(?:-[\d,]+)?\s*kcal/i);
    const proteinMatch = text.match(/Protein:\s*([\d,]+)(?:-[\d,]+)?\s*g/i);
    const fatMatch = text.match(/Fat:\s*([\d,]+)(?:-[\d,]+)?\s*g/i);
    const carbsMatch = text.match(/(?:Net\s+)?Carbs:\s*([\d,]+)(?:-[\d,]+)?\s*g/i);

    const calories = caloriesMatch ? parseInt(caloriesMatch[1].replace(/,/g, '')) : null;
    const protein = proteinMatch ? parseInt(proteinMatch[1].replace(/,/g, '')) : null;
    const fat = fatMatch ? parseInt(fatMatch[1].replace(/,/g, '')) : null;
    const carbs = carbsMatch ? parseInt(carbsMatch[1].replace(/,/g, '')) : null;

    if (calories === null || protein === null || fat === null || carbs === null) {
      console.warn('⚠️ Failed to parse some macros from response:');
      console.warn('Text sample:', text.substring(0, 500));
      console.warn('Parsed values:', { calories, protein, fat, carbs });
      
      // Return null to indicate parsing failure (don't default to 0)
      // This allows the calling code to keep previous values
      return null;
    }

    return {
      calories,
      protein,
      fat,
      carbs
    };
  }

  parseClaudeResponse(response) {
    try {
      // Extract JSON from Claude's response
      const content = response.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      // Return default structure if parsing fails
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        foodItems: [],
        confidence: 0
      };
    }
  }

  async getNutritionalInfo(foodName) {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `Provide nutritional information for "${foodName}". Return in JSON format: { "calories": number, "protein": number, "carbs": number, "fat": number, "servingSize": "string" }`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.parseClaudeResponse(data);
    } catch (error) {
      console.error('Error getting nutritional info:', error);
      throw error;
    }
  }
}

export default ClaudeAPI;
