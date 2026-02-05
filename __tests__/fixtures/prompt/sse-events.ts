/**
 * VEO Test Fixtures - SSE Event Fixtures
 * Pre-built SSE event fixtures for streaming tests
 */

import type {
  PromptSSEEvent,
  PromptProgressEvent,
  PromptCharacterEvent,
  PromptCompleteEvent,
  PromptErrorEvent,
  PromptScriptEvent,
  PromptColorProfileEvent,
  PromptLogEvent,
  PromptLogUpdateEvent,
  PromptBatchCompleteEvent,
} from "@/lib/prompt/types";
import { chefMarco, sousChefAnna, skeletonRegistry } from "./characters";
import { fullColorProfile } from "./color-profiles";
import { createMockScenes, createMockLogEntry, createMockJobSummary } from "./factories";

// ============================================================================
// Progress Events
// ============================================================================

/**
 * Progress event: First batch starting (batch 1 of 5)
 */
export const progressBatch1of5: PromptProgressEvent = {
  event: "progress",
  data: {
    batch: 1,
    total: 5,
    scenes: 0,
    message: "Processing batch 1 of 5...",
  },
};

/**
 * Progress event: Mid-job (batch 3 of 5)
 */
export const progressBatch3of5: PromptProgressEvent = {
  event: "progress",
  data: {
    batch: 3,
    total: 5,
    scenes: 10,
    message: "Processing batch 3 of 5...",
  },
};

/**
 * Progress event: Near completion (batch 5 of 5)
 */
export const progressBatch5of5: PromptProgressEvent = {
  event: "progress",
  data: {
    batch: 5,
    total: 5,
    scenes: 20,
    message: "Processing final batch...",
  },
};

/**
 * Progress event: Completed
 */
export const progressComplete: PromptProgressEvent = {
  event: "progress",
  data: {
    batch: 5,
    total: 5,
    scenes: 25,
    message: "All batches complete",
  },
};

/**
 * Progress event: Phase 0 (color profile extraction)
 */
export const progressPhase0: PromptProgressEvent = {
  event: "progress",
  data: {
    batch: 0,
    total: 5,
    scenes: 0,
    message: "Extracting color profile...",
  },
};

/**
 * Progress event: Phase 1 (character extraction)
 */
export const progressPhase1: PromptProgressEvent = {
  event: "progress",
  data: {
    batch: 0,
    total: 5,
    scenes: 0,
    message: "Analyzing characters...",
  },
};

// ============================================================================
// Character Events
// ============================================================================

/**
 * Character discovered: Chef Marco
 */
export const characterEventMarco: PromptCharacterEvent = {
  event: "character",
  data: {
    name: "Chef Marco",
    description: "Italian male chef in his 40s with salt-and-pepper hair and goatee, wearing white chef coat",
  },
};

/**
 * Character discovered: Sous Chef Anna
 */
export const characterEventAnna: PromptCharacterEvent = {
  event: "character",
  data: {
    name: "Sous Chef Anna",
    description: "French female sous chef in her 30s with auburn hair in a bun, wearing gray chef coat",
  },
};

/**
 * Character discovered: Background character
 */
export const characterEventBackground: PromptCharacterEvent = {
  event: "character",
  data: {
    name: "Waiter",
    description: "Young server in black uniform",
  },
};

// ============================================================================
// Color Profile Events
// ============================================================================

/**
 * Color profile extracted successfully
 */
export const colorProfileEvent: PromptColorProfileEvent = {
  event: "colorProfile",
  data: {
    profile: fullColorProfile,
    confidence: 0.95,
  },
};

/**
 * Color profile with lower confidence
 */
export const colorProfileEventLowConfidence: PromptColorProfileEvent = {
  event: "colorProfile",
  data: {
    profile: fullColorProfile,
    confidence: 0.65,
  },
};

// ============================================================================
// Batch Complete Events
// ============================================================================

/**
 * First batch completed
 */
export const batchComplete1: PromptBatchCompleteEvent = {
  event: "batchComplete",
  data: {
    batchNumber: 0,
    scenes: createMockScenes(5),
    characters: { "Chef Marco": chefMarco },
  },
};

/**
 * Second batch completed
 */
export const batchComplete2: PromptBatchCompleteEvent = {
  event: "batchComplete",
  data: {
    batchNumber: 1,
    scenes: createMockScenes(5).map((s, i) => ({ ...s, sequence: i + 6 })),
    characters: {
      "Chef Marco": chefMarco,
      "Sous Chef Anna": sousChefAnna,
    },
  },
};

/**
 * Final batch completed
 */
export const batchCompleteFinal: PromptBatchCompleteEvent = {
  event: "batchComplete",
  data: {
    batchNumber: 4,
    scenes: createMockScenes(5).map((s, i) => ({ ...s, sequence: i + 21 })),
    characters: skeletonRegistry,
  },
};

// ============================================================================
// Log Events
// ============================================================================

/**
 * Log event: Phase 0 request sent
 */
export const logEventPhase0Pending: PromptLogEvent = {
  event: "log",
  data: createMockLogEntry({
    phase: "phase-0",
    status: "pending",
    parsedItemCount: 0,
  }),
};

/**
 * Log event: Phase 0 completed
 */
export const logEventPhase0Complete: PromptLogUpdateEvent = {
  event: "logUpdate",
  data: createMockLogEntry({
    phase: "phase-0",
    status: "completed",
    parsedItemCount: 1,
    durationMs: 2500,
  }),
};

/**
 * Log event: Phase 1 (character extraction)
 */
export const logEventPhase1: PromptLogEvent = {
  event: "log",
  data: createMockLogEntry({
    phase: "phase-1",
    status: "completed",
    parsedItemCount: 3,
    durationMs: 3200,
  }),
};

/**
 * Log event: Phase 2 batch
 */
export const logEventPhase2Batch: PromptLogEvent = {
  event: "log",
  data: createMockLogEntry({
    phase: "phase-2",
    batchNumber: 0,
    status: "completed",
    parsedItemCount: 5,
    durationMs: 4500,
  }),
};

// ============================================================================
// Script Events
// ============================================================================

/**
 * Script generated event
 */
export const scriptEvent: PromptScriptEvent = {
  event: "script",
  data: {
    script: {
      title: "Cooking Tutorial: Perfect Pasta",
      duration: "5:30",
      language: "en",
      segments: [
        {
          timestamp: "0:00",
          content: "Introduction to pasta making",
          speaker: "Chef Marco",
          action: "standing at counter",
          emotion: "enthusiastic",
        },
        {
          timestamp: "0:45",
          content: "Preparing the ingredients",
          speaker: "Chef Marco",
          action: "gathering flour and eggs",
          emotion: "focused",
        },
        {
          timestamp: "2:00",
          content: "Making the dough",
          speaker: "Chef Marco",
          action: "kneading dough",
          emotion: "passionate",
        },
      ],
      summary: "A comprehensive tutorial on making fresh pasta from scratch",
      characters: ["Chef Marco"],
      settings: ["Professional kitchen", "Prep station"],
      rawText: "Full script text would go here...",
    },
  },
};

// ============================================================================
// Complete Events
// ============================================================================

/**
 * Job completed successfully
 */
export const completeEvent: PromptCompleteEvent = {
  event: "complete",
  data: {
    jobId: "complete-job-001",
    scenes: createMockScenes(25),
    characterRegistry: skeletonRegistry,
    summary: createMockJobSummary({
      actualScenes: 25,
      targetScenes: 25,
      processingTime: "1m 45s",
    }),
    colorProfile: fullColorProfile,
  },
};

/**
 * Job completed with fewer scenes than target
 */
export const completeEventFewerScenes: PromptCompleteEvent = {
  event: "complete",
  data: {
    jobId: "complete-fewer-001",
    scenes: createMockScenes(18),
    characterRegistry: skeletonRegistry,
    summary: createMockJobSummary({
      actualScenes: 18,
      targetScenes: 25,
      processingTime: "1m 30s",
    }),
  },
};

/**
 * Job completed with script (hybrid workflow)
 */
export const completeEventWithScript: PromptCompleteEvent = {
  event: "complete",
  data: {
    jobId: "complete-script-001",
    scenes: createMockScenes(12),
    characterRegistry: { "Chef Marco": chefMarco },
    summary: createMockJobSummary({
      mode: "hybrid",
      actualScenes: 12,
      targetScenes: 12,
    }),
    script: scriptEvent.data.script,
    colorProfile: fullColorProfile,
  },
};

// ============================================================================
// Error Events
// ============================================================================

/**
 * Quota exceeded error
 */
export const errorEventQuota: PromptErrorEvent = {
  event: "error",
  data: {
    type: "GEMINI_QUOTA",
    message: "Gemini API quota exceeded. Please try again later or check your API key limits.",
    retryable: true,
    failedBatch: 2,
    totalBatches: 5,
    scenesCompleted: 10,
    debug: {
      status: 429,
      originalMessage: "Resource exhausted",
      apiError: "RESOURCE_EXHAUSTED",
    },
  },
};

/**
 * Rate limit error
 */
export const errorEventRateLimit: PromptErrorEvent = {
  event: "error",
  data: {
    type: "GEMINI_RATE_LIMIT",
    message: "Rate limit exceeded. Please wait 60 seconds before retrying.",
    retryable: true,
    failedBatch: 3,
    totalBatches: 4,
    scenesCompleted: 15,
    debug: {
      status: 429,
      originalMessage: "Too many requests",
    },
  },
};

/**
 * Network timeout error
 */
export const errorEventTimeout: PromptErrorEvent = {
  event: "error",
  data: {
    type: "TIMEOUT",
    message: "Request timed out after 300000ms. The video may be too long or the API is slow.",
    retryable: true,
    failedBatch: 0,
    totalBatches: 2,
    scenesCompleted: 0,
  },
};

/**
 * Parse error (non-retryable)
 */
export const errorEventParse: PromptErrorEvent = {
  event: "error",
  data: {
    type: "PARSE_ERROR",
    message: "Failed to parse Gemini response. The AI returned invalid JSON.",
    retryable: false,
    failedBatch: 1,
    totalBatches: 3,
    scenesCompleted: 5,
    debug: {
      originalMessage: "Unexpected token at position 1523",
    },
  },
};

/**
 * Invalid URL error
 */
export const errorEventInvalidUrl: PromptErrorEvent = {
  event: "error",
  data: {
    type: "INVALID_URL",
    message: "The provided URL is not a valid YouTube video URL.",
    retryable: false,
  },
};

/**
 * Generic API error
 */
export const errorEventApiError: PromptErrorEvent = {
  event: "error",
  data: {
    type: "GEMINI_API_ERROR",
    message: "Gemini API returned an error. Please try again.",
    retryable: true,
    failedBatch: 2,
    totalBatches: 5,
    scenesCompleted: 10,
    debug: {
      status: 500,
      originalMessage: "Internal server error",
    },
  },
};

/**
 * Network error
 */
export const errorEventNetwork: PromptErrorEvent = {
  event: "error",
  data: {
    type: "NETWORK_ERROR",
    message: "Network connection failed. Please check your internet connection.",
    retryable: true,
    debug: {
      originalMessage: "ECONNREFUSED",
    },
  },
};

// ============================================================================
// Event Sequences (for testing full workflows)
// ============================================================================

/**
 * Successful job sequence (all events in order)
 */
export const successfulJobSequence: PromptSSEEvent[] = [
  progressPhase0,
  logEventPhase0Pending,
  colorProfileEvent,
  progressPhase1,
  logEventPhase1,
  characterEventMarco,
  characterEventAnna,
  progressBatch1of5,
  logEventPhase2Batch,
  batchComplete1,
  progressBatch3of5,
  batchComplete2,
  progressBatch5of5,
  batchCompleteFinal,
  progressComplete,
  completeEvent,
];

/**
 * Failed job sequence (fails at batch 3)
 */
export const failedJobSequence: PromptSSEEvent[] = [
  progressPhase0,
  colorProfileEvent,
  progressPhase1,
  characterEventMarco,
  progressBatch1of5,
  batchComplete1,
  progressBatch3of5,
  errorEventQuota,
];

/**
 * Hybrid workflow sequence (with script)
 */
export const hybridWorkflowSequence: PromptSSEEvent[] = [
  progressPhase0,
  colorProfileEvent,
  scriptEvent,
  progressPhase1,
  characterEventMarco,
  progressBatch1of5,
  batchComplete1,
  completeEventWithScript,
];

// ============================================================================
// Event Collections
// ============================================================================

/**
 * All progress events
 */
export const allProgressEvents: PromptProgressEvent[] = [
  progressPhase0,
  progressPhase1,
  progressBatch1of5,
  progressBatch3of5,
  progressBatch5of5,
  progressComplete,
];

/**
 * All character events
 */
export const allCharacterEvents: PromptCharacterEvent[] = [
  characterEventMarco,
  characterEventAnna,
  characterEventBackground,
];

/**
 * All error events
 */
export const allErrorEvents: PromptErrorEvent[] = [
  errorEventQuota,
  errorEventRateLimit,
  errorEventTimeout,
  errorEventParse,
  errorEventInvalidUrl,
  errorEventApiError,
  errorEventNetwork,
];

/**
 * Retryable error events
 */
export const retryableErrorEvents: PromptErrorEvent[] = [
  errorEventQuota,
  errorEventRateLimit,
  errorEventTimeout,
  errorEventApiError,
  errorEventNetwork,
];

/**
 * Non-retryable error events
 */
export const nonRetryableErrorEvents: PromptErrorEvent[] = [
  errorEventParse,
  errorEventInvalidUrl,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Serialize SSE event to string format
 */
export function serializeSSEEvent(event: PromptSSEEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

/**
 * Create a mock SSE stream from events
 */
export function createMockSSEStream(events: PromptSSEEvent[]): string {
  return events.map(serializeSSEEvent).join("");
}

/**
 * Parse SSE string back to events (for testing)
 */
export function parseSSEString(sseString: string): PromptSSEEvent[] {
  const events: PromptSSEEvent[] = [];
  const lines = sseString.split("\n");

  let currentEvent: string | null = null;
  let currentData: string | null = null;

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent = line.slice(7);
    } else if (line.startsWith("data: ")) {
      currentData = line.slice(6);
    } else if (line === "" && currentEvent && currentData) {
      events.push({
        event: currentEvent,
        data: JSON.parse(currentData),
      } as PromptSSEEvent);
      currentEvent = null;
      currentData = null;
    }
  }

  return events;
}
