# Design System Foundation

This directory contains the design system foundation for the modern UI redesign, including CSS custom properties, design tokens, and utility functions.

## Files Overview

- `design-tokens.ts` - TypeScript definitions of all design tokens
- `utils.ts` - Utility functions for working with design tokens
- `index.ts` - Central export point for the design system
- `README.md` - This documentation file

## Usage

### CSS Custom Properties

The design system is built on CSS custom properties defined in `src/app/globals.css`. These properties are automatically available throughout the application.

```css
/* Using CSS custom properties directly */
.my-component {
  background-color: var(--color-primary-500);
  padding: var(--spacing-4);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Design System Utility Classes

Pre-built utility classes are available with the `ds-` prefix:

```tsx
// Typography
<h1 className="ds-text-display">Display Text</h1>
<h2 className="ds-text-h1">Heading 1</h2>
<p className="ds-text-body">Body text</p>

// Colors
<div className="ds-bg-primary ds-text-white">Primary background</div>
<span className="ds-text-success">Success text</span>

// Spacing
<div className="ds-p-4 ds-space-2">Padded container</div>

// Borders and shadows
<div className="ds-border ds-rounded-lg ds-shadow-md">Card component</div>
```

### TypeScript Design Tokens

Import and use design tokens in your TypeScript/JavaScript code:

```tsx
import { colors, spacing, typography } from '@/styles';

// Using tokens directly
const styles = {
  backgroundColor: colors.primary[500],
  padding: spacing[4],
  ...typography.h1,
};

// Using utility functions
import { getTypographyStyles, getCSSColor } from '@/styles';

const headingStyles = getTypographyStyles('h1');
const primaryColor = getCSSColor('primary', 500);
```

### Utility Functions

The design system provides several utility functions:

```tsx
import {
  cn,
  getTypographyClass,
  getColorClasses,
  getBorderRadiusClass,
  getShadowClass,
} from '@/styles';

// Combine classes
const className = cn(
  getTypographyClass('h2'),
  getColorClasses('text', 'primary'),
  getBorderRadiusClass('lg'),
  getShadowClass('md')
);
```

## Color System

### Primary Colors

- Blue gradient system from 50 (lightest) to 950 (darkest)
- Main brand color: `--color-primary-500` (#3b82f6)

### Neutral Colors

- Sophisticated slate/zinc palette
- Used for backgrounds, text, and borders

### Semantic Colors

- Success: Green palette
- Warning: Amber palette
- Error: Red palette
- Info: Blue palette (same as primary)

## Typography Scale

Based on a modular scale with Inter font:

- Display: 48px (3rem) - For hero sections
- H1: 36px (2.25rem) - Main headings
- H2: 30px (1.875rem) - Section headings
- H3: 24px (1.5rem) - Subsection headings
- H4: 20px (1.25rem) - Minor headings
- Body Large: 18px (1.125rem) - Large body text
- Body: 16px (1rem) - Default body text
- Body Small: 14px (0.875rem) - Small body text
- Caption: 12px (0.75rem) - Captions and labels

## Spacing System

8px base unit system:

- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 6: 24px
- 8: 32px
- 12: 48px
- 16: 64px
- 24: 96px

## Dark Mode Support

The design system automatically supports dark mode through CSS custom properties that change based on `prefers-color-scheme: dark`.

## Font Loading

Inter font is loaded with optimizations:

- `font-display: swap` for better performance
- Proper fallbacks to system fonts
- Preloading for critical text
- Multiple font weights (400, 500, 600, 700)

## Best Practices

1. **Use CSS custom properties** for consistent theming
2. **Prefer utility classes** for common patterns
3. **Use TypeScript tokens** when you need programmatic access
4. **Follow the spacing system** for consistent layouts
5. **Use semantic colors** (success, warning, error) for meaningful UI states
6. **Test in both light and dark modes**

## Migration from Existing Styles

When updating existing components:

1. Replace hardcoded colors with design system colors
2. Use typography classes instead of custom font styles
3. Replace spacing values with the 8px system
4. Use design system shadows and border radius values
5. Ensure dark mode compatibility
