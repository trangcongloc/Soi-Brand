'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import styles from './SectionTitle.module.css';

export interface SectionTitleProps extends HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Optional icon before title */
  icon?: ReactNode;
  /** Optional action element (button, link, etc.) */
  action?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Add border bottom */
  bordered?: boolean;
  /** Whether this is a subsection */
  isSubsection?: boolean;
}

export const SectionTitle = forwardRef<HTMLDivElement, SectionTitleProps>(
  (
    {
      title,
      subtitle,
      icon,
      action,
      size = 'md',
      bordered = false,
      isSubsection = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const containerClasses = [
      styles.container,
      styles[`size-${size}`],
      bordered && styles.bordered,
      isSubsection && styles.subsection,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const TitleTag = isSubsection ? 'h4' : size === 'lg' ? 'h2' : 'h3';

    return (
      <div ref={ref} className={containerClasses} {...props}>
        <div className={styles.main}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <div className={styles.text}>
            <TitleTag className={styles.title}>{title}</TitleTag>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
    );
  }
);

SectionTitle.displayName = 'SectionTitle';

export default SectionTitle;
