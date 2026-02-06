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
  extractVideoAnalysis,
  parseDuration,
  cleanScriptText,
  getCharacterDescription,
  extractionResultToRegistry,
  setCachedJob,
  PromptMode,
  PromptSSEEvent,
  PromptJobSummary,
  GeminiApiError,
  Scene,
  CharacterRegistry,
  CharacterSkeleton,
  CinematicProfile,
  GeneratedScript,
  VideoAnalysisResult,
  VoiceLanguage,
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
  generateEventId,
  eventTracker,
} from "@/lib/prompt/api";
import {
  startSession,
  getSession,
  updateSession,
  closeSession,
} from "@/lib/prompt/interactions";

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

  // Initialize or restore Gemini interaction session for retry capability
  // Each job has a Gemini chat session that maintains context across batches
  let session = getSession(jobId);
  if (!session) {
    session = startSession(jobId);
    // If resuming with lastInteractionId, restore the session context
    if (promptRequest.lastInteractionId) {
      updateSession(jobId, promptRequest.lastInteractionId);
      logger.info("VEO Session restored from lastInteractionId", {
        jobId,
        interactionId: promptRequest.lastInteractionId,
      });
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      let streamTimedOut = false;
      let streamClosed = false;
      let currentBatchNum = 0;
      let eventCounter = 0;

      const safeCloseStream = () => {
        if (streamClosed) return;
        streamClosed = true;
        clearInterval(keepAliveInterval);
        clearTimeout(streamTimeout);
        // Clean up event tracker after a delay (allow recovery for a short window)
        setTimeout(() => eventTracker.clear(jobId), 5 * 60 * 1000); // 5 minutes
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
        const timeoutEvent: PromptSSEEvent = {
          event: "error",
          data: {
            type: "TIMEOUT",
            message: `Stream timed out after ${dynamicTimeoutMinutes} minutes. Please resume the job to continue.`,
            retryable: true,
          },
        };
        const eventId = generateEventId(jobId, currentBatchNum, eventCounter++);
        eventTracker.track(jobId, eventId, timeoutEvent);
        try {
          controller.enqueue(sse.encode(timeoutEvent, eventId));
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

        // Update batch number from progress events
        if (event.event === "progress" && "batch" in event.data) {
          currentBatchNum = event.data.batch;
        }

        // Generate event ID and track for recovery
        const eventId = generateEventId(jobId, currentBatchNum, eventCounter++);
        eventTracker.track(jobId, eventId, event);

        try {
          controller.enqueue(sse.encode(event, eventId));
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

  // Get interaction ID for retry capability
  const sessionInfo = getSession(jobId);

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
      // Include lastInteractionId for retry capability
      ...(sessionInfo?.currentInteractionId && { lastInteractionId: sessionInfo.currentInteractionId }),
    },
  });

  serverProgress.delete(jobId);
  resetContinuityCache(jobId);
  closeSession(jobId);
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

  // Get interaction ID for retry capability
  const sessionInfo = getSession(jobId);

  logger.info("VEO Sending complete event", {
    jobId,
    scenesCount: result.scenes.length,
    mode: request.mode,
    workflow: request.workflow,
    lastInteractionId: sessionInfo?.currentInteractionId,
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
      // Include lastInteractionId for retry capability
      ...(sessionInfo?.currentInteractionId && { lastInteractionId: sessionInfo.currentInteractionId }),
    },
  });

  serverProgress.delete(jobId);
  resetContinuityCache(jobId);
  closeSession(jobId);
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

  // Combined video analysis: Extract color profile AND characters in ONE API call
  let preExtractedCharacters: CharacterSkeleton[] = [];
  let preExtractedBackground = "";

  if (request.extractColorProfile === true && !extractedColorProfile) {
    const analysisResult = await runVideoAnalysis(request, apiKey, jobId, sendEvent);
    if (analysisResult) {
      extractedColorProfile = analysisResult.colorProfile;
      preExtractedCharacters = analysisResult.characters;
      preExtractedBackground = analysisResult.background;
    }
  }

  // Run direct mode workflow with pre-extracted data
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
    extractedColorProfile,
    preExtractedCharacters,
    preExtractedBackground
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
    data: { batch: 0, total: 0, scenes: 0, message: "Step 2/2: Script extracted. Analyzing video and generating scenes..." },
  });

  // Combined video analysis: Extract color profile AND characters in ONE API call
  let hybridPreExtractedCharacters: CharacterSkeleton[] = [];
  let hybridPreExtractedBackground = "";

  if (request.extractColorProfile === true && !extractedColorProfile) {
    const analysisResult = await runVideoAnalysis(request, apiKey, jobId, sendEvent);
    if (analysisResult) {
      extractedColorProfile = analysisResult.colorProfile;
      hybridPreExtractedCharacters = analysisResult.characters;
      hybridPreExtractedBackground = analysisResult.background;
    }
  }

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

  // Get interaction ID for retry capability
  const sessionInfo = getSession(jobId);

  sendEvent({
    event: "complete",
    data: {
      jobId,
      scenes: result.scenes,
      characterRegistry: result.characterRegistry,
      summary,
      // Include lastInteractionId for retry capability
      ...(sessionInfo?.currentInteractionId && { lastInteractionId: sessionInfo.currentInteractionId }),
    },
  });

  serverProgress.delete(jobId);
  resetContinuityCache(jobId);
  closeSession(jobId);
}

/**
 * Run combined Video Analysis: Color profile + Character extraction in ONE API call
 * This replaces separate Phase 0 and Phase 1 for better efficiency (~40% faster)
 */
async function runVideoAnalysis(
  request: PromptRequest,
  apiKey: string,
  jobId: string,
  sendEvent: (event: PromptSSEEvent) => void
): Promise<VideoAnalysisResult | undefined> {
  try {
    sendEvent({
      event: "progress",
      data: { batch: 0, total: 0, scenes: 0, message: "Analyzing video: extracting colors and characters..." },
    });

    const analysisResult = await extractVideoAnalysis(request.videoUrl!, {
      apiKey,
      model: request.geminiModel,
      startTime: request.startTime,
      endTime: request.endTime,
      onProgress: (msg) => {
        sendEvent({
          event: "progress",
          data: { batch: 0, total: 0, scenes: 0, message: msg },
        });
      },
      onLog: (entry) => sendEvent({ event: "log", data: entry }),
      onLogUpdate: (entry) => sendEvent({ event: "logUpdate", data: entry }),
    });

    // Send combined videoAnalysis event with all data
    sendEvent({
      event: "videoAnalysis",
      data: {
        colorProfile: analysisResult.colorProfile,
        confidence: analysisResult.confidence,
        characters: analysisResult.characters,
        background: analysisResult.background,
      },
    });

    // Also send individual character events for UI compatibility
    for (const char of analysisResult.characters) {
      sendEvent({
        event: "character",
        data: { name: char.name, description: getCharacterDescription(char) },
      });
    }

    logger.info("VEO Video Analysis Complete", {
      jobId,
      colorsFound: analysisResult.colorProfile.dominantColors.length,
      confidence: analysisResult.confidence,
      temperature: analysisResult.colorProfile.colorTemperature.category,
      filmStock: analysisResult.colorProfile.filmStock.suggested,
      charactersFound: analysisResult.characters.length,
      characters: analysisResult.characters.map(c => c.name),
      hasBackground: !!analysisResult.background,
    });

    sendEvent({
      event: "progress",
      data: {
        batch: 0,
        total: 0,
        scenes: 0,
        message: `Video analysis complete: ${analysisResult.colorProfile.dominantColors.length} colors, ${analysisResult.characters.length} character(s). Generating scenes...`,
      },
    });

    // ========================================================================
    // SAVE POINT: Save video analysis results to D1 for resume capability
    // ========================================================================
    const videoId = extractVideoId(request.videoUrl!) || "";
    void setCachedJob(jobId, {
      videoId,
      videoUrl: request.videoUrl!,
      status: "in_progress",
      colorProfile: analysisResult.colorProfile,
      characterRegistry: extractionResultToRegistry({
        characters: analysisResult.characters,
        background: analysisResult.background,
      }),
      resumeData: {
        completedBatches: 0,
        existingScenes: [],
        existingCharacters: extractionResultToRegistry({
          characters: analysisResult.characters,
          background: analysisResult.background,
        }),
        workflow: request.workflow as "url-to-script" | "script-to-scenes" | "url-to-scenes",
        mode: request.mode as PromptMode,
        batchSize: request.batchSize,
        sceneCount: request.sceneCount,
        voice: request.voice as VoiceLanguage,
        colorProfile: analysisResult.colorProfile,
        preExtractedCharacters: analysisResult.characters,
        preExtractedBackground: analysisResult.background,
      },
    });

    logger.info("VEO Save Point: Video analysis saved to D1", { jobId });

    return analysisResult;
  } catch (analysisError) {
    const error = analysisError as GeminiApiError;
    logger.warn("VEO Video Analysis Failed - continuing without pre-analysis", {
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
        message: "Video analysis skipped, continuing with scene generation...",
      },
    });

    return undefined;
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
