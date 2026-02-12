/**
 * Centralized UI configuration constants
 * Replaces hardcoded timeouts, event names, API endpoints, and storage keys
 */

// ============================================================================
// UI Timing
// ============================================================================

/** Timeout for "Copied!" status reset in copy buttons */
export const UI_COPY_STATUS_TIMEOUT_MS = 2000;

/** Auto-dismiss delay for error toast notifications */
export const UI_ERROR_AUTO_DISMISS_MS = 5000;

/** Delay after splash screen progress bar completes before calling onComplete */
export const UI_SPLASH_COMPLETION_DELAY_MS = 200;

/** Debounce delay for URL validation in PromptUrlInput */
export const UI_URL_VALIDATION_DEBOUNCE_MS = 500;

/** Delay between SSE events during stream recovery replay */
export const UI_SSE_REPLAY_DELAY_MS = 10;

/** Cleanup delay for event tracker after stream closes (5 minutes) */
export const UI_EVENT_TRACKER_CLEANUP_MS = 5 * 60 * 1000;

// ============================================================================
// Custom Event Names
// ============================================================================

export const CUSTOM_EVENTS = {
  DATABASE_KEY_CHANGED: "database-key-changed",
  PROMPT_JOB_UPDATED: "prompt-job-updated",
  PROMPT_AUTO_RETRY: "prompt-auto-retry",
  SETTINGS_CHANGED: "settings-changed",
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

export const API_ENDPOINTS = {
  ANALYZE: "/api/analyze",
  PROMPT: "/api/prompt",
  PROMPT_VERIFY_KEY: "/api/prompt/verify-key",
  PROMPT_GENERATE_IMAGE: "/api/prompt/generate-image",
  QUOTA: "/api/quota",
  LOADING_LABELS: "/api/loading-labels",
} as const;

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  CURRENT_REPORT: "soibrand_current_report",
  SPLASH_SHOWN: "soibrand-splash-shown",
} as const;
