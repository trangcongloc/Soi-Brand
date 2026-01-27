'use client';

import { forwardRef, HTMLAttributes } from 'react';
import styles from './ProgressBar.module.css';

export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error' | 'brand';

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Current value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Visual variant */
  variant?: ProgressBarVariant;
  /** Size of the bar */
  size?: 'sm' | 'md' | 'lg';
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Whether to animate the fill */
  animated?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      variant = 'default',
      size = 'md',
      showLabel = false,
      label,
      animated = false,
      ariaLabel,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const containerClasses = [
      styles.container,
      styles[`size-${size}`],
      showLabel && styles.withLabel,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const barClasses = [
      styles.bar,
      styles[`variant-${variant}`],
    ]
      .filter(Boolean)
      .join(' ');

    const fillClasses = [
      styles.fill,
      animated && styles.animated,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={containerClasses} {...props}>
        <div
          className={barClasses}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={ariaLabel}
        >
          <div
            className={fillClasses}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className={styles.label}>
            {label || `${Math.round(percentage)}%`}
          </span>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

// Preset for score display
export interface ScoreBarProps extends Omit<ProgressBarProps, 'variant' | 'value' | 'max'> {
  score: number;
  maxScore?: number;
}

export const ScoreBar = forwardRef<HTMLDivElement, ScoreBarProps>(
  ({ score, maxScore = 100, ...props }, ref) => {
    const percentage = (score / maxScore) * 100;

    let variant: ProgressBarVariant = 'error';
    if (percentage >= 80) variant = 'success';
    else if (percentage >= 60) variant = 'warning';

    return (
      <ProgressBar
        ref={ref}
        value={score}
        max={maxScore}
        variant={variant}
        showLabel
        label={`${score}/${maxScore}`}
        {...props}
      />
    );
  }
);

ScoreBar.displayName = 'ScoreBar';

export default ProgressBar;
