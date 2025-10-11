import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/colors';
import ClaudeAPI from '../services/api';
import StorageService from '../services/storage';

const CameraScreen = ({ navigation, route }) => {
  const [imageUri, setImageUri] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [foodDescription, setFoodDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentMacros, setCurrentMacros] = useState(null);
  const [currentExtendedMetrics, setCurrentExtendedMetrics] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [mealTitle, setMealTitle] = useState('');
  const [isMultipleDishes, setIsMultipleDishes] = useState(false);
  const [showExtendedOutput, setShowExtendedOutput] = useState(false);
  const scrollViewRef = React.useRef(null);
  
  // Get the target date from navigation params (defaults to today)
  const targetDate = route.params?.targetDate ? new Date(route.params.targetDate) : new Date();

  const claudeAPI = new ClaudeAPI(); // No API key needed - using your Flask server

  const takePicture = async () => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduced quality to help with file size
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setFoodDescription('');
        setConversation([]);
        setCurrentMacros(null);
        setCurrentExtendedMetrics(null);
        setShowInput(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow multiple selection
        allowsMultipleSelection: true,
        quality: 0.7, // Reduced quality to help with file size
        base64: false,
      });

      if (!result.canceled) {
        // First image is the main one
        setImageUri(result.assets[0].uri);
        
        // Additional images (if any)
        if (result.assets.length > 1) {
          const additionalUris = result.assets.slice(1).map(asset => asset.uri);
          setAdditionalImages(additionalUris);
        } else {
          setAdditionalImages([]);
        }
        
        setFoodDescription('');
        setConversation([]);
        setCurrentMacros(null);
        setCurrentExtendedMetrics(null);
        setShowInput(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeFood = async () => {
    if (!imageUri && !foodDescription.trim()) {
      Alert.alert('Input Required', 'Please take a photo or describe your meal');
      return;
    }

    setIsAnalyzing(true);
    setShowInput(false);

    try {
      let base64Image = null;
      if (imageUri) {
        base64Image = await convertImageToBase64(imageUri);
      }

      // Convert additional images to base64
      let base64AdditionalImages = [];
      if (additionalImages.length > 0) {
        base64AdditionalImages = await Promise.all(
          additionalImages.map(uri => convertImageToBase64(uri))
        );
      }

      const result = await claudeAPI.analyzeMealImage(base64Image, foodDescription, base64AdditionalImages, isMultipleDishes);
      
      // Store macros, extended metrics, and title FIRST (before cleaning)
      // Only update if macros were successfully parsed
      if (result.macros) {
        setCurrentMacros(result.macros);
        setCurrentExtendedMetrics(result.extendedMetrics || null);
      } else {
        console.warn('⚠️ Initial analysis: Failed to parse macros, keeping previous values');
      }
      
      // Extract and store the title from JSON (preferred) or fallback to regex
      if (result.title) {
        setMealTitle(result.title);
        console.log('DEBUG - Extracted title from JSON:', result.title);
      } else {
        // Fallback: Look for **Title:** in the first 500 characters
        const firstPart = result.response.slice(0, 500);
        let titleMatch = firstPart.match(/\*\*Title:\*\*\s*([^\n]+)/i);
        
        if (titleMatch) {
          const extractedTitle = titleMatch[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[|\]/g, '').trim();
          setMealTitle(extractedTitle);
          console.log('DEBUG - Extracted title from text:', extractedTitle);
        } else {
          console.warn('⚠️ Could not extract title');
          setMealTitle('Meal');
        }
      }
      
      // Clean the response text for display (unless extended output is enabled)
      let cleanedResponse = result.response || 'Analysis complete';
      
      if (!showExtendedOutput) {
        // Strip **Title:** line
        cleanedResponse = cleanedResponse.replace(/\*\*Title:\*\*[^\n]*\n+/i, '');
        
        // Strip **NUTRITION_DATA:** and the entire JSON code block
        cleanedResponse = cleanedResponse.replace(/\*\*NUTRITION_DATA:\*\*\s*```(?:json)?\s*\{[\s\S]*?\}\s*```/i, '');
        
        // Clean up extra whitespace
        cleanedResponse = cleanedResponse.trim();
        
        // Add helpful hint at the end
        cleanedResponse += '\n\nFeel free to share any other details.';
      }
      
      // Add to conversation
      const newConversation = [
        ...conversation,
        {
          role: 'assistant',
          content: cleanedResponse
        }
      ];
      
      setConversation(newConversation);
      setShowInput(true);
      
      // Auto-scroll to bottom after conversation loads
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error analyzing food:', error);
      Alert.alert('Error', 'Failed to analyze food. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const compressImage = async (uri) => {
    try {
      // Compress and resize the image to ensure it's under 5MB
      // 1600px at 0.7 quality provides excellent detail for nutrition labels and food
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1600 } }], // Resize to max 1600px width, maintains aspect ratio
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      // If compression fails, return original uri
      return uri;
    }
  };

  const convertImageToBase64 = async (uri) => {
    try {
      // First compress the image
      const compressedUri = await compressImage(uri);
      
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      
      // Check size (Claude has 5MB limit per image)
      const sizeInMB = blob.size / (1024 * 1024);
      console.log(`Image size: ${sizeInMB.toFixed(2)} MB`);
      
      if (sizeInMB > 5) {
        console.warn('Image still too large after compression, attempting further compression...');
        // Try more aggressive compression
        const furtherCompressed = await ImageManipulator.manipulateAsync(
          compressedUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
        );
        const response2 = await fetch(furtherCompressed.uri);
        const blob2 = await response2.blob();
        console.log(`Further compressed size: ${(blob2.size / (1024 * 1024)).toFixed(2)} MB`);
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob2);
        });
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsRefining(true);
    
    // Dismiss keyboard to show chat output clearly
    Keyboard.dismiss();

    // Add user message to conversation
    const newConversation = [
      ...conversation,
      { role: 'user', content: userMessage }
    ];
    setConversation(newConversation);

    try {
      // Format conversation history for API (only text content)
      const conversationHistory = newConversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await claudeAPI.refineAnalysis(conversationHistory);
      
      // Store macros, extended metrics, and title FIRST (before cleaning)
      // Only update if macros were successfully parsed, otherwise keep previous values
      if (result.macros) {
        setCurrentMacros(result.macros);
        setCurrentExtendedMetrics(result.extendedMetrics || null);
      } else {
        console.warn('⚠️ Refinement: Failed to parse macros, keeping previous values');
        // Keep the existing currentMacros and currentExtendedMetrics values
      }
      
      // Update the title from JSON (preferred) or fallback to regex
      if (result.title) {
        setMealTitle(result.title);
        console.log('DEBUG - Updated title from JSON:', result.title);
      } else {
        // Fallback: Look for **Title:** in the first 500 characters
        const firstPart = result.response.slice(0, 500);
        let titleMatch = firstPart.match(/\*\*Title:\*\*\s*([^\n]+)/i);
        
        if (titleMatch) {
          const extractedTitle = titleMatch[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[|\]/g, '').trim();
          setMealTitle(extractedTitle);
          console.log('DEBUG - Updated title from text:', extractedTitle);
        }
      }
      
      // Clean the response text for display (unless extended output is enabled)
      let cleanedResponse = result.response || 'Analysis updated';
      
      if (!showExtendedOutput) {
        // Strip **Title:** line
        cleanedResponse = cleanedResponse.replace(/\*\*Title:\*\*[^\n]*\n+/i, '');
        
        // Strip **NUTRITION_DATA:** and the entire JSON code block
        cleanedResponse = cleanedResponse.replace(/\*\*NUTRITION_DATA:\*\*\s*```(?:json)?\s*\{[\s\S]*?\}\s*```/i, '');
        
        // Clean up extra whitespace
        cleanedResponse = cleanedResponse.trim();
      }
      
      const assistantMessage = {
        role: 'assistant',
        content: cleanedResponse
      };

      setConversation([...newConversation, assistantMessage]);
      setIsRefining(false);
      
      // Auto-scroll to bottom after refinement
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error refining analysis:', error);
      setIsRefining(false);
      Alert.alert('Error', 'Failed to refine analysis. Please try again.');
    }
  };

  const logMeal = async () => {
    if (!currentMacros) return;

    try {
      // Use the stored meal title
      let mealName = mealTitle || 'Meal';
      console.log('DEBUG - Using meal title for logging:', mealName);

      // Use the current time for the timestamp, but keep the date from targetDate
      // This ensures the meal logs with the correct time NOW, but on the selected date
      const now = new Date();
      const mealDate = new Date(targetDate);
      
      // Set the time to NOW but keep the date from targetDate
      mealDate.setHours(now.getHours());
      mealDate.setMinutes(now.getMinutes());
      mealDate.setSeconds(now.getSeconds());
      mealDate.setMilliseconds(now.getMilliseconds());
      
      const meal = {
        id: Date.now().toString(),
        name: mealName,
        calories: currentMacros.calories,
        protein: currentMacros.protein,
        carbs: currentMacros.carbs,
        fat: currentMacros.fat,
        timestamp: mealDate.getTime(),
        date: mealDate.toDateString(),
        extendedMetrics: currentExtendedMetrics
      };

      await StorageService.saveMeal(meal);
      Alert.alert('Success', 'Meal logged successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to log meal');
    }
  };

  const saveMealTemplate = async () => {
    if (!currentMacros) return;

    Alert.prompt(
      'Save Meal Template',
      'Enter a name for this meal template:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: async (mealName) => {
            if (!mealName || !mealName.trim()) {
              Alert.alert('Error', 'Please enter a meal name');
              return;
            }

            try {
              const savedMeal = {
                id: Date.now().toString(),
                name: mealName.trim(),
                calories: currentMacros.calories,
                protein: currentMacros.protein,
                carbs: currentMacros.carbs,
                fat: currentMacros.fat,
                extendedMetrics: currentExtendedMetrics
              };

              await StorageService.saveMealTemplate(savedMeal);
              Alert.alert('Success', 'Meal template saved! You can find it in the Saved Meals section.');
            } catch (error) {
              console.error('Error saving meal template:', error);
              Alert.alert('Error', 'Failed to save meal template');
            }
          }
        }
      ],
      'plain-text',
      'My Usual Breakfast'
    );
  };

  const resetAnalysis = () => {
    setImageUri(null);
    setAdditionalImages([]);
    setFoodDescription('');
    setConversation([]);
    setCurrentMacros(null);
    setCurrentExtendedMetrics(null);
    setShowInput(false);
    setUserInput('');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollViewContent}
        keyboardDismissMode="interactive"
      >

        {/* Input Methods - hide after analysis starts */}
        {!conversation.length && (
          <View style={styles.inputMethods}>
          
          {/* Image Type Toggle - Always visible at top */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleButtons}>
              <TouchableOpacity 
                style={[styles.toggleButton, !isMultipleDishes && styles.toggleButtonActive]}
                onPress={() => setIsMultipleDishes(false)}
              >
                <Text style={[styles.toggleButtonText, !isMultipleDishes && styles.toggleButtonTextActive]}>
                  Single dish
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, isMultipleDishes && styles.toggleButtonActive]}
                onPress={() => setIsMultipleDishes(true)}
              >
                <Text style={[styles.toggleButtonText, isMultipleDishes && styles.toggleButtonTextActive]}>
                  Multiple dishes
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Debug Toggle - Show Extended Output */}
          <View style={styles.debugToggleContainer}>
            <TouchableOpacity 
              style={styles.debugToggle}
              onPress={() => setShowExtendedOutput(!showExtendedOutput)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showExtendedOutput ? "checkbox" : "square-outline"} 
                size={20} 
                color={showExtendedOutput ? Colors.accent : Colors.textTertiary} 
              />
              <Text style={styles.debugToggleText}>Show extended output (debug)</Text>
            </TouchableOpacity>
          </View>
          
          {/* Text Input */}
          <View style={styles.inputMethod}>
            <Text style={styles.methodTitle}>Describe your meal</Text>
            <Text style={styles.methodSubtitle}>Type what you ate (e.g., "grilled chicken breast, 200g")</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe your meal..."
              value={foodDescription}
              onChangeText={setFoodDescription}
              multiline
              numberOfLines={4}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={() => {
                Keyboard.dismiss();
              }}
            />
          </View>

          {/* Photo Input */}
          <View style={styles.inputMethod}>
            <Text style={styles.methodTitle}>Share photos of your meal</Text>
            <Text style={styles.methodSubtitle}>Take a photo or select multiple from gallery (e.g., meal + nutrition labels)</Text>
            
            {imageUri ? (
              <View>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => {
                    setImageUri(null);
                    setAdditionalImages([]);
                  }}>
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                
                {/* Show additional images if any */}
                {additionalImages.length > 0 && (
                  <View style={styles.additionalImagesContainer}>
                    <Text style={styles.additionalImagesLabel}>+ {additionalImages.length} more image{additionalImages.length > 1 ? 's' : ''}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.additionalImagesScroll}>
                      {additionalImages.map((uri, index) => (
                        <View key={index} style={styles.additionalImageWrapper}>
                          <Image source={{ uri }} style={styles.additionalImage} />
                          <TouchableOpacity 
                            style={styles.removeAdditionalImageButton} 
                            onPress={() => {
                              setAdditionalImages(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <Ionicons name="close-circle" size={20} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.uploadSection}>
                <TouchableOpacity style={styles.uploadButton} onPress={takePicture}>
                  <Ionicons name="camera" size={32} color={Colors.accent} />
                  <Text style={styles.uploadText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Ionicons name="image" size={32} color={Colors.accent} />
                  <Text style={styles.uploadText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        )}

        {/* Analyze Button - hide after analysis starts */}
        {!conversation.length && (imageUri || foodDescription.trim()) && (
          <TouchableOpacity 
            style={styles.analyzeButton} 
            onPress={analyzeFood}
            disabled={isAnalyzing}
          >
            <Text style={styles.analyzeButtonText}>Analyze Food</Text>
          </TouchableOpacity>
        )}

        {/* Conversation */}
        {conversation.length > 0 && (
          <View style={styles.conversationContainer}>
            {conversation.map((message, index) => {
              // Parse markdown: remove ** for bold, keep the text
              const displayText = message.content
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1');
              
              return (
                <View key={index} style={[
                  styles.message,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                ]}>
                  <Text style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                  ]}>
                    {displayText}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {currentMacros && (
          <View style={styles.stickyBottomContainer}>
            {/* Current Macros Card */}
            <View style={styles.macrosCardSticky}>
              <View style={styles.macrosCardCompact}>
                <View style={styles.macroCompactItem}>
                  <Text style={styles.macroCompactValue}>{currentMacros.calories}</Text>
                  <Text style={styles.macroCompactLabel}>cal</Text>
                </View>
                <View style={styles.macroCompactItem}>
                  <Text style={styles.macroCompactValue}>{currentMacros.protein}g</Text>
                  <Text style={styles.macroCompactLabel}>protein</Text>
                </View>
                <View style={styles.macroCompactItem}>
                  <Text style={styles.macroCompactValue}>{currentMacros.carbs}g</Text>
                  <Text style={styles.macroCompactLabel}>carbs</Text>
                </View>
                <View style={styles.macroCompactItem}>
                  <Text style={styles.macroCompactValue}>{currentMacros.fat}g</Text>
                  <Text style={styles.macroCompactLabel}>fat</Text>
                </View>
              </View>
              
              {/* Extended Metrics Row */}
              {(currentExtendedMetrics?.processedPercent != null || currentExtendedMetrics?.ultraProcessedPercent != null || currentExtendedMetrics?.fiber != null || currentExtendedMetrics?.caffeine != null || currentExtendedMetrics?.freshProduce != null) && (
                <View style={styles.extendedMetricsRow}>
                  {currentExtendedMetrics?.processedPercent != null && (
                    <Text style={styles.extendedMetricText}>
                      {currentExtendedMetrics.processedPercent}% processed
                    </Text>
                  )}
                  {currentExtendedMetrics?.ultraProcessedPercent != null && (
                    <Text style={[styles.extendedMetricText, currentExtendedMetrics?.processedPercent != null && { marginLeft: Spacing.base }]}>
                      {currentExtendedMetrics.ultraProcessedPercent}% ultra
                    </Text>
                  )}
                  {currentExtendedMetrics?.fiber != null && (
                    <Text style={[styles.extendedMetricText, (currentExtendedMetrics?.processedPercent != null || currentExtendedMetrics?.ultraProcessedPercent != null) && { marginLeft: Spacing.base }]}>
                      {currentExtendedMetrics.fiber}g fiber
                    </Text>
                  )}
                  {currentExtendedMetrics?.caffeine != null && (
                    <Text style={[styles.extendedMetricText, (currentExtendedMetrics?.processedPercent != null || currentExtendedMetrics?.ultraProcessedPercent != null || currentExtendedMetrics?.fiber != null) && { marginLeft: Spacing.base }]}>
                      {currentExtendedMetrics.caffeine}mg caffeine
                    </Text>
                  )}
                  {currentExtendedMetrics?.freshProduce != null && (
                    <Text style={[styles.extendedMetricText, (currentExtendedMetrics?.processedPercent != null || currentExtendedMetrics?.ultraProcessedPercent != null || currentExtendedMetrics?.fiber != null || currentExtendedMetrics?.caffeine != null) && { marginLeft: Spacing.base }]}>
                      {currentExtendedMetrics.freshProduce}g fruits & veg
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Input Section */}
            {showInput && (
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Add more details or answer the question..."
                  value={userInput}
                  onChangeText={setUserInput}
                  multiline
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                  }}
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                  <Ionicons name="send" size={20} color={Colors.textInverse} />
                </TouchableOpacity>
              </View>
            )}

            {/* Refining Indicator */}
            {isRefining && (
              <View style={styles.refiningContainer}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={styles.refiningText}>Refining estimate...</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.logButton} onPress={logMeal}>
                <Text style={styles.logButtonText}>Log This Meal</Text>
              </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveMealTemplate}>
              <Text style={styles.saveButtonText}>Save Meal</Text>
            </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Full Screen Loading Overlay */}
      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Analyzing your meal...</Text>
            <Text style={styles.loadingSubtext}>This may take a few moments</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: Spacing.lg,
  },
  stickyBottomContainer: {
    backgroundColor: Colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    ...Shadows.md,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 30,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: Typography.xxl,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacingTight,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textInverse,
    opacity: 0.9,
    letterSpacing: Typography.letterSpacingNormal,
  },
  inputMethods: {
    padding: 20,
    paddingTop: 10,
  },
  inputMethod: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  methodSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
    letterSpacing: Typography.letterSpacingNormal,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  uploadSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  uploadButton: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: BorderRadius.base,
    borderStyle: 'dashed',
    flex: 1,
    marginHorizontal: 5,
  },
  uploadText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
  },
  imageContainer: {
    position: 'relative',
    marginTop: 10,
  },
  imagePreview: {
    width: '100%',
    height: 80,
    borderRadius: BorderRadius.base,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  additionalImagesContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  additionalImagesLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
  },
  additionalImagesScroll: {
    flexDirection: 'row',
  },
  additionalImageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  additionalImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  removeAdditionalImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    ...Shadows.sm,
  },
  analyzeButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingNormal,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: Colors.backgroundElevated,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.lg,
    minWidth: 200,
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingNormal,
  },
  loadingSubtext: {
    marginTop: Spacing.xs,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  macrosCardSticky: {
    backgroundColor: Colors.backgroundElevated,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    ...Shadows.base,
  },
  macrosCardCompact: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroCompactItem: {
    alignItems: 'center',
  },
  macroCompactValue: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: Typography.letterSpacingTight,
  },
  macroCompactLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: Typography.letterSpacingNormal,
  },
  extendedMetricsRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: Spacing.xs,
  },
  extendedMetricText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
    fontWeight: '500',
  },
  conversationContainer: {
    margin: 20,
    marginTop: 10,
  },
  message: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 20,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  userMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
    marginLeft: '25%',
  },
  assistantMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
    marginRight: '25%',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.textInverse,
  },
  assistantMessageText: {
    color: Colors.textPrimary,
  },
  macrosPreview: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 8,
  },
  macrosText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
  inputSection: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  refiningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  refiningText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.accent,
    letterSpacing: Typography.letterSpacingNormal,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  logButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
    ...Shadows.sm,
  },
  logButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingNormal,
  },
  saveButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
    ...Shadows.sm,
  },
  saveButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingNormal,
  },
  toggleContainer: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight + '15',
  },
  toggleButtonText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
  },
  toggleButtonTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  debugToggleContainer: {
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.xs,
  },
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  debugToggleText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
    fontWeight: '500',
  },
});

export default CameraScreen;
