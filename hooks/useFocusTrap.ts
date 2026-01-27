import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for trapping focus within a container element
 * Essential for modals, dialogs, and other overlay components
 *
 * @param isActive - Whether the focus trap should be active
 * @param options - Configuration options
 * @returns ref to attach to the container element
 */
interface UseFocusTrapOptions {
  /** Element to focus when trap activates (default: first focusable) */
  initialFocus?: 'first' | 'last' | 'none';
  /** Whether to return focus to trigger element on deactivation */
  returnFocus?: boolean;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
  /** Additional selector for focusable elements */
  additionalFocusableSelector?: string;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  options: UseFocusTrapOptions = {}
) {
  const {
    initialFocus = 'first',
    returnFocus = true,
    onEscape,
    additionalFocusableSelector,
  } = options;

  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const selector = additionalFocusableSelector
      ? `${FOCUSABLE_SELECTOR}, ${additionalFocusableSelector}`
      : FOCUSABLE_SELECTOR;

    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    );

    // Filter out elements that are not visible
    return elements.filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !el.hasAttribute('aria-hidden')
      );
    });
  }, [additionalFocusableSelector]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || !containerRef.current) return;

      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        // Shift + Tab on first element -> go to last
        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        // Tab on last element -> go to first
        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
          return;
        }

        // If focus is outside container, bring it back
        if (!containerRef.current.contains(activeElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [isActive, getFocusableElements, onEscape]
  );

  // Activate/deactivate focus trap
  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Set initial focus
      if (initialFocus !== 'none') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          const elementToFocus =
            initialFocus === 'last'
              ? focusableElements[focusableElements.length - 1]
              : focusableElements[0];

          // Use setTimeout to ensure the element is rendered
          setTimeout(() => {
            elementToFocus.focus();
          }, 0);
        }
      }

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);

        // Return focus to previous element
        if (returnFocus && previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isActive, initialFocus, returnFocus, getFocusableElements, handleKeyDown]);

  // Prevent clicks outside the container when active
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        // Optionally prevent the click or just refocus
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActive, getFocusableElements]);

  return containerRef;
}

export default useFocusTrap;
