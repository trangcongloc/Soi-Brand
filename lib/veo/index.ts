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
} from "./utils";

// Prompt building
export {
  CHARACTER_ANALYSIS_PROMPT,
  addVoiceInstructions,
  buildContinuityContext,
  buildScenePrompt,
  buildScriptPrompt,
  buildScriptToScenesPrompt,
  parseScriptResponse,
} from "./prompts";

// Gemini API
export {
  callGeminiAPI,
  callGeminiAPIWithRetry,
  parseGeminiResponse,
  generateScenesDirect,
  generateScenesHybrid,
  extractCharacterRegistry,
  mapErrorToType,
  isRetryableError,
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
} from "./progress";
