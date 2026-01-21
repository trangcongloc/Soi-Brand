/**
 * Animation Library for Soi'Brand
 *
 * Centralized animation constants and variants matching existing patterns from:
 * - SplashScreen.tsx: Complex sequencing with path animations
 * - LoadingState.tsx: Terminal-style UI with stagger effects
 * - AnalysisHistory.tsx: Directional transitions with slide variants
 * - AnalysisForm.tsx: Spring-based layouts
 */

// Primary easing curve used across 90% of the codebase
export const PRIMARY_EASING = [0.4, 0, 0.2, 1] as const;

// Animation timing constants (aligned with existing components)
export const sortAnimations = {
  // List reordering (matching LoadingState height animation 0.3s)
  layoutDuration: 0.3,
  layoutEasing: PRIMARY_EASING,

  // Item fade (matching LoadingState step transitions 0.2s)
  fadeDuration: 0.2,
  staggerDelay: 0.05, // 50ms between items

  // Chart transition (matching AnalysisHistory page transition 0.3s)
  chartDuration: 0.3,
  chartEasing: PRIMARY_EASING,

  // Button feedback (matching AnalysisForm button 0.15s)
  buttonDuration: 0.15,
  buttonScale: 0.95, // whileTap value

  // Heatmap interaction (within 0.95-1.15 scale range)
  heatmapHover: 1.15,
  heatmapTap: 0.95,
  heatmapSelected: 1.1,
  heatmapDuration: 0.2,

  // Cross-component pulse (emphasis animation)
  pulseDuration: 0.6,
  pulseScale: [1, 1.2, 1] as const,
} as const;

// Internal helper for reduced motion preference
const shouldReduceMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Layout transition for automatic position animations
 * Used with framer-motion's layout prop
 */
export const layoutTransition = {
  layout: {
    duration: sortAnimations.layoutDuration,
    ease: PRIMARY_EASING,
  },
  opacity: {
    duration: sortAnimations.fadeDuration,
  },
};

/**
 * Chart animation props for Recharts
 * Enable smooth transitions when data changes
 */
export const chartAnimationProps = {
  isAnimationActive: !shouldReduceMotion(),
  animationDuration: sortAnimations.chartDuration * 1000, // Convert to ms
  animationEasing: "ease-in-out" as const,
};
