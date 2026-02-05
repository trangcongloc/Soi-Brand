/**
 * Prompt API Request Schema and Types
 * Zod schema validation for the /api/prompt endpoint
 */

import { z } from "zod";
import { VEO_CONFIG } from "@/lib/config";
import { DEFAULT_CONTENT_PACING } from "./constants";

/**
 * Voice language options for narration
 */
export const VOICE_LANGUAGES = [
  "no-voice",
  "english",
  "vietnamese",
  "spanish",
  "french",
  "german",
  "japanese",
  "korean",
  "chinese",
] as const;

/**
 * Audio settings schema for voice, music, and sound effects
 */
export const AudioSettingsSchema = z.object({
  voiceLanguage: z.enum(VOICE_LANGUAGES),
  music: z.boolean(),
  soundEffects: z.boolean(),
  environmentalAudio: z.boolean(),
});

/**
 * Main request schema for the /api/prompt endpoint
 * Validates incoming requests for scene generation
 */
export const PromptRequestSchema = z.object({
  // Workflow selection
  workflow: z.enum(["url-to-script", "script-to-scenes", "url-to-scenes"]),

  // Input sources
  videoUrl: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  scriptText: z.string().optional(),

  // Generation mode
  mode: z.enum(["direct", "hybrid"]).default("hybrid"),

  // Scene configuration
  sceneCount: z.number().int().min(1).max(VEO_CONFIG.MAX_AUTO_SCENES).default(40),
  sceneCountMode: z.enum(["auto", "manual", "gemini"]).default("auto"),
  batchSize: z.number().int().min(1).max(60).default(VEO_CONFIG.DEFAULT_BATCH_SIZE),
  contentPacing: z.enum(["fast", "standard", "slow"]).default(DEFAULT_CONTENT_PACING),

  // Voice/Audio settings
  voice: z.enum(VOICE_LANGUAGES).default("no-voice"),
  audio: AudioSettingsSchema.optional(),

  // Video metadata options
  useVideoTitle: z.boolean().default(true),
  useVideoDescription: z.boolean().default(true),
  useVideoChapters: z.boolean().default(true),
  useVideoCaptions: z.boolean().default(true),

  // Prompt customization
  negativePrompt: z.string().optional(),

  // Resume/retry support
  resumeJobId: z.string().optional(),
  resumeFromBatch: z.number().int().min(0).optional(),
  existingScenes: z.array(z.any()).optional(),
  existingCharacters: z.record(z.string(), z.any()).optional(),

  // API configuration
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
  apiKeyTier: z.enum(["free", "paid"]).optional(),

  // Phase 0: Color profile extraction
  extractColorProfile: z.boolean().default(true),
  existingColorProfile: z.any().optional(),

  // Media type: image vs video generation
  mediaType: z.enum(["image", "video"]).default("video"),

  // Selfie mode (genuine shot-type toggle)
  selfieMode: z.boolean().default(false),
});

/**
 * Inferred type from the schema
 */
export type PromptRequest = z.infer<typeof PromptRequestSchema>;

/**
 * Validated request with all defaults applied
 */
export type ValidatedPromptRequest = Required<
  Pick<PromptRequest,
    | "workflow"
    | "mode"
    | "sceneCount"
    | "sceneCountMode"
    | "batchSize"
    | "contentPacing"
    | "voice"
    | "useVideoTitle"
    | "useVideoDescription"
    | "useVideoChapters"
    | "useVideoCaptions"
    | "extractColorProfile"
    | "mediaType"
    | "selfieMode"
  >
> & Omit<PromptRequest,
    | "workflow"
    | "mode"
    | "sceneCount"
    | "sceneCountMode"
    | "batchSize"
    | "contentPacing"
    | "voice"
    | "useVideoTitle"
    | "useVideoDescription"
    | "useVideoChapters"
    | "useVideoCaptions"
    | "extractColorProfile"
    | "mediaType"
    | "selfieMode"
>;
