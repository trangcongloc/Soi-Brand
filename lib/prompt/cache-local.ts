/**
 * Prompt Pipeline - Client-side caching for Prompt jobs using localStorage
 */

import {
  CachedPromptJob,
  CachedPromptJobInfo,
  Scene,
  CharacterRegistry,
  PromptJobSummary,
  GeneratedScript,
  GeminiLogEntry,
  PromptJobStatus,
  PromptErrorType,
  CinematicProfile,
} from "./types";
import { isBrowser } from "./browser-utils";
import { LocalStorageCache } from "@/lib/cache-manager";
import { dispatchJobUpdateEvent } from "./storage-utils";
import { clearPhaseCache } from "./phase-cache";
import {
  CACHE_TTL_MS,
  MAX_CACHED_JOBS,
  FAILED_JOB_CACHE_TTL_MS,
  COMPLETED_JOB_CACHE_TTL_MS,
  ESTIMATED_GEMINI_RESPONSE_MS,
} from "./constants";
import { logger } from "@/lib/logger";

const CACHE_PREFIX = "prompt_job_";

// Create cache manager instance
const jobCache = new LocalStorageCache<CachedPromptJob>({
  prefix: CACHE_PREFIX,
  maxItems: MAX_CACHED_JOBS,
  ttlMs: CACHE_TTL_MS,
});


/**
 * Get all cached Prompt jobs for a video (sorted by date, newest first)
 */
export function getCachedJobsForVideoLocal(videoId: string): CachedPromptJobInfo[] {
  if (!isBrowser()) return [];

  const allItems = jobCache.getAll();
  const jobs: CachedPromptJobInfo[] = [];
  const now = Date.now(); // For expiration check

  for (const item of allItems) {
    if (item.data.videoId === videoId) {
      // Check and remove expired jobs
      if (item.data.expiresAt && now > item.data.expiresAt) {
        jobCache.delete(item.data.jobId);
        continue; // Skip expired job
      }

      jobs.push({
        jobId: item.data.jobId,
        videoId: item.data.videoId,
        videoUrl: item.data.videoUrl,
        sceneCount: item.data.scenes?.length || 0,
        charactersFound: Object.keys(item.data.characterRegistry || {}).length,
        mode: item.data.summary.mode,
        voice: item.data.summary.voice,
        timestamp: item.data.timestamp,
        createdAt: item.data.summary.createdAt,
        expiresAt: item.data.expiresAt, // Include expiration
        hasScript: !!item.data.script,
        status: item.data.status || "completed",
        error: item.data.error,
      });
    }
  }

  return jobs.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get a cached Prompt job by job ID
 * BUG FIX #15: Uses job-level expiresAt as single source of truth for expiration
 * The LocalStorageCache TTL is a backstop; job.expiresAt is the real expiration
 */
export function getCachedJobLocal(jobId: string): CachedPromptJob | null {
  if (!isBrowser()) return null;

  const job = jobCache.get(jobId);

  // Check if expired using expiresAt field (single source of truth)
  if (job && job.expiresAt && Date.now() > job.expiresAt) {
    // Job expired according to its own expiration time
    jobCache.delete(jobId);
    return null;
  }

  return job;
}

/**
 * Get the most recent cached job for a video
 */
export function getLatestCachedJobLocal(videoId: string): CachedPromptJob | null {
  const jobs = getCachedJobsForVideoLocal(videoId);
  if (jobs.length === 0) return null;
  return getCachedJobLocal(jobs[0].jobId);
}

/**
 * Save a Prompt job to cache
 * @param options.preserveTimestamp - If true and existing job exists, keep original timestamp
 *                                    Useful for fixing log entries without changing sort order
 */
export function setCachedJobLocal(
  jobId: string,
  data: {
    videoId: string;
    videoUrl: string;
    summary: PromptJobSummary;
    scenes: Scene[];
    characterRegistry: CharacterRegistry;
    script?: GeneratedScript; // Optional script for regeneration
    colorProfile?: CinematicProfile; // Optional color profile from Phase 0
    logs?: GeminiLogEntry[]; // Log entries for scene request/response display
    status?: PromptJobStatus;
    error?: {
      message: string;
      type: PromptErrorType;
      failedBatch?: number;
      totalBatches?: number;
      retryable: boolean;
    };
    resumeData?: CachedPromptJob["resumeData"];
  },
  options?: { preserveTimestamp?: boolean }
): void {
  if (!isBrowser()) return;

  // BUG FIX: When preserveTimestamp is true, keep original timestamp so job doesn't jump to top
  let timestamp = Date.now();
  if (options?.preserveTimestamp) {
    const existingJob = jobCache.get(jobId);
    if (existingJob) {
      timestamp = existingJob.timestamp;
    }
  }
  const status = data.status || "completed";

  // Compute expiration based on status
  let expiresAt: number;
  if (status === "failed" || status === "partial") {
    expiresAt = timestamp + FAILED_JOB_CACHE_TTL_MS; // 48 hours
  } else {
    expiresAt = timestamp + COMPLETED_JOB_CACHE_TTL_MS; // 7 days
  }

  const cacheData: CachedPromptJob = {
    jobId,
    videoId: data.videoId,
    videoUrl: data.videoUrl,
    summary: data.summary,
    scenes: data.scenes,
    characterRegistry: data.characterRegistry,
    timestamp,
    expiresAt, // Include expiration
    script: data.script,
    colorProfile: data.colorProfile,
    logs: data.logs,
    status,
    error: data.error,
    resumeData: data.resumeData,
  };

  jobCache.set(jobId, cacheData, timestamp);

  // Dispatch custom event to notify other components of the change
  dispatchJobUpdateEvent(jobId);
}

/**
 * Clear expired jobs from cache
 * BUG FIX #15: Uses job-level expiresAt as single source of truth
 */
export function clearExpiredJobsLocal(): void {
  // First, use the cache manager's TTL-based cleanup
  jobCache.clearExpired();

  // Then check job-level expiresAt for more precise expiration
  const allItems = jobCache.getAll();
  const now = Date.now();
  for (const item of allItems) {
    if (item.data.expiresAt && now > item.data.expiresAt) {
      jobCache.delete(item.id);
    }
  }
}

/**
 * Clear all cached Prompt jobs
 * BUG FIX #16: Also clears all phase caches
 */
export function clearAllJobsLocal(): void {
  // Get all job IDs first to clear their phase caches
  const allItems = jobCache.getAll();
  for (const item of allItems) {
    if (item.data.jobId) {
      clearPhaseCache(item.data.jobId);
    }
  }

  jobCache.clearAll();

  // Notify listeners that all jobs were cleared
  dispatchJobUpdateEvent(null);
}

/**
 * Delete a specific cached job by job ID
 * BUG FIX #16: Also deletes associated phase cache
 */
export function deleteCachedJobLocal(jobId: string): void {
  if (!isBrowser()) return;

  jobCache.delete(jobId);

  // Also delete associated phase cache to prevent orphaned data
  clearPhaseCache(jobId);

  // Notify listeners of the deletion
  dispatchJobUpdateEvent(jobId);
}

/**
 * Fix pending log entries in a job
 * When SSE disconnects, log entries remain "pending" even though requests completed
 * This function marks them as "completed" with estimated timing data
 * Also fixes stale "Batch X/Y" processingTime in summary
 */
export function fixPendingLogEntries(job: CachedPromptJob): boolean {
  if (!job.logs || job.logs.length === 0) return false;

  let fixed = false;
  for (const log of job.logs) {
    if (log.status === "pending") {
      log.status = "completed";
      // If response data is missing (SSE disconnected before response), add placeholder
      if (!log.response || !log.response.body) {
        log.response = {
          success: true,
          body: "[Response received but SSE disconnected before delivery]",
          responseLength: 0,
          parsedSummary: "Completed (connection lost)",
        };
      }
      // If timing is missing, estimate based on typical response time
      if (!log.timing || log.timing.durationMs === 0) {
        log.timing = {
          durationMs: ESTIMATED_GEMINI_RESPONSE_MS,
          retries: 0,
        };
      }
      fixed = true;
    }
  }

  // Fix stale "Batch X/Y" processingTime in summary
  // This happens when SSE disconnects before the complete event updates the summary
  if (job.summary && job.summary.processingTime) {
    const isBatchProgress = /^Batch \d+\/\d+$/.test(job.summary.processingTime);
    const isInProgress = job.summary.processingTime.toLowerCase().includes("progress");

    if (isBatchProgress || isInProgress) {
      // Calculate total processing time from log entries
      const totalMs = job.logs.reduce((sum, log) => {
        return sum + (log.timing?.durationMs || 0);
      }, 0);

      // Format as seconds with 1 decimal place
      job.summary.processingTime = `${(totalMs / 1000).toFixed(1)}s`;
      fixed = true;
    }
  }

  return fixed;
}

/**
 * Fix orphaned jobs that are marked as "in_progress" but actually have scenes
 * Also fixes any pending log entries in completed jobs (SSE disconnect issue)
 * This can happen when SSE stream disconnects before final status update
 */
export function fixOrphanedJobsLocal(): number {
  if (!isBrowser()) return 0;

  const allItems = jobCache.getAll();
  let fixedCount = 0;

  for (const item of allItems) {
    const job = item.data;
    let needsUpdate = false;

    // Check if job is "in_progress" but has scenes (meaning it actually completed)
    if (job.status === "in_progress" && job.scenes && job.scenes.length > 0) {
      // Fix the status to "completed"
      job.status = "completed";
      needsUpdate = true;
      logger.info(`[Cache] Fixed orphaned job ${job.jobId}: ${job.scenes.length} scenes, status now "completed"`);
    }

    // Fix pending log entries regardless of job status
    // This handles jobs that were synced from cloud with completed status but pending logs
    if (job.scenes && job.scenes.length > 0) {
      if (fixPendingLogEntries(job)) {
        needsUpdate = true;
        logger.info(`[Cache] Fixed pending log entries for job ${job.jobId}`);
      }
    }

    if (needsUpdate) {
      // Update the cache
      jobCache.set(job.jobId, job, item.timestamp);
      fixedCount++;
    }
  }

  if (fixedCount > 0) {
    dispatchJobUpdateEvent(null); // Notify all listeners
  }

  return fixedCount;
}

/**
 * Get list of all cached Prompt jobs (for history feature)
 */
export function getCachedJobListLocal(): CachedPromptJobInfo[] {
  if (!isBrowser()) return [];

  const allItems = jobCache.getAll();
  const jobs: CachedPromptJobInfo[] = [];
  const now = Date.now(); // For expiration check

  for (const item of allItems) {
    if (item.data.jobId) {
      // Check and remove expired jobs
      if (item.data.expiresAt && now > item.data.expiresAt) {
        jobCache.delete(item.data.jobId);
        continue; // Skip expired job
      }

      jobs.push({
        jobId: item.data.jobId,
        videoId: item.data.videoId,
        videoUrl: item.data.videoUrl,
        sceneCount: item.data.scenes?.length || 0,
        charactersFound: Object.keys(item.data.characterRegistry || {}).length,
        mode: item.data.summary?.mode || "hybrid",
        voice: item.data.summary?.voice || "no-voice",
        timestamp: item.data.timestamp,
        createdAt: item.data.summary?.createdAt || new Date(item.data.timestamp).toISOString(),
        expiresAt: item.data.expiresAt, // Include expiration
        hasScript: !!item.data.script,
        status: item.data.status || "completed",
        error: item.data.error,
      });
    }
  }

  // Sort by most recent first
  return jobs.sort((a, b) => b.timestamp - a.timestamp);
}
