# Fuel - Design System Documentation

## Clinical & Sophisticated Aesthetic

This document outlines the complete design transformation from a playful, amateur aesthetic to a sophisticated, clinical, professional interface.

---

## Color Palette

### Primary Colors - Deep Professional Slate
```
Primary: #1a2332 (Deep slate blue - main brand color)
Primary Light: #2a3544 (Elevated surfaces)
Primary Dark: #0f1419 (Deep accents)
```

### Accent Colors - Muted Scientific Teal
```
Accent: #4a9fa8 (Clinical teal - CTAs, highlights)
Accent Light: #6bb5bd (Hover states)
Accent Dark: #357980 (Pressed states)
```

### Backgrounds - Clean & Minimal
```
Background: #f8f9fa (App background)
Background Elevated: #ffffff (Cards, panels)
Background Subtle: #e9ecef (Input fields)
```

### Text Hierarchy
```
Text Primary: #212529 (Headlines, key data)
Text Secondary: #6c757d (Labels, descriptions)
Text Tertiary: #adb5bd (Hints, metadata)
Text Inverse: #ffffff (On dark backgrounds)
```

### Borders & Dividers
```
Border: #dee2e6 (Default borders)
Border Light: #e9ecef (Subtle separators)
Border Dark: #ced4da (Emphasis)
```

### Status Colors - Muted & Clinical
```
Success: #2d8659 (Confirmation, positive)
Warning: #856404 (Caution)
Error: #842029 (Critical, destructive)
Info: #0c5460 (Informational)
```

### Macro-Specific Colors
```
Calories: #2a3544 (Primary dark)
Protein: #d65c3b (Muted coral)
Carbs: #6a5a9f (Muted purple)
Fat: #e5a826 (Muted gold)
```

---

## Typography

### Font Scale
```
xs: 11px - Micro labels, units
sm: 13px - Secondary text, metadata
base: 15px - Body text, inputs
lg: 17px - Subheadings
xl: 20px - Headings
xxl: 24px - Large headings
xxxl: 32px - Display text
```

### Font Weights
```
Regular: 400 (Body text)
Medium: 500 (Emphasis, buttons)
Semi-Bold: 600 (Headings, labels)
```

### Letter Spacing
```
Tight: -0.3px (Large headings)
Normal: 0px (Body text)
Wide: 0.5px (Small caps, labels)
```

### Usage Guidelines
- All caps for: section headers, micro labels, navigation
- Letter spacing: increased for uppercase text
- Line height: 1.5 for body, 1.2 for headings

---

## Spacing System

Consistent 4px grid:
```
xs: 4px
sm: 8px
md: 12px
base: 16px
lg: 20px
xl: 24px
xxl: 32px
xxxl: 48px
```

---

## Border Radius

Minimal, clean corners:
```
none: 0px
sm: 4px (Buttons, small elements)
base: 8px (Cards, inputs)
md: 10px (Large cards)
lg: 12px (Modals)
xl: 16px (Special emphasis)
full: 9999px (Pills, dots)
```

---

## Shadows

Subtle elevation only:
```
none: No shadow
sm: 1px offset, 0.05 opacity (Buttons, small cards)
base: 2px offset, 0.08 opacity (Cards, panels)
md: 3px offset, 0.08 opacity (Modals)
lg: 4px offset, 0.12 opacity (Floating elements)
```

---

## Component Specifications

### MacroDisplay
- **Style**: Clinical data panel
- **Layout**: Horizontal grid with vertical divider
- **Typography**: Large bold numbers, small caps labels
- **Colors**: Color-coded by macro type
- **Numbers**: Formatted with commas (e.g., 2,888)
- **Calories**: Larger, primary color
- **Macros**: Smaller, specific colors (P/C/F)

### MealCard
- **Style**: Clean, data-focused card
- **Layout**: Header with name/time, macro grid
- **Borders**: 1px subtle border
- **Actions**: Icon + text, color-coded
- **Typography**: Tight letter spacing for numbers
- **Shadows**: Minimal elevation

### DateNavigator
- **Style**: Minimal, functional
- **Buttons**: Small, square, subtle
- **Date**: All caps, wide letter spacing
- **Smart Labels**: TODAY, YESTERDAY, TOMORROW
- **Colors**: Muted, no bright blues

### SignInScreen
- **Background**: Primary dark
- **Logo**: ⚡ Lightning bolt (72px)
- **Title**: "FUEL" - all caps, wide spacing
- **Subtitle**: "Precision Nutrition Tracking" - uppercase
- **Buttons**: White/dark only, no bright colors
- **Inputs**: Clean, white background
- **Official Logos**: Ionicons brand icons

### TrendsScreen
- **Charts**: Minimal, professional
- **Table**: Clean grid, subtle row colors
- **Header**: Dark primary background
- **Data**: Bold numbers, small units
- **Typography**: All uppercase section titles

---

## Key Design Principles

### 1. **Clinical Precision**
- No rounded corners > 12px
- Minimal shadows (< 0.1 opacity)
- Precise spacing (4px grid)
- No gradients

### 2. **Typography Hierarchy**
- Clear size differentiation
- Strategic use of uppercase
- Letter spacing for readability
- Numbers stand out

### 3. **Color Usage**
- Muted, professional palette
- High contrast for readability
- Color-coded data (macros, status)
- Minimal use of bright colors

### 4. **Iconography**
- Icons only, no emojis
- Ionicons library
- 16-20px size range
- Paired with text labels

### 5. **Data Presentation**
- Numbers formatted with commas
- Clear units (kcal, g)
- Color-coded categories
- Tabular when appropriate

---

## Before & After

### Before (Amateur/Playful)
- ❌ Bright purple (#667eea)
- ❌ Large corners (12-15px)
- ❌ Heavy shadows (0.3 opacity)
- ❌ Emojis (🍽️📸💾)
- ❌ Gradients
- ❌ Inconsistent spacing

### After (Clinical/Professional)
- ✅ Deep slate (#1a2332)
- ✅ Minimal corners (4-8px)
- ✅ Subtle shadows (0.05-0.08)
- ✅ Icons only (Ionicons)
- ✅ Flat colors
- ✅ 4px grid system

---

## Implementation

All styles now use the centralized design system:
```javascript
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/colors';
```

Benefits:
- Consistent across all screens
- Easy to maintain
- Simple to update globally
- Professional appearance

---

## Brand Identity

**App Name**: Fuel ⚡
**Tagline**: Precision Nutrition Tracking
**Voice**: Scientific, clinical, precise
**Audience**: Serious fitness enthusiasts, athletes, health professionals
**Feel**: Laboratory instrument, not a toy

---

*Design system implemented: October 11, 2025*

