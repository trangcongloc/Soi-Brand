/**
 * Prompt API Batch Error Handler
 * Shared error handling for batch processing in hybrid and direct modes
 * Extracted from workflows.ts to eliminate duplicate catch blocks
 */

import type {
  Scene,
  CharacterRegistry,
  PromptSSEEvent,
  GeminiApiError,
  PromptProgress,
} from "@/lib/prompt/types";
import { handleAPIError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { markProgressFailed, serverProgress } from "@/lib/prompt";
import { mapToPromptErrorType, formatErrorMessage } from "./helpers";
import { createErrorLog } from "./log-helpers";

const isDev = process.env.NODE_ENV === "development";

export interface BatchErrorContext {
  err: unknown;
  batchNum: number;
  totalBatches: number;
  jobId: string;
  allScenes: Scene[];
  characterRegistry: CharacterRegistry;
  startTime: number;
  sendEvent: (event: PromptSSEEvent) => void;
  /** Label prefix for error messages, e.g. "Batch" or "Direct batch" */
  batchLabel: string;
  /** Optional log ID for sending error logUpdate event */
  logId?: string;
  /** Optional request model for error log */
  requestModel?: string;
  /** Optional video URL for error log */
  videoUrl?: string;
  /** Optional extra logger fields (e.g. timeRange) */
  extraLogFields?: Record<string, unknown>;
}

export interface BatchErrorResult {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  elapsed: number;
  failedBatch: number;
}

/**
 * Handle a batch processing error with logging, progress update, and SSE event
 */
export function handleBatchError(ctx: BatchErrorContext): BatchErrorResult {
  const error = ctx.err as GeminiApiError;
  const batchLabel = `${ctx.batchLabel} ${ctx.batchNum + 1}/${ctx.totalBatches} failed`;
  const errorResult = handleAPIError(error, batchLabel);
  const errorMessage = formatErrorMessage(error, batchLabel);

  logger.error(`VEO ${ctx.batchLabel} Error`, {
    batch: ctx.batchNum + 1,
    totalBatches: ctx.totalBatches,
    type: errorResult.type,
    status: error.status,
    message: error.message,
    apiError: error.response?.error?.message,
    scenesCompleted: ctx.allScenes.length,
    jobId: ctx.jobId,
    ...ctx.extraLogFields,
  });

  const currentProgress = serverProgress.get(ctx.jobId);
  if (currentProgress) {
    const failedProgress = markProgressFailed(currentProgress, errorMessage);
    serverProgress.set(ctx.jobId, failedProgress);
  }

  // Send error log update if log ID provided
  if (ctx.logId) {
    ctx.sendEvent({
      event: "logUpdate",
      data: createErrorLog(
        ctx.logId, "phase-2",
        errorResult.type, errorMessage,
        { model: ctx.requestModel || "unknown", videoUrl: ctx.videoUrl },
        ctx.batchNum,
      ),
    });
  }

  ctx.sendEvent({
    event: "error",
    data: {
      type: mapToPromptErrorType(errorResult.type),
      message: errorMessage,
      retryable: errorResult.retryable,
      failedBatch: ctx.batchNum + 1,
      totalBatches: ctx.totalBatches,
      scenesCompleted: ctx.allScenes.length,
      ...(isDev && {
        debug: {
          status: error.status,
          apiError: error.response?.error?.message,
        },
      }),
    },
  });

  const elapsed = (Date.now() - ctx.startTime) / 1000;
  return {
    scenes: ctx.allScenes,
    characterRegistry: ctx.characterRegistry,
    elapsed,
    failedBatch: ctx.batchNum + 1,
  };
}

/**
 * Initialize batch resume state: set startBatch, scenes, characters from request,
 * and send resume progress event if resuming from a later batch.
 */
export function initializeBatchResume(
  request: { resumeFromBatch?: number; existingScenes?: Scene[]; existingCharacters?: CharacterRegistry },
  totalBatches: number,
  progress: PromptProgress,
  sendEvent: (event: PromptSSEEvent) => void,
): { startBatch: number; allScenes: Scene[]; characterRegistry: CharacterRegistry } {
  const startBatch = request.resumeFromBatch ?? 0;
  const allScenes: Scene[] = request.existingScenes ?? [];
  const characterRegistry: CharacterRegistry = request.existingCharacters ?? {};

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

  return { startBatch, allScenes, characterRegistry };
}
