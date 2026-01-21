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

// Spring transition (from AnalysisForm.tsx layoutTransition)
export const layoutSpring = {
  type: "spring" as const,
  stiffness: 500,
  damping: 40,
  mass: 1,
};

// List item animation variants (for posts accordion)
export const listItemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

// Chart transition variants
export const chartTransition = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

// Pulse animation for cross-component highlighting
export const pulseVariants = {
  rest: {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(var(--primary-rgb, 59, 130, 246), 0)",
  },
  pulse: {
    scale: sortAnimations.pulseScale,
    boxShadow: [
      "0 0 0 0 rgba(var(--primary-rgb, 59, 130, 246), 0.7)",
      "0 0 0 10px rgba(var(--primary-rgb, 59, 130, 246), 0)",
      "0 0 0 0 rgba(var(--primary-rgb, 59, 130, 246), 0)",
    ],
  },
};

// Button animation variants
export const buttonVariants = {
  tap: {
    scale: sortAnimations.buttonScale,
  },
  hover: {
    scale: 1.02,
  },
};

// Heatmap cell variants
export const heatmapCellVariants = {
  hover: {
    scale: sortAnimations.heatmapHover,
  },
  tap: {
    scale: sortAnimations.heatmapTap,
  },
  selected: {
    scale: sortAnimations.heatmapSelected,
    borderWidth: 2,
  },
  normal: {
    scale: 1,
    borderWidth: 0,
  },
};

/**
 * Check if user prefers reduced motion
 * Use this to respect accessibility preferences
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get transition config respecting user motion preferences
 * @param duration - Animation duration in seconds
 * @param ease - Easing function
 */
export const getTransition = (
  duration: number = sortAnimations.layoutDuration,
  ease: typeof PRIMARY_EASING | "easeInOut" | "easeOut" = PRIMARY_EASING
) => {
  if (shouldReduceMotion()) {
    return { duration: 0.01 }; // Instant
  }
  return { duration, ease };
};

/**
 * Calculate stagger delay for list items
 * @param index - Item index
 * @param baseDelay - Base delay in seconds
 */
export const getStaggerDelay = (
  index: number,
  baseDelay: number = sortAnimations.staggerDelay
): number => {
  return index * baseDelay;
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
