/**
 * Prompt Pipeline Configuration Constants
 * All magic numbers and configuration values centralized in one place
 */

// ============================================================================
// TIME & DURATION
// ============================================================================

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;

export const DEFAULT_SECONDS_PER_SCENE = 8;

export const MIN_PROCESSING_TIME_SECONDS = 30;
export const MAX_PROCESSING_TIME_SECONDS = 120;

// ============================================================================
// QUALITY & VALIDATION
// ============================================================================

// Character attributes
export const MAX_CHARACTER_ATTRIBUTES = 20;
export const MIN_CHAR_ATTRS_FULL_SCORE = 15;

// Scene details
export const WORDS_PER_DETAIL_UNIT = 10;
export const MAX_DETAIL_SCORE_FROM_WORDS = 5;
export const MIN_SCENE_DETAILS_FULL_SCORE = 10;

// Quality thresholds
export const QUALITY_MASTER_THRESHOLD = 8;
export const QUALITY_PROFESSIONAL_THRESHOLD = 6;
export const QUALITY_INTERMEDIATE_THRESHOLD = 4;

// Dialogue (8-second rule)
export const MAX_DIALOGUE_WORDS_8SEC_RULE = 15;
export const BASE_DIALOGUE_SCORE = 5;
export const DIALOGUE_DELIVERY_BONUS = 1;
export const DIALOGUE_8SEC_BONUS = 2;

// Negative prompts
export const MIN_NEGATIVE_PROMPT_LENGTH = 20;
export const NEGATIVE_PROMPT_QUANTITY_MAX_POINTS = 5;
export const KEY_NEGATIVE_BONUS = 0.5;

// Lighting & Audio scoring
export const LIGHTING_SETUP_SCORE = 3;
export const AUDIO_ENVIRONMENTAL_SCORE = 3;
export const AUDIO_NEGATIONS_SCORE = 2;

// Quality weights
export const QUALITY_WEIGHT_CHAR_DESC = 1.5;
export const QUALITY_WEIGHT_SCENE_DETAILS = 1.2;
export const QUALITY_WEIGHT_DIALOGUE = 1.0;
export const QUALITY_WEIGHT_NEGATIVE = 0.8;

// Success rate calculation
export const BASE_SUCCESS_RATE = 60;
export const SUCCESS_RATE_PER_POINT = 4;

// Script validation
export const SCRIPT_CONTAMINATION_THRESHOLD = 0.3;
export const MIN_SCRIPT_LENGTH = 100;

// ============================================================================
// CACHING
// ============================================================================

export const CACHE_TTL_DAYS = 7;
export const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
export const MAX_CACHED_JOBS = 20;

// Failed job expiration (48 hours)
export const FAILED_JOB_CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 172,800,000 ms

// Completed job expiration (7 days)
export const COMPLETED_JOB_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 604,800,000 ms

// Batch overlap for scene continuity (10 seconds)
export const BATCH_OVERLAP_SECONDS = 10;

// ============================================================================
// API CONFIGURATION
// ============================================================================

// Gemini API
export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash-exp";
export const DEFAULT_API_TIMEOUT_MS = 300000; // 5 minutes
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_BASE_DELAY_MS = 1000;
// API-005 FIX: Max delay cap for retry backoff
export const DEFAULT_MAX_RETRY_DELAY_MS = 30000; // 30 seconds max delay

// SSE & Streaming
export const SSE_KEEPALIVE_INTERVAL_MS = 15000; // 15 seconds
export const BATCH_DELAY_MS = 2000; // 2 seconds between batches
export const FALLBACK_VIDEO_DURATION_SECONDS = 300; // 5 minutes

// SSE-003 FIX: Dynamic stream timeout based on scene count
export const BASE_STREAM_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes base
export const STREAM_TIMEOUT_PER_SCENE_MS = 30 * 1000; // 30 seconds per scene
export const MAX_STREAM_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes max

// SSE-002 FIX: Stream flush before close
export const SSE_FLUSH_DELAY_MS = 250; // Delay between flush attempts
export const SSE_FLUSH_RETRIES = 3; // Number of flush attempts

// Phase 1 timeout (character extraction can hang if Gemini is slow)
export const PHASE1_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// ESTIMATED VALUES (for recovery/fallback scenarios)
// ============================================================================

// Estimated Gemini response time when actual timing is unavailable (SSE disconnect)
export const ESTIMATED_GEMINI_RESPONSE_MS = 15000; // 15 seconds typical

// ============================================================================
// STRINGS & FORMATTING
// ============================================================================

export const MAX_FOLDER_NAME_LENGTH = 50;
export const RANDOM_STRING_RADIX = 36;
export const RANDOM_STRING_MIN_LENGTH = 2;

// ============================================================================
// URLS
// ============================================================================

export const GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/";
export const YOUTUBE_THUMBNAIL_BASE_URL = "https://img.youtube.com/vi/";

// Interactions API (for video analysis and multi-turn chat)
export const INTERACTIONS_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
export const INTERACTIONS_MODEL = "gemini-2.5-flash-preview";

// ============================================================================
// STREAM RECOVERY
// ============================================================================

// Event ID format: {jobId}-{batchNum}-{eventNum}
export const EVENT_ID_SEPARATOR = "-";
// Maximum events to keep in memory for recovery
export const MAX_RECOVERY_EVENTS = 1000;
// Recovery reconnection delays (exponential backoff)
export const RECOVERY_INITIAL_DELAY_MS = 2000;
export const RECOVERY_MAX_DELAY_MS = 30000;
export const RECOVERY_BACKOFF_MULTIPLIER = 2;

// ============================================================================
// FORM SETTINGS PERSISTENCE
// ============================================================================

export const PROMPT_FORM_SETTINGS_KEY = "prompt_form_settings";
