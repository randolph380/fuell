# Fuel App - Component Guidelines

## Git Workflow Standards

### Regular Git Commits
**CRITICAL**: Always perform regular git commits after making changes. This is a mandatory workflow requirement.

**When to commit:**
- After completing any feature or bug fix
- After making UI/UX improvements
- After refactoring code
- After updating documentation
- Before moving to a different task

**Commit message format:**
```bash
git add -A
git commit -m "Brief description of changes

- Specific change 1
- Specific change 2
- Any additional details"
```

**Example commits:**
```bash
# Feature commits
git commit -m "Feature: Remove debug toggle from camera screen

- Removed showExtendedOutput state variable
- Removed debug toggle UI component
- Simplified response cleaning logic
- Removed unused debug styles"

# UI improvements
git commit -m "UI: Clean up photo upload buttons

- Removed text labels from camera/gallery buttons
- Kept only icons for cleaner appearance
- Maintained functionality while improving aesthetics"

# Bug fixes
git commit -m "Fix: Resolve camera permission handling

- Added proper error handling for camera permissions
- Improved user feedback for permission denied cases
- Fixed crash when camera access is denied"
```

**Why this matters:**
- Maintains clean git history
- Enables easy rollback if needed
- Documents progress for team members
- Follows professional development practices
- Required for this project workflow

## Component Development Standards

### File Structure
```javascript
// 1. Imports (external libraries first, then internal)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 2. Internal imports
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/colors';

// 3. Component definition
const ComponentName = ({ prop1, prop2, onAction }) => {
  // 4. State and hooks
  const [state, setState] = useState();
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 6. Event handlers
  const handleAction = () => {
    // Handler logic
    onAction?.(data);
  };
  
  // 7. Render
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

// 8. Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: Spacing.base,
  },
});

// 9. Export
export default ComponentName;
```

## Design System Usage

### Colors
```javascript
// Always use design system colors
backgroundColor: Colors.background,        // Light gray background
backgroundColor: Colors.backgroundElevated, // White cards
color: Colors.textPrimary,                // Main text
color: Colors.textSecondary,              // Secondary text
color: Colors.accent,                      // Accent color for highlights
```

### Typography
```javascript
// Use typography scale consistently
fontSize: Typography.base,                // 15px - body text
fontSize: Typography.lg,                  // 17px - larger text
fontSize: Typography.xl,                  // 20px - headings
fontWeight: '600',                        // Semi-bold for emphasis
fontWeight: '700',                        // Bold for titles
```

### Spacing
```javascript
// Use spacing scale for consistent spacing
padding: Spacing.base,                    // 16px - standard padding
marginBottom: Spacing.lg,                 // 20px - section spacing
gap: Spacing.sm,                          // 8px - small gaps
```

### Shadows and Borders
```javascript
// Use predefined shadows
...Shadows.base,                          // Standard card shadow
...Shadows.sm,                            // Light shadow

// Use border radius consistently
borderRadius: BorderRadius.base,           // 8px - standard radius
borderRadius: BorderRadius.lg,            // 12px - larger radius
```

## Component Patterns

### Card Components
```javascript
const Card = ({ children, onPress }) => (
  <TouchableOpacity 
    style={styles.card} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    {children}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.base,
  },
});
```

### Button Components
```javascript
const Button = ({ title, onPress, variant = 'primary', disabled = false }) => (
  <TouchableOpacity
    style={[
      styles.button,
      styles[variant],
      disabled && styles.disabled
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.buttonText, styles[`${variant}Text`]]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.base,
  },
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  primaryText: {
    color: Colors.textInverse,
  },
  secondaryText: {
    color: Colors.accent,
  },
});
```

### Form Components
```javascript
const FormField = ({ label, value, onChangeText, placeholder, error }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error && styles.inputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundElevated,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
```

## Data Display Patterns

### List Items
```javascript
const ListItem = ({ title, subtitle, value, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.listItemContent}>
      <Text style={styles.listItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
    </View>
    {value && <Text style={styles.listItemValue}>{value}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  listItemValue: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
```

### Data Cards
```javascript
const DataCard = ({ title, data, color = Colors.textPrimary }) => (
  <View style={styles.dataCard}>
    <Text style={styles.dataCardTitle}>{title}</Text>
    <Text style={[styles.dataCardValue, { color }]}>{data}</Text>
  </View>
);

const styles = StyleSheet.create({
  dataCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    alignItems: 'center',
    ...Shadows.base,
  },
  dataCardTitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  dataCardValue: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
```

## Accessibility Guidelines

### Touch Targets
- Minimum 44px touch target size
- Adequate spacing between interactive elements
- Clear visual feedback for interactions

### Text Readability
- High contrast ratios (minimum 4.5:1)
- Appropriate font sizes (minimum 15px for body text)
- Clear hierarchy with proper heading structure

### Screen Reader Support
- Meaningful labels for interactive elements
- Proper semantic structure
- Descriptive text for data visualization

## Performance Guidelines

### Optimization
- Use `React.memo` for expensive components
- Implement proper key props for lists
- Avoid unnecessary re-renders with proper state management

### Memory Management
- Clean up subscriptions and timers
- Avoid memory leaks in useEffect
- Proper component unmounting

## Testing Guidelines

### Component Testing
- Test user interactions
- Verify proper prop handling
- Check accessibility compliance
- Validate design system usage

### Integration Testing
- Test component integration
- Verify data flow
- Check error handling
- Validate user experience

## Common Anti-Patterns to Avoid

### Styling
- ❌ Don't use hardcoded colors
- ❌ Don't use arbitrary spacing values
- ❌ Don't mix design systems

### Component Structure
- ❌ Don't create overly complex components
- ❌ Don't mix business logic with presentation
- ❌ Don't ignore accessibility requirements

### Performance
- ❌ Don't create unnecessary re-renders
- ❌ Don't ignore memory leaks
- ❌ Don't use inefficient list rendering
