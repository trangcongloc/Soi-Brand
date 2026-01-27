'use client';

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useState,
  useRef,
  useEffect,
  useId,
} from 'react';
import styles from './Collapsible.module.css';

export interface CollapsibleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Trigger/header content */
  title: ReactNode;
  /** Collapsible content */
  children: ReactNode;
  /** Initial expanded state */
  defaultExpanded?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Optional icon for the trigger */
  icon?: ReactNode;
  /** Whether to show the chevron indicator */
  showChevron?: boolean;
  /** Additional content to show in the trigger (e.g., badge) */
  triggerExtra?: ReactNode;
  /** Visual variant */
  variant?: 'default' | 'card' | 'ghost';
  /** Disable the collapsible */
  disabled?: boolean;
}

export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      title,
      children,
      defaultExpanded = false,
      expanded: controlledExpanded,
      onExpandedChange,
      icon,
      showChevron = true,
      triggerExtra,
      variant = 'default',
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
    const contentId = useId();
    const triggerId = useId();

    const isControlled = controlledExpanded !== undefined;
    const isExpanded = isControlled ? controlledExpanded : internalExpanded;

    useEffect(() => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    }, [children]);

    const handleToggle = () => {
      if (disabled) return;

      if (isControlled) {
        onExpandedChange?.(!controlledExpanded);
      } else {
        setInternalExpanded((prev) => {
          const newValue = !prev;
          onExpandedChange?.(newValue);
          return newValue;
        });
      }
    };

    const containerClasses = [
      styles.container,
      styles[`variant-${variant}`],
      isExpanded && styles.expanded,
      disabled && styles.disabled,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={containerClasses} {...props}>
        <button
          type="button"
          id={triggerId}
          className={styles.trigger}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          disabled={disabled}
        >
          <span className={styles.triggerMain}>
            {icon && <span className={styles.icon}>{icon}</span>}
            <span className={styles.title}>{title}</span>
          </span>
          <span className={styles.triggerRight}>
            {triggerExtra && <span className={styles.extra}>{triggerExtra}</span>}
            {showChevron && (
              <span className={styles.chevron} aria-hidden="true">
                <ChevronIcon />
              </span>
            )}
          </span>
        </button>
        <div
          id={contentId}
          ref={contentRef}
          className={styles.content}
          role="region"
          aria-labelledby={triggerId}
          aria-hidden={!isExpanded}
          style={{
            maxHeight: isExpanded ? contentHeight : 0,
          }}
        >
          <div className={styles.contentInner}>{children}</div>
        </div>
      </div>
    );
  }
);

Collapsible.displayName = 'Collapsible';

// Simple chevron icon
function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Collapsible;
