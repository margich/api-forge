/**
 * Design System Utilities
 *
 * Utility functions for working with the design system tokens and CSS custom properties.
 */

import type {
  BorderRadius,
  ColorScale,
  Shadow,
  Spacing,
  TypographyPreset,
} from './design-tokens';
import { colors, typography } from './design-tokens';

/**
 * Get a CSS custom property value for colors
 */
export function getCSSColor(
  color: keyof typeof colors,
  shade: keyof ColorScale
): string {
  return `var(--color-${color}-${shade})`;
}

/**
 * Get a CSS custom property value for spacing
 */
export function getCSSSpacing(size: Spacing): string {
  return `var(--spacing-${size})`;
}

/**
 * Get a CSS custom property value for border radius
 */
export function getCSSBorderRadius(size: BorderRadius): string {
  return `var(--border-radius-${size})`;
}

/**
 * Get a CSS custom property value for shadows
 */
export function getCSSShadow(size: Shadow): string {
  return `var(--shadow-${size})`;
}

/**
 * Generate CSS styles for typography presets
 */
export function getTypographyStyles(
  preset: TypographyPreset
): React.CSSProperties {
  const styles = typography[preset];
  return {
    fontSize: styles.fontSize,
    lineHeight: styles.lineHeight,
    fontWeight: styles.fontWeight,
  };
}

/**
 * Combine multiple CSS custom property classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate responsive spacing classes
 */
export function getSpacingClasses(
  property:
    | 'p'
    | 'm'
    | 'px'
    | 'py'
    | 'pt'
    | 'pb'
    | 'pl'
    | 'pr'
    | 'mx'
    | 'my'
    | 'mt'
    | 'mb'
    | 'ml'
    | 'mr',
  size: Spacing
): string {
  return `ds-${property}-${size}`;
}

/**
 * Generate color utility classes
 */
export function getColorClasses(
  type: 'bg' | 'text' | 'border',
  color: 'primary' | 'success' | 'warning' | 'error' | 'info',
  variant?: 'light' | 'dark'
): string {
  const suffix = variant ? `-${variant}` : '';
  return `ds-${type}-${color}${suffix}`;
}

/**
 * Generate border radius utility classes
 */
export function getBorderRadiusClass(size: BorderRadius): string {
  return `ds-rounded-${size}`;
}

/**
 * Generate shadow utility classes
 */
export function getShadowClass(size: Shadow): string {
  return `ds-shadow-${size}`;
}

/**
 * Generate typography utility classes
 */
export function getTypographyClass(preset: TypographyPreset): string {
  const classMap: Record<TypographyPreset, string> = {
    display: 'ds-text-display',
    h1: 'ds-text-h1',
    h2: 'ds-text-h2',
    h3: 'ds-text-h3',
    h4: 'ds-text-h4',
    bodyLg: 'ds-text-body-lg',
    body: 'ds-text-body',
    bodySm: 'ds-text-body-sm',
    caption: 'ds-text-caption',
  };

  return classMap[preset];
}

/**
 * Check if the current theme is dark mode
 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get the appropriate color for the current theme
 */
export function getThemeColor(lightColor: string, darkColor: string): string {
  return isDarkMode() ? darkColor : lightColor;
}
