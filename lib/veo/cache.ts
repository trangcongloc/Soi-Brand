/**
 * VEO Pipeline - Client-side caching for VEO jobs using localStorage
 */

import {
  CachedVeoJob,
  CachedVeoJobInfo,
  Scene,
  CharacterRegistry,
  VeoJobSummary,
} from "./types";
import { logger } from "@/lib/logger";

const CACHE_PREFIX = "veo_job_";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_TOTAL_JOBS = 20; // Maximum number of cached VEO jobs

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Get cache key for a VEO job
 */
function getCacheKey(jobId: string): string {
  return `${CACHE_PREFIX}${jobId}`;
}

/**
 * Get all cached VEO job keys
 */
function getAllCacheKeys(): string[] {
  if (!isBrowser()) return [];

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Get all cached VEO jobs for a video (sorted by date, newest first)
 */
export function getCachedJobsForVideo(videoId: string): CachedVeoJobInfo[] {
  if (!isBrowser()) return [];

  const keys = getAllCacheKeys();
  const jobs: CachedVeoJobInfo[] = [];

  for (const key of keys) {
    try {
      const data: CachedVeoJob = JSON.parse(localStorage.getItem(key) || "{}");
      if (data.videoId === videoId && data.scenes) {
        // Check if not expired
        if (Date.now() - data.timestamp <= CACHE_TTL) {
          jobs.push({
            jobId: data.jobId,
            videoId: data.videoId,
            videoUrl: data.videoUrl,
            sceneCount: data.scenes.length,
            charactersFound: Object.keys(data.characterRegistry || {}).length,
            mode: data.summary.mode,
            voice: data.summary.voice,
            timestamp: data.timestamp,
            createdAt: data.summary.createdAt,
          });
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Skip corrupted entries
    }
  }

  return jobs.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get a cached VEO job by job ID
 */
export function getCachedJob(jobId: string): CachedVeoJob | null {
  if (!isBrowser()) return null;

  try {
    const key = getCacheKey(jobId);
    const cached = localStorage.getItem(key);

    if (!cached) return null;

    const data: CachedVeoJob = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
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
  }
): void {
  if (!isBrowser()) return;

  try {
    const timestamp = Date.now();

    // Enforce total job limit
    const allKeys = getAllCacheKeys();
    if (allKeys.length >= MAX_TOTAL_JOBS) {
      // Find and remove oldest job
      let oldestKey = allKeys[0];
      let oldestTime = Infinity;

      for (const key of allKeys) {
        try {
          const jobData = JSON.parse(localStorage.getItem(key) || "{}");
          if (jobData.timestamp < oldestTime) {
            oldestTime = jobData.timestamp;
            oldestKey = key;
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
      localStorage.removeItem(oldestKey);
    }

    const cacheData: CachedVeoJob = {
      jobId,
      videoId: data.videoId,
      videoUrl: data.videoUrl,
      summary: data.summary,
      scenes: data.scenes,
      characterRegistry: data.characterRegistry,
      timestamp,
    };

    const key = getCacheKey(jobId);
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    logger.error("Error writing VEO job to cache", error);
    if (error instanceof Error && error.name === "QuotaExceededError") {
      clearOldJobs();
    }
  }
}

/**
 * Clear expired jobs from cache
 */
export function clearExpiredJobs(): void {
  if (!isBrowser()) return;

  const keys = getAllCacheKeys();
  const now = Date.now();

  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      if (now - data.timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Clear old jobs (keep only most recent)
 */
function clearOldJobs(): void {
  if (!isBrowser()) return;

  const keys = getAllCacheKeys();
  const jobs: { key: string; timestamp: number }[] = [];

  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      jobs.push({ key, timestamp: data.timestamp || 0 });
    } catch {
      localStorage.removeItem(key);
    }
  }

  // Sort by timestamp descending and keep only 5
  jobs.sort((a, b) => b.timestamp - a.timestamp);
  const toRemove = jobs.slice(5);

  for (const { key } of toRemove) {
    localStorage.removeItem(key);
  }
}

/**
 * Clear all cached VEO jobs
 */
export function clearAllJobs(): void {
  if (!isBrowser()) return;

  const keys = getAllCacheKeys();
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

/**
 * Delete a specific cached job by job ID
 */
export function deleteCachedJob(jobId: string): void {
  if (!isBrowser()) return;

  const key = getCacheKey(jobId);
  localStorage.removeItem(key);
}

/**
 * Get list of all cached VEO jobs (for history feature)
 */
export function getCachedJobList(): CachedVeoJobInfo[] {
  if (!isBrowser()) return [];

  const keys = getAllCacheKeys();
  const jobs: CachedVeoJobInfo[] = [];

  for (const key of keys) {
    try {
      const data: CachedVeoJob = JSON.parse(localStorage.getItem(key) || "{}");
      if (data.jobId && data.scenes) {
        // Check if not expired
        if (Date.now() - data.timestamp <= CACHE_TTL) {
          jobs.push({
            jobId: data.jobId,
            videoId: data.videoId,
            videoUrl: data.videoUrl,
            sceneCount: data.scenes.length,
            charactersFound: Object.keys(data.characterRegistry || {}).length,
            mode: data.summary.mode,
            voice: data.summary.voice,
            timestamp: data.timestamp,
            createdAt: data.summary.createdAt,
          });
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Skip corrupted entries
    }
  }

  // Sort by most recent first
  return jobs.sort((a, b) => b.timestamp - a.timestamp);
}
