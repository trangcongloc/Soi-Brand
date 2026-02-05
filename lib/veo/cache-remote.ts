/**
 * VEO Pipeline - Async cache with D1 + localStorage fallback
 * Provides cross-device sync via Cloudflare D1
 */

import type { CachedVeoJob, CachedVeoJobInfo } from "./types";
import * as localCache from "./cache-local";
import { getUserSettings } from "@/lib/userSettings";
import { logger } from "@/lib/logger";

const API_TIMEOUT_MS = 5000; // 5 seconds

// BUG FIX #4: Retry queue for D1 writes with exponential backoff
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1 second base delay

interface PendingWrite {
  jobId: string;
  job: CachedVeoJob;
  attempts: number;
  lastAttempt: number;
}

// Queue for pending D1 writes that need retry
const pendingWrites = new Map<string, PendingWrite>();
let retryTimerId: ReturnType<typeof setTimeout> | null = null;

/**
 * Process pending write retry queue
 */
async function processRetryQueue(): Promise<void> {
  if (pendingWrites.size === 0) {
    retryTimerId = null;
    return;
  }

  const now = Date.now();
  const databaseKey = getDatabaseKey();
  if (!databaseKey) {
    // No key - clear queue
    pendingWrites.clear();
    retryTimerId = null;
    return;
  }

  for (const [jobId, pending] of Array.from(pendingWrites.entries())) {
    // Calculate delay with exponential backoff
    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, pending.attempts - 1);
    if (now - pending.lastAttempt < delay) {
      continue; // Not ready for retry yet
    }

    if (pending.attempts >= MAX_RETRY_ATTEMPTS) {
      // Max attempts reached - give up and notify
      logger.warn(`[Cache] D1 write failed after ${MAX_RETRY_ATTEMPTS} attempts:`, jobId);
      pendingWrites.delete(jobId);
      // Dispatch event so UI can show sync failure indicator
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('d1-sync-failed', { detail: { jobId } }));
      }
      continue;
    }

    // Attempt write
    try {
      const response = await fetchWithTimeout(`/api/veo/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending.job),
      });

      if (response.ok) {
        // Success - remove from queue
        pendingWrites.delete(jobId);
        // Dispatch success event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('d1-sync-success', { detail: { jobId } }));
        }
      } else if (response.status === 401) {
        // Invalid key - clear queue
        logger.warn("[Cache] Invalid database key, clearing retry queue");
        pendingWrites.clear();
        break;
      } else {
        // Other error - increment attempts
        pending.attempts++;
        pending.lastAttempt = now;
      }
    } catch {
      // Network error - increment attempts
      pending.attempts++;
      pending.lastAttempt = now;
    }
  }

  // Schedule next check if queue not empty
  if (pendingWrites.size > 0 && !retryTimerId) {
    retryTimerId = setTimeout(processRetryQueue, RETRY_BASE_DELAY_MS);
  } else {
    retryTimerId = null;
  }
}

/**
 * Queue a D1 write for retry
 */
function queueWriteForRetry(jobId: string, job: CachedVeoJob): void {
  pendingWrites.set(jobId, {
    jobId,
    job,
    attempts: 1,
    lastAttempt: Date.now(),
  });

  // Start retry processor if not running
  if (!retryTimerId) {
    retryTimerId = setTimeout(processRetryQueue, RETRY_BASE_DELAY_MS);
  }
}

/**
 * Get database key from user settings
 */
function getDatabaseKey(): string | null {
  const settings = getUserSettings();
  return settings.databaseKey || null;
}

/**
 * Fetch with timeout and database key header
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // Add database key to headers
  const databaseKey = getDatabaseKey();
  const headers = new Headers(options.headers);
  if (databaseKey) {
    headers.set('x-database-key', databaseKey);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Check if using cloud storage (database key is valid)
 */
export async function isUsingCloudStorage(): Promise<boolean> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) return false;

  try {
    const response = await fetchWithTimeout("/api/veo/jobs");
    return response.ok; // 200 = authorized, 401 = unauthorized
  } catch {
    return false;
  }
}

/**
 * Get all cached jobs (merged from D1 and localStorage)
 */
export async function getCachedJobList(): Promise<CachedVeoJobInfo[]> {
  const databaseKey = getDatabaseKey();

  // Always fetch from localStorage
  const localJobs = localCache.getCachedJobListLocal();

  // If no key, return only local jobs
  if (!databaseKey) {
    return localJobs.map(job => ({ ...job, storageSource: 'local' as const }));
  }

  // Try to fetch from cloud
  let cloudJobs: CachedVeoJobInfo[] = [];
  try {
    const response = await fetchWithTimeout("/api/veo/jobs");

    // 401 = Invalid key, use only localStorage
    if (response.status === 401) {
      logger.warn("[Cache] Invalid database key, using localStorage only");
      return localJobs.map(job => ({ ...job, storageSource: 'local' as const }));
    }

    if (response.ok) {
      const data = await response.json();
      cloudJobs = data.jobs || [];
    }
  } catch (error) {
    logger.warn("[Cache] D1 failed, using localStorage only:", error);
    return localJobs.map(job => ({ ...job, storageSource: 'local' as const }));
  }

  // BUG FIX #3: Merge cloud and local jobs with conflict resolution
  // Compare timestamps and status to prefer the most recent and most complete version
  const jobMap = new Map<string, CachedVeoJobInfo>();

  // Add cloud jobs first
  for (const job of cloudJobs) {
    jobMap.set(job.jobId, { ...job, storageSource: 'cloud' as const });
  }

  // Merge local jobs with conflict resolution
  for (const job of localJobs) {
    const existingJob = jobMap.get(job.jobId);
    if (!existingJob) {
      // Job only in local, not in cloud
      jobMap.set(job.jobId, { ...job, storageSource: 'local' as const });
    } else {
      // Job exists in both - resolve conflict
      // Priority: 1) completed > partial > failed > in_progress
      //           2) more scenes = more complete
      //           3) more recent timestamp
      const statusPriority: Record<string, number> = {
        'completed': 4,
        'partial': 3,
        'failed': 2,
        'in_progress': 1,
      };

      const existingPriority = statusPriority[existingJob.status] || 0;
      const localPriority = statusPriority[job.status] || 0;

      let useLocal = false;

      if (localPriority > existingPriority) {
        // Local has better status
        useLocal = true;
      } else if (localPriority === existingPriority) {
        // Same status - prefer more scenes (more complete data)
        if (job.sceneCount > existingJob.sceneCount) {
          useLocal = true;
        } else if (job.sceneCount === existingJob.sceneCount) {
          // Same scene count - prefer more recent
          if (job.timestamp > existingJob.timestamp) {
            useLocal = true;
          }
        }
      }

      if (useLocal) {
        // Local is better - update map with local data but mark as needing sync
        jobMap.set(job.jobId, { ...job, storageSource: 'local' as const });
        // Note: The job will be synced to cloud on next setCachedJob call
      }
      // Otherwise keep existing cloud version
    }
  }

  // Convert to array and sort by timestamp (newest first)
  return Array.from(jobMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Helper to fix job status and logs without changing timestamp
 * Returns true if any fixes were made
 */
function fixJobInPlace(job: CachedVeoJob): boolean {
  let needsFix = false;

  // BUG FIX: Fix status if marked "in_progress" but has scenes (job actually completed)
  if (job.status === "in_progress" && job.scenes && job.scenes.length > 0) {
    job.status = "completed";
    needsFix = true;
  }

  // Fix pending log entries
  if (job.scenes && job.scenes.length > 0) {
    if (localCache.fixPendingLogEntries(job)) {
      needsFix = true;
    }
  }

  return needsFix;
}

/**
 * Get job by ID (D1 with localStorage fallback)
 * Also fixes pending log entries and orphaned status without changing timestamp
 * BUG FIX: Added conflict resolution to prefer the most complete version
 */
export async function getCachedJob(jobId: string): Promise<CachedVeoJob | null> {
  const databaseKey = getDatabaseKey();

  // If no key, use localStorage directly
  if (!databaseKey) {
    const job = localCache.getCachedJobLocal(jobId);
    if (job && fixJobInPlace(job)) {
      // BUG FIX: Use preserveTimestamp to prevent job from jumping to top of list
      localCache.setCachedJobLocal(jobId, job, { preserveTimestamp: true });
    }
    return job;
  }

  // Get local version first
  const localJob = localCache.getCachedJobLocal(jobId);

  try {
    const response = await fetchWithTimeout(`/api/veo/jobs/${jobId}`);

    // 404 = Not in cloud, use localStorage
    if (response.status === 404) {
      if (localJob && fixJobInPlace(localJob)) {
        localCache.setCachedJobLocal(jobId, localJob, { preserveTimestamp: true });
      }
      return localJob;
    }

    // 401 = Invalid key, use localStorage
    if (response.status === 401) {
      if (localJob && fixJobInPlace(localJob)) {
        localCache.setCachedJobLocal(jobId, localJob, { preserveTimestamp: true });
      }
      return localJob;
    }

    if (!response.ok) throw new Error("D1 request failed");
    const data = await response.json();
    const cloudJob = data.job || null;

    // If no cloud job, use local
    if (!cloudJob) {
      if (localJob && fixJobInPlace(localJob)) {
        localCache.setCachedJobLocal(jobId, localJob, { preserveTimestamp: true });
      }
      return localJob;
    }

    // If no local job, use cloud
    if (!localJob) {
      if (fixJobInPlace(cloudJob)) {
        logger.info(`[Cache] Fixed cloud job ${jobId} (status/logs)`);
        localCache.setCachedJobLocal(jobId, cloudJob, { preserveTimestamp: true });
      }
      return cloudJob;
    }

    // BUG FIX: Conflict resolution - both versions exist
    // Priority: 1) completed > partial > failed > in_progress
    //           2) more scenes = more complete
    //           3) more recent timestamp
    const statusPriority: Record<string, number> = {
      'completed': 4,
      'partial': 3,
      'failed': 2,
      'in_progress': 1,
    };

    const cloudPriority = statusPriority[cloudJob.status] || 0;
    const localPriority = statusPriority[localJob.status] || 0;

    let useLocal = false;

    if (localPriority > cloudPriority) {
      // Local has better status
      useLocal = true;
    } else if (localPriority === cloudPriority) {
      // Same status - prefer more scenes (more complete data)
      const cloudSceneCount = cloudJob.scenes?.length || 0;
      const localSceneCount = localJob.scenes?.length || 0;

      if (localSceneCount > cloudSceneCount) {
        useLocal = true;
      } else if (localSceneCount === cloudSceneCount) {
        // Same scene count - prefer more recent
        const cloudTimestamp = new Date(cloudJob.summary?.createdAt || cloudJob.timestamp || 0).getTime();
        const localTimestamp = new Date(localJob.summary?.createdAt || localJob.timestamp || 0).getTime();

        if (localTimestamp > cloudTimestamp) {
          useLocal = true;
        }
      }
    }

    const bestJob = useLocal ? localJob : cloudJob;

    // Fix issues in the best job
    if (fixJobInPlace(bestJob)) {
      logger.info(`[Cache] Fixed job ${jobId} (status/logs) from ${useLocal ? 'local' : 'cloud'}`);
      // Save fixed job to localStorage with preserved timestamp
      localCache.setCachedJobLocal(jobId, bestJob, { preserveTimestamp: true });
    }

    // If local version is better and different from cloud, it will be synced on next setCachedJob
    // We don't sync here to avoid blocking the UI

    return bestJob;
  } catch (error) {
    logger.warn("[Cache] D1 failed, using localStorage fallback:", error);
    if (localJob && fixJobInPlace(localJob)) {
      localCache.setCachedJobLocal(jobId, localJob, { preserveTimestamp: true });
    }
    return localJob;
  }
}

/**
 * Save job (D1 with localStorage fallback)
 * BUG FIX #4: Uses retry queue for D1 writes with exponential backoff
 */
export async function setCachedJob(
  jobId: string,
  data: Parameters<typeof localCache.setCachedJobLocal>[1]
): Promise<void> {
  // Always write to localStorage first (instant, reliable)
  localCache.setCachedJobLocal(jobId, data);

  // Only try D1 if database key is provided
  const databaseKey = getDatabaseKey();
  if (!databaseKey) return;

  // Get the full job from localStorage for D1 sync
  const job = localCache.getCachedJobLocal(jobId);
  if (!job) return;

  // Try D1 write with retry queue fallback
  try {
    const response = await fetchWithTimeout(`/api/veo/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });

    if (response.status === 401) {
      // Invalid key - don't retry
      logger.warn("[Cache] Invalid database key, using localStorage only");
    } else if (!response.ok) {
      // Server error - queue for retry
      queueWriteForRetry(jobId, job);
    }
    // Success - nothing more to do
  } catch (error) {
    // Network error - queue for retry
    logger.warn("[Cache] D1 write failed, queuing for retry:", error);
    queueWriteForRetry(jobId, job);
  }
}

/**
 * Delete job from local storage only
 */
export async function deleteJobFromLocal(jobId: string): Promise<void> {
  localCache.deleteCachedJobLocal(jobId);
}

/**
 * Delete job from cloud (D1) only
 */
export async function deleteJobFromCloud(jobId: string): Promise<void> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) {
    logger.warn("[Cache] No database key, cannot delete from cloud");
    return;
  }

  try {
    await fetchWithTimeout(`/api/veo/jobs/${jobId}`, { method: "DELETE" });
  } catch (error) {
    logger.warn("[Cache] D1 delete failed:", error);
    throw error;
  }
}

/**
 * Fix orphaned jobs that are marked as "in_progress" but have scenes
 * Returns the number of jobs fixed
 */
export function fixOrphanedJobs(): number {
  return localCache.fixOrphanedJobsLocal();
}

/**
 * Delete job (D1 with localStorage fallback)
 */
export async function deleteCachedJob(jobId: string): Promise<void> {
  // Always delete from localStorage first
  localCache.deleteCachedJobLocal(jobId);

  // Only try D1 if database key is provided
  const databaseKey = getDatabaseKey();
  if (!databaseKey) return;

  // Then try D1
  try {
    await fetchWithTimeout(`/api/veo/jobs/${jobId}`, { method: "DELETE" });
  } catch (error) {
    logger.warn("[Cache] D1 delete failed, localStorage deleted:", error);
  }
}

/**
 * Clear all jobs (D1 with localStorage fallback)
 */
export async function clearAllJobs(): Promise<void> {
  // Always clear localStorage first
  localCache.clearAllJobsLocal();

  // Only try D1 if database key is provided
  const databaseKey = getDatabaseKey();
  if (!databaseKey) return;

  // Then try D1
  try {
    await fetchWithTimeout("/api/veo/jobs", { method: "DELETE" });
  } catch (error) {
    logger.warn("[Cache] D1 clear failed, localStorage cleared:", error);
  }
}

/**
 * Sync a local job to cloud (upload to D1 and delete from localStorage)
 */
export async function syncJobToCloud(jobId: string): Promise<boolean> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) {
    logger.warn("[Cache] No database key, cannot sync to cloud");
    return false;
  }

  try {
    // Get job from localStorage
    const job = localCache.getCachedJobLocal(jobId);
    if (!job) {
      logger.warn("[Cache] Job not found in localStorage:", jobId);
      return false;
    }

    // Upload to D1
    const response = await fetchWithTimeout(`/api/veo/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });

    if (response.status === 401) {
      logger.warn("[Cache] Invalid database key, cannot sync");
      return false;
    }

    if (!response.ok) {
      throw new Error("Failed to sync job to cloud");
    }

    // Delete from localStorage after successful sync
    localCache.deleteCachedJobLocal(jobId);
    logger.info("[Cache] Job synced to cloud and removed from localStorage:", jobId);
    return true;
  } catch (error) {
    logger.error("[Cache] Failed to sync job to cloud:", error);
    return false;
  }
}

// Re-export local-only functions (these don't need D1 sync)
export const getCachedJobsForVideo = localCache.getCachedJobsForVideoLocal;
export const getLatestCachedJob = localCache.getLatestCachedJobLocal;
export const clearExpiredJobs = localCache.clearExpiredJobsLocal;
