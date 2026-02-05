/**
 * Prompt API Request Schema
 * Zod schema for validating POST /api/prompt requests
 */

import { z } from "zod";
import { VEO_CONFIG } from "@/lib/config";

/**
 * Request schema validation for VEO/Prompt API
 */
export const PromptRequestSchema = z.object({
  workflow: z.enum(["url-to-script", "script-to-scenes", "url-to-scenes"]),
  videoUrl: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  scriptText: z.string().optional(),
  mode: z.enum(["direct", "hybrid"]).default("hybrid"),
  sceneCount: z.number().int().min(1).max(VEO_CONFIG.MAX_AUTO_SCENES).default(40),
  sceneCountMode: z.enum(["auto", "manual", "gemini"]).default("auto"),
  batchSize: z.number().int().min(1).max(60).default(VEO_CONFIG.DEFAULT_BATCH_SIZE),
  voice: z
    .enum([
      "no-voice",
      "english",
      "vietnamese",
      "spanish",
      "french",
      "german",
      "japanese",
      "korean",
      "chinese",
    ])
    .default("no-voice"),
  audio: z.object({
    voiceLanguage: z.enum([
      "no-voice",
      "english",
      "vietnamese",
      "spanish",
      "french",
      "german",
      "japanese",
      "korean",
      "chinese",
    ]),
    music: z.boolean(),
    soundEffects: z.boolean(),
    environmentalAudio: z.boolean(),
  }).optional(),
  useVideoTitle: z.boolean().default(true),
  useVideoDescription: z.boolean().default(true),
  useVideoChapters: z.boolean().default(true),
  useVideoCaptions: z.boolean().default(true),
  negativePrompt: z.string().optional(),
  resumeJobId: z.string().optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
  apiKeyTier: z.enum(["free", "paid"]).optional(),
  // Resume parameters (BUG FIX #7)
  resumeFromBatch: z.number().int().min(0).optional(),
  existingScenes: z.array(z.any()).optional(),
  existingCharacters: z.record(z.string(), z.any()).optional(),
  // Phase 0: Color profile extraction
  extractColorProfile: z.boolean().default(true),
  existingColorProfile: z.any().optional(),
  // Media type: image vs video generation
  mediaType: z.enum(["image", "video"]).default("video"),
  // Selfie mode
  selfieMode: z.boolean().default(false),
});

export type PromptRequest = z.infer<typeof PromptRequestSchema>;
