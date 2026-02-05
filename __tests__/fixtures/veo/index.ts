/**
 * VEO Test Fixtures - Central Export
 * Re-exports all VEO test fixtures for easy importing
 *
 * @example
 * ```typescript
 * import {
 *   createMockJob,
 *   inProgressJob,
 *   failedJob,
 *   createMockProgress,
 *   fullScene,
 *   chefMarco,
 *   fullColorProfile,
 *   errorEventQuota,
 *   quotaExceededScenario,
 * } from '@/__tests__/fixtures/veo';
 * ```
 */

// ============================================================================
// Factory Functions
// ============================================================================
export {
  // Test URL constants
  DUMMY_URL,
  TEST_URLS,

  // ID generators
  generateTestJobId,
  generateTestSceneId,
  generateTestLogId,
  resetTestCounters,

  // Scene factory
  createMockScene,
  createMockScenes,
  type CreateMockSceneOptions,

  // Character factory
  createMockCharacter,
  createMockCharacterRegistry,
  type CreateMockCharacterOptions,

  // Job summary factory
  createMockJobSummary,
  type CreateMockJobSummaryOptions,

  // Cached job factory
  createMockJob,
  type CreateMockJobOptions,

  // Progress factory
  createMockProgress,
  type CreateMockProgressOptions,

  // Resume data factory
  createMockResumeData,
  type CreateMockResumeDataOptions,

  // Log entry factory
  createMockLogEntry,
  type CreateMockLogEntryOptions,

  // Time helpers
  hoursAgo,
  daysAgo,
  minutesAgo,
  secondsAgo,
} from "./factories";

// ============================================================================
// Job Fixtures
// ============================================================================
export {
  // Completed jobs
  completedJob,
  completedJobMinimal,
  completedJobNearExpiry,

  // In-progress jobs
  inProgressJob,
  inProgressJobStart,
  stalledJob,

  // Failed jobs
  failedJob,
  failedJobRateLimit,
  failedJobTimeout,
  failedJobParseError,

  // Partial jobs
  partialJob,

  // Edge cases
  emptyJob,
  expiredJob,
  expiredFailedJob,
  hybridModeJob,
  imageMediaTypeJob,

  // Collections
  allJobs,
  resumableJobs,
  errorJobs,
  expiredJobs,
} from "./jobs";

// ============================================================================
// Scene Fixtures
// ============================================================================
export {
  // Minimal scenes
  minimalScene,
  sequencedScene,

  // Full scenes
  fullScene,
  videoScene,
  imageScene,

  // VEO 3 enhanced scenes
  sceneWithAudio,
  sceneWithDialogue,
  sceneWithEnhancedCamera,
  sceneWithExpression,
  sceneWithAdvancedComposition,

  // Platform-specific
  verticalScene,
  selfieScene,

  // Character scenes
  multiCharacterScene,

  // Edge cases
  longPromptScene,
  specialCharsScene,
  sparseScene,

  // Collections
  allScenes,
  veo3Scenes,

  // Helpers
  createSceneSequence,
} from "./scenes";

// ============================================================================
// Character Fixtures
// ============================================================================
export {
  // Individual characters
  chefMarco,
  sousChefAnna,
  managerDavid,
  criticSophia,
  minimalCharacter,

  // Enhanced templates
  enhancedChefTemplate,

  // Registries
  skeletonRegistry,
  legacyRegistry,
  mixedRegistry,
  emptyRegistry,
  singleCharacterRegistry,
  largeRegistry,

  // Extraction results
  extractionResultMultiple,
  extractionResultSingle,
  extractionResultNoCharacters,
  extractionResultCrowd,

  // Collections
  allCharacters,
  primaryCast,
  supportingCast,

  // Helpers
  isCharacterSkeleton,
  getSkeletonsFromRegistry,
  getCharacterNames,
} from "./characters";

// ============================================================================
// Color Profile Fixtures
// ============================================================================
export {
  // Color entries
  warmGold,
  deepBrown,
  creamWhite,
  sageGreen,
  copperAccent,
  steelGray,
  tomatoRed,
  midnightBlue,

  // Full profiles
  fullColorProfile,
  coolModernProfile,
  moodyDramaticProfile,
  minimalProfile,

  // Extraction results
  extractionResultHighConfidence,
  extractionResultMediumConfidence,
  extractionResultLowConfidence,

  // Collections
  allProfiles,
  allColorEntries,

  // Helpers
  createCustomProfile,
  createColorEntry,
} from "./color-profiles";

// ============================================================================
// SSE Event Fixtures
// ============================================================================
export {
  // Progress events
  progressBatch1of5,
  progressBatch3of5,
  progressBatch5of5,
  progressComplete,
  progressPhase0,
  progressPhase1,

  // Character events
  characterEventMarco,
  characterEventAnna,
  characterEventBackground,

  // Color profile events
  colorProfileEvent,
  colorProfileEventLowConfidence,

  // Batch complete events
  batchComplete1,
  batchComplete2,
  batchCompleteFinal,

  // Log events
  logEventPhase0Pending,
  logEventPhase0Complete,
  logEventPhase1,
  logEventPhase2Batch,

  // Script events
  scriptEvent,

  // Complete events
  completeEvent,
  completeEventFewerScenes,
  completeEventWithScript,

  // Error events
  errorEventQuota,
  errorEventRateLimit,
  errorEventTimeout,
  errorEventParse,
  errorEventInvalidUrl,
  errorEventApiError,
  errorEventNetwork,

  // Event sequences
  successfulJobSequence,
  failedJobSequence,
  hybridWorkflowSequence,

  // Collections
  allProgressEvents,
  allCharacterEvents,
  allErrorEvents,
  retryableErrorEvents,
  nonRetryableErrorEvents,

  // Helpers
  serializeSSEEvent,
  createMockSSEStream,
  parseSSEString,
} from "./sse-events";

// ============================================================================
// Error Fixtures
// ============================================================================
export {
  // Error type constants
  ERROR_TYPES,

  // Gemini API errors
  geminiQuotaError,
  geminiRateLimitError,
  geminiInvalidKeyError,
  geminiServerError,
  geminiContentBlockedError,
  geminiModelNotFoundError,

  // Network errors
  networkConnectionRefusedError,
  networkDnsError,
  networkResetError,
  networkSocketTimeoutError,

  // Timeout errors
  timeoutError,
  abortTimeoutError,

  // Parse errors
  parseErrorUnexpectedToken,
  parseErrorUnexpectedEnd,
  parseErrorEmptyResponse,
  parseErrorInvalidStructure,
  parseErrorSceneValidation,

  // Validation errors
  invalidUrlError,
  missingVideoIdError,
  videoUnavailableError,
  missingApiKeyError,
  invalidSceneCountError,

  // Error scenarios
  quotaExceededScenario,
  rateLimitScenario,
  networkTimeoutScenario,
  parseErrorScenario,
  invalidUrlScenario,
  apiErrorScenario,
  networkErrorScenario,
  unknownErrorScenario,
  type ErrorScenario,

  // Collections
  allErrorScenarios,
  retryableScenarios,
  nonRetryableScenarios,
  midJobErrorScenarios,
  startupErrorScenarios,

  // Helpers
  createErrorEvent,
  createBatchError,
  isRetryableErrorType,
  getErrorMessage,
} from "./errors";
