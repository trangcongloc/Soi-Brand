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
import { deduplicateScenes, getDeduplicationStats } from "./deduplication";
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
  deduplicationThreshold: number;
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
  logPrefix?: string;
  timeRange?: string; // For direct mode: "00:00-00:08"
}

export interface ProcessSceneBatchResult {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  newCharactersCount: number;
  duplicatesRemoved: number;
}

/**
 * Process a batch of scenes with character extraction, deduplication, and progress tracking
 * Unified logic used across all VEO workflows
 */
export function processSceneBatch(
  options: ProcessSceneBatchOptions
): ProcessSceneBatchResult {
  const {
    batchScenes,
    existingScenes,
    existingCharacters,
    deduplicationThreshold,
    batchNum,
    totalBatches,
    jobId,
    serverProgress,
    sendEvent,
    logPrefix = "[VEO]",
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

  // Deduplicate scenes before adding to collection
  const deduplicationResult = deduplicateScenes(
    existingScenes,
    batchScenes,
    deduplicationThreshold
  );

  // Log deduplication stats if duplicates were found
  if (deduplicationResult.duplicates.length > 0) {
    const stats = getDeduplicationStats(deduplicationResult);
    console.log(
      `${logPrefix} Batch ${batchNum + 1} deduplication: ` +
        `${stats.duplicateCount} duplicates removed ` +
        `(${(stats.removalRate * 100).toFixed(1)}% removal rate, ` +
        `avg similarity: ${(stats.averageSimilarity * 100).toFixed(1)}%)`
    );

    // Log first few duplicate reasons for debugging
    deduplicationResult.similarities.slice(0, 3).forEach((sim) => {
      console.log(`  - ${sim.reason}`);
    });
  }

  // Merge characters
  const updatedCharacters = { ...existingCharacters, ...newCharacters };

  // Add unique scenes to collection
  const updatedScenes = [...existingScenes, ...deduplicationResult.unique];

  // Update progress (convert to string format for legacy compatibility)
  const stringCharacters: Record<string, string> = {};
  for (const [n, c] of Object.entries(newCharacters)) {
    stringCharacters[n] = getCharacterDescription(c);
  }

  const updatedProgress = updateProgressAfterBatch(
    serverProgress.get(jobId)!,
    deduplicationResult.unique, // Use unique scenes for progress update
    stringCharacters
  );
  serverProgress.set(jobId, updatedProgress);

  // Build progress message
  let progressMessage = `Batch ${batchNum + 1} complete: ${deduplicationResult.unique.length} scenes`;

  if (timeRange) {
    progressMessage += ` from ${timeRange}`;
  }

  if (deduplicationResult.duplicates.length > 0) {
    progressMessage += ` (${deduplicationResult.duplicates.length} duplicates removed)`;
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
    duplicatesRemoved: deduplicationResult.duplicates.length,
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
