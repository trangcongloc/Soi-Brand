'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children: ReactNode;
  /** Visual variant */
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether the card is interactive (hoverable) */
  interactive?: boolean;
  /** Optional header content */
  header?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      interactive = false,
      header,
      footer,
      className = '',
      ...props
    },
    ref
  ) => {
    const cardClasses = [
      styles.card,
      styles[`variant-${variant}`],
      styles[`padding-${padding}`],
      interactive && styles.interactive,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={cardClasses} {...props}>
        {header && <div className={styles.header}>{header}</div>}
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
