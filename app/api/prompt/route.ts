/**
 * Prompt API Route - Video Scene Generation with SSE
 * POST /api/prompt - Generate scenes from YouTube video or script
 *
 * Supports three workflows:
 * 1. url-to-script: Generate script/transcript from video URL
 * 2. script-to-scenes: Generate scenes from provided script text
 * 3. url-to-scenes: Generate scenes directly from video URL
 */

import { NextRequest } from "next/server";
import {
  isValidYouTubeUrl,
  extractVideoId,
  generateJobId,
  serverProgress,
  resetContinuityCache,
  extractColorProfileFromVideo,
  parseDuration,
  cleanScriptText,
  getCharacterDescription,
  extractCharactersFromVideo,
  PromptMode,
  PromptSSEEvent,
  PromptJobSummary,
  GeminiApiError,
  Scene,
  CharacterRegistry,
  CharacterSkeleton,
  CinematicProfile,
  GeneratedScript,
} from "@/lib/prompt";
import { getVideoInfo, parseISO8601Duration, parseVideoDescription, type VideoDescription } from "@/lib/youtube";
import {
  checkRateLimit,
  getClientIdentifier,
  detectApiKeyTier,
  getTierRateLimit
} from "@/lib/rateLimit";
import { VEO_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";
import { handleAPIError } from "@/lib/error-handler";
import {
  SSE_KEEPALIVE_INTERVAL_MS,
  FALLBACK_VIDEO_DURATION_SECONDS,
  DEFAULT_SECONDS_PER_SCENE,
  PHASE1_TIMEOUT_MS,
  SSE_FLUSH_DELAY_MS,
  SSE_FLUSH_RETRIES,
} from "@/lib/prompt/constants";

// Import from extracted modules
import {
  PromptRequestSchema,
  type PromptRequest,
  calculateStreamTimeout,
  mapToPromptErrorType,
  formatErrorMessage,
  createSSEEncoder,
  createErrorResponse,
  createRateLimitResponse,
  runUrlToScript,
  runScriptToScenesDirect,
  runScriptToScenesHybrid,
  runUrlToScenesDirect,
} from "@/lib/prompt/api";

const isDev = process.env.NODE_ENV === "development";

export async function POST(request: NextRequest) {
  // Parse request body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return createErrorResponse("UNKNOWN_ERROR", "Invalid request body", false, 400);
  }

  // Validate request
  const parseResult = PromptRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.issues.map((i) => i.message).join(", ");
    return createErrorResponse("UNKNOWN_ERROR", `Invalid input: ${errorMessage}`, false, 400);
  }

  const promptRequest = parseResult.data;

  // Get API key
  const apiKey = promptRequest.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return createErrorResponse("GEMINI_API_ERROR", "Gemini API key is required", false, 400);
  }

  // Rate limiting
  const tier = detectApiKeyTier(apiKey, promptRequest.apiKeyTier);
  const tierRateLimit = getTierRateLimit("prompt", tier);
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, tierRateLimit, tier);

  if (!rateLimitResult.success) {
    return createRateLimitResponse(tier, tierRateLimit.limit, rateLimitResult.resetTime, rateLimitResult.remaining);
  }

  // Workflow-specific validation
  if (promptRequest.workflow === "url-to-script" || promptRequest.workflow === "url-to-scenes") {
    if (!promptRequest.videoUrl) {
      return createErrorResponse("INVALID_URL", "Video URL is required for this workflow", false, 400);
    }
    if (!isValidYouTubeUrl(promptRequest.videoUrl)) {
      return createErrorResponse("INVALID_URL", "Invalid YouTube URL format", false, 400);
    }
  } else if (promptRequest.workflow === "script-to-scenes") {
    if (!promptRequest.scriptText || promptRequest.scriptText.trim().length === 0) {
      return createErrorResponse("UNKNOWN_ERROR", "Script text is required for this workflow", false, 400);
    }
  }

  // Create SSE stream
  const sse = createSSEEncoder();

  // Validate resumeJobId
  let jobId: string;
  if (promptRequest.resumeJobId) {
    const existingProgress = serverProgress.get(promptRequest.resumeJobId);
    if (existingProgress && existingProgress.status === "in_progress") {
      return createErrorResponse(
        "UNKNOWN_ERROR",
        "Cannot resume job - another request is already processing this job ID",
        false,
        409
      );
    }
    jobId = promptRequest.resumeJobId;
  } else {
    jobId = generateJobId();
  }

  const videoId = promptRequest.videoUrl ? (extractVideoId(promptRequest.videoUrl) ?? "") : "";

  const stream = new ReadableStream({
    async start(controller) {
      let streamTimedOut = false;
      let streamClosed = false;

      const safeCloseStream = () => {
        if (streamClosed) return;
        streamClosed = true;
        clearInterval(keepAliveInterval);
        clearTimeout(streamTimeout);
        try {
          controller.close();
        } catch {
          // Controller may already be closed
        }
      };

      const keepAliveInterval = setInterval(() => {
        if (streamClosed || streamTimedOut) {
          clearInterval(keepAliveInterval);
          return;
        }
        try {
          controller.enqueue(sse.encodeKeepAlive());
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, SSE_KEEPALIVE_INTERVAL_MS);

      const dynamicTimeoutMs = calculateStreamTimeout(promptRequest.sceneCount);
      const dynamicTimeoutMinutes = Math.round(dynamicTimeoutMs / 60000);

      const streamTimeout = setTimeout(() => {
        if (streamClosed) return;
        streamTimedOut = true;
        logger.warn("Prompt SSE stream timeout", { jobId, duration: dynamicTimeoutMs / 1000, sceneCount: promptRequest.sceneCount });
        try {
          controller.enqueue(sse.encode({
            event: "error",
            data: {
              type: "TIMEOUT",
              message: `Stream timed out after ${dynamicTimeoutMinutes} minutes. Please resume the job to continue.`,
              retryable: true,
            },
          }));
        } catch {
          // Stream may be closed
        }
        safeCloseStream();
      }, dynamicTimeoutMs);

      const sendEvent = (event: PromptSSEEvent) => {
        if (streamTimedOut || streamClosed) {
          logger.warn("VEO sendEvent skipped - stream not available", {
            event: event.event,
            streamTimedOut,
            streamClosed,
            jobId,
          });
          return;
        }
        try {
          controller.enqueue(sse.encode(event));
        } catch (err) {
          if (!streamClosed) {
            streamClosed = true;
            logger.error("VEO sendEvent failed - marking stream as closed", {
              event: event.event,
              error: err instanceof Error ? err.message : String(err),
              jobId,
            });
          }
        }
      };

      try {
        // Dispatch to appropriate workflow
        if (promptRequest.workflow === "url-to-script") {
          await handleUrlToScriptWorkflow(promptRequest, apiKey, jobId, videoId, sendEvent);
        } else if (promptRequest.workflow === "url-to-scenes") {
          await handleUrlToScenesWorkflow(promptRequest, apiKey, jobId, videoId, sendEvent);
        } else if (promptRequest.workflow === "script-to-scenes") {
          await handleScriptToScenesWorkflow(promptRequest, apiKey, jobId, sendEvent);
        }
      } catch (err) {
        const error = err as GeminiApiError;
        const errorResult = handleAPIError(error, "VEO generation failed");
        const errorMessage = formatErrorMessage(error, "VEO generation failed");

        logger.error("VEO API Error", {
          type: errorResult.type,
          status: error.status,
          message: error.message,
          response: error.response,
          workflow: promptRequest.workflow,
          mode: promptRequest.mode,
          videoUrl: promptRequest.videoUrl?.slice(0, 50),
        });

        sendEvent({
          event: "error",
          data: {
            type: mapToPromptErrorType(errorResult.type),
            message: errorMessage,
            retryable: errorResult.retryable,
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
        // SSE-002 FIX: Robust stream flush with multiple attempts
        for (let i = 0; i < SSE_FLUSH_RETRIES; i++) {
          await new Promise(r => setTimeout(r, SSE_FLUSH_DELAY_MS));
          if (controller.desiredSize === null) break;
        }
        safeCloseStream();
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

/**
 * Handle URL to Script workflow
 */
async function handleUrlToScriptWorkflow(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  videoId: string,
  sendEvent: (event: PromptSSEEvent) => void
): Promise<void> {
  const script = await runUrlToScript(request, apiKey, sendEvent);

  sendEvent({
    event: "script",
    data: { script },
  });

  sendEvent({
    event: "complete",
    data: {
      jobId,
      scenes: [],
      characterRegistry: {},
      summary: {
        mode: "direct" as PromptMode,
        youtubeUrl: request.videoUrl!,
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

  serverProgress.delete(jobId);
  resetContinuityCache(jobId);
}

/**
 * Handle URL to Scenes workflow (direct or hybrid mode)
 */
async function handleUrlToScenesWorkflow(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  videoId: string,
  sendEvent: (event: PromptSSEEvent) => void
): Promise<void> {
  const startTime = Date.now();

  // Fetch video metadata
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
    if (request.useVideoTitle && videoInfo?.title) {
      videoTitle = videoInfo.title;
    }
    if (request.useVideoDescription && videoInfo?.description) {
      videoDescriptionText = videoInfo.description;
    }
    if (request.useVideoChapters && videoInfo?.description) {
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
  let effectiveSceneCount = request.sceneCount;
  let extractedColorProfile: CinematicProfile | undefined = request.existingColorProfile as CinematicProfile | undefined;

  if (request.mode === "direct") {
    // DIRECT MODE: Video → Scenes
    result = await handleDirectMode(
      request,
      apiKey,
      jobId,
      youtubeDurationSeconds,
      sendEvent,
      effectiveSceneCount,
      extractedColorProfile
    );
    effectiveSceneCount = result.scenes.length > 0 ? result.scenes.length : effectiveSceneCount;
    extractedColorProfile = result.colorProfile;
  } else {
    // HYBRID MODE: Video → Script → Scenes
    const hybridResult = await handleHybridMode(
      request,
      apiKey,
      jobId,
      youtubeDurationSeconds,
      videoDescription,
      videoTitle,
      videoDescriptionText,
      sendEvent
    );
    result = hybridResult.result;
    script = hybridResult.script;
    effectiveSceneCount = hybridResult.effectiveSceneCount;
    extractedColorProfile = hybridResult.colorProfile;
  }

  if (result.failedBatch) {
    return; // Error already sent by workflow function
  }

  const totalElapsed = (Date.now() - startTime) / 1000;
  const batchCount = request.mode === "direct"
    ? Math.ceil(youtubeDurationSeconds / (request.batchSize * DEFAULT_SECONDS_PER_SCENE))
    : Math.ceil(effectiveSceneCount / request.batchSize);

  const summary: PromptJobSummary = {
    mode: request.mode as PromptMode,
    youtubeUrl: request.videoUrl!,
    videoId,
    targetScenes: effectiveSceneCount,
    actualScenes: result.scenes.length,
    batches: batchCount,
    batchSize: request.batchSize,
    voice: request.voice === "no-voice" ? "No voice (silent)" : request.voice,
    charactersFound: Object.keys(result.characterRegistry).length,
    characters: Object.keys(result.characterRegistry),
    processingTime: `${totalElapsed.toFixed(1)}s`,
    createdAt: new Date().toISOString(),
  };

  logger.info("VEO Sending complete event", {
    jobId,
    scenesCount: result.scenes.length,
    mode: request.mode,
    workflow: request.workflow,
  });

  sendEvent({
    event: "complete",
    data: {
      jobId,
      scenes: result.scenes,
      characterRegistry: result.characterRegistry,
      summary,
      ...(script && { script }),
      ...(extractedColorProfile && { colorProfile: extractedColorProfile }),
    },
  });

  serverProgress.delete(jobId);
  resetContinuityCache(jobId);
}

/**
 * Handle direct mode for URL to Scenes
 */
async function handleDirectMode(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  youtubeDurationSeconds: number,
  sendEvent: (event: PromptSSEEvent) => void,
  effectiveSceneCount: number,
  existingColorProfile?: CinematicProfile
): Promise<{
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  elapsed: number;
  failedBatch?: number;
  colorProfile?: CinematicProfile;
}> {
  let extractedColorProfile = existingColorProfile;

  // Calculate scene count from duration
  if (request.sceneCountMode !== "manual" && youtubeDurationSeconds > 0) {
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
    logger.warn("VEO Direct Mode: No duration available, using default scene count", {
      videoId: extractVideoId(request.videoUrl!),
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
    youtubeDurationSeconds = FALLBACK_VIDEO_DURATION_SECONDS;
  }

  sendEvent({
    event: "progress",
    data: { batch: 0, total: 0, scenes: 0, message: "Direct mode: Generating scenes directly from video (skipping script extraction)..." },
  });

  // Phase 0: Extract color profile
  if (request.extractColorProfile === true && !extractedColorProfile) {
    extractedColorProfile = await runPhase0ColorExtraction(request, apiKey, jobId, sendEvent);
  }

  // Run direct mode workflow
  const directRequest = {
    ...request,
    sceneCount: effectiveSceneCount,
  };

  const result = await runUrlToScenesDirect(
    directRequest,
    apiKey,
    jobId,
    youtubeDurationSeconds,
    sendEvent,
    extractedColorProfile
  );

  return result;
}

/**
 * Handle hybrid mode for URL to Scenes
 */
async function handleHybridMode(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  youtubeDurationSeconds: number,
  videoDescription: VideoDescription | undefined,
  videoTitle: string | undefined,
  videoDescriptionText: string | undefined,
  sendEvent: (event: PromptSSEEvent) => void
): Promise<{
  result: {
    scenes: Scene[];
    characterRegistry: CharacterRegistry;
    elapsed: number;
    failedBatch?: number;
    colorProfile?: CinematicProfile;
  };
  script: GeneratedScript;
  effectiveSceneCount: number;
  colorProfile?: CinematicProfile;
}> {
  let effectiveSceneCount = request.sceneCount;
  let extractedColorProfile: CinematicProfile | undefined = request.existingColorProfile as CinematicProfile | undefined;

  // Step 1: Extract script
  sendEvent({
    event: "progress",
    data: { batch: 0, total: 0, scenes: 0, message: "Step 1/2: Analyzing video and extracting transcript..." },
  });

  const script = await runUrlToScript(request, apiKey, sendEvent, videoDescription, videoTitle, videoDescriptionText, request.useVideoCaptions);

  sendEvent({
    event: "script",
    data: { script },
  });

  // Calculate scene count from duration
  if (request.sceneCountMode !== "manual") {
    let durationSeconds = youtubeDurationSeconds;
    let durationSource = "YouTube API";

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

  // Phase 0: Extract color profile
  if (request.extractColorProfile === true && !extractedColorProfile) {
    extractedColorProfile = await runPhase0ColorExtraction(request, apiKey, jobId, sendEvent);
  }

  // Phase 1: Extract characters
  const { characters: hybridPreExtractedCharacters, background: hybridPreExtractedBackground } =
    await runPhase1CharacterExtraction(request, apiKey, sendEvent);

  // Phase 2: Generate scenes from script
  const cleanedScriptText = cleanScriptText(script.rawText);

  const scriptRequest = {
    ...request,
    workflow: "script-to-scenes" as const,
    scriptText: cleanedScriptText,
    sceneCount: effectiveSceneCount,
  };

  const result = await runScriptToScenesHybrid(
    scriptRequest,
    apiKey,
    jobId,
    sendEvent,
    extractedColorProfile,
    hybridPreExtractedCharacters,
    hybridPreExtractedBackground
  );

  return {
    result: extractedColorProfile ? { ...result, colorProfile: extractedColorProfile } : result,
    script,
    effectiveSceneCount,
    colorProfile: extractedColorProfile,
  };
}

/**
 * Handle Script to Scenes workflow
 */
async function handleScriptToScenesWorkflow(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  sendEvent: (event: PromptSSEEvent) => void
): Promise<void> {
  let result: {
    scenes: Scene[];
    characterRegistry: CharacterRegistry;
    elapsed: number;
    failedBatch?: number;
  };

  if (request.mode === "direct") {
    result = await runScriptToScenesDirect(request, apiKey, sendEvent);
  } else {
    result = await runScriptToScenesHybrid(
      request,
      apiKey,
      jobId,
      sendEvent,
      undefined,
      undefined,
      undefined
    );
  }

  if (result.failedBatch) {
    return;
  }

  const summary: PromptJobSummary = {
    mode: request.mode as PromptMode,
    youtubeUrl: "",
    videoId: "",
    targetScenes: request.sceneCount,
    actualScenes: result.scenes.length,
    batches: request.mode === "hybrid" ? Math.ceil(request.sceneCount / request.batchSize) : 1,
    batchSize: request.batchSize,
    voice: request.voice === "no-voice" ? "No voice (silent)" : request.voice,
    charactersFound: Object.keys(result.characterRegistry).length,
    characters: Object.keys(result.characterRegistry),
    processingTime: `${result.elapsed.toFixed(1)}s`,
    createdAt: new Date().toISOString(),
  };

  sendEvent({
    event: "complete",
    data: {
      jobId,
      scenes: result.scenes,
      characterRegistry: result.characterRegistry,
      summary,
    },
  });

  serverProgress.delete(jobId);
  resetContinuityCache(jobId);
}

/**
 * Run Phase 0: Color profile extraction
 */
async function runPhase0ColorExtraction(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  sendEvent: (event: PromptSSEEvent) => void
): Promise<CinematicProfile | undefined> {
  try {
    sendEvent({
      event: "progress",
      data: { batch: 0, total: 0, scenes: 0, message: "Phase 0: Extracting cinematic color profile from video..." },
    });

    const colorResult = await extractColorProfileFromVideo(request.videoUrl!, {
      apiKey,
      model: request.geminiModel,
      onProgress: (msg) => {
        sendEvent({
          event: "progress",
          data: { batch: 0, total: 0, scenes: 0, message: msg },
        });
      },
      onLog: (entry) => sendEvent({ event: "log", data: entry }),
      onLogUpdate: (entry) => sendEvent({ event: "logUpdate", data: entry }),
    });

    sendEvent({
      event: "colorProfile",
      data: {
        profile: colorResult.profile,
        confidence: colorResult.confidence,
      },
    });

    logger.info("VEO Phase 0 Complete", {
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

    return colorResult.profile;
  } catch (phase0Error) {
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

    return undefined;
  }
}

/**
 * Run Phase 1: Character extraction (for hybrid mode)
 */
async function runPhase1CharacterExtraction(
  request: PromptRequest,
  apiKey: string,
  sendEvent: (event: PromptSSEEvent) => void
): Promise<{
  characters: CharacterSkeleton[];
  background: string;
}> {
  let pendingPhase1LogId: string | null = null;

  try {
    sendEvent({
      event: "progress",
      data: { batch: 0, total: 0, scenes: 0, message: "Phase 1: Identifying characters in video..." },
    });

    const characterDataPromise = extractCharactersFromVideo(request.videoUrl!, {
      apiKey,
      model: request.geminiModel,
      onProgress: (msg) => {
        sendEvent({
          event: "progress",
          data: { batch: 0, total: 0, scenes: 0, message: msg },
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

    for (const char of characterData.characters) {
      sendEvent({
        event: "character",
        data: { name: char.name, description: getCharacterDescription(char) },
      });
    }

    logger.info("VEO Hybrid Phase 1 Complete", {
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

    return {
      characters: characterData.characters,
      background: characterData.background,
    };
  } catch (phase1Error) {
    const error = phase1Error as GeminiApiError;
    logger.warn("VEO Hybrid Phase 1 Failed - continuing without pre-extracted characters", {
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
      data: { batch: 0, total: 0, scenes: 0, message: "Character extraction skipped, continuing with scene generation..." },
    });

    return { characters: [], background: "" };
  }
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
