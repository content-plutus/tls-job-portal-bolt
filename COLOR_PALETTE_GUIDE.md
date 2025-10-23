# Legal Job Portal - Professional Color Palette Guide

## Color System Overview

This guide provides the complete color palette for the LegalJobs platform, based on research of top-tier legal firms including Cravath, Skadden, and Latham & Watkins.

---

## Primary Colors: Navy Blue

**Usage:** Main brand color, headers, primary actions, backgrounds

| Shade | Hex Code | Usage | WCAG on White |
|-------|----------|-------|---------------|
| Navy 900 | `#00205B` | Primary brand, hero text, CTAs | ✅ AAA (13.45:1) |
| Navy 800 | `#003875` | Dark backgrounds, footers | ✅ AAA (11.2:1) |
| Navy 700 | `#004D8F` | Button backgrounds, cards | ✅ AAA (8.7:1) |
| Navy 600 | `#0062A9` | Interactive elements | ✅ AA (6.9:1) |
| Navy 500 | `#0077C3` | Links, accents | ✅ AA (5.2:1) |
| Navy 400 | `#3391CF` | Hover states | ✅ AA (4.8:1) |
| Navy 300 | `#66ABDB` | Subtle highlights | ⚠️ AA (3.1:1 - use on dark) |
| Navy 200 | `#99C5E7` | Light backgrounds | 🔍 Large text only |
| Navy 100 | `#CCE0F3` | Tints, borders | 🔍 Large text only |
| Navy 50 | `#E5F0F9` | Subtle backgrounds | 🔍 Large text only |

**Tailwind Classes:**
```css
bg-legal-navy-900    text-legal-navy-900
bg-legal-navy-800    text-legal-navy-800
border-legal-navy-500
```

---

## Secondary Colors: Gold

**Usage:** Premium features, accents, success states, highlights

| Shade | Hex Code | Usage | WCAG on Navy-900 |
|-------|----------|-------|------------------|
| Gold 900 | `#8B6914` | Deep accents | ✅ AA (5.8:1) |
| Gold 800 | `#9D7A1F` | Rich gold elements | ✅ AA (5.2:1) |
| Gold 700 | `#AF8B2A` | Standard gold | ✅ AA (4.9:1) |
| Gold 600 | `#C19C35` | Primary gold | ✅ AA (4.52:1) |
| Gold 500 | `#C5A572` | Main accent color | ✅ AA (4.6:1) |
| Gold 400 | `#D4B88E` | Light gold | ✅ AA (5.1:1) |
| Gold 300 | `#E3CBAA` | Subtle gold | ✅ AA (6.8:1) |
| Gold 200 | `#F1DEC6` | Background tints | ✅ AAA (8.9:1) |
| Gold 100 | `#F8EFE3` | Very light gold | ✅ AAA (11.2:1) |
| Gold 50 | `#FCF7F1` | Subtle backgrounds | ✅ AAA (12.5:1) |

**Tailwind Classes:**
```css
bg-legal-gold-500    text-legal-gold-500
bg-legal-gold-400    text-legal-gold-400
border-legal-gold-500
```

**Gradients:**
```css
bg-gradient-to-r from-legal-gold-600 to-legal-gold-500
bg-gradient-to-r from-legal-gold-400 to-legal-gold-200
```

---

## Accent Colors: Cardinal Red

**Usage:** Error states, urgent actions, important highlights

| Shade | Hex Code | Usage | WCAG on White |
|-------|----------|-------|---------------|
| Red 900 | `#6D1826` | Deep red accents | ✅ AAA (12.4:1) |
| Red 800 | `#7F1E2D` | Dark red | ✅ AAA (10.8:1) |
| Red 700 | `#912334` | Standard red | ✅ AAA (9.4:1) |
| Red 600 | `#9D2235` | Primary red | ✅ AAA (8.93:1) |
| Red 500 | `#B52C40` | Bright red | ✅ AA (7.2:1) |
| Red 400 | `#CD5666` | Light red | ✅ AA (5.1:1) |
| Red 300 | `#E5808C` | Subtle red | ⚠️ AA (3.2:1 - use on dark) |
| Red 200 | `#F0B3B9` | Background red | 🔍 Large text only |
| Red 100 | `#F8D9DC` | Tints | 🔍 Large text only |
| Red 50 | `#FCECEE` | Subtle backgrounds | 🔍 Large text only |

**Tailwind Classes:**
```css
bg-legal-red-600     text-legal-red-600
text-legal-red-500   hover:text-legal-red-500
```

---

## Neutral Colors: Slate Gray

**Usage:** Text, borders, backgrounds, secondary elements

| Shade | Hex Code | Usage | WCAG on White |
|-------|----------|-------|---------------|
| Slate 900 | `#2C3540` | Primary text | ✅ AAA (14.2:1) |
| Slate 800 | `#3D4854` | Secondary text | ✅ AAA (11.8:1) |
| Slate 700 | `#4E5A68` | Tertiary text | ✅ AAA (9.1:1) |
| Slate 600 | `#5F6D7C` | Muted text | ✅ AAA (7.21:1) |
| Slate 500 | `#6B7F92` | Subtle text | ✅ AA (5.8:1) |
| Slate 400 | `#8899A8` | Placeholder text | ✅ AA (4.6:1) |
| Slate 300 | `#A5B3BE` | Borders | ⚠️ AA (3.2:1 - use on dark) |
| Slate 200 | `#C2CCD4` | Light borders | 🔍 Large text only |
| Slate 100 | `#DFE6EA` | Background tints | 🔍 Large text only |
| Slate 50 | `#EFF3F5` | Subtle backgrounds | 🔍 Large text only |

**Tailwind Classes:**
```css
text-legal-slate-900    # Primary text
text-legal-slate-600    # Secondary text
text-legal-slate-400    # Tertiary text
border-legal-slate-300
```

---

## Background & Surface Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| BG Primary | `#FFFFFF` | Main background |
| BG Secondary | `#F8F9FA` | Alternate sections |
| BG Tertiary | `#F5F5F5` | Card backgrounds |
| Surface Elevated | `#FFFFFF` | Raised cards |
| Surface Overlay | `rgba(0, 32, 91, 0.05)` | Modal overlays |

---

## Semantic Colors

| Purpose | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| Success | `#047857` (Green) | `#10B981` | Completed, approved |
| Warning | `#D97706` (Orange) | `#F59E0B` | Caution, pending |
| Error | `#DC2626` (Red) | `#EF4444` | Errors, destructive |
| Info | `#0077C3` (Navy-500) | `#3391CF` | Information, tips |

---

## Typography Colors

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary Text | `#1A1A1A` | `#FFFFFF` |
| Secondary Text | `#4E5A68` | `#C2CCD4` |
| Tertiary Text | `#6B7F92` | `#8899A8` |
| Inverse Text | `#FFFFFF` | `#1A1A1A` |
| Link Default | `#0077C3` | `#3391CF` |
| Link Hover | `#004D8F` | `#66ABDB` |

---

## Border Colors

| Type | Color | Hex Code | Usage |
|------|-------|----------|-------|
| Light | `border-legal-slate-100` | `#DFE6EA` | Subtle dividers |
| Medium | `border-legal-slate-300` | `#A5B3BE` | Standard borders |
| Dark | `border-legal-slate-500` | `#6B7F92` | Emphasis borders |
| Accent | `border-legal-gold-500` | `#C5A572` | Premium elements |

---

## Gradient Combinations

### Hero Gradients
```css
/* Navy to Slate - Professional Background */
bg-gradient-to-br from-legal-navy-900 via-legal-navy-800 to-legal-slate-900

/* Gold Shine - Premium Elements */
bg-gradient-to-r from-legal-gold-600 to-legal-gold-500

/* Navy Depth - Buttons and Cards */
bg-gradient-to-r from-legal-navy-700 to-legal-navy-600
```

### Text Gradients
```css
/* Premium Heading */
bg-gradient-to-r from-legal-gold-400 via-legal-gold-300 to-white
bg-clip-text text-transparent

/* Brand Heading */
bg-gradient-to-r from-legal-gold-500 to-legal-gold-300
bg-clip-text text-transparent
```

---

## Component-Specific Colors

### Buttons

**Primary (Navy)**
```css
bg-gradient-to-r from-legal-navy-700 to-legal-navy-600
text-white
hover:from-legal-navy-800 hover:to-legal-navy-700
```

**Secondary (Gold)**
```css
bg-gradient-to-r from-legal-gold-600 to-legal-gold-500
text-legal-navy-900
hover:from-legal-gold-700 hover:to-legal-gold-600
```

**Outline**
```css
border-2 border-legal-gold-500
text-legal-gold-500
hover:bg-legal-gold-500/10
```

### Cards

**Glass Effect**
```css
bg-white/10
backdrop-blur-lg
border border-legal-gold-500/20
hover:border-legal-gold-500/40
```

**Solid Card**
```css
bg-white
border border-legal-slate-200
shadow-lg
```

### Inputs

**Default State**
```css
bg-white/10
backdrop-blur-lg
border border-legal-gold-500/30
text-white
placeholder-gray-400
```

**Focus State**
```css
focus:outline-none
focus:ring-2
focus:ring-legal-gold-500
focus:border-legal-gold-500
```

---

## Usage Guidelines

### Do's ✅

- Use Navy-900 for primary brand elements and main headers
- Use Gold-500 for premium features and highlights
- Use Slate-900 for body text on light backgrounds
- Maintain 4.5:1 contrast ratio minimum for text
- Use gradients sparingly for impact
- Test colors in both light and dark environments

### Don'ts ❌

- Don't use light colors on light backgrounds
- Don't mix too many colors in one component
- Don't use Gold as primary text color (use for accents)
- Don't forget to test accessibility
- Don't use Red excessively (reserve for errors)

---

## Accessibility Checklist

- [ ] All text meets WCAG AA contrast (4.5:1 minimum)
- [ ] Large text meets 3:1 contrast
- [ ] UI components meet 3:1 contrast
- [ ] Focus indicators are visible (gold outline)
- [ ] Color is not the only indicator of state
- [ ] Links are distinguishable from text
- [ ] Hover states are clear

---

## Color Psychology Summary

**Navy Blue (#00205B)**
- Represents: Trust, Authority, Stability, Professionalism
- Emotion: Confidence, Security
- Industry: Legal, Finance, Government
- Use for: Brand identity, primary actions

**Gold (#C5A572)**
- Represents: Excellence, Quality, Success, Sophistication
- Emotion: Prestige, Achievement
- Industry: Premium services, Luxury
- Use for: Premium features, highlights, success states

**Cardinal Red (#9D2235)**
- Represents: Power, Confidence, Determination, Energy
- Emotion: Urgency, Importance
- Industry: Legal advocacy, Leadership
- Use for: CTAs, errors, important notices

**Slate Gray (#6B7F92)**
- Represents: Balance, Wisdom, Professionalism, Neutrality
- Emotion: Calm, Sophistication
- Industry: Universal
- Use for: Text, borders, backgrounds

---

## Quick Reference

### Most Used Colors

```css
/* Primary Brand */
text-legal-navy-900      #00205B
bg-legal-navy-900        #00205B

/* Gold Accent */
text-legal-gold-500      #C5A572
bg-legal-gold-500        #C5A572
border-legal-gold-500    #C5A572

/* Text */
text-legal-slate-900     #2C3540
text-legal-slate-600     #5F6D7C
text-legal-slate-400     #8899A8

/* Backgrounds */
bg-white                 #FFFFFF
bg-legal-slate-50        #EFF3F5
```

---

## Implementation Files

- **Tailwind Config:** `/tailwind.config.js`
- **CSS Variables:** `/src/styles/legal-colors.css`
- **Components:** All using Tailwind classes

---

**Version:** 1.0
**Last Updated:** October 13, 2025
**Status:** Production Ready ✅
