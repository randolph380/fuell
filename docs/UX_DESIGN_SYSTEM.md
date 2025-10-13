# Fuel App - UX Design System

## Overview
This document outlines the consistent design system for the Fuel macro tracking app. All components should follow these guidelines to maintain visual consistency and professional appearance.

## Design Philosophy
- **Clinical & Professional**: Clean, medical-grade aesthetic
- **Data-Focused**: Clear hierarchy for nutritional information
- **Accessible**: High contrast, readable typography
- **Consistent**: Unified spacing, colors, and interactions
- **Compact**: Efficient use of space with smaller, readable fonts

## Color System

### Primary Colors
- **Primary**: `#1a2332` (Deep professional blue/slate)
- **Primary Light**: `#2a3544` 
- **Primary Dark**: `#0f1419`

### Accent Colors
- **Accent**: `#4a9fa8` (Muted scientific teal)
- **Accent Light**: `#6bb5bd`
- **Accent Dark**: `#357980`

### Background Colors
- **Background**: `#f8f9fa` (Light gray)
- **Background Elevated**: `#ffffff` (White)
- **Background Subtle**: `#e9ecef` (Light gray)

### Text Colors
- **Text Primary**: `#1a2332` (Same as primary)
- **Text Secondary**: `#6c757d` (Muted gray)
- **Text Tertiary**: `#adb5bd` (Very subtle)
- **Text Inverse**: `#ffffff` (White)

### Status Colors
- **Success**: `#2d8659`
- **Warning**: `#856404`
- **Error**: `#842029`
- **Info**: `#0c5460`

## Typography

### Font Families
- **Regular**: System font (iOS: System, Android: Roboto)
- **Medium**: System-Medium (iOS: System, Android: Roboto-Medium)
- **Bold**: System-Bold (iOS: System, Android: Roboto-Bold)

### Font Sizes (Compact Design)
- **xs**: 10px
- **sm**: 12px
- **base**: 14px
- **lg**: 16px
- **xl**: 18px
- **xxl**: 20px
- **xxxl**: 24px

### Letter Spacing
- **Tight**: -0.3
- **Normal**: 0
- **Wide**: 0.5

## Spacing Scale (Compact Design)
- **xs**: 3px
- **sm**: 6px
- **md**: 9px
- **base**: 12px
- **lg**: 15px
- **xl**: 18px
- **xxl**: 24px
- **xxxl**: 36px

## Border Radius
- **none**: 0
- **sm**: 4px
- **base**: 8px
- **md**: 10px
- **lg**: 12px
- **xl**: 16px
- **full**: 9999px

## Shadows
- **none**: No shadow
- **sm**: Light shadow (elevation 1)
- **base**: Medium shadow (elevation 2)
- **md**: Medium shadow (elevation 3)
- **lg**: Strong shadow (elevation 4)

## Compact Design Principles

### Space Efficiency
- **Minimize vertical spacing** - Use smaller margins and padding
- **Tight layouts** - Reduce gaps between elements
- **Smaller fonts** - Use compact typography scale
- **Efficient cards** - Reduce padding while maintaining readability

### Typography Guidelines
- **Screen titles**: `Typography.xl` (18px) - not `Typography.xxxl`
- **Card titles**: `Typography.base` (14px) - not `Typography.lg`
- **Body text**: `Typography.sm` (12px) - not `Typography.base`
- **Labels**: `Typography.xs` (10px) - not `Typography.sm`

### Spacing Guidelines
- **Card padding**: `Spacing.base` (12px) - not `Spacing.lg`
- **Section margins**: `Spacing.lg` (15px) - not `Spacing.xl`
- **Element gaps**: `Spacing.sm` (6px) - not `Spacing.base`

## Component Guidelines

### Cards (Compact)
- **Background**: `Colors.backgroundElevated` (#ffffff)
- **Border Radius**: `BorderRadius.base` (8px)
- **Shadow**: `Shadows.base`
- **Padding**: `Spacing.base` (12px)

### Buttons
- **Primary Button**: 
  - Background: `Colors.accent`
  - Text: `Colors.textInverse`
  - Border Radius: `BorderRadius.base`
  - Padding: `Spacing.md` vertical, `Spacing.base` horizontal

- **Secondary Button**:
  - Background: `Colors.backgroundSubtle`
  - Border: `Colors.border`
  - Text: `Colors.accent`
  - Border Radius: `BorderRadius.base`

- **Destructive Button**:
  - Background: `Colors.error`
  - Text: `Colors.textInverse`
  - Border Radius: `BorderRadius.base`

### Text Styles (Compact Design)
- **Title**: `Typography.xl`, `Colors.textPrimary`, `fontWeight: '700'`
- **Subtitle**: `Typography.base`, `Colors.textPrimary`, `fontWeight: '600'`
- **Body**: `Typography.sm`, `Colors.textPrimary`
- **Caption**: `Typography.xs`, `Colors.textSecondary`
- **Label**: `Typography.xs`, `Colors.textSecondary`, `fontWeight: '500'`

### Section Titles & Form Labels (Consistent)
- **Section Titles**: `Typography.base`, `Colors.textPrimary`, `fontWeight: '600'`
- **Form Labels**: `Typography.base`, `Colors.textPrimary`, `fontWeight: '600'`
- **Toggle Labels**: `Typography.base`, `Colors.textPrimary`, `fontWeight: '600'`
- **Method Titles**: `Typography.base`, `Colors.textPrimary`, `fontWeight: '600'`

**Important**: All section titles, form labels, toggle labels, and method titles should use the same typography for consistency.

### Containers
- **Screen Background**: `Colors.background`
- **Card Background**: `Colors.backgroundElevated`
- **Section Background**: `Colors.backgroundSubtle`

## Implementation Notes

### Import Pattern
```javascript
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/colors';
```

### StyleSheet Pattern
```javascript
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: Spacing.base,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  // Section titles, form labels, toggle labels, method titles - ALL CONSISTENT
  sectionTitle: {
    fontSize: Typography.base,        // 14px
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  formLabel: {
    fontSize: Typography.base,        // 14px - SAME as sectionTitle
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  toggleLabel: {
    fontSize: Typography.base,        // 14px - SAME as sectionTitle
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  methodTitle: {
    fontSize: Typography.base,        // 14px - SAME as sectionTitle
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    ...Shadows.base,
  },
});
```

## Accessibility
- Minimum touch target: 44px
- High contrast ratios for text
- Clear visual hierarchy
- Consistent interaction patterns

## Data Visualization Colors
- **Calories**: `#4a9fa8` (Accent teal)
- **Protein**: `#e07856` (Orange)
- **Carbs**: `#8b7fb8` (Purple)
- **Fat**: `#f4c542` (Yellow)

## Common Patterns

### Screen Layout
1. **Container**: `backgroundColor: Colors.background`
2. **Content**: `padding: Spacing.base`
3. **Cards**: Use elevated background with shadows
4. **Sections**: Use subtle background for grouping

### Button Groups
- Use consistent spacing between buttons
- Primary action should be most prominent
- Destructive actions should be clearly marked

### Data Display
- Use cards for data presentation
- Clear typography hierarchy
- Consistent color coding for macros
- Proper spacing between elements

## Consistency Rules

### Typography Consistency
- **ALL section titles** must use `Typography.base` (14px)
- **ALL form labels** must use `Typography.base` (14px)  
- **ALL toggle labels** must use `Typography.base` (14px)
- **ALL method titles** must use `Typography.base` (14px)
- **Font weight**: Always `'600'` for these elements
- **Color**: Always `Colors.textPrimary`

### Common Mistakes to Avoid
- ❌ Don't use `Typography.lg` for section titles
- ❌ Don't use `Typography.sm` for form labels
- ❌ Don't mix different font sizes for similar elements
- ❌ Don't use different font weights for the same type of element

### Quick Reference
```javascript
// ✅ CORRECT - All section titles use same typography
sectionTitle: {
  fontSize: Typography.base,    // 14px
  fontWeight: '600',
  color: Colors.textPrimary,
}

// ❌ WRONG - Inconsistent font sizes
sectionTitle: {
  fontSize: Typography.lg,      // 16px - TOO BIG
  fontWeight: '600',
  color: Colors.textPrimary,
}
```

## Quality Checklist
- [ ] Uses design system colors
- [ ] Consistent spacing scale
- [ ] Proper typography hierarchy
- [ ] **ALL section titles use Typography.base**
- [ ] **ALL form labels use Typography.base**
- [ ] Appropriate shadows and elevation
- [ ] Accessible touch targets
- [ ] Clear visual hierarchy
- [ ] Consistent with existing components
