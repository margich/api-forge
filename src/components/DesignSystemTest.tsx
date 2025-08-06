/**
 * Design System Test Component
 *
 * This component demonstrates the design system foundation implementation
 * and can be used to verify that all tokens and utilities are working correctly.
 */

import {
  cn,
  getBorderRadiusClass,
  getColorClasses,
  getShadowClass,
  getTypographyClass,
} from '@/styles';

export function DesignSystemTest() {
  return (
    <div className="ds-p-8 ds-space-4">
      <div
        className={cn(
          getTypographyClass('display'),
          getColorClasses('text', 'primary')
        )}
      >
        Design System Foundation
      </div>

      <div className={cn(getTypographyClass('h2'), 'ds-text-muted-foreground')}>
        Typography Scale
      </div>

      <div className="ds-space-6">
        <div className={getTypographyClass('display')}>Display Text (48px)</div>
        <div className={getTypographyClass('h1')}>Heading 1 (36px)</div>
        <div className={getTypographyClass('h2')}>Heading 2 (30px)</div>
        <div className={getTypographyClass('h3')}>Heading 3 (24px)</div>
        <div className={getTypographyClass('h4')}>Heading 4 (20px)</div>
        <div className={getTypographyClass('bodyLg')}>Body Large (18px)</div>
        <div className={getTypographyClass('body')}>Body Text (16px)</div>
        <div className={getTypographyClass('bodySm')}>Body Small (14px)</div>
        <div className={getTypographyClass('caption')}>Caption Text (12px)</div>
      </div>

      <div className={cn(getTypographyClass('h2'), 'ds-text-muted-foreground')}>
        Color System
      </div>

      <div className="ds-space-6">
        <div className="flex gap-4">
          <div
            className={cn(
              'ds-p-4',
              getBorderRadiusClass('lg'),
              getColorClasses('bg', 'primary'),
              'text-white'
            )}
          >
            Primary
          </div>
          <div
            className={cn(
              'ds-p-4',
              getBorderRadiusClass('lg'),
              getColorClasses('bg', 'success'),
              'text-white'
            )}
          >
            Success
          </div>
          <div
            className={cn(
              'ds-p-4',
              getBorderRadiusClass('lg'),
              getColorClasses('bg', 'warning'),
              'text-white'
            )}
          >
            Warning
          </div>
          <div
            className={cn(
              'ds-p-4',
              getBorderRadiusClass('lg'),
              getColorClasses('bg', 'error'),
              'text-white'
            )}
          >
            Error
          </div>
        </div>
      </div>

      <div className={cn(getTypographyClass('h2'), 'ds-text-muted-foreground')}>
        Spacing & Layout
      </div>

      <div className="ds-space-6">
        <div className="ds-p-1 ds-bg-primary-light">Padding 1 (4px)</div>
        <div className="ds-p-2 ds-bg-primary-light">Padding 2 (8px)</div>
        <div className="ds-p-4 ds-bg-primary-light">Padding 4 (16px)</div>
        <div className="ds-p-8 ds-bg-primary-light">Padding 8 (32px)</div>
      </div>

      <div className={cn(getTypographyClass('h2'), 'ds-text-muted-foreground')}>
        Shadows & Borders
      </div>

      <div className="ds-space-6 flex gap-4">
        <div
          className={cn(
            'ds-p-4',
            getBorderRadiusClass('md'),
            getShadowClass('sm'),
            'ds-bg-card'
          )}
        >
          Small Shadow
        </div>
        <div
          className={cn(
            'ds-p-4',
            getBorderRadiusClass('lg'),
            getShadowClass('md'),
            'ds-bg-card'
          )}
        >
          Medium Shadow
        </div>
        <div
          className={cn(
            'ds-p-4',
            getBorderRadiusClass('xl'),
            getShadowClass('lg'),
            'ds-bg-card'
          )}
        >
          Large Shadow
        </div>
      </div>

      <div className={cn(getTypographyClass('h2'), 'ds-text-muted-foreground')}>
        Inter Font Test
      </div>

      <div className="ds-space-4">
        <div style={{ fontFamily: 'var(--font-inter)' }}>
          This text uses the Inter font with proper fallbacks and font-display
          optimization. The quick brown fox jumps over the lazy dog. 1234567890
        </div>
      </div>
    </div>
  );
}
