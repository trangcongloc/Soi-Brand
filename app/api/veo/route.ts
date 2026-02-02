/**
 * VEO API Route - Video Scene Generation with SSE
 * POST /api/veo - Generate scenes from YouTube video or script
 *
 * Supports two workflows:
 * 1. url-to-script: Generate script/transcript from video URL
 * 2. script-to-scenes: Generate scenes from provided script text
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  isValidYouTubeUrl,
  extractVideoId,
  generateJobId,
  buildScriptPrompt,
  buildScriptToScenesPrompt,
  buildScenePrompt,
  buildContinuityContext,
  callGeminiAPIWithRetry,
  parseGeminiResponse,
  parseScriptResponse,
  extractCharacterRegistry,
  getCharacterDescription,
  serverProgress,
  createProgress,
  markProgressFailed,
  markProgressCompleted,
  parseDuration,
  cleanScriptText,
  formatTime,
  // Phase 0: Color profile extraction
  extractColorProfileFromVideo,
  // Phase 1: Character extraction
  extractCharactersFromVideo,
  extractionResultToRegistry,
  VeoMode,
  VoiceLanguage,
  AudioSettings,
  VeoErrorType,
  Scene,
  CharacterRegistry,
  CharacterSkeleton,
  CinematicProfile,
  DirectBatchInfo,
  VeoSSEEvent,
  VeoJobSummary,
  GeminiApiError,
  GeneratedScript,
  MediaType,
} from "@/lib/veo";
import { processSceneBatch } from "@/lib/veo/scene-processor";
import { getVideoInfo, parseISO8601Duration, parseVideoDescription, type VideoDescription } from "@/lib/youtube";
import {
  checkRateLimit,
  getClientIdentifier,
  detectApiKeyTier,
  getTierRateLimit
} from "@/lib/rateLimit";
import { VEO_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";
import { handleAPIError, type UnifiedErrorType } from "@/lib/error-handler";
import {
  SSE_KEEPALIVE_INTERVAL_MS,
  BATCH_DELAY_MS,
  FALLBACK_VIDEO_DURATION_SECONDS,
  DEFAULT_SECONDS_PER_SCENE,
} from "@/lib/veo/constants";

const isDev = process.env.NODE_ENV === "development";

/**
 * Map UnifiedErrorType to VeoErrorType
 * Converts general error types to VEO-specific error types
 */
function mapToVeoErrorType(unifiedType: UnifiedErrorType): VeoErrorType {
  // Map unified types to VEO types
  const mapping: Record<string, VeoErrorType> = {
    INVALID_URL: "INVALID_URL",
    GEMINI_API_ERROR: "GEMINI_API_ERROR",
    GEMINI_QUOTA: "GEMINI_QUOTA",
    GEMINI_RATE_LIMIT: "GEMINI_RATE_LIMIT",
    NETWORK_ERROR: "NETWORK_ERROR",
    PARSE_ERROR: "PARSE_ERROR",
    AI_PARSE_ERROR: "PARSE_ERROR",
    TIMEOUT: "TIMEOUT",
    // Map other types to closest VEO equivalent
    YOUTUBE_QUOTA: "GEMINI_QUOTA", // Rate limiting
    YOUTUBE_API_ERROR: "GEMINI_API_ERROR", // General API error
    RATE_LIMIT: "GEMINI_RATE_LIMIT", // Rate limiting
    MODEL_OVERLOAD: "GEMINI_API_ERROR", // API overload
    API_CONFIG: "GEMINI_API_ERROR", // Configuration error
    CHANNEL_NOT_FOUND: "INVALID_URL", // URL-related error
    UNKNOWN: "UNKNOWN_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
  };

  return mapping[unifiedType] || "UNKNOWN_ERROR";
}

/**
 * Format error for SSE response with detailed info
 * Uses unified error handler for consistent error messages
 */
function formatErrorMessage(error: unknown, context?: string): string {
  const errorResult = handleAPIError(error, context);

  // Use English message for error logging/display (default)
  let message = errorResult.message.en;

  // In dev mode, add additional debug info
  if (isDev && typeof error === "object" && error !== null) {
    const geminiError = error as GeminiApiError;
    if (geminiError.status) {
      message += ` [${geminiError.status}]`;
    }
    if (geminiError.response?.error?.message) {
      message += ` - ${geminiError.response.error.message}`;
    }
  }

  return message;
}

// Request schema validation
const VeoRequestSchema = z.object({
  workflow: z.enum(["url-to-script", "script-to-scenes", "url-to-scenes"]),
  videoUrl: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  scriptText: z.string().optional(),
  mode: z.enum(["direct", "hybrid"]).default("hybrid"),
  sceneCount: z.number().int().min(1).max(VEO_CONFIG.MAX_AUTO_SCENES).default(40),
  autoSceneCount: z.boolean().default(true), // Auto-calculate scene count from duration
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
  useVideoTitle: z.boolean().default(true), // Include video title in script prompt
  useVideoDescription: z.boolean().default(true), // Include full description text in script prompt
  useVideoChapters: z.boolean().default(true), // Include video description chapters
  useVideoCaptions: z.boolean().default(true), // Extract on-screen captions/subtitles
  negativePrompt: z.string().optional(),
  resumeJobId: z.string().optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
  apiKeyTier: z.enum(["free", "paid"]).optional(),
  // Resume parameters
  resumeFromBatch: z.number().int().min(0).optional(),
  existingScenes: z.array(z.any()).optional(),
  existingCharacters: z.record(z.string(), z.any()).optional(),
  // Phase 0: Color profile extraction
  extractColorProfile: z.boolean().default(true), // Enable by default
  existingColorProfile: z.any().optional(), // For resume
  // Media type: image vs video generation
  mediaType: z.enum(["image", "video"]).default("video"),
  // Selfie mode (genuine shot-type toggle — VEO 3 techniques are integrated by default)
  selfieMode: z.boolean().default(false),
});

type VeoRequest = z.infer<typeof VeoRequestSchema>;

/**
 * Create SSE encoder for streaming events
 */
function createSSEEncoder() {
  const encoder = new TextEncoder();

  return {
    encode: (event: VeoSSEEvent): Uint8Array => {
      const data = JSON.stringify(event);
      return encoder.encode(`data: ${data}\n\n`);
    },
    encodeKeepAlive: (): Uint8Array => {
      return encoder.encode(`: keepalive\n\n`);
    },
  };
}

/**
 * Run URL to Script workflow - generates script from video
 */
async function runUrlToScript(
  request: VeoRequest,
  apiKey: string,
  sendEvent: (event: VeoSSEEvent) => void,
  videoDescription?: VideoDescription,
  videoTitle?: string,
  videoDescriptionText?: string,
  useVideoCaptions?: boolean,
): Promise<GeneratedScript> {
  sendEvent({
    event: "progress",
    data: { batch: 1, total: 1, scenes: 0, message: "Analyzing video and generating script transcript..." },
  });

  const requestBody = buildScriptPrompt({
    videoUrl: request.videoUrl!,
    startTime: request.startTime,
    endTime: request.endTime,
    videoDescription,
    videoTitle,
    videoDescriptionText,
    useVideoCaptions,
  });

  // Send pending log before API call
  const scriptLogId = `log_script_${Date.now()}`;
  sendEvent({
    event: "log",
    data: {
      id: scriptLogId,
      timestamp: new Date().toISOString(),
      phase: "phase-0",
      status: "pending",
      request: {
        model: request.geminiModel || "default",
        body: JSON.stringify(requestBody),
        promptLength: JSON.stringify(requestBody).length,
        videoUrl: request.videoUrl,
      },
      response: { success: false, body: "", responseLength: 0, parsedSummary: "awaiting response..." },
      timing: { durationMs: 0, retries: 0 },
    },
  });

  const { response, meta } = await callGeminiAPIWithRetry(requestBody, {
    apiKey,
    model: request.geminiModel,
    onRetry: (attempt) => {
      sendEvent({
        event: "progress",
        data: { batch: 1, total: 1, scenes: 0, message: `Retry ${attempt}...` },
      });
    },
  });

  // Send log update with completed data
  sendEvent({
    event: "logUpdate",
    data: {
      id: scriptLogId,
      timestamp: new Date().toISOString(),
      phase: "phase-0",
      status: "completed",
      request: {
        model: meta.model,
        body: JSON.stringify(requestBody),
        promptLength: meta.promptLength,
        videoUrl: request.videoUrl,
      },
      response: {
        success: true,
        finishReason: response.candidates?.[0]?.finishReason,
        body: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
        responseLength: meta.responseLength,
        parsedSummary: "script extracted",
      },
      timing: { durationMs: meta.durationMs, retries: meta.retries },
      tokens: meta.tokens,
    },
  });

  sendEvent({
    event: "progress",
    data: { batch: 1, total: 1, scenes: 0, message: "Script extraction complete, preparing for scene generation..." },
  });

  const script = parseScriptResponse(response);
  return script;
}

/**
 * Run Script to Scenes - Direct mode (single API call)
 */
async function runScriptToScenesDirect(
  request: VeoRequest,
  apiKey: string,
  sendEvent: (event: VeoSSEEvent) => void
): Promise<{
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  elapsed: number;
}> {
  const startTime = Date.now();

  sendEvent({
    event: "progress",
    data: { batch: 1, total: 1, scenes: 0, message: "Converting script to scene descriptions..." },
  });

  const requestBody = buildScriptToScenesPrompt({
    scriptText: request.scriptText!,
    sceneCount: request.sceneCount,
    voiceLang: request.voice as VoiceLanguage,
    audio: request.audio as AudioSettings | undefined,
    globalNegativePrompt: request.negativePrompt,
    mediaType: request.mediaType as MediaType,
    selfieMode: request.selfieMode,
  });

  // Send pending log before API call
  const directLogId = `log_direct_scenes_${Date.now()}`;
  sendEvent({
    event: "log",
    data: {
      id: directLogId,
      timestamp: new Date().toISOString(),
      phase: "phase-2",
      status: "pending",
      request: {
        model: request.geminiModel || "default",
        body: JSON.stringify(requestBody),
        promptLength: JSON.stringify(requestBody).length,
      },
      response: { success: false, body: "", responseLength: 0, parsedSummary: "awaiting response..." },
      timing: { durationMs: 0, retries: 0 },
    },
  });

  const { response, meta } = await callGeminiAPIWithRetry(requestBody, {
    apiKey,
    model: request.geminiModel,
    onRetry: (attempt) => {
      sendEvent({
        event: "progress",
        data: { batch: 1, total: 1, scenes: 0, message: `Retry ${attempt}...` },
      });
    },
  });

  sendEvent({
    event: "progress",
    data: { batch: 1, total: 1, scenes: 0, message: "Processing response and extracting scene data..." },
  });

  const scenes = parseGeminiResponse(response);
  const characterRegistry = extractCharacterRegistry(scenes);
  const elapsed = (Date.now() - startTime) / 1000;

  // Send log update with completed data
  sendEvent({
    event: "logUpdate",
    data: {
      id: directLogId,
      timestamp: new Date().toISOString(),
      phase: "phase-2",
      status: "completed",
      request: {
        model: meta.model,
        body: JSON.stringify(requestBody),
        promptLength: meta.promptLength,
      },
      response: {
        success: true,
        finishReason: response.candidates?.[0]?.finishReason,
        body: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
        responseLength: meta.responseLength,
        parsedItemCount: scenes.length,
        parsedSummary: `${scenes.length} scenes`,
      },
      timing: { durationMs: meta.durationMs, retries: meta.retries },
      tokens: meta.tokens,
    },
  });

  // Send character events
  for (const [name, charData] of Object.entries(characterRegistry)) {
    sendEvent({
      event: "character",
      data: { name, description: getCharacterDescription(charData) },
    });
  }

  return { scenes, characterRegistry, elapsed };
}

/**
 * Run Script to Scenes - Hybrid mode (batched)
 * Phase 2: Can use pre-extracted characters from Phase 1
 */
async function runScriptToScenesHybrid(
  request: VeoRequest,
  apiKey: string,
  jobId: string,
  sendEvent: (event: VeoSSEEvent) => void,
  // Phase 0: Pre-extracted cinematic profile
  cinematicProfile?: CinematicProfile,
  // Phase 2: Pre-extracted characters from Phase 1
  preExtractedCharacters?: CharacterSkeleton[],
  preExtractedBackground?: string
): Promise<{
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  elapsed: number;
  failedBatch?: number;
}> {
  const startTime = Date.now();
  const totalBatches = Math.ceil(request.sceneCount / request.batchSize);

  // Resume support: Initialize with existing data if resuming
  const startBatch = request.resumeFromBatch ?? 0;
  let allScenes: Scene[] = request.existingScenes ?? [];
  let characterRegistry: CharacterRegistry = request.existingCharacters ?? {};

  // Initialize progress tracking
  const progress = createProgress({
    jobId,
    mode: "hybrid",
    youtubeUrl: request.videoUrl ?? "",
    videoId: request.videoUrl ? extractVideoId(request.videoUrl) : "",
    sceneCount: request.sceneCount,
    batchSize: request.batchSize,
    voiceLang: request.voice as VoiceLanguage,
    totalBatches,
    scriptText: request.scriptText,
  });

  // If resuming, update progress to reflect completed batches
  if (startBatch > 0) {
    progress.completedBatches = startBatch;
    progress.scenes = allScenes;
    progress.characterRegistry = characterRegistry;
    progress.status = "in_progress";

    sendEvent({
      event: "progress",
      data: {
        batch: startBatch,
        total: totalBatches,
        scenes: allScenes.length,
        message: `Resuming from batch ${startBatch + 1}/${totalBatches} with ${allScenes.length} existing scenes`,
      },
    });
  }

  serverProgress.set(jobId, progress);

  // Split script into chunks for batching
  const scriptLines = request.scriptText!.split("\n").filter((l) => l.trim());
  const linesPerBatch = Math.ceil(scriptLines.length / totalBatches);

  for (let batchNum = startBatch; batchNum < totalBatches; batchNum++) {
    const batchStart = batchNum * request.batchSize + 1;
    const batchEnd = Math.min((batchNum + 1) * request.batchSize, request.sceneCount);
    const batchSceneCount = batchEnd - batchStart + 1;

    // Get script chunk for this batch
    const scriptChunkStart = batchNum * linesPerBatch;
    const scriptChunkEnd = Math.min((batchNum + 1) * linesPerBatch, scriptLines.length);
    const scriptChunk = scriptLines.slice(scriptChunkStart, scriptChunkEnd).join("\n");

    sendEvent({
      event: "progress",
      data: {
        batch: batchNum + 1,
        total: totalBatches,
        scenes: allScenes.length,
        message: `Generating scenes ${batchStart}-${batchEnd} (batch ${batchNum + 1}/${totalBatches})`,
      },
    });

    // Build context from previous scenes (outside try for error logging)
    const continuityContext =
      allScenes.length > 0 ? buildContinuityContext(allScenes, characterRegistry) : "";

    try {
      // Build prompt for Phase 2 scene generation with pre-extracted characters and color profile
      const requestBody = buildScriptToScenesPrompt({
        scriptText: scriptChunk + (continuityContext ? `\n\n${continuityContext}` : ""),
        sceneCount: batchSceneCount,
        voiceLang: request.voice as VoiceLanguage,
        audio: request.audio as AudioSettings | undefined,
        globalNegativePrompt: request.negativePrompt,
        // Phase 0: Use pre-extracted cinematic profile
        cinematicProfile: cinematicProfile || undefined,
        // Media type: image vs video generation
        mediaType: request.mediaType as MediaType,
        // Phase 2: Use pre-extracted characters from Phase 1
        preExtractedCharacters: preExtractedCharacters && preExtractedCharacters.length > 0 ? preExtractedCharacters : undefined,
        preExtractedBackground: preExtractedBackground || undefined,
        selfieMode: request.selfieMode,
      });

      // Send pending log before API call
      const hybridLogId = `log_phase2_batch${batchNum}_${Date.now()}`;
      sendEvent({
        event: "log",
        data: {
          id: hybridLogId,
          timestamp: new Date().toISOString(),
          phase: "phase-2",
          batchNumber: batchNum,
          status: "pending",
          request: {
            model: request.geminiModel || "default",
            body: JSON.stringify(requestBody),
            promptLength: JSON.stringify(requestBody).length,
          },
          response: { success: false, body: "", responseLength: 0, parsedSummary: "awaiting response..." },
          timing: { durationMs: 0, retries: 0 },
        },
      });

      const { response, meta: batchMeta } = await callGeminiAPIWithRetry(requestBody, {
        apiKey,
        model: request.geminiModel,
        onRetry: (attempt) => {
          sendEvent({
            event: "progress",
            data: {
              batch: batchNum + 1,
              total: totalBatches,
              scenes: allScenes.length,
              message: `Batch ${batchNum + 1} retry ${attempt}...`,
            },
          });
        },
      });

      const batchScenes = parseGeminiResponse(response);

      if (Array.isArray(batchScenes)) {
        // Process batch using unified scene processor
        const result = processSceneBatch({
          batchScenes,
          existingScenes: allScenes,
          existingCharacters: characterRegistry,
          batchNum,
          totalBatches,
          jobId,
          serverProgress,
          sendEvent,
        });

        // Update state with processed results
        allScenes = result.scenes;
        characterRegistry = result.characterRegistry;

        // Send log update with completed data
        sendEvent({
          event: "logUpdate",
          data: {
            id: hybridLogId,
            timestamp: new Date().toISOString(),
            phase: "phase-2",
            batchNumber: batchNum,
            status: "completed",
            request: {
              model: batchMeta.model,
              body: JSON.stringify(requestBody),
              promptLength: batchMeta.promptLength,
            },
            response: {
              success: true,
              finishReason: response.candidates?.[0]?.finishReason,
              body: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
              responseLength: batchMeta.responseLength,
              parsedItemCount: batchScenes.length,
              parsedSummary: `${batchScenes.length} scenes`,
            },
            timing: { durationMs: batchMeta.durationMs, retries: batchMeta.retries },
            tokens: batchMeta.tokens,
          },
        });

        // Send batchComplete event for client-side phase caching
        sendEvent({
          event: "batchComplete",
          data: {
            batchNumber: batchNum,
            scenes: batchScenes,
            characters: result.characterRegistry,
          },
        });
      }

      // Delay between batches (except for last batch)
      if (batchNum < totalBatches - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    } catch (err) {
      const error = err as GeminiApiError;
      const errorResult = handleAPIError(error, `Batch ${batchNum + 1}/${totalBatches} failed`);
      const errorMessage = formatErrorMessage(error, `Batch ${batchNum + 1}/${totalBatches} failed`);

      // Log detailed error for debugging
      logger.error("VEO Batch Error", {
        batch: batchNum + 1,
        totalBatches,
        type: errorResult.type,
        status: error.status,
        message: error.message,
        apiError: error.response?.error?.message,
        scenesCompleted: allScenes.length,
        jobId,
      });

      // Update progress with error
      const failedProgress = markProgressFailed(serverProgress.get(jobId)!, errorMessage);
      serverProgress.set(jobId, failedProgress);

      sendEvent({
        event: "error",
        data: {
          type: mapToVeoErrorType(errorResult.type),
          message: errorMessage,
          retryable: errorResult.retryable,
          failedBatch: batchNum + 1,
          totalBatches,
          scenesCompleted: allScenes.length,
          // Include additional debug info in dev mode
          ...(isDev && {
            debug: {
              status: error.status,
              apiError: error.response?.error?.message,
            },
          }),
        },
      });

      const elapsed = (Date.now() - startTime) / 1000;
      return {
        scenes: allScenes,
        characterRegistry,
        elapsed,
        failedBatch: batchNum + 1,
      };
    }
  }

  // Mark as completed
  const completedProgress = markProgressCompleted(serverProgress.get(jobId)!);
  serverProgress.set(jobId, completedProgress);

  const elapsed = (Date.now() - startTime) / 1000;
  return { scenes: allScenes, characterRegistry, elapsed };
}

/**
 * Run URL to Scenes - Direct mode (video → scenes, no script generation)
 * Uses time-based batching to analyze video segments directly
 */
async function runUrlToScenesDirect(
  request: VeoRequest,
  apiKey: string,
  jobId: string,
  videoDurationSeconds: number,
  sendEvent: (event: VeoSSEEvent) => void,
  // Phase 0: Pre-extracted cinematic profile (optional)
  cinematicProfile?: CinematicProfile
): Promise<{
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  elapsed: number;
  failedBatch?: number;
  colorProfile?: CinematicProfile;
}> {
  const startTime = Date.now();

  // Calculate time-based batches
  // Each scene is ~DEFAULT_SECONDS_PER_SCENE seconds, so batch covers batchSize * DEFAULT_SECONDS_PER_SCENE seconds of video
  const secondsPerScene = DEFAULT_SECONDS_PER_SCENE;
  const secondsPerBatch = request.batchSize * secondsPerScene;
  const totalBatches = Math.max(1, Math.ceil(videoDurationSeconds / secondsPerBatch));

  // Resume support: Initialize with existing data if resuming
  const startBatch = request.resumeFromBatch ?? 0;
  let allScenes: Scene[] = request.existingScenes ?? [];
  let characterRegistry: CharacterRegistry = request.existingCharacters ?? {};

  // Initialize progress tracking
  const progress = createProgress({
    jobId,
    mode: "direct",
    youtubeUrl: request.videoUrl ?? "",
    videoId: request.videoUrl ? extractVideoId(request.videoUrl) : "",
    sceneCount: request.sceneCount,
    batchSize: request.batchSize,
    voiceLang: request.voice as VoiceLanguage,
    totalBatches,
  });

  // If resuming, update progress to reflect completed batches
  if (startBatch > 0) {
    progress.completedBatches = startBatch;
    progress.scenes = allScenes;
    progress.characterRegistry = characterRegistry;
    progress.status = "in_progress";

    sendEvent({
      event: "progress",
      data: {
        batch: startBatch,
        total: totalBatches,
        scenes: allScenes.length,
        message: `Resuming from batch ${startBatch + 1}/${totalBatches} with ${allScenes.length} existing scenes`,
      },
    });
  }

  serverProgress.set(jobId, progress);

  logger.info("VEO Direct Mode Starting", {
    jobId,
    videoDurationSeconds,
    secondsPerBatch,
    totalBatches,
    batchSize: request.batchSize,
    startBatch,
  });

  // ============================================================================
  // PHASE 1: Extract characters FIRST (before scene generation)
  // ============================================================================
  let preExtractedCharacters: CharacterSkeleton[] = [];
  let preExtractedBackground = "";

  // Only run Phase 1 if not resuming (resuming already has characters)
  if (startBatch === 0 && Object.keys(characterRegistry).length === 0) {
    try {
      sendEvent({
        event: "progress",
        data: {
          batch: 0,
          total: totalBatches,
          scenes: 0,
          message: "Analyzing video to identify characters and settings...",
        },
      });

      const characterData = await extractCharactersFromVideo(request.videoUrl!, {
        apiKey,
        model: request.geminiModel,
        onProgress: (msg) => {
          sendEvent({
            event: "progress",
            data: { batch: 0, total: totalBatches, scenes: 0, message: msg },
          });
        },
        onLog: (entry) => sendEvent({ event: "log", data: entry }),
      });

      preExtractedCharacters = characterData.characters;
      preExtractedBackground = characterData.background;

      // Convert to registry and send character events immediately
      const extractedRegistry = extractionResultToRegistry(characterData);
      characterRegistry = { ...characterRegistry, ...extractedRegistry };

      for (const char of characterData.characters) {
        sendEvent({
          event: "character",
          data: { name: char.name, description: getCharacterDescription(char) },
        });
      }

      logger.info("VEO Phase 1 Complete", {
        jobId,
        charactersFound: characterData.characters.length,
        characters: characterData.characters.map(c => c.name),
        hasBackground: !!characterData.background,
      });

      sendEvent({
        event: "progress",
        data: {
          batch: 0,
          total: totalBatches,
          scenes: 0,
          message: `Character analysis complete: Found ${characterData.characters.length} character(s). Generating scene descriptions...`,
        },
      });
    } catch (phase1Error) {
      // Phase 1 failed - log but continue with Phase 2 (fallback to inline extraction)
      const error = phase1Error as GeminiApiError;
      logger.warn("VEO Phase 1 Failed - falling back to inline extraction", {
        jobId,
        error: error.message,
        status: error.status,
      });

      sendEvent({
        event: "progress",
        data: {
          batch: 0,
          total: totalBatches,
          scenes: 0,
          message: "Character extraction skipped, continuing with scene generation...",
        },
      });
    }
  } else if (startBatch > 0) {
    // Resuming - extract characters from existing registry
    for (const [, charData] of Object.entries(characterRegistry)) {
      if (typeof charData === "object") {
        preExtractedCharacters.push(charData);
      }
    }
    logger.info("VEO Resuming with existing characters", {
      jobId,
      existingCharacters: preExtractedCharacters.length,
    });
  }

  // ============================================================================
  // PHASE 2: Generate scenes using pre-extracted characters
  // ============================================================================

  for (let batchNum = startBatch; batchNum < totalBatches; batchNum++) {
    const batchStartSeconds = batchNum * secondsPerBatch;
    const batchEndSeconds = Math.min((batchNum + 1) * secondsPerBatch, videoDurationSeconds);
    const batchSceneCount = Math.ceil((batchEndSeconds - batchStartSeconds) / secondsPerScene);

    const directBatchInfo: DirectBatchInfo = {
      batchNum,
      totalBatches,
      startSeconds: batchStartSeconds,
      endSeconds: batchEndSeconds,
      startTime: formatTime(batchStartSeconds),
      endTime: formatTime(batchEndSeconds),
      sceneCount: batchSceneCount,
    };

    sendEvent({
      event: "progress",
      data: {
        batch: batchNum + 1,
        total: totalBatches,
        scenes: allScenes.length,
        message: `Generating scenes for video segment ${directBatchInfo.startTime}-${directBatchInfo.endTime} (batch ${batchNum + 1}/${totalBatches})`,
      },
    });

    // Build context from previous scenes (outside try for error logging)
    const continuityContext =
      allScenes.length > 0 ? buildContinuityContext(allScenes, characterRegistry) : "";

    try {
      // Build prompt for direct video analysis
      // Build prompt for Phase 2 scene generation with pre-extracted characters and color profile
      const requestBody = buildScenePrompt({
        videoUrl: request.videoUrl!,
        sceneCount: batchSceneCount,
        voiceLang: request.voice as VoiceLanguage,
        audio: request.audio as AudioSettings | undefined,
        continuityContext,
        directBatchInfo,
        globalNegativePrompt: request.negativePrompt,
        // Phase 0: Use pre-extracted cinematic profile
        cinematicProfile: cinematicProfile || undefined,
        // Media type: image vs video generation
        mediaType: request.mediaType as MediaType,
        // Phase 2: Use pre-extracted characters from Phase 1
        preExtractedCharacters: preExtractedCharacters.length > 0 ? preExtractedCharacters : undefined,
        preExtractedBackground: preExtractedBackground || undefined,
        selfieMode: request.selfieMode,
      });

      // Send pending log before API call
      const directBatchLogId = `log_phase2_batch${batchNum}_${Date.now()}`;
      sendEvent({
        event: "log",
        data: {
          id: directBatchLogId,
          timestamp: new Date().toISOString(),
          phase: "phase-2",
          batchNumber: batchNum,
          status: "pending",
          request: {
            model: request.geminiModel || "default",
            body: JSON.stringify(requestBody),
            promptLength: JSON.stringify(requestBody).length,
            videoUrl: request.videoUrl,
          },
          response: { success: false, body: "", responseLength: 0, parsedSummary: "awaiting response..." },
          timing: { durationMs: 0, retries: 0 },
        },
      });

      const { response, meta: batchMeta } = await callGeminiAPIWithRetry(requestBody, {
        apiKey,
        model: request.geminiModel,
        onRetry: (attempt) => {
          sendEvent({
            event: "progress",
            data: {
              batch: batchNum + 1,
              total: totalBatches,
              scenes: allScenes.length,
              message: `Batch ${batchNum + 1} retry ${attempt}...`,
            },
          });
        },
      });

      const batchScenes = parseGeminiResponse(response);

      if (Array.isArray(batchScenes)) {
        // Process batch using unified scene processor
        const result = processSceneBatch({
          batchScenes,
          existingScenes: allScenes,
          existingCharacters: characterRegistry,
          batchNum,
          totalBatches,
          jobId,
          serverProgress,
          sendEvent,
          timeRange: `${directBatchInfo.startTime}-${directBatchInfo.endTime}`,
        });

        // Update state with processed results
        allScenes = result.scenes;
        characterRegistry = result.characterRegistry;

        // Send log update with completed data
        sendEvent({
          event: "logUpdate",
          data: {
            id: directBatchLogId,
            timestamp: new Date().toISOString(),
            phase: "phase-2",
            batchNumber: batchNum,
            status: "completed",
            request: {
              model: batchMeta.model,
              body: JSON.stringify(requestBody),
              promptLength: batchMeta.promptLength,
              videoUrl: request.videoUrl,
            },
            response: {
              success: true,
              finishReason: response.candidates?.[0]?.finishReason,
              body: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
              responseLength: batchMeta.responseLength,
              parsedItemCount: batchScenes.length,
              parsedSummary: `${batchScenes.length} scenes`,
            },
            timing: { durationMs: batchMeta.durationMs, retries: batchMeta.retries },
            tokens: batchMeta.tokens,
          },
        });

        // Send batchComplete event for client-side phase caching
        sendEvent({
          event: "batchComplete",
          data: {
            batchNumber: batchNum,
            scenes: batchScenes,
            characters: result.characterRegistry,
          },
        });
      }

      // Delay between batches (except for last batch)
      if (batchNum < totalBatches - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    } catch (err) {
      const error = err as GeminiApiError;
      const errorResult = handleAPIError(error, `Direct batch ${batchNum + 1}/${totalBatches} failed`);
      const errorMessage = formatErrorMessage(error, `Direct batch ${batchNum + 1}/${totalBatches} failed`);

      // Log detailed error for debugging
      logger.error("VEO Direct Batch Error", {
        batch: batchNum + 1,
        totalBatches,
        type: errorResult.type,
        status: error.status,
        message: error.message,
        apiError: error.response?.error?.message,
        scenesCompleted: allScenes.length,
        jobId,
        timeRange: `${formatTime(batchNum * secondsPerBatch)}-${formatTime(Math.min((batchNum + 1) * secondsPerBatch, videoDurationSeconds))}`,
      });

      // Update progress with error
      const failedProgress = markProgressFailed(serverProgress.get(jobId)!, errorMessage);
      serverProgress.set(jobId, failedProgress);

      sendEvent({
        event: "error",
        data: {
          type: mapToVeoErrorType(errorResult.type),
          message: errorMessage,
          retryable: errorResult.retryable,
          failedBatch: batchNum + 1,
          totalBatches,
          scenesCompleted: allScenes.length,
          // Include additional debug info in dev mode
          ...(isDev && {
            debug: {
              status: error.status,
              apiError: error.response?.error?.message,
            },
          }),
        },
      });

      const elapsed = (Date.now() - startTime) / 1000;
      return {
        scenes: allScenes,
        characterRegistry,
        elapsed,
        failedBatch: batchNum + 1,
      };
    }
  }

  // Mark as completed
  const completedProgress = markProgressCompleted(serverProgress.get(jobId)!);
  serverProgress.set(jobId, completedProgress);

  const elapsed = (Date.now() - startTime) / 1000;
  return { scenes: allScenes, characterRegistry, elapsed, colorProfile: cinematicProfile };
}

export async function POST(request: NextRequest) {
  // Parse request body first to get API key for tier detection
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        event: "error",
        data: { type: "UNKNOWN_ERROR", message: "Invalid request body", retryable: false },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate request
  const parseResult = VeoRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.issues.map((i) => i.message).join(", ");
    return new Response(
      JSON.stringify({
        event: "error",
        data: { type: "UNKNOWN_ERROR", message: `Invalid input: ${errorMessage}`, retryable: false },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const veoRequest = parseResult.data;

  // Get API key (from request or environment)
  const apiKey = veoRequest.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        event: "error",
        data: { type: "GEMINI_API_ERROR", message: "Gemini API key is required", retryable: false },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Detect API key tier (uses cache or explicit tier from request)
  const tier = detectApiKeyTier(apiKey, veoRequest.apiKeyTier);
  const tierRateLimit = getTierRateLimit("veo", tier);

  // Tier-based rate limiting check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, tierRateLimit, tier);

  if (!rateLimitResult.success) {
    const tierLabel = tier === "paid" ? "paid tier" : "free tier";
    return new Response(
      JSON.stringify({
        event: "error",
        data: {
          type: "RATE_LIMIT",
          message: `Rate limit exceeded for ${tierLabel} (${tierRateLimit.limit} requests per minute). Please try again later.`,
          retryable: true,
          tier,
          limit: tierRateLimit.limit,
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(tierRateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          "X-RateLimit-Tier": tier,
        },
      }
    );
  }

  // Workflow-specific validation
  if (veoRequest.workflow === "url-to-script" || veoRequest.workflow === "url-to-scenes") {
    if (!veoRequest.videoUrl) {
      return new Response(
        JSON.stringify({
          event: "error",
          data: { type: "INVALID_URL", message: "Video URL is required for this workflow", retryable: false },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!isValidYouTubeUrl(veoRequest.videoUrl)) {
      return new Response(
        JSON.stringify({
          event: "error",
          data: { type: "INVALID_URL", message: "Invalid YouTube URL format", retryable: false },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } else if (veoRequest.workflow === "script-to-scenes") {
    if (!veoRequest.scriptText || veoRequest.scriptText.trim().length === 0) {
      return new Response(
        JSON.stringify({
          event: "error",
          data: { type: "UNKNOWN_ERROR", message: "Script text is required for this workflow", retryable: false },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Create SSE stream
  const sse = createSSEEncoder();
  const jobId = veoRequest.resumeJobId || generateJobId();
  const videoId = veoRequest.videoUrl ? extractVideoId(veoRequest.videoUrl) : "";

  const stream = new ReadableStream({
    async start(controller) {
      // Keep-alive interval
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(sse.encodeKeepAlive());
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, SSE_KEEPALIVE_INTERVAL_MS);

      const sendEvent = (event: VeoSSEEvent) => {
        try {
          controller.enqueue(sse.encode(event));
        } catch {
          // Stream closed
        }
      };

      try {
        // Handle URL to Script workflow
        if (veoRequest.workflow === "url-to-script") {
          const script = await runUrlToScript(veoRequest, apiKey, sendEvent);

          // Send script event
          sendEvent({
            event: "script",
            data: { script },
          });

          // Send complete event with script summary
          sendEvent({
            event: "complete",
            data: {
              jobId,
              scenes: [],
              characterRegistry: {},
              summary: {
                mode: "direct" as VeoMode,
                youtubeUrl: veoRequest.videoUrl!,
                videoId,
                targetScenes: 0,
                actualScenes: 0,
                voice: "Script generation",
                charactersFound: script.characters.length,
                characters: script.characters,
                processingTime: "N/A",
                createdAt: new Date().toISOString(),
              },
            },
          });
        }
        // Handle URL to Scenes (combined workflow)
        else if (veoRequest.workflow === "url-to-scenes") {
          const startTime = Date.now();

          // Step 0: Fetch video duration from YouTube API (required for both modes)
          sendEvent({
            event: "progress",
            data: { batch: 0, total: 0, scenes: 0, message: "Fetching video metadata from YouTube..." },
          });

          let youtubeDurationSeconds = 0;
          let videoDescription: VideoDescription | undefined;
          let videoTitle: string | undefined;
          let videoDescriptionText: string | undefined;
          try {
            const videoInfo = await getVideoInfo(videoId);
            if (videoInfo?.contentDetails?.duration) {
              youtubeDurationSeconds = parseISO8601Duration(videoInfo.contentDetails.duration);
              logger.info("VEO YouTube Duration", {
                videoId,
                iso8601: videoInfo.contentDetails.duration,
                seconds: youtubeDurationSeconds,
                title: videoInfo.title,
              });
            }
            // Collect video title (if enabled)
            if (veoRequest.useVideoTitle && videoInfo?.title) {
              videoTitle = videoInfo.title;
            }
            // Collect full description text (if enabled)
            if (veoRequest.useVideoDescription && videoInfo?.description) {
              videoDescriptionText = videoInfo.description;
            }
            // Parse video description for chapters (if enabled)
            if (veoRequest.useVideoChapters && videoInfo?.description) {
              videoDescription = parseVideoDescription(videoInfo.description);
              if (videoDescription.chapters && videoDescription.chapters.length > 0) {
                logger.info("VEO Video Chapters Found", {
                  videoId,
                  chapterCount: videoDescription.chapters.length,
                  chapters: videoDescription.chapters.map(c => `${c.timestamp}: ${c.title}`),
                });
              }
            }
          } catch (ytError) {
            logger.warn("Failed to fetch YouTube video info", { videoId, error: ytError });
          }

          let result: {
            scenes: Scene[];
            characterRegistry: CharacterRegistry;
            elapsed: number;
            failedBatch?: number;
            colorProfile?: CinematicProfile;
          };

          let script: GeneratedScript | undefined;
          let effectiveSceneCount = veoRequest.sceneCount;
          let extractedColorProfile: CinematicProfile | undefined = veoRequest.existingColorProfile as CinematicProfile | undefined;

          // DIRECT MODE: Video → Scenes (no script generation)
          if (veoRequest.mode === "direct") {
            // Calculate scene count from YouTube duration
            if (veoRequest.autoSceneCount && youtubeDurationSeconds > 0) {
              const calculatedCount = Math.ceil(youtubeDurationSeconds / DEFAULT_SECONDS_PER_SCENE);
              effectiveSceneCount = Math.max(VEO_CONFIG.MIN_AUTO_SCENES, Math.min(calculatedCount, VEO_CONFIG.MAX_AUTO_SCENES));

              const durationFormatted = `${Math.floor(youtubeDurationSeconds / 60)}m ${youtubeDurationSeconds % 60}s`;
              sendEvent({
                event: "progress",
                data: {
                  batch: 0,
                  total: 0,
                  scenes: 0,
                  message: `Video duration: ${durationFormatted}. Auto-calculated ${effectiveSceneCount} scenes (~${DEFAULT_SECONDS_PER_SCENE}s/scene)`
                },
              });
            } else if (youtubeDurationSeconds === 0) {
              // Duration not available - use default and warn
              logger.warn("VEO Direct Mode: No duration available, using default scene count", {
                videoId,
                defaultSceneCount: effectiveSceneCount,
              });
              sendEvent({
                event: "progress",
                data: {
                  batch: 0,
                  total: 0,
                  scenes: 0,
                  message: `Could not determine video duration. Using ${effectiveSceneCount} scenes.`
                },
              });
              // Estimate fallback duration for unknown duration
              youtubeDurationSeconds = FALLBACK_VIDEO_DURATION_SECONDS;
            }

            sendEvent({
              event: "progress",
              data: { batch: 0, total: 0, scenes: 0, message: "Direct mode: Generating scenes directly from video (skipping script extraction)..." },
            });

            // ============================================================================
            // PHASE 0: Extract cinematic color profile FIRST (before character extraction)
            // ============================================================================
            if (veoRequest.extractColorProfile && !extractedColorProfile) {
              try {
                sendEvent({
                  event: "progress",
                  data: { batch: 0, total: 0, scenes: 0, message: "Phase 0: Extracting cinematic color profile from video..." },
                });

                const colorResult = await extractColorProfileFromVideo(veoRequest.videoUrl!, {
                  apiKey,
                  model: veoRequest.geminiModel,
                  onProgress: (msg) => {
                    sendEvent({
                      event: "progress",
                      data: { batch: 0, total: 0, scenes: 0, message: msg },
                    });
                  },
                  onLog: (entry) => sendEvent({ event: "log", data: entry }),
                });

                extractedColorProfile = colorResult.profile;

                // Send color profile SSE event
                sendEvent({
                  event: "colorProfile",
                  data: {
                    profile: colorResult.profile,
                    confidence: colorResult.confidence,
                  },
                });

                logger.info("VEO Phase 0 Complete (Direct)", {
                  jobId,
                  colorsFound: colorResult.profile.dominantColors.length,
                  confidence: colorResult.confidence,
                  temperature: colorResult.profile.colorTemperature.category,
                  filmStock: colorResult.profile.filmStock.suggested,
                });

                sendEvent({
                  event: "progress",
                  data: {
                    batch: 0,
                    total: 0,
                    scenes: 0,
                    message: `Color profile extracted: ${colorResult.profile.dominantColors.length} colors, ${colorResult.profile.colorTemperature.category} temperature (${(colorResult.confidence * 100).toFixed(0)}% confidence). Proceeding with character analysis...`,
                  },
                });
              } catch (phase0Error) {
                // Phase 0 failed - log but continue (fallback to inferred style)
                const error = phase0Error as GeminiApiError;
                logger.warn("VEO Phase 0 Failed - continuing with inferred style", {
                  jobId,
                  error: error.message,
                  status: error.status,
                });

                sendEvent({
                  event: "progress",
                  data: {
                    batch: 0,
                    total: 0,
                    scenes: 0,
                    message: "Color profile extraction skipped, continuing with inferred style...",
                  },
                });
              }
            }

            // Use direct video analysis with time-based batching
            const directRequest = {
              ...veoRequest,
              sceneCount: effectiveSceneCount,
            };

            result = await runUrlToScenesDirect(
              directRequest,
              apiKey,
              jobId,
              youtubeDurationSeconds,
              sendEvent,
              extractedColorProfile
            );
          }
          // HYBRID MODE: Video → Script → Scenes
          else {
            // Step 1: Extract script from URL
            sendEvent({
              event: "progress",
              data: { batch: 0, total: 0, scenes: 0, message: "Step 1/2: Analyzing video and extracting transcript..." },
            });

            script = await runUrlToScript(veoRequest, apiKey, sendEvent, videoDescription, videoTitle, videoDescriptionText, veoRequest.useVideoCaptions);

            // Send script event so client can show/download it
            sendEvent({
              event: "script",
              data: { script },
            });

            // Calculate scene count from duration if auto mode is enabled
            // Priority: YouTube API duration > Gemini script duration > default
            if (veoRequest.autoSceneCount) {
              let durationSeconds = youtubeDurationSeconds;
              let durationSource = "YouTube API";

              // Fallback to Gemini's parsed duration if YouTube failed
              if (durationSeconds === 0 && script.duration) {
                durationSeconds = parseDuration(script.duration);
                durationSource = "Gemini script";

                logger.info("VEO Duration Fallback", {
                  rawDuration: script.duration,
                  parsedSeconds: durationSeconds,
                });
              }

              if (durationSeconds > 0) {
                const calculatedCount = Math.ceil(durationSeconds / DEFAULT_SECONDS_PER_SCENE);
                effectiveSceneCount = Math.max(VEO_CONFIG.MIN_AUTO_SCENES, Math.min(calculatedCount, VEO_CONFIG.MAX_AUTO_SCENES));

                const durationFormatted = `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;
                sendEvent({
                  event: "progress",
                  data: {
                    batch: 0,
                    total: 0,
                    scenes: 0,
                    message: `Video duration: ${durationFormatted} (from ${durationSource}). Auto-calculated ${effectiveSceneCount} scenes (~${DEFAULT_SECONDS_PER_SCENE}s/scene)`
                  },
                });

                logger.info("VEO Scene Count Calculated", {
                  durationSeconds,
                  durationSource,
                  calculatedCount,
                  effectiveSceneCount,
                  maxAllowed: VEO_CONFIG.MAX_AUTO_SCENES,
                });
              } else {
                // Duration parsing failed completely
                logger.warn("VEO Duration parsing failed", {
                  youtubeDuration: youtubeDurationSeconds,
                  scriptDuration: script.duration,
                  fallbackSceneCount: effectiveSceneCount,
                });

                sendEvent({
                  event: "progress",
                  data: {
                    batch: 0,
                    total: 0,
                    scenes: 0,
                    message: `Could not determine video duration. Using default ${effectiveSceneCount} scenes.`
                  },
                });
              }
            }

            sendEvent({
              event: "progress",
              data: { batch: 0, total: 0, scenes: 0, message: "Step 2/2: Script extracted. Identifying characters and generating scenes..." },
            });

            // ============================================================================
            // PHASE 0: Extract cinematic color profile FIRST (before character extraction)
            // ============================================================================
            if (veoRequest.extractColorProfile && !extractedColorProfile) {
              try {
                sendEvent({
                  event: "progress",
                  data: { batch: 0, total: 0, scenes: 0, message: "Phase 0: Extracting cinematic color profile from video..." },
                });

                const colorResult = await extractColorProfileFromVideo(veoRequest.videoUrl!, {
                  apiKey,
                  model: veoRequest.geminiModel,
                  onProgress: (msg) => {
                    sendEvent({
                      event: "progress",
                      data: { batch: 0, total: 0, scenes: 0, message: msg },
                    });
                  },
                  onLog: (entry) => sendEvent({ event: "log", data: entry }),
                });

                extractedColorProfile = colorResult.profile;

                // Send color profile SSE event
                sendEvent({
                  event: "colorProfile",
                  data: {
                    profile: colorResult.profile,
                    confidence: colorResult.confidence,
                  },
                });

                logger.info("VEO Phase 0 Complete (Hybrid)", {
                  jobId,
                  colorsFound: colorResult.profile.dominantColors.length,
                  confidence: colorResult.confidence,
                  temperature: colorResult.profile.colorTemperature.category,
                  filmStock: colorResult.profile.filmStock.suggested,
                });

                sendEvent({
                  event: "progress",
                  data: {
                    batch: 0,
                    total: 0,
                    scenes: 0,
                    message: `Color profile extracted: ${colorResult.profile.dominantColors.length} colors, ${colorResult.profile.colorTemperature.category} temperature (${(colorResult.confidence * 100).toFixed(0)}% confidence). Proceeding with character analysis...`,
                  },
                });
              } catch (phase0Error) {
                // Phase 0 failed - log but continue (fallback to inferred style)
                const error = phase0Error as GeminiApiError;
                logger.warn("VEO Phase 0 Failed (Hybrid) - continuing with inferred style", {
                  jobId,
                  error: error.message,
                  status: error.status,
                });

                sendEvent({
                  event: "progress",
                  data: {
                    batch: 0,
                    total: 0,
                    scenes: 0,
                    message: "Color profile extraction skipped, continuing with inferred style...",
                  },
                });
              }
            }

            // ============================================================================
            // PHASE 1: Extract characters from video BEFORE scene generation
            // ============================================================================
            let hybridPreExtractedCharacters: CharacterSkeleton[] = [];
            let hybridPreExtractedBackground = "";

            try {
              sendEvent({
                event: "progress",
                data: { batch: 0, total: 0, scenes: 0, message: "Phase 1: Identifying characters in video..." },
              });

              const characterData = await extractCharactersFromVideo(veoRequest.videoUrl!, {
                apiKey,
                model: veoRequest.geminiModel,
                onProgress: (msg) => {
                  sendEvent({
                    event: "progress",
                    data: { batch: 0, total: 0, scenes: 0, message: msg },
                  });
                },
                onLog: (entry) => sendEvent({ event: "log", data: entry }),
              });

              hybridPreExtractedCharacters = characterData.characters;
              hybridPreExtractedBackground = characterData.background;

              // Send character events immediately
              for (const char of characterData.characters) {
                sendEvent({
                  event: "character",
                  data: { name: char.name, description: getCharacterDescription(char) },
                });
              }

              logger.info("VEO Hybrid Phase 1 Complete", {
                jobId,
                charactersFound: characterData.characters.length,
                characters: characterData.characters.map(c => c.name),
                hasBackground: !!characterData.background,
              });

              sendEvent({
                event: "progress",
                data: {
                  batch: 0,
                  total: 0,
                  scenes: 0,
                  message: `Character analysis complete: Found ${characterData.characters.length} character(s). Generating scene descriptions...`,
                },
              });
            } catch (phase1Error) {
              // Phase 1 failed - log but continue with Phase 2 (fallback)
              const error = phase1Error as GeminiApiError;
              logger.warn("VEO Hybrid Phase 1 Failed - continuing without pre-extracted characters", {
                jobId,
                error: error.message,
                status: error.status,
              });

              sendEvent({
                event: "progress",
                data: { batch: 0, total: 0, scenes: 0, message: "Character extraction skipped, continuing with scene generation..." },
              });
            }

            // ============================================================================
            // PHASE 2: Generate scenes from script with pre-extracted characters
            // ============================================================================

            // Clean the raw text to remove caption timestamp artifacts
            const cleanedScriptText = cleanScriptText(script.rawText);

            const scriptRequest = {
              ...veoRequest,
              workflow: "script-to-scenes" as const,
              scriptText: cleanedScriptText,
              sceneCount: effectiveSceneCount,
            };

            // In hybrid mode, use batched processing for scenes from script
            result = await runScriptToScenesHybrid(
              scriptRequest,
              apiKey,
              jobId,
              sendEvent,
              // Pass Phase 0 results
              extractedColorProfile,
              // Pass Phase 1 results
              hybridPreExtractedCharacters,
              hybridPreExtractedBackground
            );

            // Include color profile in result for complete event
            if (extractedColorProfile) {
              result = { ...result, colorProfile: extractedColorProfile };
            }
          }

          // If there was a failure, don't send complete event
          if (result.failedBatch) {
            clearInterval(keepAliveInterval);
            controller.close();
            return;
          }

          const totalElapsed = (Date.now() - startTime) / 1000;

          // Calculate batch count based on mode
          const batchCount = veoRequest.mode === "direct"
            ? Math.ceil(youtubeDurationSeconds / (veoRequest.batchSize * DEFAULT_SECONDS_PER_SCENE))
            : Math.ceil(effectiveSceneCount / veoRequest.batchSize);

          // Build summary
          const summary: VeoJobSummary = {
            mode: veoRequest.mode as VeoMode,
            youtubeUrl: veoRequest.videoUrl!,
            videoId,
            targetScenes: effectiveSceneCount,
            actualScenes: result.scenes.length,
            batches: batchCount,
            batchSize: veoRequest.batchSize,
            voice: veoRequest.voice === "no-voice" ? "No voice (silent)" : veoRequest.voice,
            charactersFound: Object.keys(result.characterRegistry).length,
            characters: Object.keys(result.characterRegistry),
            processingTime: `${totalElapsed.toFixed(1)}s`,
            createdAt: new Date().toISOString(),
          };

          // Send complete event (include script only for hybrid mode)
          sendEvent({
            event: "complete",
            data: {
              jobId,
              scenes: result.scenes,
              characterRegistry: result.characterRegistry,
              summary,
              ...(script && { script }), // Include script for client-side caching (hybrid mode only)
              ...(result.colorProfile && { colorProfile: result.colorProfile }), // Include color profile (Phase 0)
            },
          });

          // Clean up server progress
          serverProgress.delete(jobId);
        }
        // Handle Script to Scenes workflow
        else if (veoRequest.workflow === "script-to-scenes") {
          let result: {
            scenes: Scene[];
            characterRegistry: CharacterRegistry;
            elapsed: number;
            failedBatch?: number;
          };

          if (veoRequest.mode === "direct") {
            result = await runScriptToScenesDirect(veoRequest, apiKey, sendEvent);
          } else {
            // For script-to-scenes, we don't have a video to extract color profile from
            result = await runScriptToScenesHybrid(
              veoRequest,
              apiKey,
              jobId,
              sendEvent,
              undefined, // No color profile for script-only mode
              undefined, // No pre-extracted characters
              undefined  // No pre-extracted background
            );
          }

          // If there was a failure, don't send complete event
          if (result.failedBatch) {
            clearInterval(keepAliveInterval);
            controller.close();
            return;
          }

          // Build summary
          const summary: VeoJobSummary = {
            mode: veoRequest.mode as VeoMode,
            youtubeUrl: "",
            videoId: "",
            targetScenes: veoRequest.sceneCount,
            actualScenes: result.scenes.length,
            batches:
              veoRequest.mode === "hybrid"
                ? Math.ceil(veoRequest.sceneCount / veoRequest.batchSize)
                : 1,
            batchSize: veoRequest.batchSize,
            voice: veoRequest.voice === "no-voice" ? "No voice (silent)" : veoRequest.voice,
            charactersFound: Object.keys(result.characterRegistry).length,
            characters: Object.keys(result.characterRegistry),
            processingTime: `${result.elapsed.toFixed(1)}s`,
            createdAt: new Date().toISOString(),
          };

          // Send complete event
          sendEvent({
            event: "complete",
            data: {
              jobId,
              scenes: result.scenes,
              characterRegistry: result.characterRegistry,
              summary,
            },
          });

          // Clean up server progress
          serverProgress.delete(jobId);
        }
      } catch (err) {
        const error = err as GeminiApiError;
        const errorResult = handleAPIError(error, "VEO generation failed");
        const errorMessage = formatErrorMessage(error, "VEO generation failed");

        // Log detailed error for debugging
        logger.error("VEO API Error", {
          type: errorResult.type,
          status: error.status,
          message: error.message,
          response: error.response,
          workflow: veoRequest.workflow,
          mode: veoRequest.mode,
          videoUrl: veoRequest.videoUrl?.slice(0, 50),
        });

        sendEvent({
          event: "error",
          data: {
            type: mapToVeoErrorType(errorResult.type),
            message: errorMessage,
            retryable: errorResult.retryable,
            // Include debug info in dev mode
            ...(isDev && {
              debug: {
                status: error.status,
                originalMessage: error.message,
                apiError: error.response?.error?.message,
              },
            }),
          },
        });
      } finally {
        clearInterval(keepAliveInterval);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
