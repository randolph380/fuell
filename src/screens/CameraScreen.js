import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
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
  const [mealPreparation, setMealPreparation] = useState(null); // null, 'prepackaged', 'restaurant', 'homemade'
  const [showMacroEditor, setShowMacroEditor] = useState(false);
  const [editedMacros, setEditedMacros] = useState(null);
  const [portionSize, setPortionSize] = useState('1');
  const scrollViewRef = React.useRef(null);
  
  // Animation refs for food dots
  const dot1Anim = useRef(new Animated.Value(1)).current;
  const dot2Anim = useRef(new Animated.Value(1)).current;
  const dot3Anim = useRef(new Animated.Value(1)).current;
  const dot4Anim = useRef(new Animated.Value(1)).current;
  const dot5Anim = useRef(new Animated.Value(1)).current;
  
  // Get the target date from navigation params (defaults to today)
  const targetDate = route.params?.targetDate ? new Date(route.params.targetDate) : new Date();

  const claudeAPI = new ClaudeAPI(); // No API key needed - using your Flask server

  // Food animation effect
  useEffect(() => {
    if (isAnalyzing) {
      const createPulseAnimation = (animValue, delay = 0) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = [
        createPulseAnimation(dot1Anim, 0),
        createPulseAnimation(dot2Anim, 150),
        createPulseAnimation(dot3Anim, 300),
        createPulseAnimation(dot4Anim, 450),
        createPulseAnimation(dot5Anim, 600),
      ];

      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    }
  }, [isAnalyzing]);

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
        allowsEditing: false, // No crop, use original photo
        quality: 0.7, // Reduced quality to help with file size
      });

      if (!result.canceled) {
        const newPhotoUri = result.assets[0].uri;
        
        // If there's already a main image, add this as an additional image
        if (imageUri) {
          setAdditionalImages(prev => [...prev, newPhotoUri]);
        } else {
          // First photo - set as main image
          setImageUri(newPhotoUri);
          // Don't clear foodDescription - user can have both text and images
          setConversation([]);
          setCurrentMacros(null);
          setCurrentExtendedMetrics(null);
          setShowInput(false);
        }
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
        
        // Don't clear foodDescription - user can have both text and images
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

      const result = await claudeAPI.analyzeMealImage(base64Image, foodDescription, base64AdditionalImages, isMultipleDishes, mealPreparation);
      
      // Store macros, extended metrics, and title FIRST (before cleaning)
      // Only update if macros were successfully parsed
      if (result.macros) {
        setCurrentMacros(result.macros);
        setCurrentExtendedMetrics(result.extendedMetrics || null);
      } else {
        console.warn('⚠️ Initial analysis: Failed to parse macros, keeping previous values');
      }
      
      // Extract and store the title from JSON (preferred) or fallback to regex
      console.log('DEBUG - result.title value:', result.title, 'type:', typeof result.title);
      
      if (result.title && result.title.trim().length > 0) {
        setMealTitle(result.title.trim());
        console.log('DEBUG - ✅ Extracted title from JSON:', result.title);
      } else {
        console.log('DEBUG - ⚠️ No title in JSON, trying regex fallback');
        // Fallback: Look for **Title:** in the first 500 characters
        const firstPart = result.response.slice(0, 500);
        let titleMatch = firstPart.match(/\*\*Title:\*\*\s*([^\n]+)/i);
        
        if (titleMatch) {
          const extractedTitle = titleMatch[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[|\]/g, '').trim();
          setMealTitle(extractedTitle);
          console.log('DEBUG - ✅ Extracted title from text:', extractedTitle);
        } else {
          console.warn('DEBUG - ❌ Could not extract title from anywhere, defaulting to Meal');
          setMealTitle('Meal');
        }
      }
      
      // Clean the response text for display
      let cleanedResponse = result.response || 'Analysis complete';
      
      // Strip **Title:** line
      cleanedResponse = cleanedResponse.replace(/\*\*Title:\*\*[^\n]*\n+/i, '');
      
      // Strip **NUTRITION_DATA:** and the entire JSON code block
      cleanedResponse = cleanedResponse.replace(/\*\*NUTRITION_DATA:\*\*\s*```(?:json)?\s*\{[\s\S]*?\}\s*```/i, '');
      
      // Clean up extra whitespace
      cleanedResponse = cleanedResponse.trim();
      
      // Add helpful hint at the end
      cleanedResponse += '\n\nFeel free to share any other details.';
      
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
      console.log('DEBUG - Refinement result.title value:', result.title, 'type:', typeof result.title);
      
      if (result.title && result.title.trim().length > 0) {
        setMealTitle(result.title.trim());
        console.log('DEBUG - ✅ Updated title from JSON:', result.title);
      } else {
        console.log('DEBUG - ⚠️ No title in refinement JSON, trying regex fallback');
        // Fallback: Look for **Title:** in the first 500 characters
        const firstPart = result.response.slice(0, 500);
        let titleMatch = firstPart.match(/\*\*Title:\*\*\s*([^\n]+)/i);
        
        if (titleMatch) {
          const extractedTitle = titleMatch[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[|\]/g, '').trim();
          setMealTitle(extractedTitle);
          console.log('DEBUG - ✅ Updated title from text:', extractedTitle);
        } else {
          console.log('DEBUG - ⚠️ Could not update title, keeping existing:', mealTitle);
        }
      }
      
      // Clean the response text for display
      let cleanedResponse = result.response || 'Analysis updated';
      
      // Strip **Title:** line
      cleanedResponse = cleanedResponse.replace(/\*\*Title:\*\*[^\n]*\n+/i, '');
      
      // Strip **NUTRITION_DATA:** and the entire JSON code block
      cleanedResponse = cleanedResponse.replace(/\*\*NUTRITION_DATA:\*\*\s*```(?:json)?\s*\{[\s\S]*?\}\s*```/i, '');
      
      // Clean up extra whitespace
      cleanedResponse = cleanedResponse.trim();
      
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

  const quickLogMeal = async () => {
    if (!imageUri && !foodDescription.trim()) {
      Alert.alert('Input Required', 'Please take a photo or describe your meal');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Convert images to base64
      let base64Image = null;
      if (imageUri) {
        base64Image = await convertImageToBase64(imageUri);
      }

      let base64AdditionalImages = [];
      if (additionalImages.length > 0) {
        base64AdditionalImages = await Promise.all(
          additionalImages.map(uri => convertImageToBase64(uri))
        );
      }

      // Analyze the meal
      const result = await claudeAPI.analyzeMealImage(base64Image, foodDescription, base64AdditionalImages, isMultipleDishes);
      
      if (!result.macros) {
        throw new Error('Failed to analyze meal');
      }

      // Extract title
      const extractedTitle = result.title?.trim() || 'Meal';

      // Create meal object
      const now = new Date();
      const mealDate = new Date(targetDate);
      mealDate.setHours(now.getHours());
      mealDate.setMinutes(now.getMinutes());
      mealDate.setSeconds(now.getSeconds());
      mealDate.setMilliseconds(now.getMilliseconds());
      
      const meal = {
        id: Date.now().toString(),
        name: extractedTitle,
        calories: result.macros.calories,
        protein: result.macros.protein,
        carbs: result.macros.carbs,
        fat: result.macros.fat,
        timestamp: mealDate.getTime(),
        date: mealDate.toDateString(),
        extendedMetrics: result.extendedMetrics || null
      };

      // Log the meal immediately
      await StorageService.saveMeal(meal);
      navigation.navigate('Home', { targetDate: targetDate.toISOString() });
    } catch (error) {
      console.error('Error quick logging meal:', error);
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    } finally {
      setIsAnalyzing(false);
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
      navigation.navigate('Home', { targetDate: targetDate.toISOString() });
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
            <Text style={styles.toggleLabel}>How many items in your meal?</Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity 
                style={[styles.toggleButton, !isMultipleDishes && styles.toggleButtonActive]}
                onPress={() => setIsMultipleDishes(false)}
              >
                <Ionicons 
                  name="document-text-outline" 
                  size={16} 
                  color={!isMultipleDishes ? Colors.textInverse : Colors.textSecondary} 
                  style={styles.toggleIcon}
                />
                <Text style={[styles.toggleButtonText, !isMultipleDishes && styles.toggleButtonTextActive]}>
                  One item
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, isMultipleDishes && styles.toggleButtonActive]}
                onPress={() => setIsMultipleDishes(true)}
              >
                <Ionicons 
                  name="restaurant-outline" 
                  size={16} 
                  color={isMultipleDishes ? Colors.textInverse : Colors.textSecondary}
                  style={styles.toggleIcon}
                />
                <Text style={[styles.toggleButtonText, isMultipleDishes && styles.toggleButtonTextActive]}>
                  Multiple items
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Meal Preparation Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>How was your meal prepped?</Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity 
                style={[styles.toggleButton, mealPreparation === 'prepackaged' && styles.toggleButtonActive]}
                onPress={() => setMealPreparation(mealPreparation === 'prepackaged' ? null : 'prepackaged')}
              >
                <Ionicons 
                  name="cube-outline" 
                  size={16} 
                  color={mealPreparation === 'prepackaged' ? Colors.textInverse : Colors.textSecondary} 
                  style={styles.toggleIcon}
                />
                <Text style={[styles.toggleButtonText, mealPreparation === 'prepackaged' && styles.toggleButtonTextActive]}>
                  Pre-packaged
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, mealPreparation === 'restaurant' && styles.toggleButtonActive]}
                onPress={() => setMealPreparation(mealPreparation === 'restaurant' ? null : 'restaurant')}
              >
                <Ionicons 
                  name="restaurant-outline" 
                  size={16} 
                  color={mealPreparation === 'restaurant' ? Colors.textInverse : Colors.textSecondary}
                  style={styles.toggleIcon}
                />
                <Text style={[styles.toggleButtonText, mealPreparation === 'restaurant' && styles.toggleButtonTextActive]}>
                  Restaurant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, mealPreparation === 'homemade' && styles.toggleButtonActive]}
                onPress={() => setMealPreparation(mealPreparation === 'homemade' ? null : 'homemade')}
              >
                <Ionicons 
                  name="home-outline" 
                  size={16} 
                  color={mealPreparation === 'homemade' ? Colors.textInverse : Colors.textSecondary}
                  style={styles.toggleIcon}
                />
                <Text style={[styles.toggleButtonText, mealPreparation === 'homemade' && styles.toggleButtonTextActive]}>
                  Home made
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          
          {/* Text Input */}
          <View style={styles.inputMethod}>
            <Text style={styles.methodTitle}>Describe your meal</Text>
            <Text style={styles.methodSubtitle}>Include specific ingredients, weights, brands, cooking methods, and portion sizes for accurate analysis.</Text>
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
            <Text style={styles.methodTitle}>Upload photos of your meal</Text>
            <Text style={styles.methodSubtitle}>Capture images of your meal, ingredients, nutrition labels, preparation steps, packaging, or receipts.</Text>
            
            {imageUri ? (
              <View>
                {/* All images in one horizontal row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.allImagesScroll}>
                  {/* Main image */}
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => {
                      setImageUri(null);
                      setAdditionalImages([]);
                    }}>
                      <Ionicons name="close-circle" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Additional images */}
                  {additionalImages.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={() => {
                          setAdditionalImages(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                
                {/* Add Another Photo buttons */}
                <View style={styles.addMorePhotosSection}>
                  <TouchableOpacity style={styles.addMoreButton} onPress={takePicture}>
                    <Ionicons name="camera" size={20} color={Colors.accent} />
                    <Text style={styles.addMoreText}>Take Another</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addMoreButton} onPress={async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert('Permission needed', 'Photo library permission is required');
                      return;
                    }
                    try {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: false,
                        allowsMultipleSelection: true,
                        quality: 0.7,
                      });
                      if (!result.canceled) {
                        // Add all selected images to additionalImages
                        const newImages = result.assets.map(asset => asset.uri);
                        setAdditionalImages(prev => [...prev, ...newImages]);
                      }
                    } catch (error) {
                      console.error('Error picking additional images:', error);
                      Alert.alert('Error', 'Failed to pick images');
                    }
                  }}>
                    <Ionicons name="image" size={20} color={Colors.accent} />
                    <Text style={styles.addMoreText}>Add from Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.uploadSection}>
                <TouchableOpacity style={styles.uploadButton} onPress={takePicture}>
                  <Ionicons name="camera" size={32} color={Colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Ionicons name="image" size={32} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        )}

        {/* Analyze Button - hide after analysis starts */}
        {!conversation.length && (imageUri || foodDescription.trim()) && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.analyzeButton, styles.halfButton]} 
              onPress={analyzeFood}
              disabled={isAnalyzing}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.analyzeButtonText}>Analyze & Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickLogButton, styles.halfButton]} 
              onPress={quickLogMeal}
              disabled={isAnalyzing}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.quickLogButtonText}>Quick Log</Text>
            </TouchableOpacity>
          </View>
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
              
              {/* Extended Metrics Row - Hidden to save space */}
              {/* Secondary metrics are visible in expanded meal cards on home screen */}
            </View>

            {/* Input Section */}
            {showInput && (
              <View>
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
              <TouchableOpacity style={styles.editButton} onPress={() => setShowMacroEditor(true)}>
                <Text style={styles.editButtonText}>Edit Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logButton} onPress={logMeal}>
                <Text style={styles.logButtonText}>Log This Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Macro Editor Modal */}
      {showMacroEditor && currentMacros && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.macroEditorOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.macroEditorModal}>
                <View style={styles.macroEditorHeader}>
                  <Text style={styles.macroEditorTitle}>Edit Meal Macros</Text>
                  <TouchableOpacity onPress={() => {
                    Keyboard.dismiss();
                    setShowMacroEditor(false);
                    setPortionSize('1');
                  }}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                
                {/* Portion Size */}
                <View style={styles.portionSizeSection}>
                  <Text style={styles.portionSizeLabel}>Portion Size</Text>
                  <View style={styles.portionSizeInput}>
                    <TextInput
                      style={styles.portionInput}
                      value={portionSize}
                      onChangeText={setPortionSize}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                    <Text style={styles.portionX}>x</Text>
                  </View>
                </View>
                
                <View style={styles.macroEditorInputs}>
                  <Text style={styles.baseMacrosLabel}>Base Values (1x portion):</Text>
                  
                  <View style={styles.macroEditorRow}>
                    <Text style={styles.macroEditorLabel}>Calories</Text>
                    <TextInput
                      style={styles.macroEditorInput}
                      value={(editedMacros?.calories ?? currentMacros.calories).toString()}
                      onChangeText={(text) => setEditedMacros({
                        ...editedMacros,
                        calories: parseInt(text) || 0
                      })}
                      keyboardType="numeric"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  
                  <View style={styles.macroEditorRow}>
                    <Text style={styles.macroEditorLabel}>Protein (g)</Text>
                    <TextInput
                      style={styles.macroEditorInput}
                      value={(editedMacros?.protein ?? currentMacros.protein).toString()}
                      onChangeText={(text) => setEditedMacros({
                        ...editedMacros,
                        protein: parseInt(text) || 0
                      })}
                      keyboardType="numeric"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  
                  <View style={styles.macroEditorRow}>
                    <Text style={styles.macroEditorLabel}>Carbs (g)</Text>
                    <TextInput
                      style={styles.macroEditorInput}
                      value={(editedMacros?.carbs ?? currentMacros.carbs).toString()}
                      onChangeText={(text) => setEditedMacros({
                        ...editedMacros,
                        carbs: parseInt(text) || 0
                      })}
                      keyboardType="numeric"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  
                  <View style={styles.macroEditorRow}>
                    <Text style={styles.macroEditorLabel}>Fat (g)</Text>
                    <TextInput
                      style={styles.macroEditorInput}
                      value={(editedMacros?.fat ?? currentMacros.fat).toString()}
                      onChangeText={(text) => setEditedMacros({
                        ...editedMacros,
                        fat: parseInt(text) || 0
                      })}
                      keyboardType="numeric"
                      selectTextOnFocus
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                </View>
                
                {/* Preview of final values */}
                {portionSize && parseFloat(portionSize) !== 1 && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewTitle}>Final values ({portionSize}x):</Text>
                    <Text style={styles.previewText}>
                      {Math.round((editedMacros?.calories ?? currentMacros.calories) * parseFloat(portionSize))} cal | {' '}
                      {Math.round((editedMacros?.protein ?? currentMacros.protein) * parseFloat(portionSize))}g protein | {' '}
                      {Math.round((editedMacros?.carbs ?? currentMacros.carbs) * parseFloat(portionSize))}g carbs | {' '}
                      {Math.round((editedMacros?.fat ?? currentMacros.fat) * parseFloat(portionSize))}g fat
                    </Text>
                  </View>
                )}
                
                <View style={styles.macroEditorActions}>
                  <TouchableOpacity 
                    style={styles.macroEditorCancel}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowMacroEditor(false);
                      setEditedMacros(null);
                      setPortionSize('1');
                    }}
                  >
                    <Text style={styles.macroEditorCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.macroEditorSave}
                    onPress={() => {
                      Keyboard.dismiss();
                      const portion = parseFloat(portionSize) || 1;
                      const baseMacros = editedMacros || currentMacros;
                      
                      // Apply portion multiplier to macros
                      setCurrentMacros({
                        calories: Math.round(baseMacros.calories * portion),
                        protein: Math.round(baseMacros.protein * portion),
                        carbs: Math.round(baseMacros.carbs * portion),
                        fat: Math.round(baseMacros.fat * portion),
                      });
                      
                      setShowMacroEditor(false);
                      setEditedMacros(null);
                      setPortionSize('1');
                    }}
                  >
                    <Text style={styles.macroEditorSaveText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Full Screen Loading Overlay */}
      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <View style={styles.foodAnimation}>
              <Animated.View style={[styles.foodDot, styles.foodDot1, { opacity: dot1Anim }]} />
              <Animated.View style={[styles.foodDot, styles.foodDot2, { opacity: dot2Anim }]} />
              <Animated.View style={[styles.foodDot, styles.foodDot3, { opacity: dot3Anim }]} />
              <Animated.View style={[styles.foodDot, styles.foodDot4, { opacity: dot4Anim }]} />
              <Animated.View style={[styles.foodDot, styles.foodDot5, { opacity: dot5Anim }]} />
            </View>
            <Text style={styles.loadingText}>Analyzing meal</Text>
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
    padding: 16,
    paddingTop: 8,
  },
  inputMethod: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    marginBottom: 6,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  methodSubtitle: {
    fontSize: Typography.sm * 0.7,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: Typography.letterSpacingNormal,
    lineHeight: Typography.sm * 0.7 * 1.4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    padding: 8,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  uploadSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: BorderRadius.base,
    borderStyle: 'dashed',
    flex: 1,
    marginHorizontal: 4,
  },
  uploadText: {
    marginTop: 6,
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
  },
  allImagesScroll: {
    marginTop: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.base,
  },
  removeImageButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addMorePhotosSection: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  addMoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.backgroundElevated,
    gap: 3,
  },
  addMoreText: {
    fontSize: Typography.sm,
    color: Colors.accent,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 8,
    gap: 6,
  },
  halfButton: {
    flex: 1,
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    ...Shadows.sm,
  },
  analyzeButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingNormal,
  },
  quickLogButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    ...Shadows.sm,
  },
  quickLogButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingNormal,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: Colors.backgroundElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.md,
    minWidth: 120,
  },
  foodAnimation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    height: 25,
  },
  foodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  foodDot1: {
    backgroundColor: '#FF6B6B', // Red
    opacity: 0.8,
  },
  foodDot2: {
    backgroundColor: '#FFD93D', // Yellow
    opacity: 0.8,
  },
  foodDot3: {
    backgroundColor: '#6BCF7F', // Green
    opacity: 0.8,
  },
  foodDot4: {
    backgroundColor: '#4D96FF', // Blue
    opacity: 0.8,
  },
  foodDot5: {
    backgroundColor: '#9B59B6', // Purple
    opacity: 0.8,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '500',
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
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundElevated,
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
  editButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
    ...Shadows.sm,
  },
  editButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacingNormal,
  },
  macroEditorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  macroEditorModal: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '85%',
    maxWidth: 400,
    ...Shadows.lg,
  },
  macroEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  macroEditorTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  portionSizeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundSubtle,
    borderRadius: BorderRadius.base,
  },
  portionSizeLabel: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  portionSizeInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portionInput: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.lg,
    textAlign: 'center',
    width: 70,
    backgroundColor: Colors.backgroundElevated,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  portionX: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.accent,
    marginLeft: Spacing.sm,
  },
  baseMacrosLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacingWide,
  },
  macroEditorInputs: {
    gap: Spacing.md,
  },
  macroEditorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroEditorLabel: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  macroEditorInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.base,
    textAlign: 'center',
    width: 100,
    backgroundColor: Colors.backgroundSubtle,
    color: Colors.textPrimary,
  },
  previewSection: {
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  previewTitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.info,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacingWide,
  },
  previewText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  macroEditorActions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  macroEditorCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroEditorCancelText: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  macroEditorSave: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    backgroundColor: Colors.accent,
    ...Shadows.sm,
  },
  macroEditorSaveText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  toggleContainer: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacingNormal,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  toggleIcon: {
    marginBottom: Spacing.xs,
  },
  toggleButtonText: {
    fontSize: Typography.xs,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacingNormal,
  },
  toggleButtonTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  toggleSubtext: {
    fontSize: Typography.xs * 0.85,
    color: 'inherit',
    fontWeight: '400',
    opacity: 0.8,
  },
});

export default CameraScreen;
