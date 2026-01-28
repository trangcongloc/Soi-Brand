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
  VeoJobStatus,
  VeoErrorType,
  VoiceLanguage,
  VeoMode,
  CinematicProfile,
} from "./types";
import { isBrowser } from "./browser-utils";
import { LocalStorageCache } from "@/lib/cache-manager";
import { dispatchJobUpdateEvent } from "./storage-utils";
import { CACHE_TTL_MS, MAX_CACHED_JOBS } from "./constants";

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
export function getCachedJobsForVideo(videoId: string): CachedVeoJobInfo[] {
  if (!isBrowser()) return [];

  const allItems = jobCache.getAll();
  const jobs: CachedVeoJobInfo[] = [];

  for (const item of allItems) {
    if (item.data.videoId === videoId) {
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
export function getCachedJob(jobId: string): CachedVeoJob | null {
  if (!isBrowser()) return null;
  return jobCache.get(jobId);
}

/**
 * Get the most recent cached job for a video
 */
export function getLatestCachedJob(videoId: string): CachedVeoJob | null {
  const jobs = getCachedJobsForVideo(videoId);
  if (jobs.length === 0) return null;
  return getCachedJob(jobs[0].jobId);
}

/**
 * Save a VEO job to cache
 */
export function setCachedJob(
  jobId: string,
  data: {
    videoId: string;
    videoUrl: string;
    summary: VeoJobSummary;
    scenes: Scene[];
    characterRegistry: CharacterRegistry;
    script?: GeneratedScript; // Optional script for regeneration
    colorProfile?: CinematicProfile; // Optional color profile from Phase 0
    status?: VeoJobStatus;
    error?: {
      message: string;
      type: VeoErrorType;
      failedBatch?: number;
      totalBatches?: number;
      retryable: boolean;
    };
    resumeData?: {
      completedBatches: number;
      existingScenes: Scene[];
      existingCharacters: CharacterRegistry;
      workflow: "url-to-script" | "script-to-scenes" | "url-to-scenes";
      mode: VeoMode;
      batchSize: number;
      sceneCount: number;
      voice: VoiceLanguage;
    };
  }
): void {
  if (!isBrowser()) return;

  const timestamp = Date.now();

  const cacheData: CachedVeoJob = {
    jobId,
    videoId: data.videoId,
    videoUrl: data.videoUrl,
    summary: data.summary,
    scenes: data.scenes,
    characterRegistry: data.characterRegistry,
    timestamp,
    script: data.script,
    colorProfile: data.colorProfile,
    status: data.status || "completed",
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
export function clearExpiredJobs(): void {
  jobCache.clearExpired();
}

/**
 * Clear all cached VEO jobs
 */
export function clearAllJobs(): void {
  jobCache.clearAll();

  // Notify listeners that all jobs were cleared
  dispatchJobUpdateEvent(null);
}

/**
 * Delete a specific cached job by job ID
 */
export function deleteCachedJob(jobId: string): void {
  if (!isBrowser()) return;

  jobCache.delete(jobId);

  // Notify listeners of the deletion
  dispatchJobUpdateEvent(jobId);
}

/**
 * Get list of all cached VEO jobs (for history feature)
 */
export function getCachedJobList(): CachedVeoJobInfo[] {
  if (!isBrowser()) return [];

  const allItems = jobCache.getAll();
  const jobs: CachedVeoJobInfo[] = [];

  for (const item of allItems) {
    if (item.data.jobId) {
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
        hasScript: !!item.data.script,
        status: item.data.status || "completed",
        error: item.data.error,
      });
    }
  }

  // Sort by most recent first
  return jobs.sort((a, b) => b.timestamp - a.timestamp);
}
