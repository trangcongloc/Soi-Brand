/**
 * Prompt Pipeline - Barrel export
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
  DEFAULT_NEGATIVE_PROMPT,
  getDefaultNegativePrompt,
  addVoiceInstructions,
  addAudioInstructions,
  voiceLanguageToAudioSettings,
  buildContinuityContext,
  // PERF-001 FIX: Cached version for O(1) repeated calls
  buildContinuityContextCached,
  resetContinuityCache,
  buildScenePrompt,
  buildScriptPrompt,
  buildScriptToScenesPrompt,
  parseScriptResponse,
  // Phase 0: Color profile extraction
  buildColorProfileExtractionPrompt,
  parseColorProfileResponse,
  buildCinematicProfileContext,
  cinematicProfileToStyleFields,
  enrichExtractedProfile,
  // Phase 1: Character extraction
  buildCharacterExtractionPrompt,
  parseCharacterExtractionResponse,
  // Combined Video Analysis (Phase 0+1 merged)
  buildVideoAnalysisPrompt,
  parseVideoAnalysisResponse,
} from "./prompts";

// Prompt 3 Templates
export {
  TEMPLATE_REGISTRY,
  POV_VLOG_TEMPLATE,
  ASMR_MACRO_TEMPLATE,
  STREET_INTERVIEW_TEMPLATE,
  CORPORATE_TEMPLATE,
  EDUCATIONAL_TEMPLATE,
  HORROR_THRILLER_TEMPLATE,
  FASHION_BEAUTY_TEMPLATE,
  DOCUMENTARY_TEMPLATE,
  getTemplatesByCategory,
  getTemplateById,
  getAvailableTemplateIds,
  getTemplateCategories,
  applyTemplate,
  validateTemplateVariables,
} from "./templates";

// Prompt 3 Validation & Quality Scoring
export {
  validateQualityChecklist,
  getChecklistCompletionCount,
  getQualityLevel,
  calculatePromptQualityScore,
  validateBatchQuality,
} from "./validation";

// Gemini API
export {
  callGeminiAPI,
  callGeminiAPIWithRetry,
  parseGeminiResponse,
  extractCharacterRegistry,
  getCharacterDescription,
  mapErrorToType,
  isRetryableError,
  // Phase 0: Color profile extraction
  extractColorProfileFromVideo,
  // Phase 1: Character extraction
  extractCharactersFromVideo,
  extractionResultToRegistry,
  // Combined Video Analysis (Phase 0+1 merged)
  extractVideoAnalysis,
} from "./gemini";

export type { GeminiCallMeta } from "./gemini";

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
  isUsingCloudStorage,
  syncJobToCloud,
  deleteJobFromLocal,
  deleteJobFromCloud,
  fixOrphanedJobs,
} from "./cache";

// Form settings persistence
export {
  DEFAULT_AUDIO_SETTINGS,
  getDefaultPromptFormSettings,
  loadPromptFormSettings,
  savePromptFormSettings,
} from "./settings";

// D1-only: Phase-level caching removed - all data stored in CachedPromptJob via D1

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

// Interactions API (for video analysis and multi-turn chat)
export {
  startSession,
  getSession,
  updateSession,
  closeSession,
  createInteraction,
  createInteractionStream,
  createInteractionWithRetry,
  continueSession,
  continueSessionStream,
  extractScenesWithInteractions,
  shouldUseInteractionsAPI,
  getSessionInfo,
} from "./interactions";
