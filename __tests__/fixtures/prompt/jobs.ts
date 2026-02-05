/**
 * VEO Test Fixtures - Pre-built Job Fixtures
 * Ready-to-use CachedPromptJob fixtures for common test scenarios
 */

import type { CachedPromptJob } from "@/lib/prompt/types";
import {
  CACHE_TTL_MS,
  FAILED_JOB_CACHE_TTL_MS,
} from "@/lib/prompt/constants";
import {
  createMockJob,
  createMockScenes,
  createMockCharacter,
  createMockCharacterRegistry,
  createMockLogEntry,
  daysAgo,
  hoursAgo,
  minutesAgo,
} from "./factories";
import { fullColorProfile } from "./color-profiles";

// ============================================================================
// Completed Jobs
// ============================================================================

/**
 * A fully completed job with all data populated.
 * Use for testing successful job display and data access.
 */
export const completedJob: CachedPromptJob = createMockJob({
  jobId: "completed-job-001",
  videoId: "yt-video-abc123",
  videoUrl: "https://www.youtube.com/watch?v=abc123",
  status: "completed",
  sceneCount: 10,
  colorProfile: fullColorProfile,
  logs: [
    createMockLogEntry({ phase: "phase-0", parsedItemCount: 1 }),
    createMockLogEntry({ phase: "phase-1", parsedItemCount: 2 }),
    createMockLogEntry({ phase: "phase-2", batchNumber: 0, parsedItemCount: 5 }),
    createMockLogEntry({ phase: "phase-2", batchNumber: 1, parsedItemCount: 5 }),
  ],
  summaryOverrides: {
    processingTime: "1m 23s",
    batches: 2,
    batchSize: 5,
  },
});

/**
 * A completed job with minimal data (no color profile, no logs).
 * Use for testing backward compatibility with older cached jobs.
 */
export const completedJobMinimal: CachedPromptJob = createMockJob({
  jobId: "completed-minimal-001",
  videoId: "yt-video-minimal",
  status: "completed",
  sceneCount: 5,
  summaryOverrides: {
    processingTime: "30s",
    batches: 1,
    batchSize: 5,
  },
});

/**
 * A completed job that's about to expire (created 6 days ago).
 * Use for testing TTL/expiration logic.
 */
export const completedJobNearExpiry: CachedPromptJob = createMockJob({
  jobId: "near-expiry-001",
  videoId: "yt-video-expiring",
  status: "completed",
  sceneCount: 8,
  timestamp: daysAgo(6),
  expiresAt: daysAgo(6) + CACHE_TTL_MS,
});

// ============================================================================
// In-Progress Jobs
// ============================================================================

/**
 * A job currently in progress (batch 2 of 5).
 * Use for testing progress display and resume logic.
 */
export const inProgressJob: CachedPromptJob = createMockJob({
  jobId: "in-progress-001",
  videoId: "yt-video-progress",
  videoUrl: "https://www.youtube.com/watch?v=progress123",
  status: "in_progress",
  scenes: createMockScenes(10), // 2 batches completed
  sceneCount: 25, // Target is 25 scenes
  timestamp: minutesAgo(2), // Recent - not stalled
  resumeData: {
    completedBatches: 2,
    existingScenes: createMockScenes(10),
    existingCharacters: createMockCharacterRegistry([
      createMockCharacter({ name: "Chef Marco" }),
    ]),
    workflow: "url-to-scenes",
    mode: "direct",
    batchSize: 5,
    sceneCount: 25,
    voice: "english",
    extractColorProfile: true,
  },
  logs: [
    createMockLogEntry({ phase: "phase-0", parsedItemCount: 1 }),
    createMockLogEntry({ phase: "phase-1", parsedItemCount: 1 }),
    createMockLogEntry({ phase: "phase-2", batchNumber: 0, parsedItemCount: 5 }),
    createMockLogEntry({ phase: "phase-2", batchNumber: 1, parsedItemCount: 5 }),
  ],
  summaryOverrides: {
    targetScenes: 25,
    actualScenes: 10,
    batches: 5,
    batchSize: 5,
    status: "in_progress",
  },
});

/**
 * A job at the very beginning (batch 0 of 3, no scenes yet).
 * Use for testing initial state handling.
 */
export const inProgressJobStart: CachedPromptJob = createMockJob({
  jobId: "in-progress-start-001",
  videoId: "yt-video-start",
  status: "in_progress",
  scenes: [],
  sceneCount: 15,
  timestamp: minutesAgo(1),
  resumeData: {
    completedBatches: 0,
    existingScenes: [],
    existingCharacters: {},
    workflow: "url-to-scenes",
    mode: "direct",
    batchSize: 5,
    sceneCount: 15,
    voice: "english",
  },
  logs: [
    createMockLogEntry({ phase: "phase-0", status: "pending" }),
  ],
  summaryOverrides: {
    targetScenes: 15,
    actualScenes: 0,
    batches: 3,
    status: "in_progress",
  },
});

/**
 * A stalled job - in_progress but no updates for 5+ minutes.
 * Use for testing stale job detection and recovery.
 */
export const stalledJob: CachedPromptJob = createMockJob({
  jobId: "stalled-001",
  videoId: "yt-video-stalled",
  status: "in_progress",
  scenes: createMockScenes(5),
  sceneCount: 20,
  timestamp: minutesAgo(10), // Last update 10 minutes ago
  resumeData: {
    completedBatches: 1,
    existingScenes: createMockScenes(5),
    existingCharacters: createMockCharacterRegistry([
      createMockCharacter({ name: "Chef Marco" }),
    ]),
    workflow: "url-to-scenes",
    mode: "direct",
    batchSize: 5,
    sceneCount: 20,
    voice: "english",
  },
  summaryOverrides: {
    targetScenes: 20,
    actualScenes: 5,
    batches: 4,
    status: "in_progress",
  },
});

// ============================================================================
// Failed Jobs
// ============================================================================

/**
 * A job that failed at batch 3 due to quota error.
 * Use for testing error display and retry logic.
 */
export const failedJob: CachedPromptJob = createMockJob({
  jobId: "failed-001",
  videoId: "yt-video-failed",
  status: "failed",
  scenes: createMockScenes(10), // 2 batches completed before failure
  sceneCount: 25,
  timestamp: hoursAgo(2),
  expiresAt: hoursAgo(2) + FAILED_JOB_CACHE_TTL_MS,
  error: {
    message: "Gemini API quota exceeded. Please try again later.",
    type: "GEMINI_QUOTA",
    failedBatch: 2, // 0-indexed, so batch 3
    totalBatches: 5,
    retryable: true,
  },
  resumeData: {
    completedBatches: 2,
    existingScenes: createMockScenes(10),
    existingCharacters: createMockCharacterRegistry([
      createMockCharacter({ name: "Chef Marco" }),
    ]),
    workflow: "url-to-scenes",
    mode: "direct",
    batchSize: 5,
    sceneCount: 25,
    voice: "english",
  },
  summaryOverrides: {
    targetScenes: 25,
    actualScenes: 10,
    batches: 5,
    status: "failed",
    error: {
      message: "Gemini API quota exceeded. Please try again later.",
      type: "GEMINI_QUOTA",
      failedBatch: 2,
      totalBatches: 5,
      retryable: true,
    },
  },
});

/**
 * A job that failed due to rate limiting (retryable after delay).
 */
export const failedJobRateLimit: CachedPromptJob = createMockJob({
  jobId: "failed-rate-limit-001",
  videoId: "yt-video-rate-limited",
  status: "failed",
  scenes: createMockScenes(15),
  sceneCount: 20,
  timestamp: minutesAgo(30),
  error: {
    message: "Rate limit exceeded. Retry after 60 seconds.",
    type: "GEMINI_RATE_LIMIT",
    failedBatch: 3,
    totalBatches: 4,
    retryable: true,
  },
  resumeData: {
    completedBatches: 3,
    existingScenes: createMockScenes(15),
    existingCharacters: createMockCharacterRegistry([
      createMockCharacter({ name: "Chef Marco" }),
      createMockCharacter({ name: "Sous Chef Anna", gender: "female" }),
    ]),
    workflow: "url-to-scenes",
    mode: "direct",
    batchSize: 5,
    sceneCount: 20,
    voice: "vietnamese",
  },
  summaryOverrides: {
    targetScenes: 20,
    actualScenes: 15,
    status: "failed",
  },
});

/**
 * A job that failed due to network timeout (non-retryable without intervention).
 */
export const failedJobTimeout: CachedPromptJob = createMockJob({
  jobId: "failed-timeout-001",
  videoId: "yt-video-timeout",
  status: "failed",
  scenes: [],
  sceneCount: 10,
  timestamp: hoursAgo(1),
  error: {
    message: "Request timed out after 300000ms",
    type: "TIMEOUT",
    failedBatch: 0,
    totalBatches: 2,
    retryable: true,
  },
  summaryOverrides: {
    targetScenes: 10,
    actualScenes: 0,
    status: "failed",
  },
});

/**
 * A job that failed due to parse error (non-retryable).
 */
export const failedJobParseError: CachedPromptJob = createMockJob({
  jobId: "failed-parse-001",
  videoId: "yt-video-parse-error",
  status: "failed",
  scenes: createMockScenes(5),
  sceneCount: 15,
  timestamp: hoursAgo(3),
  error: {
    message: "Failed to parse Gemini response: Unexpected token",
    type: "PARSE_ERROR",
    failedBatch: 1,
    totalBatches: 3,
    retryable: false,
  },
  summaryOverrides: {
    targetScenes: 15,
    actualScenes: 5,
    status: "failed",
  },
});

// ============================================================================
// Partial Jobs
// ============================================================================

/**
 * A partial job with some scenes completed, can be resumed.
 * Status is "partial" (distinct from "in_progress" and "failed").
 */
export const partialJob: CachedPromptJob = createMockJob({
  jobId: "partial-001",
  videoId: "yt-video-partial",
  status: "partial",
  scenes: createMockScenes(15),
  sceneCount: 30,
  timestamp: hoursAgo(6),
  colorProfile: fullColorProfile,
  resumeData: {
    completedBatches: 3,
    existingScenes: createMockScenes(15),
    existingCharacters: createMockCharacterRegistry([
      createMockCharacter({ name: "Chef Marco" }),
      createMockCharacter({ name: "Sous Chef Anna", gender: "female" }),
    ]),
    workflow: "url-to-scenes",
    mode: "direct",
    batchSize: 5,
    sceneCount: 30,
    voice: "english",
    colorProfile: fullColorProfile,
    useVideoTitle: true,
    useVideoDescription: true,
    extractColorProfile: true,
  },
  summaryOverrides: {
    targetScenes: 30,
    actualScenes: 15,
    batches: 6,
    status: "partial",
  },
});

// ============================================================================
// Edge Cases
// ============================================================================

/**
 * A job with 0 scenes (edge case).
 * Use for testing empty state handling.
 */
export const emptyJob: CachedPromptJob = createMockJob({
  jobId: "empty-001",
  videoId: "yt-video-empty",
  status: "completed",
  scenes: [],
  sceneCount: 0,
  summaryOverrides: {
    targetScenes: 0,
    actualScenes: 0,
    batches: 0,
  },
});

/**
 * A job that has expired (past TTL).
 * Use for testing cleanup and expiration logic.
 */
export const expiredJob: CachedPromptJob = createMockJob({
  jobId: "expired-001",
  videoId: "yt-video-expired",
  status: "completed",
  sceneCount: 8,
  timestamp: daysAgo(10),
  expiresAt: daysAgo(3), // Expired 3 days ago
});

/**
 * A failed job that has expired.
 */
export const expiredFailedJob: CachedPromptJob = createMockJob({
  jobId: "expired-failed-001",
  videoId: "yt-video-expired-failed",
  status: "failed",
  scenes: createMockScenes(5),
  sceneCount: 20,
  timestamp: daysAgo(5),
  expiresAt: daysAgo(3), // Expired 3 days ago
  error: {
    message: "Old failure",
    type: "GEMINI_API_ERROR",
    retryable: false,
  },
});

/**
 * A job with hybrid mode (script-first workflow).
 */
export const hybridModeJob: CachedPromptJob = createMockJob({
  jobId: "hybrid-001",
  videoId: "yt-video-hybrid",
  status: "completed",
  sceneCount: 12,
  resumeData: {
    completedBatches: 3,
    workflow: "url-to-script",
    mode: "hybrid",
    batchSize: 4,
    sceneCount: 12,
    voice: "vietnamese",
    existingScenes: createMockScenes(12),
    existingCharacters: createMockCharacterRegistry([
      createMockCharacter({ name: "Presenter" }),
    ]),
  },
  summaryOverrides: {
    mode: "hybrid",
    batches: 3,
    batchSize: 4,
    voice: "vietnamese",
  },
});

/**
 * A job with image media type (not video).
 */
export const imageMediaTypeJob: CachedPromptJob = createMockJob({
  jobId: "image-type-001",
  videoId: "yt-video-images",
  status: "completed",
  scenes: createMockScenes(8).map(s => ({ ...s, mediaType: "image" as const })),
  sceneCount: 8,
  resumeData: {
    completedBatches: 2,
    workflow: "url-to-scenes",
    mode: "direct",
    batchSize: 4,
    sceneCount: 8,
    voice: "no-voice",
    mediaType: "image",
    existingScenes: createMockScenes(8).map(s => ({ ...s, mediaType: "image" as const })),
    existingCharacters: {},
  },
  summaryOverrides: {
    voice: "no-voice",
  },
});

// ============================================================================
// Job Collections (for batch testing)
// ============================================================================

/**
 * All job fixtures in a single array.
 */
export const allJobs: CachedPromptJob[] = [
  completedJob,
  completedJobMinimal,
  completedJobNearExpiry,
  inProgressJob,
  inProgressJobStart,
  stalledJob,
  failedJob,
  failedJobRateLimit,
  failedJobTimeout,
  failedJobParseError,
  partialJob,
  emptyJob,
  expiredJob,
  expiredFailedJob,
  hybridModeJob,
  imageMediaTypeJob,
];

/**
 * Jobs that can be resumed (in_progress, failed with retryable, partial).
 */
export const resumableJobs: CachedPromptJob[] = [
  inProgressJob,
  inProgressJobStart,
  stalledJob,
  failedJob,
  failedJobRateLimit,
  failedJobTimeout,
  partialJob,
];

/**
 * Jobs that have errors.
 */
export const errorJobs: CachedPromptJob[] = [
  failedJob,
  failedJobRateLimit,
  failedJobTimeout,
  failedJobParseError,
];

/**
 * Jobs that have expired.
 */
export const expiredJobs: CachedPromptJob[] = [
  expiredJob,
  expiredFailedJob,
];
