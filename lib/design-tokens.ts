/**
 * Centralized Design Tokens
 *
 * Use these tokens for consistent styling across the application.
 * CSS variables in globals.css mirror these values for CSS usage.
 */

export const colors = {
  primary: {
    main: '#1a1a1a',
    hover: '#000000',
    light: '#f7f7f7',
  },
  brand: {
    main: '#e53935',
    hover: '#c62828',
    light: '#ffcdd2',
  },
  secondary: {
    main: '#ff7043',
    hover: '#f4511e',
  },
  text: {
    main: '#1a1a1a',
    secondary: '#808080',
    tertiary: '#666666',
    muted: '#8e8e8e',
  },
  background: {
    main: '#f7f7f7',
    card: '#ffffff',
    sidebar: 'rgba(242, 242, 242, 0.3)',
    hover: '#f3f4f6',
  },
  status: {
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fef2f2',
    info: '#3b82f6',
    infoLight: '#dbeafe',
  },
  border: {
    main: '#ebebeb',
    light: '#e5e7eb',
    focus: '#1a1a1a',
  },
  accent: {
    link: '#2563eb',
    linkHover: '#1e40af',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
  },
} as const;

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
} as const;

/**
 * Font sizes with WCAG compliance notes
 * - Body text minimum: 16px (base)
 * - Labels/captions minimum: 12px (xs)
 */
export const fontSize = {
  xs: '12px', // Labels, captions (minimum for legibility)
  sm: '14px', // Secondary text
  base: '16px', // Body text (WCAG minimum)
  lg: '18px', // Emphasized text
  xl: '20px', // Subheadings
  '2xl': '24px', // Section headings
  '3xl': '28px', // Page headings
  '4xl': '32px', // Hero text
} as const;

/**
 * Compact font sizes for data-dense UIs
 * Use sparingly and only for non-essential information
 */
export const fontSizeCompact = {
  xs: '10px', // Metadata only
  sm: '11px', // Dense data
  base: '12px', // Compact body
  md: '13px', // Compact emphasized
  lg: '14px', // Compact headings
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '12px',
  full: '9999px',
} as const;

export const shadow = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.02)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.04)',
  md: '0 4px 8px rgba(0, 0, 0, 0.06)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.08)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.1)',
} as const;

/**
 * Touch/Click targets for accessibility
 * - Touch (mobile): minimum 44px
 * - Click (desktop): minimum 32px
 */
export const targets = {
  touchMin: '44px',
  clickMin: '32px',
} as const;

export const transition = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
  bounce: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
} as const;

// Type exports for TypeScript usage
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type FontSize = typeof fontSize;
export type BorderRadius = typeof borderRadius;
export type Shadow = typeof shadow;
export type Transition = typeof transition;
export type Breakpoints = typeof breakpoints;
