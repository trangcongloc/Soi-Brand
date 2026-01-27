'use client';

import { forwardRef, HTMLAttributes } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Whether to animate */
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      width,
      height,
      variant = 'text',
      animation = 'wave',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const skeletonClasses = [
      styles.skeleton,
      styles[`variant-${variant}`],
      animation !== 'none' && styles[`animation-${animation}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={skeletonClasses}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Preset components for common patterns
export interface SkeletonTextProps extends Omit<SkeletonProps, 'variant' | 'height'> {
  /** Number of lines */
  lines?: number;
  /** Gap between lines */
  gap?: string | number;
}

export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 1, gap = 8, width = '100%', ...props }, ref) => {
    if (lines === 1) {
      return <Skeleton ref={ref} variant="text" width={width} {...props} />;
    }

    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: typeof gap === 'number' ? `${gap}px` : gap,
        }}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={i === lines - 1 ? '70%' : width}
            {...props}
          />
        ))}
      </div>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';

export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Show image placeholder */
  showImage?: boolean;
  /** Image height */
  imageHeight?: number;
  /** Number of text lines */
  lines?: number;
}

export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ showImage = true, imageHeight = 120, lines = 3, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${styles.card} ${className}`}
        {...props}
      >
        {showImage && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={imageHeight}
          />
        )}
        <div className={styles.cardContent}>
          <Skeleton variant="text" width="60%" height={20} />
          <SkeletonText lines={lines} />
        </div>
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

export default Skeleton;
