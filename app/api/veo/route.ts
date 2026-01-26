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
  buildContinuityContext,
  callGeminiAPIWithRetry,
  parseGeminiResponse,
  parseScriptResponse,
  extractCharacterRegistry,
  mapErrorToType,
  serverProgress,
  createProgress,
  updateProgressAfterBatch,
  markProgressFailed,
  markProgressCompleted,
  VeoMode,
  VoiceLanguage,
  Scene,
  CharacterRegistry,
  VeoSSEEvent,
  VeoJobSummary,
  GeminiApiError,
  GeneratedScript,
} from "@/lib/veo";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";

// Request schema validation
const VeoRequestSchema = z.object({
  workflow: z.enum(["url-to-script", "script-to-scenes"]),
  videoUrl: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  scriptText: z.string().optional(),
  mode: z.enum(["direct", "hybrid"]).default("hybrid"),
  sceneCount: z.number().int().min(1).max(200).default(40),
  batchSize: z.number().int().min(1).max(50).default(10),
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
  resumeJobId: z.string().optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
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
  sendEvent: (event: VeoSSEEvent) => void
): Promise<GeneratedScript> {
  sendEvent({
    event: "progress",
    data: { batch: 1, total: 1, scenes: 0, message: "Analyzing video content..." },
  });

  const requestBody = buildScriptPrompt({
    videoUrl: request.videoUrl!,
    startTime: request.startTime,
    endTime: request.endTime,
  });

  const response = await callGeminiAPIWithRetry(requestBody, {
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
    data: { batch: 1, total: 1, scenes: 0, message: "Parsing script..." },
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
    data: { batch: 1, total: 1, scenes: 0, message: "Generating scenes from script..." },
  });

  const requestBody = buildScriptToScenesPrompt({
    scriptText: request.scriptText!,
    sceneCount: request.sceneCount,
    voiceLang: request.voice as VoiceLanguage,
  });

  const response = await callGeminiAPIWithRetry(requestBody, {
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
    data: { batch: 1, total: 1, scenes: 0, message: "Parsing response..." },
  });

  const scenes = parseGeminiResponse(response);
  const characterRegistry = extractCharacterRegistry(scenes);
  const elapsed = (Date.now() - startTime) / 1000;

  // Send character events
  for (const [name, description] of Object.entries(characterRegistry)) {
    sendEvent({
      event: "character",
      data: { name, description },
    });
  }

  return { scenes, characterRegistry, elapsed };
}

/**
 * Run Script to Scenes - Hybrid mode (batched)
 */
async function runScriptToScenesHybrid(
  request: VeoRequest,
  apiKey: string,
  jobId: string,
  sendEvent: (event: VeoSSEEvent) => void
): Promise<{
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  elapsed: number;
  failedBatch?: number;
}> {
  const startTime = Date.now();
  const totalBatches = Math.ceil(request.sceneCount / request.batchSize);

  let allScenes: Scene[] = [];
  let characterRegistry: CharacterRegistry = {};

  // Initialize progress tracking
  const progress = createProgress({
    jobId,
    mode: "hybrid",
    youtubeUrl: "",
    videoId: "",
    sceneCount: request.sceneCount,
    batchSize: request.batchSize,
    voiceLang: request.voice as VoiceLanguage,
    totalBatches,
  });
  serverProgress.set(jobId, progress);

  // Split script into chunks for batching
  const scriptLines = request.scriptText!.split("\n").filter((l) => l.trim());
  const linesPerBatch = Math.ceil(scriptLines.length / totalBatches);

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
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
        message: `Processing batch ${batchNum + 1}/${totalBatches} (scenes ${batchStart}-${batchEnd})`,
      },
    });

    try {
      // Build context from previous scenes
      const continuityContext =
        allScenes.length > 0 ? buildContinuityContext(allScenes, characterRegistry) : "";

      const requestBody = buildScriptToScenesPrompt({
        scriptText: scriptChunk + (continuityContext ? `\n\n${continuityContext}` : ""),
        sceneCount: batchSceneCount,
        voiceLang: request.voice as VoiceLanguage,
      });

      const response = await callGeminiAPIWithRetry(requestBody, {
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
        // Extract new characters
        const newCharacters = extractCharacterRegistry(batchScenes);

        // Send character events for new characters
        for (const [name, description] of Object.entries(newCharacters)) {
          if (!characterRegistry[name]) {
            sendEvent({
              event: "character",
              data: { name, description },
            });
          }
        }

        // Update state
        characterRegistry = { ...characterRegistry, ...newCharacters };
        allScenes = [...allScenes, ...batchScenes];

        // Update progress
        const updatedProgress = updateProgressAfterBatch(
          serverProgress.get(jobId)!,
          batchScenes,
          newCharacters
        );
        serverProgress.set(jobId, updatedProgress);

        sendEvent({
          event: "progress",
          data: {
            batch: batchNum + 1,
            total: totalBatches,
            scenes: allScenes.length,
            message: `Batch ${batchNum + 1} complete: ${batchScenes.length} scenes`,
          },
        });
      }

      // Delay between batches (except for last batch)
      if (batchNum < totalBatches - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      const error = err as GeminiApiError;
      const errorType = mapErrorToType(error);

      // Update progress with error
      const failedProgress = markProgressFailed(serverProgress.get(jobId)!, error.message);
      serverProgress.set(jobId, failedProgress);

      sendEvent({
        event: "error",
        data: {
          type: errorType,
          message: `Batch ${batchNum + 1} failed: ${error.message}`,
          retryable: true,
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

export async function POST(request: NextRequest) {
  // Rate limiting check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, { limit: 5, windowMs: 60000 });

  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({
        event: "error",
        data: {
          type: "GEMINI_RATE_LIMIT",
          message: "Too many requests. Please try again later.",
          retryable: true,
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // Parse request body
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

  // Workflow-specific validation
  if (veoRequest.workflow === "url-to-script") {
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
      }, 15000);

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
            result = await runScriptToScenesHybrid(veoRequest, apiKey, jobId, sendEvent);
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
        const errorType = mapErrorToType(error);

        sendEvent({
          event: "error",
          data: {
            type: errorType,
            message: error.message || "An unexpected error occurred",
            retryable: errorType !== "GEMINI_API_ERROR",
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
