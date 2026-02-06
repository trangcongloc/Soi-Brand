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
import type { VideoDescription } from "@/lib/youtube";
import { logger } from "@/lib/logger";
import {
  DEFAULT_SECONDS_PER_SCENE,
  BATCH_OVERLAP_SECONDS,
  PHASE1_TIMEOUT_MS,
  DEFAULT_GEMINI_MODEL,
} from "@/lib/prompt/constants";
import type { PromptRequest } from "./schema";
import { createPendingLog, createCompletedLog } from "./log-helpers";
import { initializeBatchResume } from "./batch-error-handler";
import { runBatchLoop } from "./batch-runner";

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
  const requestBodyStr = JSON.stringify(requestBody);
  sendEvent({
    event: "log",
    data: createPendingLog(scriptLogId, "phase-script", {
      model: request.geminiModel || "default",
      body: requestBodyStr,
      promptLength: requestBodyStr.length,
      videoUrl: request.videoUrl,
    }),
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
    data: createCompletedLog(
      scriptLogId, "phase-script",
      { model: meta.model, body: requestBodyStr, promptLength: meta.promptLength, videoUrl: request.videoUrl },
      response, meta, "script extracted",
    ),
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
  const directRequestBodyStr = JSON.stringify(requestBody);
  sendEvent({
    event: "log",
    data: createPendingLog(directLogId, "phase-2", {
      model: request.geminiModel || "default",
      body: directRequestBodyStr,
      promptLength: directRequestBodyStr.length,
    }),
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
    data: createCompletedLog(
      directLogId, "phase-2",
      { model: meta.model, body: directRequestBodyStr, promptLength: meta.promptLength },
      response, meta, `${scenes.length} scenes`, undefined, scenes.length,
    ),
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

  // Resume support
  const { startBatch, allScenes: initScenes, characterRegistry: initChars } =
    initializeBatchResume(request, totalBatches, progress, sendEvent);
  let allScenes = initScenes;
  let characterRegistry = initChars;

  serverProgress.set(jobId, progress);

  // Split script into chunks for batching
  const scriptLines = request.scriptText!.split("\n").filter((l) => l.trim());
  const linesPerBatch = Math.ceil(scriptLines.length / totalBatches);

  return runBatchLoop({
    totalBatches,
    startBatch,
    initialScenes: allScenes,
    initialCharacters: characterRegistry,
    jobId,
    apiKey,
    model: request.geminiModel,
    sendEvent,
    startTime,

    buildBatchRequest: (batchNum, { continuityContext }) => {
      const batchStart = batchNum * request.batchSize + 1;
      const batchEnd = Math.min((batchNum + 1) * request.batchSize, request.sceneCount);
      const batchSceneCount = batchEnd - batchStart + 1;

      const scriptChunkStart = batchNum * linesPerBatch;
      const scriptChunkEnd = Math.min((batchNum + 1) * linesPerBatch, scriptLines.length);
      const scriptChunk = scriptLines.slice(scriptChunkStart, scriptChunkEnd).join("\n");

      return buildScriptToScenesPrompt({
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
    },

    getProgressMessage: (batchNum, total) => {
      const batchStart = batchNum * request.batchSize + 1;
      const batchEnd = Math.min((batchNum + 1) * request.batchSize, request.sceneCount);
      return `Generating scenes ${batchStart}-${batchEnd} (batch ${batchNum + 1}/${total})`;
    },

    getLogInfo: () => ({}),

    getBatchErrorOverrides: (_batchNum, logId) => ({ batchLabel: "Batch", logId }),

    buildContinuityContext: (jId, scenes, chars) =>
      scenes.length > 0 ? buildContinuityContextCached(jId, scenes, chars, true, 5) : "",
  });
}

/**
 * Run URL to Scenes - Direct mode (video → scenes, no script generation)
 * Uses time-based batching to analyze video segments directly
 *
 * @param providedCharacters - Pre-extracted characters from combined video analysis (skips Phase 1 if provided)
 * @param providedBackground - Pre-extracted background from combined video analysis
 */
export async function runUrlToScenesDirect(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  videoDurationSeconds: number,
  sendEvent: (event: PromptSSEEvent) => void,
  cinematicProfile?: CinematicProfile,
  providedCharacters?: CharacterSkeleton[],
  providedBackground?: string
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

  // Resume support
  const { startBatch, allScenes: initScenes, characterRegistry: initChars } =
    initializeBatchResume(request, totalBatches, progress, sendEvent);
  let allScenes = initScenes;
  let characterRegistry = initChars;

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
  // PHASE 1: Use pre-extracted characters OR extract them from video
  // Skip extraction if providedCharacters is passed from combined video analysis
  // ============================================================================
  let preExtractedCharacters: CharacterSkeleton[] = providedCharacters ?? [];
  let preExtractedBackground = providedBackground ?? "";

  // If characters were provided from combined video analysis, use them directly
  if (providedCharacters && providedCharacters.length > 0) {
    const extractedRegistry = extractionResultToRegistry({
      characters: providedCharacters,
      background: providedBackground || "",
    });
    for (const [name, details] of Object.entries(extractedRegistry)) {
      if (!(name in characterRegistry)) {
        characterRegistry[name] = details;
      }
    }

    logger.info("VEO Using pre-extracted characters from video analysis", {
      jobId,
      charactersFound: providedCharacters.length,
      characters: providedCharacters.map(c => c.name),
      hasBackground: !!providedBackground,
    });
  } else if (startBatch === 0 && Object.keys(characterRegistry).length === 0) {
    // No pre-extracted characters, need to extract them now (fallback for extractColorProfile=false)
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
              model: request.geminiModel || DEFAULT_GEMINI_MODEL,
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

  const getBatchInfo = (batchNum: number): DirectBatchInfo => {
    const batchStartSeconds = batchNum * secondsPerBatch;
    const batchEndSeconds = Math.min((batchNum + 1) * secondsPerBatch, videoDurationSeconds);
    const batchSceneCount = Math.ceil((batchEndSeconds - batchStartSeconds) / secondsPerScene);
    const analysisStartSeconds = batchNum === 0
      ? batchStartSeconds
      : Math.max(0, batchStartSeconds - BATCH_OVERLAP_SECONDS);

    return {
      batchNum,
      totalBatches,
      startSeconds: batchStartSeconds,
      endSeconds: batchEndSeconds,
      analysisStartSeconds,
      startTime: formatTime(batchStartSeconds),
      endTime: formatTime(batchEndSeconds),
      estimatedSceneCount: batchSceneCount,
    };
  };

  const batchResult = await runBatchLoop({
    totalBatches,
    startBatch,
    initialScenes: allScenes,
    initialCharacters: characterRegistry,
    jobId,
    apiKey,
    model: request.geminiModel,
    sendEvent,
    startTime,

    buildBatchRequest: (batchNum, { continuityContext }) => {
      const info = getBatchInfo(batchNum);
      return buildScenePrompt({
        videoUrl: request.videoUrl!,
        sceneCount: info.estimatedSceneCount,
        sceneCountMode: request.sceneCountMode as "auto" | "manual" | "gemini",
        voiceLang: request.voice as VoiceLanguage,
        audio: request.audio as AudioSettings | undefined,
        continuityContext,
        directBatchInfo: info,
        globalNegativePrompt: request.negativePrompt,
        cinematicProfile: cinematicProfile || undefined,
        mediaType: request.mediaType as MediaType,
        preExtractedCharacters: preExtractedCharacters.length > 0 ? preExtractedCharacters : undefined,
        preExtractedBackground: preExtractedBackground || undefined,
        selfieMode: request.selfieMode,
      });
    },

    getProgressMessage: (batchNum, total) => {
      const info = getBatchInfo(batchNum);
      return `Generating scenes for video segment ${info.startTime}-${info.endTime} (batch ${batchNum + 1}/${total})`;
    },

    getLogInfo: (batchNum) => {
      const info = getBatchInfo(batchNum);
      return {
        videoUrl: request.videoUrl,
        timeRange: `${info.startTime}-${info.endTime}`,
      };
    },

    getBatchErrorOverrides: (batchNum, logId) => ({
      batchLabel: "Direct batch",
      logId,
      requestModel: request.geminiModel,
      videoUrl: request.videoUrl,
      extraLogFields: {
        timeRange: `${formatTime(batchNum * secondsPerBatch)}-${formatTime(Math.min((batchNum + 1) * secondsPerBatch, videoDurationSeconds))}`,
      },
    }),

    buildContinuityContext: (jId, scenes, chars) =>
      scenes.length > 0 ? buildContinuityContextCached(jId, scenes, chars, true, 5) : "",
  });

  return { ...batchResult, colorProfile: cinematicProfile };
}
