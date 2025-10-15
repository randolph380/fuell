// Claude API service for macro analysis
const API_BASE_URL = 'https://fuell.onrender.com/api';

class ClaudeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async analyzeMealImage(imageData, foodDescription = '', additionalImages = [], isMultipleDishes = false, mealPreparation = null) {
    try {
      // Build context-specific instructions based on user's selection
      const multiImageInstructions = isMultipleDishes ? 
        `**USER INDICATED: MULTIPLE ITEMS (sum for this meal)**

The user photographed MULTIPLE different food items that should be ADDED TOGETHER:

**Common scenarios:**
- Hot pot: multiple small plates
- Buffet: photo of each item taken
- Tapas or small plates dining
- Meal components photographed separately
- Multiple items in one sitting (e.g., coffee + pastry)

**How to analyze:**
1. Look at EACH image as a SEPARATE food item
2. Identify and estimate each item independently
3. For small plates, use visual cues to determine portion size (plate size, utensil references)
4. Calculate macros for EACH item separately
5. In your response, LIST OUT each item with its calorie estimate (transparency for user to verify)
6. Then ADD all macros together for the final total

**CRITICAL - Show your itemized breakdown in your response:**
In your conversational analysis, list each item like this:
- Item 1: [description] → ~[calories] cal
- Item 2: [description] → ~[calories] cal
- Item 3: [description] → ~[calories] cal
Total: [sum] calories

**Example response format:**
"Looking at your hot pot plates:
- Small plate of noodles (~80g) → 120 cal
- 6 thin beef slices (~60g) → 150 cal  
- Mixed vegetables (~100g) → 40 cal
Total: 310 calories. Mostly NOVA 1 (fresh ingredients) with minimal processing."

**Full macro example for internal calculation:**
- Image 1 (Small plate of noodles): ~80g noodles = 120 cal, 4g protein, 24g carbs, 1g fat
- Image 2 (6 thin beef slices): ~60g beef = 150 cal, 18g protein, 0g carbs, 8g fat
- Image 3 (Vegetables): ~100g mixed veg = 40 cal, 2g protein, 8g carbs, 0g fat
- **TOTAL IN JSON: 310 cal, 24g protein, 32g carbs, 9g fat**` 
        : 
        `**USER INDICATED: ONE ITEM (with labels, scale, or multiple angles)**

The images provide DIFFERENT INFORMATION about ONE food item:

**Common scenarios:**
- Nutrition label + the actual food
- Scale showing weight + the plated food
- Front and back of package
- Different angles to show portion size
- Ingredients list + prepared dish

**How to analyze:**
1. Look at ALL images together - they describe ONE thing
2. Use nutrition labels for exact macros when visible
3. Use scale measurements for precise portions
4. Multiple angles help you see the full portion size
5. COMBINE all information to analyze THIS ONE ITEM
6. If you see multiple scale readings with DIFFERENT weights:
   - LARGER weight = TOTAL combined weight
   - SMALLER weight = ONE component measured separately
   - SUBTRACT smaller from larger to find the other component
   - Example: 360g total, 214g yogurt alone → berries = 360g - 214g = 146g

**Example approach:**
- Image 1: Bowl on scale showing 360g total
- Image 2: Yogurt nutrition label (120 cal per 170g serving)
- Image 3: Just yogurt on scale showing 214g
- **Analysis**: Yogurt (214g) + berries (146g) = ONE item with combined macros`;

      // Build meal preparation context
      const preparationContext = mealPreparation ? 
        `**MEAL PREPARATION CONTEXT:**
The user indicated this meal was: **${mealPreparation.toUpperCase()}**

${mealPreparation === 'prepackaged' ? 
  `**PRE-PACKAGED MEAL ANALYSIS:**
- This is a pre-made, packaged food item
- Look for nutrition labels on packaging
- Consider typical processing levels of packaged foods
- May have preservatives, additives, or processing agents
- Portion sizes are often standardized by manufacturers` :
mealPreparation === 'restaurant' ?
  `**RESTAURANT MEAL ANALYSIS:**
- This meal was prepared in a restaurant/kitchen setting
- **RESTAURANT IDENTIFICATION:** Try to identify the restaurant chain or type from visual cues
- Look for: logos, packaging, distinctive plating, menu items, restaurant-specific dishes
- **ASK THE USER:** "What restaurant is this from?" if you can't identify it
- **RESTAURANT-SPECIFIC KNOWLEDGE:** Use your knowledge of restaurant chains and their typical:
  * Portion sizes (restaurant portions are often 1.5-2x larger than home servings)
  * Cooking methods (more oil, butter, salt, sugar than home cooking)
  * Hidden ingredients (cooking oils, sauces, seasonings, marinades)
  * Menu item variations and typical preparations
- **PRIORITIZE PUBLISHED NUTRITION DATA:** If the user provides a specific restaurant and dish name:
  * **FIRST:** Search your knowledge for that exact restaurant's published nutrition data
  * **USE PUBLISHED VALUES:** If you know the macros for that specific dish at that restaurant, use those exact values
  * **CITE SOURCE:** Always cite "Restaurant Menu: [Restaurant Name] [Dish Name]" when using published data
  * **HIGH CONFIDENCE:** Published restaurant nutrition data should get 0.9+ confidence scores
  * **EXAMPLE:** "McDonald's Big Mac" → Use published 550 cal, 25g protein, 33g carbs, 33g fat
- **COMMON RESTAURANT PATTERNS:**
  * Fast food: High sodium, processed ingredients, large portions
  * Casual dining: Generous portions, rich sauces, hidden calories
  * Fine dining: Rich preparations, multiple components, generous portions
  * Asian restaurants: Often more oil, sodium, and sugar than home cooking
  * Italian restaurants: Heavy on cheese, oil, and large pasta portions
- **PORTION SIZE ADJUSTMENT:** Restaurant portions are typically 25-50% larger than standard servings
- **HIDDEN CALORIES:** Account for cooking oils, butter, sauces, and seasonings not visible in photos` :
  `**HOME-MADE MEAL ANALYSIS:**
- This meal was prepared from scratch at home
- Likely uses fresh, whole ingredients
- Cooking methods are typically healthier (less oil, more control)
- Portion sizes are more controlled
- Minimal processing, closer to NOVA 1 classification`}

Use this context to inform your macro estimates and processing level assessments.` : '';

      const initialPrompt = `Let's analyze this meal! I'll give you my best estimate.

${multiImageInstructions}

${preparationContext}

**PER-ITEM FOOD IDENTIFICATION & DATABASE RETRIEVAL:**
- **MANDATORY:** Identify each food item individually before calculating macros
- **NO GUESSING:** For each food item, attempt to match against known databases:
  * USDA FoodData Central (FDC) - primary source for whole foods
  * Open Food Facts - for packaged/branded items
  * Restaurant chain databases - for branded menu items
  * Brand-specific nutrition data when visible
- **MATCHING PROCESS:**
  1. Identify food item clearly (e.g., "Grilled Chicken Breast", "White Rice", "Broccoli")
  2. Attempt database lookup for exact match
  3. If exact match found: use database values with high confidence
  4. If no match found: mark as "unmatched" with higher uncertainty
- **UNMATCHED ITEMS:** When no database match is found:
  * Clearly state "No database match found for [item]"
  * Use estimated values with lower confidence
  * Flag for user verification
- **SOURCE ATTRIBUTION:** Always cite your data source:
  * "USDA FDC: Grilled Chicken Breast (100g)"
  * "Open Food Facts: Brand X Pasta"
  * "Restaurant Menu: McDonald's Big Mac"
  * "Estimated: No database match"

**ENHANCED PORTION ESTIMATION:**
- **REFERENCE OBJECTS REQUIRED:** Look for size references in every image:
  * Credit card (standard 3.375" × 2.125")
  * Fork (standard 7-8 inches)
  * Standard dinner plate (10-12 inches)
  * Hand/palm for protein portions
- **MULTI-ANGLE ANALYSIS:** If multiple images provided:
  * Use different angles to triangulate portion size
  * Cross-reference measurements between images
  * Use depth perception cues for 3D volume estimation
- **DENSITY CONVERSION TABLE:** Use food class → density mapping:
  * Proteins: 0.8-1.0 g/cm³ (chicken, beef, fish)
  * Starches: 0.6-0.8 g/cm³ (rice, pasta, bread)
  * Vegetables: 0.3-0.5 g/cm³ (leafy greens, broccoli)
  * Fats: 0.9-1.0 g/cm³ (oils, butter, cheese)
- **VOLUME TO WEIGHT CONVERSION:**
  * Estimate volume using reference objects
  * Apply density multiplier based on food class
  * Convert to grams: Volume(cm³) × Density(g/cm³) = Weight(g)

**RECIPE DECOMPOSITION FOR COMPLEX MEALS:**
- **INGREDIENT BREAKDOWN:** For multi-component dishes:
  * Identify base ingredients (rice, chicken, vegetables)
  * Identify cooking method (fried, steamed, grilled, sautéed)
  * Identify added fats/oils (visible or typical for cooking method)
- **COOKING METHOD MULTIPLIERS:**
  * **Frying:** +15-25% oil absorption, +5-10% water loss
  * **Grilling:** +5-10% oil absorption, +10-15% water loss
  * **Steaming:** No oil, +5-10% water gain
  * **Sautéing:** +10-15% oil absorption, +5-10% water loss
- **DEFAULT TEMPLATES:** Use common dish templates when identifiable:
  * "Fried Rice": Base rice + vegetables + protein + 2-3 tbsp oil
  * "Stir-fry": Base vegetables + protein + 1-2 tbsp oil
  * "Pasta with sauce": Base pasta + sauce ingredients + cooking oil
- **USER OVERRIDES:** Allow user to specify cooking method if unclear

**HARD CONSISTENCY CHECKS - ATWATER CONSTRAINTS:**
- **MANDATORY VALIDATION:** Every estimate must pass Atwater energy constraints:
  * Formula: |calories - (4×carbs + 4×protein + 9×fat)| ≤ 10 calories
  * If constraint violated: identify least certain macro and rescale
- **RESCALING LOGIC:**
  * If carbs most uncertain: rescale carbs to fit constraint
  * If protein most uncertain: rescale protein to fit constraint  
  * If fat most uncertain: rescale fat to fit constraint
- **CLARIFICATION REQUESTS:** If rescaling >20% of any macro:
  * Ask user: "The portion seems larger/smaller than typical. Is this a [small/medium/large] portion?"
  * Request specific clarification on most uncertain component

**CONFIDENCE & ACTIVE QUERY SYSTEM:**
- **PER-ITEM CONFIDENCE:** Rate each food item separately (0-1 scale):
  * 0.9-1.0: Exact database match with precise portion
  * 0.7-0.8: Good database match with estimated portion
  * 0.5-0.6: No database match, visual estimation only
  * 0.0-0.4: High uncertainty, multiple possible interpretations
- **OVERALL CERTAINTY:** Calculate weighted average of all items
- **ACTIVE QUERIES:** If overall certainty <0.6, ask ONE targeted question:
  * "Is this white rice or fried rice?" (changes fat content significantly)
  * "Was this cooked with oil or steamed?" (changes fat content)
  * "Is this a small or large portion?" (changes all macros proportionally)
- **SOURCE TRACKING:** Always provide data sources and confidence levels

**SCALE/WEIGHT ASSUMPTION:**
- ASSUME the scale is TARED (zeroed) - the weight shown is ONLY the food, not the container
- ALWAYS ask the user to confirm if the scale was tared when you see a scale

**PORTION RATIO HANDLING:**
- If user mentions eating a fraction in description (e.g., "had half this bread", "ate 1/3", "quarter of this"), apply that exact ratio to ALL macros
- Examples: "had half this bread" = calculate full bread portion from image, then multiply by 0.5
- Always show the math: "Full portion: 300 cal → Half portion: 300 × 0.5 = 150 cal"
- Apply ratio to ALL metrics: calories, protein, carbs, fat, fiber, caffeine, etc.
- If user says "I ate half" during chat, apply 0.5 ratio to your current estimate

**RESPONSE STYLE:**
- Be concise but informative - get to the point quickly
- Use short sentences and bullet points
- Skip unnecessary elaboration
- Focus on the key facts and calculations
- **FOR RESTAURANT MEALS:** If you can't identify the restaurant, ask: "What restaurant is this from? This will help me give you more accurate macro estimates."

**RESPONSE LENGTH REQUIREMENTS:**
- Keep the conversational analysis section (before JSON) under 50 words
- If conversational part exceeds 50 words, summarize to key points only
- Focus on: calories, main ingredients, portion size
- Skip detailed explanations and examples
- No NOVA classification mentions in conversational text
- **IMPORTANT:** The JSON section must remain complete and unchanged

**PROCESSED FOOD CLASSIFICATION:**
Use the NOVA classification system to estimate processed food percentage. Ask yourself these questions:

**NOVA 1 (0% processed) - Unprocessed/Minimally Processed:**
- Can you make this at home with basic cooking (boiling, grilling, steaming)?
- Examples: fresh fruit, plain rice, grilled chicken, steamed vegetables, plain yogurt
- Key test: ONE ingredient + basic preparation

**NOVA 2 (100% processed) - Processed Culinary Ingredients:**
- Pure extracted/refined ingredients used in cooking
- Examples: sugar, oil, butter, salt, flour
- Key test: Extracted FROM food, not a complete food itself

**NOVA 3 (70% processed) - Processed Foods:**
- Made by ADDING NOVA 2 ingredients to NOVA 1 foods
- Requires commercial/industrial preparation methods
- Examples: canned vegetables, cheese, bread, packaged tofu, **mochi**, dumplings, pasta
- Key test: Could a home cook make this? If "technically yes but rarely do" → NOVA 3
- Red flags: Shaped into forms (balls, cubes, sheets), requires molding/pressing, sold in packages

**NOVA 4 (100% processed) - Ultra-Processed:**
- Industrial formulations with 5+ ingredients including additives
- Contains substances NEVER used in home cooking
- Examples: sodas, chips, instant noodles, packaged snacks, shelf-stable desserts
- Key test: Look for modified starches, emulsifiers, stabilizers, flavor enhancers, preservatives, artificial colors
- **Important distinction:** Fresh bakery bread with 4 simple ingredients = NOVA 3. Packaged "fresh" bread with 15 ingredients including preservatives = NOVA 4
- If it lists ingredients you don't recognize or wouldn't buy at a grocery store → NOVA 4

**Critical thinking for edge cases:**
- "Is this just cooked food?" → NOVA 1
- "Was this shaped/molded in a factory?" → At least NOVA 3
- "Does it have added sugar/salt/oil?" → At least NOVA 3
- "Would I need industrial equipment to make this?" → NOVA 3 or 4

**Default assumptions when details are unclear:**
- **Packaged desserts/sweets** (cookies, mochi, cakes, pastries): Default to NOVA 4 unless clearly homemade or artisan
- **Packaged snacks** (chips, crackers, bars): Default to NOVA 4
- **Beverages** (sodas, energy drinks, flavored drinks): Default to NOVA 4
- **Packaged savory items** (frozen meals, instant foods): Default to NOVA 4
- **Fresh/homemade appearance** (visible fresh ingredients, rustic presentation): Can assume NOVA 1-3
- **When in doubt between NOVA 3 and 4:** Choose NOVA 4 for packaged commercial products

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

**FRUITS & VEGETABLES:**
Estimate total grams of fresh fruits and vegetables (combined).
- Include: fresh or frozen fruits and vegetables (raw or cooked), legumes
- Exclude: potatoes and other starchy tubers (cassava, yams)
- Exclude: fruit juice, dried fruit
- Round to nearest 10g

**CRITICAL FORMATTING REQUIREMENTS:**
YOU MUST format your response EXACTLY as shown below:

**Analyzing:** [State what you received - e.g., "2 images + text description", "3 images", "text description only"]

[Your brief conversational analysis - 2-3 sentences max. Mention NOVA classification naturally.]

**CERTAINTY RATING:**
Rate your confidence in this estimate (0-10 scale):
- 8-10: Exact data available (nutrition labels, precise weights, clear portions)
- 6-7: Good visual clarity, standard portions, familiar foods
- 4-5: Partial ambiguity (hidden ingredients, unclear portions, unfamiliar preparation)
- 0-3: High uncertainty (blurry images, unusual foods, no size reference)

If certainty is 6 or below, ask 1-2 brief clarifying questions to improve accuracy:
- Portion size: "Is this a small appetizer portion or a full entree?"
- Preparation: "Was this cooked with oil/butter?"
- Context: "Are these separate meals or different angles of the same dish?"

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
\`\`\`

CRITICAL:
- Keep analysis conversational and brief
- End with valid JSON in the NUTRITION_DATA code block
- JSON must be parseable and include all fields
- Title must be EXACTLY 2 words inside the JSON`;

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
      
      // Parse nutrition data (macros + extended metrics + title + certainty) from response
      const nutritionData = this.extractNutritionData(assistantMessage);
      
      return {
        response: assistantMessage,
        macros: nutritionData.macros,
        extendedMetrics: nutritionData.extendedMetrics,
        title: nutritionData.title,
        certainty: nutritionData.certainty,
        foodItems: nutritionData.foodItems,
        atwaterCheck: nutritionData.atwaterCheck,
        activeQuery: nutritionData.activeQuery
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

**ENHANCED REFINEMENT WITH DATABASE MATCHING:**
- **RE-EVALUATE FOOD ITEMS:** With new information, attempt to match items against databases:
  * USDA FDC for whole foods
  * Open Food Facts for packaged items
  * Restaurant/brand databases for menu items
- **UPDATE CONFIDENCE:** Increase confidence for database matches, maintain lower confidence for estimates
- **SOURCE ATTRIBUTION:** Update source citations based on new information
- **ATWATER VALIDATION:** Re-check energy constraints: |calories - (4×carbs + 4×protein + 9×fat)| ≤ 10

**PORTION RATIO HANDLING:**
- If user mentions eating a fraction (e.g., "1/2", "half", "quarter", "1/3", "2/3"), apply that exact ratio to ALL macros
- Examples: "I ate half" = multiply all values by 0.5, "I had 1/3" = multiply by 0.33, "I ate 2/3" = multiply by 0.67
- If user says "had half this bread" in description, calculate full portion from image then apply 0.5 ratio
- Always show the math: "Full portion: 300 cal → Half portion: 300 × 0.5 = 150 cal"
- Apply ratio to ALL metrics: calories, protein, carbs, fat, fiber, caffeine, etc.

**COOKING METHOD REFINEMENT:**
- If user clarifies cooking method, apply appropriate multipliers:
  * Frying: +15-25% oil absorption, +5-10% water loss
  * Grilling: +5-10% oil absorption, +10-15% water loss
  * Steaming: No oil, +5-10% water gain
  * Sautéing: +10-15% oil absorption, +5-10% water loss

CALORIE ESTIMATION:
- With new info, recalculate for ACCURACY
- When uncertain about hidden ingredients (oils, butter, sauces), include them with 5-10% buffer
- Example: If butter was used but amount unclear, estimate 1-1.5 tbsp (realistic but generous)

RESPONSE STYLE:
- Be brief and direct - no rambling
- Use short sentences
- Focus on key updates and math
- Skip unnecessary elaboration

RESPONSE LENGTH REQUIREMENTS:
- Keep the conversational analysis section (before JSON) under 50 words
- If conversational part exceeds 50 words, summarize to key points only
- Focus on: calories, main ingredients, portion size
- Skip detailed explanations and examples
- No NOVA classification mentions in conversational text
- **IMPORTANT:** The JSON section must remain complete and unchanged

PROCESSED FOOD (NOVA):
- Update your NOVA classification if new information changes it
- Recalculate processed calories and percent based on new details
- If user clarifies ingredients/preparation, adjust NOVA groups accordingly

**CRITICAL FORMATTING REQUIREMENTS:**
YOU MUST format your response EXACTLY as shown below:

**Update based on:** [State the new information you received - e.g., "user clarified portion size", "confirmed scale was tared", "added cooking method details"]

[Your brief update - acknowledge new info, show key math if needed. 2-3 sentences max.]

Example: "Perfect! Scale was tared, so 200g is yogurt weight. Math: (200/170) × 150 = 176 cal. Plus 30 cal berries = 206 total."

**CERTAINTY RATING:** (provide your updated confidence 0-10 - should increase with more info)

[ONE question only if critical detail missing, otherwise skip entirely]

**NUTRITION_DATA:**
\`\`\`json
{
  "title": "[Keep same 2-word title from before]",
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
  },
  "foodItems": [
    {
      "name": "Updated Food Item",
      "weight": 150,
      "calories": 250,
      "protein": 46,
      "carbs": 0,
      "fat": 5,
      "confidence": 0.9,
      "source": "USDA FDC: Updated match",
      "matched": true
    }
  ],
  "atwaterCheck": {
    "passed": true,
    "calculatedCalories": 510,
    "difference": 0
  },
  "activeQuery": null
}
\`\`\`

CRITICAL:
- Keep update brief and conversational
- End with valid JSON in the NUTRITION_DATA code block
- JSON must be parseable and include all fields
- Title must be inside the JSON, same as before`
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
      
      // Parse nutrition data (macros + extended metrics + title + certainty) from response
      const nutritionData = this.extractNutritionData(assistantMessage);
      
      return {
        response: assistantMessage,
        macros: nutritionData.macros,
        extendedMetrics: nutritionData.extendedMetrics,
        title: nutritionData.title,
        certainty: nutritionData.certainty,
        foodItems: nutritionData.foodItems,
        atwaterCheck: nutritionData.atwaterCheck,
        activeQuery: nutritionData.activeQuery
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
      console.log('📦 Title field specifically:', {
        title: data.title,
        hasTitle: 'title' in data,
        titleType: typeof data.title
      });
      
      // Validate required fields
      if (typeof data.calories !== 'number' || 
          typeof data.protein !== 'number' || 
          typeof data.fat !== 'number' || 
          typeof data.carbs !== 'number') {
        console.warn('⚠️ Invalid JSON structure, missing required fields');
        return this._extractNutritionDataLegacy(text);
      }
      
      // Extract title if present and validate it
      let title = typeof data.title === 'string' ? data.title.trim() : null;
      
      console.log('🔍 Raw title from AI:', {
        rawTitle: data.title,
        type: typeof data.title,
        length: data.title?.length,
        trimmed: title
      });
      
      // Filter out invalid titles (analysis instructions, etc.)
      const invalidPhrases = [
        'analyzing', 'images together', 'calculation', 'estimate', 
        'based on', 'looks like', 'appears to be', 'seems to be'
      ];
      
      if (title) {
        const lowerTitle = title.toLowerCase();
        const isInvalid = invalidPhrases.some(phrase => lowerTitle.includes(phrase));
        
        if (isInvalid || title.length > 30) {
          console.warn('📝 Invalid title detected, ignoring:', title);
          title = null;
        } else {
          console.log('📝 Extracted title from JSON:', title);
        }
      } else {
        console.warn('📝 No title found in AI response');
      }
      
      // Extract certainty rating
      const certainty = typeof data.certainty === 'number' ? data.certainty : null;
      if (certainty !== null) {
        console.log(`🎯 Certainty rating: ${certainty}/10`);
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
        let processedCalories = data.processed?.calories ?? null;
        let processedPercent = data.processed?.percent ?? null;
        const ultraProcessedCalories = data.ultraProcessed?.calories ?? null;
        const ultraProcessedPercent = data.ultraProcessed?.percent ?? null;
        
        // Ensure processed is always >= ultra-processed (since ultra-processed is a subset)
        if (processedPercent !== null && ultraProcessedPercent !== null && processedPercent < ultraProcessedPercent) {
          console.warn(`⚠️ Fixing processed percent: was ${processedPercent}%, should be >= ${ultraProcessedPercent}%`);
          processedPercent = ultraProcessedPercent;
        }
        if (processedCalories !== null && ultraProcessedCalories !== null && processedCalories < ultraProcessedCalories) {
          console.warn(`⚠️ Fixing processed calories: was ${processedCalories}, should be >= ${ultraProcessedCalories}`);
          processedCalories = ultraProcessedCalories;
        }
        
        extendedMetrics = {
          processedCalories,
          processedPercent,
          ultraProcessedCalories,
          ultraProcessedPercent,
          fiber: hasFiber ? data.fiber : null,
          caffeine: hasCaffeine ? data.caffeine : null,
          freshProduce: hasFreshProduce ? data.freshProduce : null
        };
        console.log('📊 Extracted extended metrics:', extendedMetrics);
      } else {
        console.warn('⚠️ No valid extended metrics found in JSON');
      }

      // Extract new enhanced data if present
      let foodItems = null;
      let atwaterCheck = null;
      let activeQuery = null;
      
      if (Array.isArray(data.foodItems)) {
        foodItems = data.foodItems;
        console.log('🍎 Extracted food items:', foodItems);
      }
      
      if (data.atwaterCheck && typeof data.atwaterCheck.passed === 'boolean') {
        atwaterCheck = data.atwaterCheck;
        console.log('⚖️ Atwater constraint check:', atwaterCheck);
      }
      
      if (typeof data.activeQuery === 'string' && data.activeQuery.trim()) {
        activeQuery = data.activeQuery.trim();
        console.log('❓ Active query:', activeQuery);
      }
      
      console.log('✅ Successfully extracted nutrition data from JSON:');
      console.log('  Title:', title);
      console.log('  Certainty:', certainty);
      console.log('  Macros:', macros);
      if (extendedMetrics) {
        console.log('  Extended metrics:', extendedMetrics);
      }
      if (foodItems) {
        console.log('  Food items:', foodItems.length, 'items');
      }
      if (atwaterCheck) {
        console.log('  Atwater check:', atwaterCheck.passed ? 'PASSED' : 'FAILED');
      }
      if (activeQuery) {
        console.log('  Active query:', activeQuery);
      }
      
      return { 
        macros, 
        extendedMetrics, 
        title, 
        certainty, 
        foodItems, 
        atwaterCheck, 
        activeQuery 
      };
      
    } catch (error) {
      console.error('❌ JSON parsing failed:', error.message);
      console.log('Falling back to legacy regex extraction');
      return this._extractNutritionDataLegacy(text);
    }
  }

  // Legacy fallback for backwards compatibility
  _extractNutritionDataLegacy(text) {
    // Try to extract title from the beginning of the text
    const firstPart = text.slice(0, 500);
    let title = null;
    const titleMatch = firstPart.match(/\*\*Title:\*\*\s*([^\n]+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[|\]/g, '').trim();
      console.log('📝 Legacy: Extracted title from text:', title);
    }
    
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
      return { macros: null, extendedMetrics: null, title: null };
    }
    
    return {
      macros: { calories, protein, carbs, fat },
      extendedMetrics,
      title
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
