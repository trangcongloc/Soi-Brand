/**
 * VEO Pipeline - Barrel export
 */

// Types
export * from "./types";

// Utilities
export {
  extractVideoId,
  isValidYouTubeUrl,
  sanitizeForFolder,
  parseDuration,
  formatTime,
  formatTimeLong,
  generateTimeRanges,
  validatePositiveInt,
  sleep,
  generateJobId,
  getVoiceLabel,
  estimateProcessingTime,
  formatProcessingTime,
  truncateText,
  getYouTubeThumbnail,
  cleanScriptText,
} from "./utils";

// Prompt building
export {
  CHARACTER_ANALYSIS_PROMPT,
  DEFAULT_NEGATIVE_PROMPT,
  getDefaultNegativePrompt,
  addVoiceInstructions,
  buildContinuityContext,
  buildScenePrompt,
  buildScriptPrompt,
  buildScriptToScenesPrompt,
  parseScriptResponse,
  // Phase 0: Color profile extraction
  buildColorProfileExtractionPrompt,
  parseColorProfileResponse,
  buildCinematicProfileContext,
  cinematicProfileToStyleFields,
  // Phase 1: Character extraction
  buildCharacterExtractionPrompt,
  parseCharacterExtractionResponse,
} from "./prompts";

// Gemini API
export {
  callGeminiAPI,
  callGeminiAPIWithRetry,
  parseGeminiResponse,
  generateScenesDirect,
  generateScenesHybrid,
  extractCharacterRegistry,
  getCharacterDescription,
  mapErrorToType,
  isRetryableError,
  // Phase 0: Color profile extraction
  extractColorProfileFromVideo,
  // Phase 1: Character extraction
  extractCharactersFromVideo,
  extractionResultToRegistry,
} from "./gemini";

// Caching
export {
  getCachedJobsForVideo,
  getCachedJob,
  getLatestCachedJob,
  setCachedJob,
  clearExpiredJobs,
  clearAllJobs,
  deleteCachedJob,
  getCachedJobList,
} from "./cache";

// Progress tracking
export {
  loadProgress,
  saveProgress,
  clearProgress,
  hasProgress,
  createProgress,
  updateProgressAfterBatch,
  markProgressFailed,
  markProgressCompleted,
  createProgressTracker,
  serverProgress,
  calculateProgressPercent,
  getProgressMessage,
  updateProgressWithScript,
  getResumeData,
  canResumeProgress,
} from "./progress";
