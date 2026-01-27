# Plan: Comprehensive UI/UX Enhancement for Soi-Brand

## Executive Summary

After conducting a thorough UI/UX review using the `ui-ux` skill, I've identified **47 specific enhancements** across 6 priority categories. The current implementation is solid with good accessibility foundations, but there are significant opportunities to modernize the design system, improve mobile UX, enhance accessibility to WCAG 2.1 AAA standards, and optimize performance.

**Current State**: Well-structured React/Next.js application with:
- ✅ Good accessibility foundations (ARIA, semantic HTML, keyboard nav)
- ✅ Responsive design with breakpoints
- ✅ Consistent CSS module pattern
- ✅ Framer Motion animations
- ⚠️ Ultracompact typography (10-24px range - below recommended 16px minimum)
- ⚠️ Inconsistent design tokens vs UI/UX skill standards
- ⚠️ Limited mobile touch optimization (32px targets, not 44px)
- ⚠️ Missing accessibility features (focus trap, ARIA descriptions, reduced motion)

**Target State**: Professional, accessible, performant UI that:
- Meets WCAG 2.1 AAA standards where critical
- Follows modern design system best practices
- Provides exceptional mobile UX
- Maintains visual consistency across all components
- Enhances micro-interactions and feedback

---

## Priority Categories & Impact

| Category | Issues Found | Estimated Impact | Time Investment |
|----------|--------------|------------------|-----------------|
| **P0: Critical Accessibility** | 12 issues | High (legal/compliance) | 2-3 days |
| **P1: Design System Alignment** | 8 issues | High (consistency) | 3-4 days |
| **P2: Mobile UX Optimization** | 9 issues | Medium (user growth) | 2-3 days |
| **P3: Micro-interactions & Feedback** | 7 issues | Medium (polish) | 1-2 days |
| **P4: Performance & Loading** | 6 issues | Low-Medium | 1-2 days |
| **P5: Advanced Enhancements** | 5 issues | Low (nice-to-have) | 2-3 days |

**Total**: 47 enhancements, 11-17 days implementation time

---

## P0: Critical Accessibility Issues (MUST FIX)

### Issue 1: Typography Below Minimum Readable Size

**Severity**: Critical
**Type**: Accessibility
**WCAG**: 1.4.4 Resize Text (AA)

**Current State**:
```css
/* app/globals.css */
--fs-xs: 10px;    /* Too small */
--fs-sm: 11px;    /* Too small */
--fs-base: 12px;  /* Below 16px minimum */
--fs-md: 13px;    /* Below 16px minimum */
--fs-lg: 14px;    /* Below 16px minimum */
```

Used extensively across components:
- `LoadingState`: 10-11px for labels
- `ReportDisplay`: 12px body text
- `VeoForm`: 12-13px form labels

**Impact**: Users with visual impairments or older users struggle to read content.

**Recommended Fix**:
```css
/* app/globals.css */
--fs-xs: 12px;    /* Minimum for supporting text */
--fs-sm: 14px;    /* Small labels */
--fs-base: 16px;  /* Body text (MINIMUM) */
--fs-md: 18px;    /* Comfortable reading */
--fs-lg: 20px;    /* Headings */
--fs-xl: 24px;    /* Section headings */
--fs-2xl: 32px;   /* Page headings */
--fs-3xl: 40px;   /* Hero text */
```

**Files to Update**:
- `app/globals.css` - Update CSS variables
- `components/loading/LoadingState.module.css` - Update font sizes
- `components/ReportDisplay.module.css` - Increase body text
- `components/veo/VeoForm.module.css` - Increase form labels
- `components/report/**/*.module.css` - Update all report sections

---

### Issue 2: Insufficient Touch Target Sizes

**Severity**: Critical
**Type**: Accessibility
**WCAG**: 2.5.5 Target Size (AAA)

**Current State**:
```css
/* components/AnalysisForm.module.css */
.arrow-button {
  width: 32px;
  height: 32px;  /* Below 44px minimum */
}
```

Other small targets:
- Settings button: 40x40px (close, but 44px preferred)
- Close buttons on modals: ~32px
- Tab navigation buttons: Variable
- Icon-only buttons throughout

**Impact**: Mobile users struggle to tap accurately, leading to frustration.

**Recommended Fix**:
```css
/* Minimum touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  /* Add padding if content is smaller */
  padding: 12px;
}

/* For visually smaller buttons, use transparent padding */
.icon-button {
  width: 24px;  /* Visual size */
  height: 24px;
  padding: 10px; /* Extends touch area to 44px */
  margin: -10px; /* Negative margin to preserve layout */
}
```

**Files to Update**:
- `components/AnalysisForm.module.css` - Increase arrow button
- `components/settings/SettingsButton.module.css` - Ensure 44px
- `components/ReportDisplay.module.css` - Tab buttons and controls
- `components/veo/VeoForm.module.css` - Form buttons and icons
- All components with icon-only buttons

---

### Issue 3: Missing Focus Trap in Modals

**Severity**: High
**Type**: Accessibility
**WCAG**: 2.1.2 No Keyboard Trap (A)

**Current State**:
```typescript
// components/settings/SettingsButton.tsx
// No focus trap - users can tab outside modal to background content
```

**Impact**: Keyboard users get confused when focus moves behind modal overlay.

**Recommended Fix**:
```typescript
import { useEffect, useRef } from 'react';

function useModalFocusTrap(isOpen: boolean) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Get all focusable elements
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstElement?.focus();

    // Trap focus
    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  return modalRef;
}

// Usage in SettingsButton:
const modalRef = useModalFocusTrap(isOpen);
```

**Files to Update**:
- Create `lib/hooks/useModalFocusTrap.ts` - Reusable hook
- `components/settings/SettingsButton.tsx` - Apply focus trap
- Any future modals/drawers

---

### Issue 4: Missing Reduced Motion Support

**Severity**: High
**Type**: Accessibility
**WCAG**: 2.3.3 Animation from Interactions (AAA)

**Current State**:
```typescript
// All Framer Motion animations ignore prefers-reduced-motion
const variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
```

**Impact**: Users with vestibular disorders or motion sensitivity experience discomfort.

**Recommended Fix**:
```typescript
// lib/motion.ts
import { useReducedMotion } from 'framer-motion';

export function useAccessibleVariants() {
  const shouldReduceMotion = useReducedMotion();

  return {
    fadeIn: shouldReduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },

    slideIn: shouldReduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
      : { initial: { x: -20, opacity: 0 }, animate: { x: 0, opacity: 1 } },

    stagger: shouldReduceMotion ? 0 : 0.1,
  };
}
```

```css
/* app/globals.css - CSS animations */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Files to Update**:
- Create `lib/motion.ts` - Accessible animation variants
- `app/globals.css` - Add reduced motion media query
- `app/page.tsx` - Use accessible variants
- `app/veo/page.tsx` - Use accessible variants
- All components using Framer Motion

---

### Issue 5: Insufficient Color Contrast

**Severity**: High
**Type**: Accessibility
**WCAG**: 1.4.3 Contrast Minimum (AA), 1.4.6 Contrast Enhanced (AAA)

**Current State**:
```css
/* app/globals.css */
--text-secondary: #808080;  /* 3.95:1 on white - FAILS AA (4.5:1) */
--text-muted: #8e8e8e;      /* 4.15:1 on white - FAILS AA */
--border: #ebebeb;          /* Too light for non-text */
```

Used in:
- Form labels (secondary text)
- Help text and hints
- Disabled states
- Borders throughout

**Impact**: Low-vision users cannot read secondary text.

**Recommended Fix**:
```css
/* app/globals.css - Updated for WCAG AA minimum */
--text-main: #1a1a1a;       /* 16.1:1 - AAA ✓ */
--text-secondary: #4a4a4a;  /* 9.7:1 - AAA ✓ */
--text-muted: #666666;      /* 5.74:1 - AA ✓ */
--text-disabled: #999999;   /* 2.85:1 - Use only for disabled (exception) */

/* Borders - non-text, 3:1 minimum */
--border: #cccccc;          /* 1.6:1 - Acceptable for non-text */
--border-strong: #999999;   /* 2.85:1 - Stronger borders */
```

**Verification Tool**: Use WebAIM Contrast Checker or browser DevTools

**Files to Update**:
- `app/globals.css` - Update color variables
- Test all pages with contrast checker

---

### Issue 6: Missing ARIA Descriptions on Form Fields

**Severity**: Medium
**Type**: Accessibility
**WCAG**: 3.3.2 Labels or Instructions (A)

**Current State**:
```typescript
// components/AnalysisForm.tsx
<input
  type="text"
  placeholder={lang.enterChannelUrl}
  aria-label={lang.enterChannelUrl}
  // Missing: aria-describedby for hint text
/>
```

**Impact**: Screen reader users don't hear helpful hints/validation messages.

**Recommended Fix**:
```typescript
<div className={styles.inputWrapper}>
  <input
    type="text"
    id="channel-url"
    placeholder={lang.enterChannelUrl}
    aria-label={lang.enterChannelUrl}
    aria-describedby="channel-url-hint channel-url-error"
    aria-invalid={hasError}
  />
  <span id="channel-url-hint" className="sr-only">
    {lang.urlFormatHint}
  </span>
  {error && (
    <span id="channel-url-error" role="alert" className={styles.error}>
      {error}
    </span>
  )}
</div>
```

**Files to Update**:
- `components/AnalysisForm.tsx` - Add aria-describedby
- `components/veo/VeoForm.tsx` - All form fields
- `components/settings/SettingsButton.tsx` - API key inputs
- Update language files with hint text

---

### Issue 7: No Skip Navigation to Main Sections

**Severity**: Medium
**Type**: Accessibility
**WCAG**: 2.4.1 Bypass Blocks (A)

**Current State**:
```typescript
// app/layout.tsx
<a href="#main" className="skip-link">
  Skip to main content
</a>
// Only skips to main, not to report sections or VEO tabs
```

**Impact**: Keyboard users must tab through entire navigation to reach content sections.

**Recommended Fix**:
```typescript
// Add multiple skip links for complex pages
<nav className="skip-links" aria-label="Skip links">
  <a href="#main">Skip to main content</a>
  <a href="#report-tabs">Skip to report tabs</a>
  <a href="#report-content">Skip to report details</a>
  <a href="#settings">Skip to settings</a>
</nav>
```

```css
/* app/globals.css */
.skip-links {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10000;
}

.skip-links a {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px;
  background: var(--primary);
  color: white;
  text-decoration: none;
  transition: top 0.2s;
}

.skip-links a:focus {
  top: 0;
}
```

**Files to Update**:
- `app/layout.tsx` - Add skip links navigation
- `app/page.tsx` - Add section IDs
- `components/ReportDisplay.tsx` - Add IDs to tabs and sections
- `app/veo/page.tsx` - Add IDs to VEO sections

---

### Issue 8: Loading States Missing Progress Semantics

**Severity**: Medium
**Type**: Accessibility
**WCAG**: 4.1.3 Status Messages (AA)

**Current State**:
```typescript
// components/loading/LoadingState.tsx
<div aria-live="polite" aria-busy="true">
  {/* Missing: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax */}
  <div className={styles.spinner} />
</div>
```

**Impact**: Screen readers announce updates but don't convey progress percentage.

**Recommended Fix**:
```typescript
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Loading: ${currentStep} of ${totalSteps}`}
  aria-live="polite"
  aria-busy="true"
>
  <div className={styles.progressBar} style={{ width: `${progress}%` }} />
  <span className="sr-only">{progress}% complete</span>
</div>
```

**Files to Update**:
- `components/loading/LoadingState.tsx` - Add progressbar role
- `components/veo/VeoLoadingState.tsx` - Add progress semantics

---

### Issue 9: Error Messages Not Associated with Fields

**Severity**: Medium
**Type**: Accessibility
**WCAG**: 3.3.1 Error Identification (A)

**Current State**:
```typescript
// components/settings/SettingsButton.tsx
{error && <div className={styles.error}>{error}</div>}
// Error not associated with specific input field
```

**Impact**: Screen reader users hear error but don't know which field is invalid.

**Recommended Fix**:
```typescript
<input
  id="gemini-api-key"
  type="password"
  aria-invalid={!!error}
  aria-describedby="gemini-api-key-error"
/>
{error && (
  <div
    id="gemini-api-key-error"
    role="alert"
    className={styles.error}
  >
    {error}
  </div>
)}
```

**Files to Update**:
- `components/settings/SettingsButton.tsx` - Associate errors with inputs
- `components/veo/VeoForm.tsx` - Form validation errors
- `components/AnalysisForm.tsx` - URL validation errors

---

### Issue 10: Missing Live Region Announcements for Dynamic Content

**Severity**: Medium
**Type**: Accessibility
**WCAG**: 4.1.3 Status Messages (AA)

**Current State**:
```typescript
// components/veo/VeoLoadingState.tsx
// Characters appear dynamically but no announcement
{characterRegistry && Object.entries(characterRegistry).map(...)}
```

**Impact**: Screen reader users miss important dynamic updates (characters found, scenes generated).

**Recommended Fix**:
```typescript
// Add announcement region
const [announcement, setAnnouncement] = useState('');

useEffect(() => {
  if (newCharacter) {
    setAnnouncement(`New character found: ${newCharacter.name}`);
    setTimeout(() => setAnnouncement(''), 1000);
  }
}, [newCharacter]);

return (
  <>
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
    {/* Rest of component */}
  </>
);
```

**Files to Update**:
- `components/veo/VeoLoadingState.tsx` - Announce character discoveries
- `components/loading/LoadingState.tsx` - Announce step completions

---

### Issue 11: No Keyboard Shortcut for Common Actions

**Severity**: Low
**Type**: Accessibility
**WCAG**: 2.1.1 Keyboard (A)

**Current State**:
- No keyboard shortcuts documented
- No hotkeys for common actions (retry, cancel, settings)

**Impact**: Power users and keyboard-only users lack efficiency.

**Recommended Fix**:
```typescript
// lib/hooks/useKeyboardShortcut.ts
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const matchesModifiers =
        (options.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey) &&
        (options.shift ? e.shiftKey : !e.shiftKey) &&
        (options.alt ? e.altKey : !e.altKey);

      if (e.key.toLowerCase() === key.toLowerCase() && matchesModifiers) {
        e.preventDefault();
        callback();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options]);
}

// Usage:
useKeyboardShortcut('r', handleRetry, { ctrl: true }); // Ctrl+R to retry
useKeyboardShortcut('s', openSettings, { ctrl: true }); // Ctrl+S for settings
useKeyboardShortcut('/', focusSearch); // / to focus search
```

**Add Keyboard Shortcuts Help Modal**:
- Show with `?` key
- List all available shortcuts
- Accessible with screen readers

**Files to Update**:
- Create `lib/hooks/useKeyboardShortcut.ts`
- Create `components/KeyboardShortcutsHelp.tsx` - Modal listing shortcuts
- `app/page.tsx` - Add shortcuts for main actions
- `components/ReportDisplay.tsx` - Navigate tabs with number keys
- `app/veo/page.tsx` - VEO-specific shortcuts

---

### Issue 12: Missing Language Attribute on Dynamic Content

**Severity**: Low
**Type**: Accessibility
**WCAG**: 3.1.1 Language of Page (A), 3.1.2 Language of Parts (AA)

**Current State**:
```html
<!-- app/layout.tsx -->
<html lang="en">
  <!-- Content may be in Vietnamese but lang attribute doesn't change -->
</html>
```

**Impact**: Screen readers use wrong pronunciation for Vietnamese content.

**Recommended Fix**:
```typescript
// app/layout.tsx
const { language } = useLanguage();

return (
  <html lang={language === 'vi' ? 'vi' : 'en'}>
    {/* ... */}
  </html>
);
```

For mixed-language content:
```typescript
<div lang="vi">
  {vietnameseContent}
</div>
<div lang="en">
  {englishContent}
</div>
```

**Files to Update**:
- `app/layout.tsx` - Dynamic lang attribute
- Components with mixed-language content

---

## P1: Design System Alignment

### Issue 13: Inconsistent Color Palette with UI/UX Standards

**Severity**: Medium
**Type**: Visual Consistency

**Current State**:
```css
/* app/globals.css - Current */
--primary: #1a1a1a;  /* Black */
--brand: #e53935;    /* Red (barely used) */
```

**UI/UX Skill Recommendation**:
```css
--primary: #e53935;       /* Red as primary */
--primary-hover: #c62828; /* Darker red */
--secondary: #ff7043;     /* Orange */
```

**Mismatch**: App uses black as primary, skill recommends red (brand color).

**Recommended Fix**:
Conduct brand audit and decide:
- **Option A**: Keep black as primary (minimalist aesthetic)
- **Option B**: Adopt red as primary (more vibrant, aligns with brand name "Soi")

If choosing Option B:
```css
/* app/globals.css - Updated */
--primary: #e53935;
--primary-hover: #c62828;
--primary-active: #b71c1c;
--secondary: #ff7043;
--secondary-hover: #ff5722;

/* Update all button styles */
.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}
```

**Files to Update**:
- `app/globals.css` - Update color variables
- All components using --primary
- Test visual consistency across entire app

---

### Issue 14: Shadow System Not Following Elevation Hierarchy

**Severity**: Low
**Type**: Visual Consistency

**Current State**:
```css
/* app/globals.css */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.02);  /* Too subtle */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.04);  /* Too subtle */
--shadow-md: 0 4px 8px rgba(0,0,0,0.06);  /* Too subtle */
--shadow-lg: 0 8px 16px rgba(0,0,0,0.08); /* Too subtle */
```

**UI/UX Skill Recommendation**:
```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
```

**Impact**: Cards and elevated elements don't have clear visual hierarchy.

**Recommended Fix**:
Update shadow system to match UI/UX standards for better depth perception.

**Files to Update**:
- `app/globals.css` - Update shadow variables
- Verify visual hierarchy in all components

---

### Issue 15: Missing Design Token Documentation

**Severity**: Low
**Type**: Developer Experience

**Current State**:
- CSS variables defined in `globals.css`
- No documentation or comments explaining usage
- No Storybook or design system documentation

**Recommended Fix**:
Create `docs/DESIGN_SYSTEM.md`:

```markdown
# Soi-Brand Design System

## Color Palette

### Primary Colors
- `--primary: #1a1a1a` - Main action color (buttons, links)
- `--brand: #e53935` - Brand identity color (logo, accents)

### Text Colors
- `--text-main: #1a1a1a` - Body text (16.1:1 contrast)
- `--text-secondary: #4a4a4a` - Secondary text (9.7:1 contrast)
- `--text-muted: #666666` - Muted text (5.74:1 contrast)

## Typography Scale

Font sizes follow a modular scale:
- `--fs-base: 16px` - Body text (WCAG minimum)
- `--fs-lg: 20px` - Comfortable reading
- `--fs-xl: 24px` - Section headings

## Usage Examples

```tsx
// Correct
<p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-main)' }}>
  Body text
</p>

// Incorrect
<p style={{ fontSize: '12px', color: '#888' }}>
  Text too small and low contrast
</p>
```
```

**Files to Create**:
- `docs/DESIGN_SYSTEM.md` - Comprehensive design token documentation
- Optional: Set up Storybook for component library

---

### Issue 16: Inconsistent Spacing System

**Severity**: Low
**Type**: Visual Consistency

**Current State**:
- Arbitrary padding/margin values throughout components
- No consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px)

**Example Issues**:
```css
/* Various inconsistent spacing */
padding: 15px;  /* Why 15? */
margin: 18px;   /* Why 18? */
gap: 14px;      /* Why 14? */
```

**Recommended Fix**:
```css
/* app/globals.css - Add spacing scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 24px;
--space-2xl: 32px;
--space-3xl: 48px;
--space-4xl: 64px;

/* Usage */
padding: var(--space-lg);  /* 16px */
margin: var(--space-xl);   /* 24px */
gap: var(--space-md);      /* 12px */
```

**Files to Update**:
- `app/globals.css` - Add spacing variables
- All CSS modules - Replace arbitrary values with spacing tokens
- Document spacing system in `docs/DESIGN_SYSTEM.md`

---

### Issue 17: Border Radius Not Following Scale

**Severity**: Low
**Type**: Visual Consistency

**Current State**:
```css
/* app/globals.css */
--radius-sm: 4px;
--radius-md: 6px;   /* Not following consistent scale */
--radius-lg: 8px;
--radius-xl: 10px;  /* Too small for XL */
```

**UI/UX Skill Recommendation**:
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;  /* Pills and circles */
```

**Recommended Fix**:
Update to match UI/UX standards.

**Files to Update**:
- `app/globals.css` - Update radius values
- Test visual consistency across all components

---

### Issue 18: No Dark Mode Support

**Severity**: Low (Future Enhancement)
**Type**: Visual
**WCAG**: 1.4.8 Visual Presentation (AAA)

**Current State**:
- Light mode only
- No `prefers-color-scheme` support

**Recommended Fix** (Future):
```css
/* app/globals.css */
:root {
  --bg-main: #ffffff;
  --text-main: #1a1a1a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-main: #1a1a1a;
    --text-main: #f0f0f0;
    /* Update all color tokens */
  }
}
```

**Files to Update** (Future):
- `app/globals.css` - Add dark mode variables
- All components - Test in dark mode
- Add dark mode toggle in settings

---

### Issue 19: Inconsistent Button Styles Across Components

**Severity**: Medium
**Type**: Visual Consistency

**Current State**:
- Different button styles in different components
- No shared button component
- Inconsistent hover/active states

**Examples**:
```css
/* AnalysisForm - 32px black button */
.arrow-button { background: black; }

/* Settings - Varies by button type */
.saveButton { background: #e53935; }

/* VeoForm - Different again */
.submitButton { background: #1a1a1a; }
```

**Recommended Fix**:
Create shared button component:

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  // ... other props
}

export function Button({ variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        styles[size]
      )}
      {...props}
    />
  );
}
```

```css
/* components/ui/Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 150ms ease-in-out;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: none;
}

.button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Variants */
.primary {
  background: var(--primary);
  color: white;
}

.primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.primary:active {
  transform: translateY(0);
}

.secondary { /* ... */ }
.outline { /* ... */ }
.ghost { /* ... */ }

/* Sizes */
.sm {
  padding: 8px 12px;
  font-size: var(--fs-sm);
  min-height: 32px;
}

.md {
  padding: 12px 20px;
  font-size: var(--fs-base);
  min-height: 44px; /* Touch-friendly */
}

.lg {
  padding: 16px 24px;
  font-size: var(--fs-lg);
  min-height: 52px;
}
```

**Files to Create**:
- `components/ui/Button.tsx` - Shared button component
- `components/ui/Button.module.css` - Button styles

**Files to Update**:
- Replace all custom buttons with shared Button component
- `components/AnalysisForm.tsx`
- `components/settings/SettingsButton.tsx`
- `components/veo/VeoForm.tsx`
- All report components

---

### Issue 20: No Loading Skeleton for Content Areas

**Severity**: Medium
**Type**: UX

**Current State**:
- LoadingState component shows progress UI
- When data loads, content pops in abruptly
- No skeleton loading for report sections

**Recommended Fix**:
```typescript
// components/ui/Skeleton.tsx
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(styles.skeleton, className)}
      {...props}
    />
  );
}

export function ReportSkeleton() {
  return (
    <div className={styles.reportSkeleton}>
      <Skeleton className={styles.header} />
      <div className={styles.grid}>
        <Skeleton className={styles.card} />
        <Skeleton className={styles.card} />
        <Skeleton className={styles.card} />
      </div>
    </div>
  );
}
```

```css
/* components/ui/Skeleton.module.css */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    var(--bg-hover) 50%,
    var(--bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Files to Create**:
- `components/ui/Skeleton.tsx` - Skeleton component
- `components/ui/Skeleton.module.css` - Skeleton styles

**Files to Update**:
- `components/ReportDisplay.tsx` - Show skeleton before data loads
- `app/veo/page.tsx` - Skeleton for VEO results

---

## P2: Mobile UX Optimization

### Issue 21: Viewport Meta Tag Missing Optimization

**Severity**: Medium
**Type**: Mobile UX

**Current State**:
```html
<!-- app/layout.tsx -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
<!-- Missing: maximum-scale, user-scalable -->
```

**Recommended Fix**:
```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
/>
```

**Note**: Don't use `user-scalable=no` - violates WCAG 1.4.4 Resize Text.

**Files to Update**:
- `app/layout.tsx` - Update viewport meta tag

---

### Issue 22: Sidebar Navigation Not Optimized for Mobile

**Severity**: Medium
**Type**: Mobile UX

**Current State**:
```css
/* components/ReportDisplay.module.css */
.sidebar {
  position: sticky;
  top: 2rem;
  /* On mobile (<768px), sidebar stacks above content */
  /* Not ideal for quick access */
}
```

**Impact**: Mobile users must scroll up to navigate between sections.

**Recommended Fix**:
```css
/* Mobile: Convert to bottom sheet / floating action button */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
    z-index: 100;
    transform: translateY(calc(100% - 60px)); /* Peek */
    transition: transform 0.3s ease;
  }

  .sidebar.expanded {
    transform: translateY(0);
  }

  .sidebarHandle {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    cursor: pointer;
    border-bottom: 1px solid var(--border);
  }
}
```

**Files to Update**:
- `components/ReportDisplay.tsx` - Add mobile bottom sheet behavior
- `components/ReportDisplay.module.css` - Mobile styles

---

### Issue 23: Form Inputs Too Small on Mobile

**Severity**: Medium
**Type**: Mobile UX

**Current State**:
```css
/* components/AnalysisForm.module.css */
.input {
  height: 40px;
  font-size: 14px;  /* Mobile browsers zoom in if <16px */
}
```

**Impact**: iOS Safari auto-zooms when focusing inputs <16px, disrupting UX.

**Recommended Fix**:
```css
.input {
  height: 48px;  /* Larger touch target */
  font-size: 16px;  /* Prevents auto-zoom */
  padding: 12px 16px;
}

/* Desktop: Can use smaller font if desired */
@media (min-width: 768px) {
  .input {
    font-size: 14px;
    height: 44px;
  }
}
```

**Files to Update**:
- `components/AnalysisForm.module.css`
- `components/veo/VeoForm.module.css`
- `components/settings/SettingsButton.module.css`

---

### Issue 24: Missing Pull-to-Refresh Pattern

**Severity**: Low
**Type**: Mobile UX

**Current State**:
- No pull-to-refresh on mobile
- Users must manually click retry/refresh

**Recommended Fix**:
```typescript
// lib/hooks/usePullToRefresh.ts
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (!('ontouchstart' in window)) return; // Desktop only

    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (window.scrollY !== 0) return;

      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY.current;

      if (pullDistance > 80) {
        setIsPulling(true);
      }
    }

    async function handleTouchEnd() {
      if (isPulling) {
        await onRefresh();
        setIsPulling(false);
      }
    }

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, onRefresh]);

  return isPulling;
}
```

**Files to Create**:
- `lib/hooks/usePullToRefresh.ts`

**Files to Update**:
- `app/page.tsx` - Add pull-to-refresh for home page
- `components/ReportDisplay.tsx` - Add for report refresh

---

### Issue 25: Horizontal Scroll on Mobile

**Severity**: Medium
**Type**: Mobile UX

**Current State**:
- Some tables and charts overflow on small screens
- No horizontal scroll indicator
- Content gets cut off

**Recommended Fix**:
```css
/* Scrollable container with fade indicators */
.scrollable {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  position: relative;
}

.scrollable::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to right, transparent, var(--bg-main));
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.3s;
}

.scrollable.scrolled-end::after {
  opacity: 0;
}
```

```typescript
// Detect scroll position
function useScrollPosition(ref: RefObject<HTMLElement>) {
  const [isAtEnd, setIsAtEnd] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleScroll() {
      const { scrollLeft, scrollWidth, clientWidth } = el!;
      setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 5);
    }

    el.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => el.removeEventListener('scroll', handleScroll);
  }, [ref]);

  return isAtEnd;
}
```

**Files to Update**:
- `components/report/data/VideoPerformanceChart.tsx` - Make scrollable
- `components/report/analysis/UploadHeatmap.tsx` - Make scrollable
- All tables in report sections

---

### Issue 26: No Swipe Gestures for Navigation

**Severity**: Low
**Type**: Mobile UX

**Current State**:
- Tab navigation requires tapping
- No swipe between report sections
- No swipe to go back

**Recommended Fix**:
```typescript
// lib/hooks/useSwipeGesture.ts
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && onSwipeLeft) {
        onSwipeLeft(); // Swipe left
      } else if (diff < 0 && onSwipeRight) {
        onSwipeRight(); // Swipe right
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// Usage in ReportDisplay:
const swipeHandlers = useSwipeGesture(
  () => setActiveTab(nextTab), // Swipe left = next tab
  () => setActiveTab(prevTab)  // Swipe right = previous tab
);

<div {...swipeHandlers}>
  {/* Content */}
</div>
```

**Files to Create**:
- `lib/hooks/useSwipeGesture.ts`

**Files to Update**:
- `components/ReportDisplay.tsx` - Add swipe between tabs
- `app/veo/page.tsx` - Swipe between VEO tabs

---

### Issue 27: Fixed Position Elements Block Content on Mobile

**Severity**: Medium
**Type**: Mobile UX

**Current State**:
```css
/* components/settings/SettingsButton.module.css */
.settingsButton {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  /* On mobile, can block content and FAB area */
}
```

**Impact**: Settings button overlaps content, especially on small screens.

**Recommended Fix**:
```css
/* Add safe area for fixed elements */
@media (max-width: 768px) {
  .settingsButton {
    bottom: calc(env(safe-area-inset-bottom) + 1rem);
    right: 1rem;
    z-index: 90; /* Below modals, above content */
  }

  /* Add padding to body for fixed elements */
  .mainContent {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
}
```

**Files to Update**:
- `components/settings/SettingsButton.module.css`
- `app/page.tsx` - Add padding for fixed elements
- `components/ReportDisplay.module.css` - Adjust for bottom sheet

---

### Issue 28: Touch Feedback Missing on Interactive Elements

**Severity**: Medium
**Type**: Mobile UX

**Current State**:
- No visual feedback on tap
- No active state styling
- Users unsure if tap registered

**Recommended Fix**:
```css
/* Add -webkit-tap-highlight-color and active states */
.interactive {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  transition: all 150ms ease-in-out;
}

.interactive:active {
  transform: scale(0.97);
  opacity: 0.8;
}

/* For buttons */
.button:active {
  transform: translateY(2px);
  box-shadow: none;
}

/* For cards */
.card:active {
  background: var(--bg-hover);
}
```

**Files to Update**:
- Add active states to all interactive elements
- `components/AnalysisForm.module.css`
- `components/ReportDisplay.module.css`
- `components/veo/VeoSceneCard.module.css`
- All clickable components

---

### Issue 29: No Pinch-to-Zoom for Charts/Images

**Severity**: Low
**Type**: Mobile UX

**Current State**:
- Charts and heatmaps not zoomable on mobile
- Users can't examine details

**Recommended Fix**:
```typescript
// lib/hooks/usePinchZoom.ts
export function usePinchZoom(ref: RefObject<HTMLElement>) {
  const [scale, setScale] = useState(1);
  const initialDistance = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function getDistance(e: TouchEvent) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance.current = getDistance(e);
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e);
        const newScale = (currentDistance / initialDistance.current) * scale;
        setScale(Math.max(1, Math.min(newScale, 4))); // 1x to 4x
      }
    }

    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchmove', handleTouchMove);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [ref, scale]);

  return scale;
}
```

**Files to Create**:
- `lib/hooks/usePinchZoom.ts`

**Files to Update**:
- `components/report/analysis/UploadHeatmap.tsx` - Enable pinch-zoom
- `components/VideoPerformanceChart.tsx` - Enable pinch-zoom

---

## P3: Micro-interactions & Feedback

### Issue 30: No Success Animation After Form Submit

**Severity**: Low
**Type**: UX

**Current State**:
- Form submits → loading state appears immediately
- No confirmation that input was received

**Recommended Fix**:
```typescript
// Add success checkmark animation before loading
async function handleSubmit() {
  setStatus('submitting');

  // Brief success animation
  await new Promise(resolve => setTimeout(resolve, 400));
  setStatus('success');

  await new Promise(resolve => setTimeout(resolve, 600));
  setStatus('loading');

  // Continue with analysis...
}
```

```css
/* Success checkmark animation */
@keyframes checkmark {
  0% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

.checkmark {
  animation: checkmark 0.6s ease-in-out forwards;
}
```

**Files to Update**:
- `components/AnalysisForm.tsx` - Add success state
- `components/veo/VeoForm.tsx` - Add success state

---

### Issue 31: Button States Lack Visual Feedback

**Severity**: Low
**Type**: UX

**Current State**:
```css
/* Simple hover only */
.button:hover {
  background: var(--primary-hover);
}
```

**Recommended Fix**:
```css
/* Enhanced button micro-interactions */
.button {
  position: relative;
  transition: all 150ms ease-in-out;
  overflow: hidden;
}

/* Hover lift */
.button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Active press */
.button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-xs);
}

/* Ripple effect */
.button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

.button:active::before {
  width: 300px;
  height: 300px;
}

/* Loading shimmer */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.button.loading {
  background: linear-gradient(
    90deg,
    var(--primary) 0%,
    var(--primary-hover) 50%,
    var(--primary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

**Files to Update**:
- `components/ui/Button.module.css` (if creating shared button)
- Or update individual button styles in all components

---

### Issue 32: No Transition When Switching Tabs

**Severity**: Low
**Type**: UX

**Current State**:
```typescript
// Tabs switch instantly with no transition
<div>{activeTab === 'data' ? <DataTab /> : <AnalysisTab />}</div>
```

**Recommended Fix**:
```typescript
// Add crossfade transition
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {activeTab === 'data' && <DataTab />}
    {activeTab === 'analysis' && <AnalysisTab />}
    {activeTab === 'evaluation' && <EvaluationTab />}
  </motion.div>
</AnimatePresence>
```

**Files to Update**:
- `components/ReportDisplay.tsx` - Add tab transitions
- `app/veo/page.tsx` - Add VEO tab transitions

---

### Issue 33: Copy Button No Visual Feedback

**Severity**: Low
**Type**: UX

**Current State**:
```typescript
// Copy button just copies, no feedback
function handleCopy() {
  navigator.clipboard.writeText(text);
  // User unsure if copy worked
}
```

**Recommended Fix**:
```typescript
function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy };
}

// In component:
const { copied, copy } = useCopyToClipboard();

<button onClick={() => copy(text)}>
  {copied ? (
    <>
      <CheckIcon /> Copied!
    </>
  ) : (
    <>
      <CopyIcon /> Copy
    </>
  )}
</button>
```

**Files to Create**:
- `lib/hooks/useCopyToClipboard.ts`

**Files to Update**:
- `components/veo/VeoLoadingState.tsx` - Script copy button
- `components/report/data/PostAccordion.tsx` - Tags copy button
- Any other copy functionality

---

### Issue 34: No Hover Preview for Scene Cards

**Severity**: Low
**Type**: UX

**Current State**:
```css
/* Scene cards just highlight on hover */
.sceneCard:hover {
  box-shadow: var(--shadow-md);
}
```

**Recommended Fix**:
```css
/* Expand preview on hover */
.sceneCard {
  position: relative;
  transition: all 300ms ease-in-out;
  overflow: hidden;
}

.sceneCard:hover {
  transform: scale(1.03);
  box-shadow: var(--shadow-lg);
  z-index: 10;
}

/* Show preview content on hover */
.sceneCard .previewContent {
  max-height: 0;
  opacity: 0;
  transition: all 300ms ease-in-out;
}

.sceneCard:hover .previewContent {
  max-height: 200px;
  opacity: 1;
}
```

**Files to Update**:
- `components/veo/VeoSceneCard.tsx` - Enhanced hover preview
- `components/veo/VeoSceneCard.module.css`

---

### Issue 35: Loading Spinner Too Generic

**Severity**: Low
**Type**: Visual

**Current State**:
```typescript
// Simple Braille spinner
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
```

**Recommended Fix**:
Add contextual loading indicators:

```typescript
// For video analysis
<Spinner type="video" /> // Film reel animation

// For character discovery
<Spinner type="character" /> // Person icon pulsing

// For scene generation
<Spinner type="scene" /> // Camera icon

// For report generation
<Spinner type="report" /> // Document pages flipping
```

**Files to Create**:
- `components/ui/Spinner.tsx` - Contextual spinners

**Files to Update**:
- `components/loading/LoadingState.tsx` - Use contextual spinners
- `components/veo/VeoLoadingState.tsx` - Use contextual spinners

---

### Issue 36: No Progress Percentage Display

**Severity**: Low
**Type**: UX

**Current State**:
```typescript
// Progress shown as "Step 2 of 5" but no percentage
<div>Step {current} of {total}</div>
```

**Recommended Fix**:
```typescript
const percentage = Math.round((current / total) * 100);

<div className={styles.progressWrapper}>
  <div className={styles.progressBar}>
    <div
      className={styles.progressFill}
      style={{ width: `${percentage}%` }}
    />
  </div>
  <span className={styles.progressText}>
    {percentage}% • Step {current} of {total}
  </span>
</div>
```

**Files to Update**:
- `components/loading/LoadingState.tsx` - Add progress bar
- `components/veo/VeoLoadingState.tsx` - Add progress bar

---

## P4: Performance & Loading

### Issue 37: No Image Optimization for YouTube Thumbnails

**Severity**: Medium
**Type**: Performance

**Current State**:
```typescript
// Direct image URLs from YouTube API
<img src={video.thumbnails.high.url} alt={video.title} />
```

**Impact**: Large images downloaded unnecessarily, slow page load.

**Recommended Fix**:
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={video.thumbnails.high.url}
  alt={video.title}
  width={480}
  height={360}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate blur hash
/>
```

**Files to Update**:
- `components/report/data/PostAccordion.tsx` - Optimize thumbnails
- `components/report/analysis/VideoPerformanceChart.tsx`
- Any component displaying thumbnails

---

### Issue 38: No Virtual Scrolling for Large Lists

**Severity**: Medium
**Type**: Performance

**Current State**:
```typescript
// Renders all videos at once (50-100+ items)
{videos.map(video => <VideoCard key={video.id} {...video} />)}
```

**Impact**: DOM bloat, slow rendering, laggy scrolling.

**Recommended Fix**:
```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={videos.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <VideoCard {...videos[index]} />
    </div>
  )}
</FixedSizeList>
```

**Files to Update**:
- `components/report/data/PostAccordion.tsx` - Virtual scroll for videos
- `components/veo/VeoSceneDisplay.tsx` - Virtual scroll for scenes

---

### Issue 39: Loading States Not Preloading Next Step Data

**Severity**: Low
**Type**: Performance

**Current State**:
```typescript
// Each step waits for previous to complete
// No prefetching of next step data
```

**Recommended Fix**:
```typescript
// Prefetch next step data while current step is running
useEffect(() => {
  if (currentStep === 2) {
    // Prefetch data for step 3
    prefetchChannelInfo();
  } else if (currentStep === 3) {
    // Prefetch data for step 4
    prefetchVideoList();
  }
}, [currentStep]);
```

**Files to Update**:
- `components/loading/LoadingState.tsx` - Prefetch next step

---

### Issue 40: No Code Splitting for Report Sections

**Severity**: Low
**Type**: Performance

**Current State**:
```typescript
// All report sections loaded upfront
import { DataTab } from './DataTab';
import { AnalysisTab } from './AnalysisTab';
import { EvaluationTab } from './EvaluationTab';
```

**Recommended Fix**:
```typescript
// Lazy load tabs
const DataTab = lazy(() => import('./DataTab'));
const AnalysisTab = lazy(() => import('./AnalysisTab'));
const EvaluationTab = lazy(() => import('./EvaluationTab'));

<Suspense fallback={<TabSkeleton />}>
  {activeTab === 'data' && <DataTab />}
  {activeTab === 'analysis' && <AnalysisTab />}
  {activeTab === 'evaluation' && <EvaluationTab />}
</Suspense>
```

**Files to Update**:
- `components/ReportDisplay.tsx` - Lazy load tabs
- `app/veo/page.tsx` - Lazy load VEO components

---

### Issue 41: No Request Debouncing/Throttling

**Severity**: Low
**Type**: Performance

**Current State**:
```typescript
// API key validation fires on every keystroke
onChange={(e) => validateApiKey(e.target.value)}
```

**Recommended Fix**:
```typescript
// Debounce validation
const debouncedValidate = useMemo(
  () => debounce(validateApiKey, 500),
  []
);

onChange={(e) => debouncedValidate(e.target.value)}
```

**Files to Create**:
- `lib/hooks/useDebounce.ts`

**Files to Update**:
- `components/settings/SettingsButton.tsx` - Debounce API key validation
- `components/AnalysisForm.tsx` - Debounce URL validation

---

### Issue 42: No Service Worker for Offline Support

**Severity**: Low (Future Enhancement)
**Type**: Performance / PWA

**Current State**:
- No offline support
- No PWA capabilities
- No caching strategy

**Recommended Fix** (Future):
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // Next.js config
});
```

**Files to Create** (Future):
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker (auto-generated by next-pwa)

---

## P5: Advanced Enhancements

### Issue 43: No Data Export Options

**Severity**: Low
**Type**: Feature

**Current State**:
```typescript
// Only JSON download available
<button onClick={() => downloadJSON(data)}>
  Download Report
</button>
```

**Recommended Fix**:
```typescript
// Multiple export formats
<DropdownMenu>
  <DropdownMenuTrigger>Export Report</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => exportJSON()}>
      JSON
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportCSV()}>
      CSV
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportPDF()}>
      PDF
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportMarkdown()}>
      Markdown
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Files to Create**:
- `lib/export/` - Export utilities (CSV, PDF, Markdown)

**Files to Update**:
- `components/ReportDisplay.tsx` - Add export dropdown
- `components/veo/VeoDownloadPanel.tsx` - Multiple formats

---

### Issue 44: No Comparison View Between Reports

**Severity**: Low
**Type**: Feature

**Current State**:
- Can only view one report at a time
- No way to compare multiple channels

**Recommended Fix**:
```typescript
// Compare mode
<div className={styles.compareView}>
  <ReportDisplay report={report1} />
  <div className={styles.divider} />
  <ReportDisplay report={report2} />
</div>
```

**Files to Create**:
- `components/CompareView.tsx` - Side-by-side comparison
- `components/CompareView.module.css`

**Files to Update**:
- `app/page.tsx` - Add compare mode toggle

---

### Issue 45: No Shareable Report Links

**Severity**: Low
**Type**: Feature

**Current State**:
- Reports only viewable locally
- No way to share analysis with others

**Recommended Fix**:
```typescript
// Generate shareable link
async function shareReport(reportId: string) {
  const shareableLink = await createShareableReport(reportId);
  // Copy to clipboard or show QR code
  return `https://soibrand.com/report/${shareableLink}`;
}

// Public report viewer
// app/report/[id]/page.tsx
export default function SharedReport({ params }) {
  const report = await fetchPublicReport(params.id);
  return <ReportDisplay report={report} isPublic />;
}
```

**Files to Create**:
- `app/report/[id]/page.tsx` - Public report viewer
- `lib/sharing.ts` - Share link generation

**Files to Update**:
- `components/ReportDisplay.tsx` - Add share button

---

### Issue 46: No User Preferences Persistence

**Severity**: Low
**Type**: Feature

**Current State**:
```typescript
// Settings saved in localStorage
// No sync across devices
// No cloud backup
```

**Recommended Fix**:
```typescript
// Optional user accounts for preferences sync
// If user logged in: sync to cloud
// If not: localStorage only

interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'vi' | 'en';
  defaultModel: GeminiModel;
  exportFormat: 'json' | 'csv' | 'pdf';
  // ...
}

async function savePreferences(prefs: UserPreferences) {
  if (user) {
    await syncToCloud(prefs);
  } else {
    localStorage.setItem('preferences', JSON.stringify(prefs));
  }
}
```

**Files to Create**:
- `lib/preferences.ts` - Preferences management

**Files to Update**:
- `components/settings/SettingsButton.tsx` - Preferences UI

---

### Issue 47: No Analytics / Usage Tracking

**Severity**: Low
**Type**: Feature / Business

**Current State**:
- No analytics
- No error tracking
- No performance monitoring

**Recommended Fix**:
```typescript
// Add privacy-respecting analytics
// Vercel Analytics (built-in, privacy-friendly)
import { Analytics } from '@vercel/analytics/react';

// Or Plausible (GDPR-compliant)
<script defer data-domain="soibrand.com" src="https://plausible.io/js/script.js"></script>

// Error tracking with Sentry
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Files to Create**:
- `sentry.client.config.ts` - Sentry config
- `sentry.server.config.ts` - Sentry server config

**Files to Update**:
- `app/layout.tsx` - Add Analytics component
- `next.config.js` - Sentry integration

---

## Implementation Roadmap

### Phase 1: Critical Accessibility (Week 1-2)
**Priority**: P0 - Must fix before any other work

1. **Typography Overhaul** (2 days)
   - Update CSS variables for minimum 16px body text
   - Audit all components for font size compliance
   - Test readability across devices

2. **Touch Targets** (1 day)
   - Ensure all interactive elements ≥44px
   - Add transparent padding where needed
   - Test on mobile devices

3. **Focus Management** (1 day)
   - Implement focus trap in modals
   - Add skip links for major sections
   - Test keyboard navigation

4. **Motion & Contrast** (1 day)
   - Add reduced motion support
   - Fix color contrast issues
   - Test with accessibility tools

5. **ARIA Improvements** (1 day)
   - Add aria-describedby to forms
   - Add progress semantics to loaders
   - Associate errors with fields

**Deliverables**:
- ✅ WCAG 2.1 AA compliance minimum
- ✅ All critical accessibility issues resolved
- ✅ Accessibility audit report

---

### Phase 2: Design System Standardization (Week 3-4)
**Priority**: P1 - Foundation for consistency

1. **Color & Token Alignment** (1 day)
   - Decide on primary color (black vs red)
   - Update all color tokens
   - Document in DESIGN_SYSTEM.md

2. **Shared Components** (2 days)
   - Create Button component
   - Create Skeleton component
   - Create Spinner variants

3. **Spacing & Shadows** (1 day)
   - Implement spacing scale
   - Update shadow system
   - Apply consistently

4. **Documentation** (1 day)
   - Write DESIGN_SYSTEM.md
   - Add usage examples
   - Create component guidelines

**Deliverables**:
- ✅ Unified design system
- ✅ Shared component library
- ✅ Complete documentation

---

### Phase 3: Mobile Optimization (Week 5-6)
**Priority**: P2 - Growing mobile user base

1. **Touch Optimization** (1 day)
   - Mobile-specific styles
   - Touch feedback on all interactions
   - Test on various devices

2. **Responsive Improvements** (2 days)
   - Bottom sheet navigation for reports
   - Larger form inputs (≥16px to prevent zoom)
   - Horizontal scroll with indicators

3. **Gestures** (1 day)
   - Swipe between tabs
   - Pull-to-refresh
   - Pinch-to-zoom on charts

**Deliverables**:
- ✅ Excellent mobile UX
- ✅ Touch-optimized interactions
- ✅ Mobile-first improvements

---

### Phase 4: Polish & Micro-interactions (Week 7)
**Priority**: P3 - Professional polish

1. **Visual Feedback** (1 day)
   - Enhanced button states
   - Success animations
   - Copy feedback

2. **Transitions** (1 day)
   - Tab transitions
   - Loading animations
   - Hover effects

**Deliverables**:
- ✅ Professional micro-interactions
- ✅ Smooth transitions
- ✅ Enhanced feedback

---

### Phase 5: Performance (Week 8)
**Priority**: P4 - Optimization

1. **Image & List Optimization** (1 day)
   - Next.js Image optimization
   - Virtual scrolling
   - Lazy loading

2. **Code Splitting** (1 day)
   - Lazy load tabs
   - Prefetch next steps
   - Debounce inputs

**Deliverables**:
- ✅ Faster page loads
- ✅ Smoother scrolling
- ✅ Reduced bundle size

---

### Phase 6: Advanced Features (Future)
**Priority**: P5 - Nice-to-have

1. **Export Options**
2. **Dark Mode**
3. **PWA Support**
4. **Shareable Links**
5. **User Preferences Sync**
6. **Analytics Integration**

---

## Verification & Testing Plan

### Automated Testing

1. **Accessibility Testing**:
   ```bash
   # Install tools
   npm install --save-dev @axe-core/react axe-playwright

   # Run automated tests
   npm run test:a11y
   ```

2. **Visual Regression Testing**:
   ```bash
   # Install Chromatic
   npm install --save-dev chromatic

   # Run visual tests
   npm run chromatic
   ```

3. **Performance Testing**:
   ```bash
   # Lighthouse CI
   npm install --save-dev @lhci/cli

   # Run Lighthouse
   npm run lighthouse
   ```

---

### Manual Testing Checklist

#### Accessibility Audit
- [ ] Screen reader test (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation (no mouse)
- [ ] Color contrast verification (WebAIM tool)
- [ ] Focus visible on all interactive elements
- [ ] ARIA attributes correct
- [ ] Forms accessible with errors
- [ ] Reduced motion preference respected

#### Mobile Testing
- [ ] Test on iPhone (Safari, Chrome)
- [ ] Test on Android (Chrome, Firefox)
- [ ] Touch targets ≥44px verified
- [ ] No horizontal scroll issues
- [ ] Gestures work (swipe, pull-to-refresh)
- [ ] Viewport zoom disabled where appropriate
- [ ] Safe area insets respected

#### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

#### Performance Metrics
- [ ] Lighthouse score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3.5s
- [ ] No layout shift (CLS <0.1)

---

## Critical Files to Modify

### Design System
1. `app/globals.css` - CSS variables, typography scale, spacing, colors
2. `docs/DESIGN_SYSTEM.md` (NEW) - Design token documentation

### Shared Components (NEW)
3. `components/ui/Button.tsx` - Unified button component
4. `components/ui/Button.module.css` - Button styles
5. `components/ui/Skeleton.tsx` - Loading skeletons
6. `components/ui/Skeleton.module.css` - Skeleton styles
7. `components/ui/Spinner.tsx` - Contextual spinners

### Hooks (NEW)
8. `lib/hooks/useModalFocusTrap.ts` - Focus trap for modals
9. `lib/hooks/useKeyboardShortcut.ts` - Keyboard shortcuts
10. `lib/hooks/useCopyToClipboard.ts` - Copy feedback
11. `lib/hooks/useSwipeGesture.ts` - Touch gestures
12. `lib/hooks/usePullToRefresh.ts` - Pull-to-refresh
13. `lib/hooks/usePinchZoom.ts` - Pinch zoom
14. `lib/hooks/useDebounce.ts` - Input debouncing
15. `lib/motion.ts` - Accessible animation variants

### Core Components
16. `app/layout.tsx` - Root layout, skip links, lang attribute
17. `app/page.tsx` - Home page, accessibility improvements
18. `app/veo/page.tsx` - VEO page, mobile optimizations
19. `components/AnalysisForm.tsx` - Form accessibility
20. `components/AnalysisForm.module.css` - Touch targets, typography
21. `components/ReportDisplay.tsx` - Mobile nav, tab transitions
22. `components/ReportDisplay.module.css` - Bottom sheet, responsive
23. `components/loading/LoadingState.tsx` - Progress semantics
24. `components/loading/LoadingState.module.css` - Typography
25. `components/settings/SettingsButton.tsx` - Focus trap, accessibility
26. `components/settings/SettingsButton.module.css` - Mobile positioning
27. `components/veo/VeoForm.tsx` - Form accessibility
28. `components/veo/VeoForm.module.css` - Touch targets
29. `components/veo/VeoLoadingState.tsx` - Progress, announcements
30. `components/veo/VeoSceneCard.tsx` - Hover interactions
31. `components/veo/VeoSceneCard.module.css` - Micro-interactions

### Report Components
32. `components/report/AnalysisTab.tsx` - Accessibility
33. `components/report/DataTab.tsx` - Virtual scrolling
34. `components/report/data/PostAccordion.tsx` - Image optimization
35. `components/report/analysis/UploadHeatmap.tsx` - Pinch zoom

---

## Risk Assessment

### High Risk
1. **Typography changes**: May affect entire visual design
   - **Mitigation**: Incremental rollout, A/B testing

2. **Color system overhaul**: Breaking visual consistency
   - **Mitigation**: Create feature flag, gradual migration

### Medium Risk
3. **Touch target expansion**: May break layouts
   - **Mitigation**: Test on multiple devices, responsive design

4. **Focus trap implementation**: May break existing keyboard nav
   - **Mitigation**: Thorough keyboard testing

### Low Risk
5. **Micro-interactions**: Purely additive
6. **Performance optimizations**: Can be rolled back easily

---

## Success Metrics

### Accessibility
- ✅ WCAG 2.1 AA compliance: 100%
- ✅ Lighthouse Accessibility score: >95
- ✅ Zero critical accessibility issues
- ✅ Screen reader compatible

### Performance
- ✅ Lighthouse Performance score: >90
- ✅ First Contentful Paint: <1.5s
- ✅ Time to Interactive: <3.5s
- ✅ Cumulative Layout Shift: <0.1

### Mobile UX
- ✅ All touch targets ≥44px
- ✅ Mobile Lighthouse score: >90
- ✅ No horizontal scroll
- ✅ Smooth gesture interactions

### User Satisfaction
- ✅ User testing feedback positive
- ✅ No usability complaints
- ✅ Improved conversion rates (if tracked)

---

## Next Steps

1. **Review Plan**: User approval of enhancement priorities
2. **Set Timeline**: Confirm implementation schedule
3. **Create Issues**: Break down into GitHub issues/tasks
4. **Start Phase 1**: Begin critical accessibility fixes
5. **Iterative Testing**: Test after each phase
6. **User Feedback**: Gather feedback throughout implementation
7. **Documentation**: Update docs as system evolves

---

## Questions for User

Before proceeding with implementation:

1. **Color System**: Keep black as primary, or switch to red brand color?
2. **Timeline**: Prefer aggressive (4 weeks) or conservative (8 weeks) timeline?
3. **Priorities**: Any specific P2/P3 items to prioritize over others?
4. **Future Features**: Which P5 features are most important for roadmap?
5. **Browser Support**: Any specific browser versions to target?
6. **Analytics**: Do you want usage tracking implemented?
7. **Dark Mode**: Priority for future implementation?

---

This comprehensive plan addresses all major UI/UX concerns while maintaining a practical, phased implementation approach. The focus is on accessibility first, followed by design consistency, mobile optimization, and performance improvements.
