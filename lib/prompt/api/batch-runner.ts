/**
 * Prompt API Batch Runner
 * Common batch loop extracted from runScriptToScenesHybrid and runUrlToScenesDirect.
 * Uses callback pattern for the parts that differ between modes.
 */

import {
  callGeminiAPIWithRetry,
  parseGeminiResponse,
  serverProgress,
  markProgressCompleted,
  Scene,
  CharacterRegistry,
  PromptSSEEvent,
  GeminiRequestBody,
} from "@/lib/prompt";
import { processSceneBatch } from "@/lib/prompt/scene-processor";
import { BATCH_DELAY_MS } from "@/lib/prompt/constants";
import { createPendingLog, createCompletedLog } from "./log-helpers";
import { handleBatchError, type BatchErrorContext } from "./batch-error-handler";
import { getSession } from "@/lib/prompt/interactions";

export interface BatchLoopConfig {
  totalBatches: number;
  startBatch: number;
  initialScenes: Scene[];
  initialCharacters: CharacterRegistry;
  jobId: string;
  apiKey: string;
  model?: string;
  sendEvent: (event: PromptSSEEvent) => void;
  startTime: number;

  /**
   * Build the request body for a specific batch.
   * Called once per batch with continuity context and batch number.
   */
  buildBatchRequest: (batchNum: number, context: {
    allScenes: Scene[];
    characterRegistry: CharacterRegistry;
    continuityContext: string;
  }) => GeminiRequestBody;

  /**
   * Get the progress message for a specific batch.
   */
  getProgressMessage: (batchNum: number, totalBatches: number, sceneCount: number) => string;

  /**
   * Get the log ID prefix and optional request info for a batch.
   */
  getLogInfo: (batchNum: number) => {
    videoUrl?: string;
    /** Optional timeRange for processSceneBatch */
    timeRange?: string;
  };

  /**
   * Get batch error context overrides (label, logId, extra fields).
   */
  getBatchErrorOverrides: (batchNum: number, logId: string) => Partial<BatchErrorContext>;

  /**
   * Build continuity context for the current batch.
   */
  buildContinuityContext: (jobId: string, allScenes: Scene[], characterRegistry: CharacterRegistry) => string;
}

export interface BatchLoopResult {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  elapsed: number;
  failedBatch?: number;
}

/**
 * Run the common batch loop for scene generation.
 * Handles: API call, parse, processSceneBatch, logging, batchComplete, delay, error handling.
 */
export async function runBatchLoop(config: BatchLoopConfig): Promise<BatchLoopResult> {
  let allScenes = config.initialScenes;
  let characterRegistry = config.initialCharacters;

  for (let batchNum = config.startBatch; batchNum < config.totalBatches; batchNum++) {
    sendProgress(config, batchNum, allScenes.length);

    const continuityContext = config.buildContinuityContext(
      config.jobId, allScenes, characterRegistry,
    );

    const logId = `log_phase2_batch${batchNum}_${Date.now()}`;
    const logInfo = config.getLogInfo(batchNum);

    try {
      const requestBody = config.buildBatchRequest(batchNum, {
        allScenes, characterRegistry, continuityContext,
      });

      const requestBodyStr = JSON.stringify(requestBody);

      // Send pending log
      config.sendEvent({
        event: "log",
        data: createPendingLog(logId, "phase-2", {
          model: config.model || "default",
          body: requestBodyStr,
          promptLength: requestBodyStr.length,
          videoUrl: logInfo.videoUrl,
        }, batchNum),
      });

      // Make API call
      const { response, meta: batchMeta } = await callGeminiAPIWithRetry(requestBody, {
        apiKey: config.apiKey,
        model: config.model,
        onRetry: (attempt) => {
          config.sendEvent({
            event: "progress",
            data: {
              batch: batchNum + 1,
              total: config.totalBatches,
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
          totalBatches: config.totalBatches,
          jobId: config.jobId,
          serverProgress,
          sendEvent: config.sendEvent,
          ...(logInfo.timeRange && { timeRange: logInfo.timeRange }),
        });

        allScenes = result.scenes;
        characterRegistry = result.characterRegistry;

        // Send completed log
        config.sendEvent({
          event: "logUpdate",
          data: createCompletedLog(
            logId, "phase-2",
            {
              model: batchMeta.model,
              body: requestBodyStr,
              promptLength: batchMeta.promptLength,
              videoUrl: logInfo.videoUrl,
            },
            response, batchMeta, `${batchScenes.length} scenes`, batchNum, batchScenes.length,
          ),
        });

        // Send batch complete event
        const sessionInfo = getSession(config.jobId);
        config.sendEvent({
          event: "batchComplete",
          data: {
            batchNumber: batchNum,
            scenes: batchScenes,
            characters: result.characterRegistry,
            ...(sessionInfo?.currentInteractionId && { lastInteractionId: sessionInfo.currentInteractionId }),
          },
        });
      }

      // Delay between batches
      if (batchNum < config.totalBatches - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    } catch (err) {
      const overrides = config.getBatchErrorOverrides(batchNum, logId);
      return handleBatchError({
        err, batchNum, totalBatches: config.totalBatches, jobId: config.jobId,
        allScenes, characterRegistry, startTime: config.startTime,
        sendEvent: config.sendEvent,
        batchLabel: "Batch",
        ...overrides,
      });
    }
  }

  // Mark progress as completed
  const currentProgress = serverProgress.get(config.jobId);
  if (currentProgress) {
    const completedProgress = markProgressCompleted(currentProgress);
    serverProgress.set(config.jobId, completedProgress);
  }

  const elapsed = (Date.now() - config.startTime) / 1000;
  return { scenes: allScenes, characterRegistry, elapsed };
}

function sendProgress(config: BatchLoopConfig, batchNum: number, sceneCount: number): void {
  config.sendEvent({
    event: "progress",
    data: {
      batch: batchNum + 1,
      total: config.totalBatches,
      scenes: sceneCount,
      message: config.getProgressMessage(batchNum, config.totalBatches, sceneCount),
    },
  });
}
