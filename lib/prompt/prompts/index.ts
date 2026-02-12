/**
 * Prompt Pipeline - Barrel export for all prompt modules
 */

// Negative prompts
export { DEFAULT_NEGATIVE_PROMPT, getDefaultNegativePrompt } from "./negative-prompts";

// Character extraction (Phase 1)
export { buildCharacterExtractionPrompt, parseCharacterExtractionResponse } from "./character-extraction";

// Color profile & video analysis (Phase 0 + combined)
export {
  buildColorProfileExtractionPrompt,
  parseColorProfileResponse,
  enrichExtractedProfile,
  buildCinematicProfileContext,
  cinematicProfileToStyleFields,
  buildVideoAnalysisPrompt,
  parseVideoAnalysisResponse,
} from "./color-profile";

// Scene generation (Phase 2)
export {
  buildScenePrompt,
  getMediaTypeInstructions,
  RESPONSE_SCHEMA,
} from "./scene-generation";

// Script generation (Steps 1 & 2)
export { buildScriptPrompt, buildScriptToScenesPrompt } from "./script-generation";

// Shared utilities
export {
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
} from "./shared";
