/**
 * VEO Pipeline - Client-side caching for VEO jobs using localStorage
 */

import {
  CachedVeoJob,
  CachedVeoJobInfo,
  Scene,
  CharacterRegistry,
  VeoJobSummary,
  GeneratedScript,
  GeminiLogEntry,
  VeoJobStatus,
  VeoErrorType,
  CinematicProfile,
} from "./types";
import { isBrowser } from "./browser-utils";
import { LocalStorageCache } from "@/lib/cache-manager";
import { dispatchJobUpdateEvent } from "./storage-utils";
import {
  CACHE_TTL_MS,
  MAX_CACHED_JOBS,
  FAILED_JOB_CACHE_TTL_MS,
  COMPLETED_JOB_CACHE_TTL_MS,
} from "./constants";

const CACHE_PREFIX = "veo_job_";

// Create cache manager instance
const jobCache = new LocalStorageCache<CachedVeoJob>({
  prefix: CACHE_PREFIX,
  maxItems: MAX_CACHED_JOBS,
  ttlMs: CACHE_TTL_MS,
});


/**
 * Get all cached VEO jobs for a video (sorted by date, newest first)
 */
export function getCachedJobsForVideoLocal(videoId: string): CachedVeoJobInfo[] {
  if (!isBrowser()) return [];

  const allItems = jobCache.getAll();
  const jobs: CachedVeoJobInfo[] = [];
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
 * Get a cached VEO job by job ID
 */
export function getCachedJobLocal(jobId: string): CachedVeoJob | null {
  if (!isBrowser()) return null;

  const job = jobCache.get(jobId);

  // Check if expired using expiresAt field
  if (job && job.expiresAt && Date.now() > job.expiresAt) {
    jobCache.delete(jobId);
    return null;
  }

  return job;
}

/**
 * Get the most recent cached job for a video
 */
export function getLatestCachedJobLocal(videoId: string): CachedVeoJob | null {
  const jobs = getCachedJobsForVideoLocal(videoId);
  if (jobs.length === 0) return null;
  return getCachedJobLocal(jobs[0].jobId);
}

/**
 * Save a VEO job to cache
 */
export function setCachedJobLocal(
  jobId: string,
  data: {
    videoId: string;
    videoUrl: string;
    summary: VeoJobSummary;
    scenes: Scene[];
    characterRegistry: CharacterRegistry;
    script?: GeneratedScript; // Optional script for regeneration
    colorProfile?: CinematicProfile; // Optional color profile from Phase 0
    logs?: GeminiLogEntry[]; // Log entries for scene request/response display
    status?: VeoJobStatus;
    error?: {
      message: string;
      type: VeoErrorType;
      failedBatch?: number;
      totalBatches?: number;
      retryable: boolean;
    };
    resumeData?: CachedVeoJob["resumeData"];
  }
): void {
  if (!isBrowser()) return;

  const timestamp = Date.now();
  const status = data.status || "completed";

  // Compute expiration based on status
  let expiresAt: number;
  if (status === "failed" || status === "partial") {
    expiresAt = timestamp + FAILED_JOB_CACHE_TTL_MS; // 48 hours
  } else {
    expiresAt = timestamp + COMPLETED_JOB_CACHE_TTL_MS; // 7 days
  }

  const cacheData: CachedVeoJob = {
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
 */
export function clearExpiredJobsLocal(): void {
  jobCache.clearExpired();
}

/**
 * Clear all cached VEO jobs
 */
export function clearAllJobsLocal(): void {
  jobCache.clearAll();

  // Notify listeners that all jobs were cleared
  dispatchJobUpdateEvent(null);
}

/**
 * Delete a specific cached job by job ID
 */
export function deleteCachedJobLocal(jobId: string): void {
  if (!isBrowser()) return;

  jobCache.delete(jobId);

  // Notify listeners of the deletion
  dispatchJobUpdateEvent(jobId);
}

/**
 * Get list of all cached VEO jobs (for history feature)
 */
export function getCachedJobListLocal(): CachedVeoJobInfo[] {
  if (!isBrowser()) return [];

  const allItems = jobCache.getAll();
  const jobs: CachedVeoJobInfo[] = [];
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
