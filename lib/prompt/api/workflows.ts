/**
 * Prompt API Workflows
 * Workflow functions for video/script to scene generation
 */

import {
  buildScriptPrompt,
  buildScriptToScenesPrompt,
  buildScenePrompt,
  buildContinuityContextCached,
  resetContinuityCache,
  callGeminiAPIWithRetry,
  parseGeminiResponse,
  parseScriptResponse,
  extractCharacterRegistry,
  getCharacterDescription,
  serverProgress,
  createProgress,
  markProgressFailed,
  markProgressCompleted,
  formatTime,
  extractVideoId,
  extractCharactersFromVideo,
  extractionResultToRegistry,
  VoiceLanguage,
  AudioSettings,
  Scene,
  CharacterRegistry,
  CharacterSkeleton,
  CinematicProfile,
  DirectBatchInfo,
  PromptSSEEvent,
  GeminiApiError,
  GeneratedScript,
  MediaType,
} from "@/lib/prompt";
import { processSceneBatch } from "@/lib/prompt/scene-processor";
import type { VideoDescription } from "@/lib/youtube";
import { handleAPIError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import {
  BATCH_DELAY_MS,
  DEFAULT_SECONDS_PER_SCENE,
  BATCH_OVERLAP_SECONDS,
  PHASE1_TIMEOUT_MS,
} from "@/lib/prompt/constants";
import type { PromptRequest } from "./schema";
import { mapToPromptErrorType, formatErrorMessage } from "./helpers";

const isDev = process.env.NODE_ENV === "development";

/**
 * Run URL to Script workflow - generates script from video
 */
export async function runUrlToScript(
  request: PromptRequest,
  apiKey: string,
  sendEvent: (event: PromptSSEEvent) => void,
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
      phase: "phase-script",
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
      phase: "phase-script",
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
export async function runScriptToScenesDirect(
  request: PromptRequest,
  apiKey: string,
  sendEvent: (event: PromptSSEEvent) => void
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
export async function runScriptToScenesHybrid(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  sendEvent: (event: PromptSSEEvent) => void,
  cinematicProfile?: CinematicProfile,
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

  // PERF-001 FIX: Reset continuity cache at job start
  resetContinuityCache(jobId);

  // Resume support
  const startBatch = request.resumeFromBatch ?? 0;
  let allScenes: Scene[] = request.existingScenes ?? [];
  let characterRegistry: CharacterRegistry = request.existingCharacters ?? {};

  // Initialize progress tracking
  const progress = createProgress({
    jobId,
    mode: "hybrid",
    youtubeUrl: request.videoUrl ?? "",
    videoId: request.videoUrl ? (extractVideoId(request.videoUrl) ?? "") : "",
    sceneCount: request.sceneCount,
    batchSize: request.batchSize,
    voiceLang: request.voice as VoiceLanguage,
    totalBatches,
    scriptText: request.scriptText,
  });

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

    const continuityContext =
      allScenes.length > 0 ? buildContinuityContextCached(jobId, allScenes, characterRegistry, true, 5) : "";

    try {
      const requestBody = buildScriptToScenesPrompt({
        scriptText: scriptChunk + (continuityContext ? `\n\n${continuityContext}` : ""),
        sceneCount: batchSceneCount,
        voiceLang: request.voice as VoiceLanguage,
        audio: request.audio as AudioSettings | undefined,
        globalNegativePrompt: request.negativePrompt,
        cinematicProfile: cinematicProfile || undefined,
        mediaType: request.mediaType as MediaType,
        preExtractedCharacters: preExtractedCharacters && preExtractedCharacters.length > 0 ? preExtractedCharacters : undefined,
        preExtractedBackground: preExtractedBackground || undefined,
        selfieMode: request.selfieMode,
      });

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

        allScenes = result.scenes;
        characterRegistry = result.characterRegistry;

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

        sendEvent({
          event: "batchComplete",
          data: {
            batchNumber: batchNum,
            scenes: batchScenes,
            characters: result.characterRegistry,
          },
        });
      }

      if (batchNum < totalBatches - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    } catch (err) {
      const error = err as GeminiApiError;
      const errorResult = handleAPIError(error, `Batch ${batchNum + 1}/${totalBatches} failed`);
      const errorMessage = formatErrorMessage(error, `Batch ${batchNum + 1}/${totalBatches} failed`);

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

      const failedProgress = markProgressFailed(serverProgress.get(jobId)!, errorMessage);
      serverProgress.set(jobId, failedProgress);

      sendEvent({
        event: "error",
        data: {
          type: mapToPromptErrorType(errorResult.type),
          message: errorMessage,
          retryable: errorResult.retryable,
          failedBatch: batchNum + 1,
          totalBatches,
          scenesCompleted: allScenes.length,
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

  const completedProgress = markProgressCompleted(serverProgress.get(jobId)!);
  serverProgress.set(jobId, completedProgress);

  const elapsed = (Date.now() - startTime) / 1000;
  return { scenes: allScenes, characterRegistry, elapsed };
}

/**
 * Run URL to Scenes - Direct mode (video → scenes, no script generation)
 * Uses time-based batching to analyze video segments directly
 */
export async function runUrlToScenesDirect(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  videoDurationSeconds: number,
  sendEvent: (event: PromptSSEEvent) => void,
  cinematicProfile?: CinematicProfile
): Promise<{
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  elapsed: number;
  failedBatch?: number;
  colorProfile?: CinematicProfile;
}> {
  const startTime = Date.now();

  // PERF-001 FIX: Reset continuity cache at job start
  resetContinuityCache(jobId);

  // Calculate time-based batches
  const secondsPerScene = DEFAULT_SECONDS_PER_SCENE;
  const secondsPerBatch = request.batchSize * secondsPerScene;
  const totalBatches = Math.max(1, Math.ceil(videoDurationSeconds / secondsPerBatch));

  // Resume support
  const startBatch = request.resumeFromBatch ?? 0;
  let allScenes: Scene[] = request.existingScenes ?? [];
  let characterRegistry: CharacterRegistry = request.existingCharacters ?? {};

  // Initialize progress tracking
  const progress = createProgress({
    jobId,
    mode: "direct",
    youtubeUrl: request.videoUrl ?? "",
    videoId: request.videoUrl ? (extractVideoId(request.videoUrl) ?? "") : "",
    sceneCount: request.sceneCount,
    batchSize: request.batchSize,
    voiceLang: request.voice as VoiceLanguage,
    totalBatches,
  });

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

  if (startBatch === 0 && Object.keys(characterRegistry).length === 0) {
    let pendingPhase1LogId: string | null = null;

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

      const characterDataPromise = extractCharactersFromVideo(request.videoUrl!, {
        apiKey,
        model: request.geminiModel,
        onProgress: (msg) => {
          sendEvent({
            event: "progress",
            data: { batch: 0, total: totalBatches, scenes: 0, message: msg },
          });
        },
        onLog: (entry) => {
          pendingPhase1LogId = entry.id;
          sendEvent({ event: "log", data: entry });
        },
        onLogUpdate: (entry) => sendEvent({ event: "logUpdate", data: entry }),
      });

      const phase1Timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Phase 1 character extraction timed out")), PHASE1_TIMEOUT_MS);
      });

      const characterData = await Promise.race([characterDataPromise, phase1Timeout]);

      preExtractedCharacters = characterData.characters;
      preExtractedBackground = characterData.background;

      const extractedRegistry = extractionResultToRegistry(characterData);
      for (const [name, details] of Object.entries(extractedRegistry)) {
        if (!(name in characterRegistry)) {
          characterRegistry[name] = details;
        }
      }

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
      const error = phase1Error as GeminiApiError;
      logger.warn("VEO Phase 1 Failed - falling back to inline extraction", {
        jobId,
        error: error.message,
        status: error.status,
      });

      if (pendingPhase1LogId) {
        sendEvent({
          event: "logUpdate",
          data: {
            id: pendingPhase1LogId,
            timestamp: new Date().toISOString(),
            phase: "phase-1",
            status: "completed",
            error: { type: "TIMEOUT", message: error.message },
            request: {
              model: request.geminiModel || "gemini-2.0-flash-exp",
              body: "",
              promptLength: 0,
              videoUrl: request.videoUrl,
            },
            response: {
              success: false,
              body: "",
              responseLength: 0,
              parsedSummary: `Error: ${error.message}`,
            },
            timing: { durationMs: PHASE1_TIMEOUT_MS, retries: 0 },
          },
        });
      }

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

    const analysisStartSeconds = batchNum === 0
      ? batchStartSeconds
      : Math.max(0, batchStartSeconds - BATCH_OVERLAP_SECONDS);

    const directBatchInfo: DirectBatchInfo = {
      batchNum,
      totalBatches,
      startSeconds: batchStartSeconds,
      endSeconds: batchEndSeconds,
      analysisStartSeconds,
      startTime: formatTime(batchStartSeconds),
      endTime: formatTime(batchEndSeconds),
      estimatedSceneCount: batchSceneCount,
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

    const continuityContext =
      allScenes.length > 0 ? buildContinuityContextCached(jobId, allScenes, characterRegistry, true, 5) : "";

    const directBatchLogId = `log_phase2_batch${batchNum}_${Date.now()}`;

    try {
      const requestBody = buildScenePrompt({
        videoUrl: request.videoUrl!,
        sceneCount: batchSceneCount,
        sceneCountMode: request.sceneCountMode as "auto" | "manual" | "gemini",
        voiceLang: request.voice as VoiceLanguage,
        audio: request.audio as AudioSettings | undefined,
        continuityContext,
        directBatchInfo,
        globalNegativePrompt: request.negativePrompt,
        cinematicProfile: cinematicProfile || undefined,
        mediaType: request.mediaType as MediaType,
        preExtractedCharacters: preExtractedCharacters.length > 0 ? preExtractedCharacters : undefined,
        preExtractedBackground: preExtractedBackground || undefined,
        selfieMode: request.selfieMode,
      });

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

        allScenes = result.scenes;
        characterRegistry = result.characterRegistry;

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

        sendEvent({
          event: "batchComplete",
          data: {
            batchNumber: batchNum,
            scenes: batchScenes,
            characters: result.characterRegistry,
          },
        });
      }

      if (batchNum < totalBatches - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    } catch (err) {
      const error = err as GeminiApiError;
      const errorResult = handleAPIError(error, `Direct batch ${batchNum + 1}/${totalBatches} failed`);
      const errorMessage = formatErrorMessage(error, `Direct batch ${batchNum + 1}/${totalBatches} failed`);

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

      const failedProgress = markProgressFailed(serverProgress.get(jobId)!, errorMessage);
      serverProgress.set(jobId, failedProgress);

      sendEvent({
        event: "logUpdate",
        data: {
          id: directBatchLogId,
          timestamp: new Date().toISOString(),
          phase: "phase-2",
          batchNumber: batchNum,
          status: "completed",
          error: { type: errorResult.type, message: errorMessage },
          request: {
            model: request.geminiModel || "unknown",
            body: "",
            promptLength: 0,
            videoUrl: request.videoUrl,
          },
          response: {
            success: false,
            body: "",
            responseLength: 0,
            parsedSummary: `Error: ${errorMessage}`,
          },
          timing: { durationMs: 0, retries: 0 },
        },
      });

      sendEvent({
        event: "error",
        data: {
          type: mapToPromptErrorType(errorResult.type),
          message: errorMessage,
          retryable: errorResult.retryable,
          failedBatch: batchNum + 1,
          totalBatches,
          scenesCompleted: allScenes.length,
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

  const completedProgress = markProgressCompleted(serverProgress.get(jobId)!);
  serverProgress.set(jobId, completedProgress);

  const elapsed = (Date.now() - startTime) / 1000;
  return { scenes: allScenes, characterRegistry, elapsed, colorProfile: cinematicProfile };
}
