/**
 * Scene Processing Pipeline
 * Consolidates duplicate scene processing logic from VEO route
 */

import {
  Scene,
  CharacterRegistry,
  VeoSSEEvent,
  VeoProgress,
} from "./types";
import {
  extractCharacterRegistry,
  getCharacterDescription,
} from "./gemini";
import { updateProgressAfterBatch } from "./progress";

export interface ProcessSceneBatchOptions {
  // Scene data
  batchScenes: Scene[];
  existingScenes: Scene[];
  existingCharacters: CharacterRegistry;

  // Configuration
  batchNum: number;
  totalBatches: number;

  // Progress tracking
  jobId: string;
  serverProgress: {
    get: (jobId: string) => VeoProgress | undefined;
    set: (jobId: string, progress: VeoProgress) => void;
  };

  // Event handling
  sendEvent: (event: VeoSSEEvent) => void;

  // Optional metadata
  timeRange?: string; // For direct mode: "00:00-00:08"
}

export interface ProcessSceneBatchResult {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  newCharactersCount: number;
}

/**
 * Process a batch of scenes with character extraction and progress tracking
 * Unified logic used across all VEO workflows
 */
export function processSceneBatch(
  options: ProcessSceneBatchOptions
): ProcessSceneBatchResult {
  const {
    batchScenes,
    existingScenes,
    existingCharacters,
    batchNum,
    totalBatches,
    jobId,
    serverProgress,
    sendEvent,
    timeRange,
  } = options;

  // Extract new characters from batch
  const newCharacters = extractCharacterRegistry(batchScenes);

  // Send character events for newly discovered characters
  let newCharactersCount = 0;
  for (const [name, charData] of Object.entries(newCharacters)) {
    if (!existingCharacters[name]) {
      newCharactersCount++;
      sendEvent({
        event: "character",
        data: { name, description: getCharacterDescription(charData) },
      });
    }
  }

  // Merge characters
  const updatedCharacters = { ...existingCharacters, ...newCharacters };

  // Add all batch scenes to collection
  const updatedScenes = [...existingScenes, ...batchScenes];

  // Update progress (convert to string format for legacy compatibility)
  const stringCharacters: Record<string, string> = {};
  for (const [n, c] of Object.entries(newCharacters)) {
    stringCharacters[n] = getCharacterDescription(c);
  }

  // BUG-002 FIX: Add null check to prevent crash if progress was evicted
  const currentProgress = serverProgress.get(jobId);
  if (currentProgress) {
    const updatedProgress = updateProgressAfterBatch(
      currentProgress,
      batchScenes,
      stringCharacters
    );
    serverProgress.set(jobId, updatedProgress);
  }

  // Build progress message
  let progressMessage = `Batch ${batchNum + 1} complete: ${batchScenes.length} scenes`;

  if (timeRange) {
    progressMessage += ` from ${timeRange}`;
  }

  // Send progress event
  sendEvent({
    event: "progress",
    data: {
      batch: batchNum + 1,
      total: totalBatches,
      scenes: updatedScenes.length,
      message: progressMessage,
    },
  });

  return {
    scenes: updatedScenes,
    characterRegistry: updatedCharacters,
    newCharactersCount,
  };
}

/**
 * Send progress event for batch start
 */
export function sendBatchStartEvent(
  sendEvent: (event: VeoSSEEvent) => void,
  options: {
    batchNum: number;
    totalBatches: number;
    currentScenes: number;
    message: string;
  }
): void {
  sendEvent({
    event: "progress",
    data: {
      batch: options.batchNum + 1,
      total: options.totalBatches,
      scenes: options.currentScenes,
      message: options.message,
    },
  });
}

/**
 * Send progress event for batch retry
 */
export function sendBatchRetryEvent(
  sendEvent: (event: VeoSSEEvent) => void,
  options: {
    batchNum: number;
    totalBatches: number;
    currentScenes: number;
    attempt: number;
  }
): void {
  sendEvent({
    event: "progress",
    data: {
      batch: options.batchNum + 1,
      total: options.totalBatches,
      scenes: options.currentScenes,
      message: `Batch ${options.batchNum + 1} retry ${options.attempt}...`,
    },
  });
}
