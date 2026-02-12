/**
 * Prompt Pipeline - Re-export from split modules
 *
 * This file was split into focused modules under ./prompts/
 * All public exports are maintained here for backward compatibility.
 */

export {
  // Negative prompts
  DEFAULT_NEGATIVE_PROMPT,
  getDefaultNegativePrompt,

  // Character extraction (Phase 1)
  buildCharacterExtractionPrompt,
  parseCharacterExtractionResponse,

  // Color profile & video analysis (Phase 0 + combined)
  buildColorProfileExtractionPrompt,
  parseColorProfileResponse,
  enrichExtractedProfile,
  buildCinematicProfileContext,
  cinematicProfileToStyleFields,
  buildVideoAnalysisPrompt,
  parseVideoAnalysisResponse,

  // Scene generation (Phase 2)
  buildScenePrompt,
  getMediaTypeInstructions,
  RESPONSE_SCHEMA,

  // Script generation (Steps 1 & 2)
  buildScriptPrompt,
  buildScriptToScenesPrompt,

  // Shared utilities
  voiceLanguageToAudioSettings,
  addAudioInstructions,
  addVoiceInstructions,
  buildContinuityContext,
  buildContinuityContextCached,
  resetContinuityCache,
  parseScriptResponse,
  extractJsonFromText,
  repairTruncatedJson,
  formatCharacterSkeletonForPrompt,
  buildPreExtractedCharactersContext,
} from "./prompts/index";
