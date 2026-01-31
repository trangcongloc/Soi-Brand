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
  enrichExtractedProfile,
  // Phase 1: Character extraction
  buildCharacterExtractionPrompt,
  parseCharacterExtractionResponse,
  // VEO 3 Prompting Guide instructions
  VEO3_AUDIO_INSTRUCTIONS,
  VEO3_DIALOGUE_INSTRUCTIONS,
  VEO3_CAMERA_INSTRUCTIONS,
  VEO3_EXPRESSION_INSTRUCTIONS,
  VEO3_COMPOSITION_INSTRUCTIONS,
  VEO3_PHYSICS_INSTRUCTIONS,
  VEO3_SELFIE_INSTRUCTIONS,
  VEO3_QUALITY_CHECKLIST,
  buildVeo3Instructions,
} from "./prompts";

// VEO 3 Templates
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

// VEO 3 Validation & Quality Scoring
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

// Form settings persistence
export {
  getDefaultVeoFormSettings,
  loadVeoFormSettings,
  saveVeoFormSettings,
} from "./settings";

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
