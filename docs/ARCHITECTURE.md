# Fuel App - Architecture Documentation

## Overview
The Fuel app is a React Native macro tracking application with a focus on clinical, professional design and robust data management.

## Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Authentication**: Clerk
- **Storage**: AsyncStorage (local) + Cloud backup
- **State Management**: React hooks + Context
- **Styling**: StyleSheet with design system
- **AI Analysis**: Claude Sonnet 4.5 with enhanced prompt engineering
- **Food Databases**: USDA FDC, Open Food Facts, Restaurant menus

## Folder Structure
```
src/
├── components/          # Reusable UI components
│   ├── ClerkWrapper.js  # Authentication wrapper
│   └── MealCard.js      # Meal display component
├── screens/             # Screen components
│   └── SimpleBackupScreen.js  # Export Data screen
├── services/            # Business logic and data
│   ├── storage.js       # Local storage service
│   └── simpleBackup.js  # CSV export service
├── constants/           # Design system and constants
│   └── colors.js        # Colors, typography, spacing
└── docs/               # Development documentation
```

## Component Architecture

### Authentication Layer
- **ClerkWrapper**: Handles authentication state and user management
- **User-specific storage**: All data is scoped to authenticated users
- **Session management**: Automatic login/logout handling

### Data Layer
- **StorageService**: Centralized data management
- **User-scoped keys**: All storage keys prefixed with user ID
- **Data types**: Meals, daily macros, saved meals, preferences

### UI Layer
- **Design system**: Consistent colors, typography, spacing
- **Component patterns**: Cards, buttons, forms follow established patterns
- **Responsive design**: Works across different screen sizes

## AI Analysis System

### Enhanced Prompt Engineering
- **Per-Item Database Retrieval**: Forces AI to match foods against USDA FDC, Open Food Facts, and restaurant databases
- **Scientific Validation**: Enforces Atwater energy constraints with automatic rescaling
- **Enhanced Portion Estimation**: Uses reference objects and multi-angle analysis for accurate sizing
- **Recipe Decomposition**: Parses complex meals with cooking method multipliers
- **Confidence System**: Per-item confidence scoring with active queries for low certainty

### Data Sources
- **USDA FDC**: Primary source for whole foods with exact nutritional data
- **Open Food Facts**: Packaged and branded food items with barcode data
- **Restaurant Databases**: Chain restaurant menu items with standardized nutrition
- **Source Attribution**: Always cites data source for transparency

### Response Structure
```json
{
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

## Data Flow

### User Authentication
1. User logs in via Clerk
2. ClerkWrapper sets user ID in StorageService
3. All subsequent data operations are user-scoped

### Data Operations
1. User performs action (add meal, update preferences)
2. Component calls StorageService method
3. StorageService updates AsyncStorage with user-scoped key
4. UI updates reflect changes

### Data Export
1. User initiates CSV export
2. SimpleBackup collects meal data with accurate timestamps
3. Data exported as CSV with chronological sorting
4. Military time format and ISO dates for analysis

## Key Patterns

### Component Structure
```javascript
import { Colors, Typography, Spacing } from '../constants/colors';

const Component = ({ prop1, prop2 }) => {
  // State and effects
  const [state, setState] = useState();
  
  // Event handlers
  const handleAction = () => {};
  
  // Render
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: Spacing.base,
  },
});
```

### Service Pattern
```javascript
class ServiceName {
  static async methodName(params) {
    try {
      // Implementation
      return result;
    } catch (error) {
      console.error('Error in methodName:', error);
      throw error;
    }
  }
}
```

## Design Principles

### Consistency
- All components follow the design system
- Consistent spacing, colors, and typography
- Standardized component patterns

### User Experience
- Clinical, professional aesthetic
- Clear data hierarchy
- Intuitive navigation

### Data Integrity
- User-scoped data isolation
- Robust error handling
- Backup/restore capabilities

## Security Considerations

### Data Isolation
- User data is completely isolated by user ID
- No cross-user data access possible
- Secure authentication via Clerk

### Local Storage
- Sensitive data stored locally only
- No cloud sync by default
- User controls backup/export

## Performance Considerations

### Storage Efficiency
- Minimal data duplication
- Efficient key structure
- Lazy loading where appropriate

### UI Performance
- Optimized re-renders
- Efficient list rendering
- Proper state management

### Memory Management
- **Memory leak prevention**: State cleanup after meal processing
- **Image memory optimization**: Clear image URIs and base64 data after use
- **Component lifecycle**: Proper cleanup on unmount to prevent memory leaks
- **Memory monitoring**: Debug tools for tracking memory usage patterns

## Future Considerations

### Scalability
- Architecture supports additional features
- Service layer can be extended
- Component system is modular

### Maintenance
- Clear separation of concerns
- Consistent patterns
- Comprehensive documentation
