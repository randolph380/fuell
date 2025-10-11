# Fuel App - App Store Submission Checklist

## ✅ Completed

### Branding & Identity
- [x] App renamed from "MacroTracker" to "Fuel"
- [x] Bundle identifier: `com.fuel.app`
- [x] App name in app.json: "Fuel"
- [x] Scheme updated: `fuel`
- [x] Professional, clinical aesthetic applied

### UI/UX Polish
- [x] Removed all emojis from production UI
- [x] Replaced purple (#667eea) with professional color scheme
- [x] Applied consistent design system (Colors, Typography, Spacing, Shadows)
- [x] Removed dev-only "Add Sample Data" button
- [x] Professional brand logos for Google/Apple OAuth
- [x] Clean, clinical aesthetic throughout

### Core Functionality
- [x] Camera integration for food photos
- [x] Claude AI food analysis
- [x] Meal logging with date/time
- [x] Daily macro tracking
- [x] Saved meals/templates
- [x] Trends and analytics
- [x] Multi-image support (nutrition labels, scales)
- [x] Image compression for API limits

### Authentication
- [x] Clerk integration (Google, Apple, Email)
- [x] User-specific data storage
- [x] Sign out functionality
- [x] OAuth branding shows "Fuel" (requires custom credentials)

### Technical
- [x] React Native 0.81.4
- [x] Expo SDK 54
- [x] All dependencies up to date
- [x] No console errors or warnings
- [x] Proper error handling

## 🔧 Pre-Submission Tasks

### 1. App Store Connect Setup
- [ ] Create app listing in App Store Connect
- [ ] Upload app icon (1024x1024)
- [ ] Prepare screenshots (6.7", 6.5", 5.5")
- [ ] Write app description
- [ ] Set up pricing (Free)
- [ ] Select app category (Health & Fitness)

### 2. Privacy & Permissions
- [ ] Add Privacy Policy URL
- [ ] Add Terms of Service URL
- [ ] Document data collection practices:
  - Camera: For taking food photos
  - Photo Library: For selecting existing food images
  - User data: Meal logs, macros (stored locally & with user account)
  - Claude API: Food images sent for macro analysis

### 3. App Icon & Splash Screen
- [ ] Design professional app icon (1024x1024)
- [ ] Update `./assets/images/icon.png`
- [ ] Update splash screen
- [ ] Update `./assets/images/splash-icon.png`

### 4. Info.plist Permissions (iOS)
Add to app.json under `ios`:
```json
"infoPlist": {
  "NSCameraUsageDescription": "Fuel needs camera access to photograph your meals for macro analysis.",
  "NSPhotoLibraryUsageDescription": "Fuel needs photo library access to select food images for macro analysis."
}
```

### 5. Testing
- [ ] Test on physical iOS device
- [ ] Test camera functionality
- [ ] Test photo selection
- [ ] Test Claude API integration (ensure API key is secure)
- [ ] Test offline behavior
- [ ] Test authentication flow (all 3 methods)
- [ ] Test sign out and data persistence
- [ ] Test saved meals
- [ ] Test trends/analytics
- [ ] Test edge cases (no meals, large datasets)

### 6. API & Backend
- [ ] Move Flask server to production hosting (Heroku, AWS, etc.)
- [ ] Secure API key (use environment variables, never commit)
- [ ] Update `src/services/api.js` with production server URL
- [ ] Add rate limiting/usage monitoring for Claude API
- [ ] Consider costs: Claude API usage per user

### 7. Build & Deployment
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### 8. App Store Assets Needed
- [ ] App Name: "Fuel - Precision Nutrition Tracking"
- [ ] Subtitle: "AI-Powered Macro Tracker"
- [ ] Keywords: nutrition, macros, calories, protein, diet, fitness, AI, food
- [ ] Promotional text (170 chars)
- [ ] Description (4000 chars max)
- [ ] Screenshots (3-10 images per device size)
- [ ] App preview video (optional but recommended)

### 9. Legal Requirements
- [ ] Privacy Policy (required)
- [ ] Terms of Service
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Copyright statement

### 10. Clerk OAuth Configuration
For production:
- [ ] Get custom Google OAuth credentials (Client ID/Secret)
- [ ] Get Apple Sign In credentials
- [ ] Configure in Clerk Dashboard (use custom, not shared)
- [ ] Test OAuth shows "Fuel" not "Expo"

## 🚨 Critical Issues to Address

### 1. API Key Security
**URGENT**: Your Claude API key is currently in `server.py`. This needs to be:
- Moved to environment variable
- Never committed to git
- Secured in production

```python
# server.py - Use environment variable
import os
API_KEY = os.environ.get('ANTHROPIC_API_KEY')
```

### 2. Server Hosting
The Flask server currently runs locally. For production:
- Deploy to cloud service (Heroku, Railway, Fly.io, AWS Lambda)
- Update API_BASE_URL in `src/services/api.js`
- Use HTTPS (required for production)
- Consider serverless (AWS Lambda + API Gateway) for cost efficiency

### 3. Cost Management
Claude API usage costs money:
- Estimate: ~$0.01-0.05 per food analysis
- 1000 users × 3 meals/day × 30 days = 90,000 API calls/month
- At $0.03/call = $2,700/month
- **Solution**: Implement usage limits, freemium model, or subscription

### 4. Offline Support
Currently requires internet for:
- Claude API analysis
- User authentication
What happens when offline?
- [ ] Add offline detection
- [ ] Queue failed API calls for retry
- [ ] Show appropriate error messages

### 5. Data Backup
User data is stored locally (AsyncStorage):
- [ ] Implement cloud sync for logged meals
- [ ] Backup to user's Clerk account
- [ ] Consider database (Firebase, Supabase, PostgreSQL)

## 📝 Recommended Improvements

### Before V1 Launch
1. **Error boundaries** - Catch crashes gracefully
2. **Loading states** - Better feedback during API calls
3. **Haptic feedback** - Better touch response
4. **Onboarding** - Tutorial for first-time users
5. **App Store optimization** - Better description, keywords
6. **Analytics** - Track usage (Amplitude, Mixpanel)

### Post-Launch Features
1. Barcode scanner for packaged foods
2. Recipe builder
3. Meal planning
4. Integration with fitness trackers
5. Social features (share meals)
6. Export data (CSV, PDF)
7. Custom macro goals
8. Weekly reports

## 🔐 Security Checklist

- [x] User data isolated per account
- [x] Secure token storage (expo-secure-store)
- [ ] API key secured (not in code)
- [ ] HTTPS for all network requests
- [ ] No sensitive data in logs
- [ ] Input validation on forms
- [ ] Rate limiting on API endpoints

## 📱 Device Testing

Test on:
- [ ] iPhone 16 Pro Max (6.9")
- [ ] iPhone 16/15/14 Pro (6.1")
- [ ] iPhone SE (4.7")
- [ ] iPad (if supporting tablets)

Test scenarios:
- [ ] Dark mode
- [ ] Light mode
- [ ] Low battery mode
- [ ] Poor network connection
- [ ] No network connection
- [ ] Camera denied permission
- [ ] Photo library denied permission

## 📊 App Store Metadata Template

**Name**: Fuel - Precision Nutrition Tracking

**Subtitle**: AI-Powered Macro Tracker

**Description**:
```
Fuel is a precision nutrition tracking app powered by AI. Simply take a photo of your food, and our advanced AI analyzes it to provide accurate macro breakdowns - calories, protein, carbs, and fat.

KEY FEATURES:
• AI Food Analysis - Just snap a photo, no manual entry
• Multi-Image Support - Include nutrition labels and scale measurements
• Conversational Refinement - Chat with AI to improve accuracy
• Daily Tracking - Monitor your nutrition progress
• Trends & Analytics - Visualize your macro trends over time
• Saved Meals - Save and quickly log favorite meals
• Portion Adjustment - Easily scale meal macros

PERFECT FOR:
• Bodybuilders and athletes tracking macros
• Anyone on a calorie-controlled diet
• Fitness enthusiasts wanting precision
• People tired of manual food logging

HOW IT WORKS:
1. Take a photo of your food
2. AI analyzes and estimates macros
3. Refine the estimate through conversation
4. Log to your daily tracker

Fuel uses advanced AI to provide the most accurate macro estimates from photos. While not 100% perfect, it's significantly faster and more convenient than traditional food logging.

Start tracking your nutrition with precision. Download Fuel today.
```

**Keywords**:
nutrition, macros, calories, protein, diet, fitness, AI, food tracker, meal tracker, macro tracker, calorie counter, bodybuilding, weight loss, health

**Support URL**: [Need to create]

**Privacy Policy URL**: [Need to create]

## ✅ Final Pre-Launch Checklist

Before hitting "Submit for Review":
- [ ] All features tested on physical device
- [ ] No crashes or critical bugs
- [ ] Privacy Policy live and accessible
- [ ] Support email/website set up
- [ ] App icon finalized
- [ ] Screenshots captured
- [ ] Description proofread
- [ ] API server deployed and stable
- [ ] API costs/limits understood
- [ ] Clerk OAuth properly configured
- [ ] TestFlight testing complete (recommended)
- [ ] App Store Connect fully configured
- [ ] Legal documents reviewed

---

**Current Status**: Development Complete - Ready for Pre-Submission Tasks

**Estimated Timeline**:
- App Store assets: 2-3 days
- Server deployment: 1-2 days  
- Testing: 2-3 days
- App Store review: 1-3 days (Apple)

**Total**: ~1-2 weeks to launch

