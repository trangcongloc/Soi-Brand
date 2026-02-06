/**
 * Prompt Pipeline - D1-only Cache
 * All job data is stored in Cloudflare D1 via REST API
 * D1 is the single source of truth - no localStorage
 */

import type { CachedPromptJob, CachedPromptJobInfo, PromptJobStatus } from "./types";
import { getUserSettings } from "@/lib/userSettings";
import { logger } from "@/lib/logger";

const API_TIMEOUT_MS = 10000; // 10 seconds for D1 operations

// Retry queue for D1 writes with exponential backoff
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

interface PendingWrite {
  jobId: string;
  job: CachedPromptJob;
  attempts: number;
  lastAttempt: number;
}

const pendingWrites = new Map<string, PendingWrite>();
let retryTimerId: ReturnType<typeof setTimeout> | null = null;

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

  const databaseKey = getDatabaseKey();
  const headers = new Headers(options.headers);
  if (databaseKey) {
    headers.set("x-database-key", databaseKey);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

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
    pendingWrites.clear();
    retryTimerId = null;
    return;
  }

  for (const [jobId, pending] of Array.from(pendingWrites.entries())) {
    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, pending.attempts - 1);
    if (now - pending.lastAttempt < delay) {
      continue;
    }

    if (pending.attempts >= MAX_RETRY_ATTEMPTS) {
      logger.warn(`[Cache] D1 write failed after ${MAX_RETRY_ATTEMPTS} attempts:`, jobId);
      pendingWrites.delete(jobId);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("d1-sync-failed", { detail: { jobId } }));
      }
      continue;
    }

    try {
      const response = await fetchWithTimeout(`/api/prompt/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending.job),
      });

      if (response.ok) {
        pendingWrites.delete(jobId);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("d1-sync-success", { detail: { jobId } }));
        }
      } else if (response.status === 401) {
        logger.warn("[Cache] Invalid database key, clearing retry queue");
        pendingWrites.clear();
        break;
      } else {
        pending.attempts++;
        pending.lastAttempt = now;
      }
    } catch {
      pending.attempts++;
      pending.lastAttempt = now;
    }
  }

  if (pendingWrites.size > 0 && !retryTimerId) {
    retryTimerId = setTimeout(processRetryQueue, RETRY_BASE_DELAY_MS);
  } else {
    retryTimerId = null;
  }
}

/**
 * Queue a D1 write for retry
 */
function queueWriteForRetry(jobId: string, job: CachedPromptJob): void {
  pendingWrites.set(jobId, {
    jobId,
    job,
    attempts: 1,
    lastAttempt: Date.now(),
  });

  if (!retryTimerId) {
    retryTimerId = setTimeout(processRetryQueue, RETRY_BASE_DELAY_MS);
  }
}

/**
 * Check if cloud storage is available (database key is valid)
 */
export async function isUsingCloudStorage(): Promise<boolean> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) return false;

  try {
    const response = await fetchWithTimeout("/api/prompt/jobs");
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get all cached jobs from D1
 */
export async function getCachedJobList(): Promise<CachedPromptJobInfo[]> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) {
    logger.warn("[Cache] No database key configured");
    return [];
  }

  try {
    const response = await fetchWithTimeout("/api/prompt/jobs");

    if (response.status === 401) {
      logger.warn("[Cache] Invalid database key");
      return [];
    }

    if (response.ok) {
      const data = await response.json();
      return (data.jobs || []).map((job: CachedPromptJobInfo) => ({
        ...job,
        storageSource: "cloud" as const,
      }));
    }

    return [];
  } catch (error) {
    logger.warn("[Cache] Failed to fetch job list:", error);
    return [];
  }
}

/**
 * Get job by ID from D1
 */
export async function getCachedJob(jobId: string): Promise<CachedPromptJob | null> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) {
    logger.warn("[Cache] No database key configured");
    return null;
  }

  try {
    const response = await fetchWithTimeout(`/api/prompt/jobs/${jobId}`);

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401) {
      logger.warn("[Cache] Invalid database key");
      return null;
    }

    if (!response.ok) {
      throw new Error("D1 request failed");
    }

    const data = await response.json();
    const job = data.job || null;

    // Fix orphaned status if needed
    if (job && job.status === "in_progress" && job.scenes && job.scenes.length > 0) {
      job.status = "completed" as PromptJobStatus;
    }

    return job;
  } catch (error) {
    logger.warn("[Cache] Failed to get job:", error);
    return null;
  }
}

/**
 * Save job to D1 with retry support
 */
export async function setCachedJob(
  jobId: string,
  data: Partial<CachedPromptJob> & { videoId: string; videoUrl: string }
): Promise<void> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) {
    logger.warn("[Cache] No database key configured, job not saved");
    return;
  }

  // Get existing job to merge with (non-blocking)
  let existingJob: CachedPromptJob | null = null;
  try {
    existingJob = await getCachedJob(jobId);
  } catch {
    // Continue without existing job
  }

  // Build full job object
  const job: CachedPromptJob = {
    jobId,
    videoId: data.videoId,
    videoUrl: data.videoUrl,
    summary: data.summary || existingJob?.summary || {
      mode: "direct",
      youtubeUrl: data.videoUrl,
      videoId: data.videoId,
      targetScenes: 0,
      actualScenes: 0,
      voice: "no-voice",
      charactersFound: 0,
      characters: [],
      processingTime: "",
      createdAt: new Date().toISOString(),
    },
    scenes: data.scenes ?? existingJob?.scenes ?? [],
    characterRegistry: data.characterRegistry ?? existingJob?.characterRegistry ?? {},
    timestamp: data.timestamp || Date.now(),
    status: data.status || existingJob?.status || "in_progress",
    script: data.script ?? existingJob?.script,
    colorProfile: data.colorProfile ?? existingJob?.colorProfile,
    error: data.error ?? existingJob?.error,
    logs: data.logs ?? existingJob?.logs ?? [],
    resumeData: data.resumeData ?? existingJob?.resumeData,
    expiresAt: data.expiresAt || existingJob?.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  try {
    const response = await fetchWithTimeout(`/api/prompt/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });

    if (response.status === 401) {
      logger.warn("[Cache] Invalid database key, job not saved");
    } else if (!response.ok) {
      queueWriteForRetry(jobId, job);
    }
  } catch (error) {
    logger.warn("[Cache] D1 write failed, queuing for retry:", error);
    queueWriteForRetry(jobId, job);
  }
}

/**
 * Delete job from D1
 */
export async function deleteCachedJob(jobId: string): Promise<void> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) return;

  try {
    await fetchWithTimeout(`/api/prompt/jobs/${jobId}`, { method: "DELETE" });
  } catch (error) {
    logger.warn("[Cache] D1 delete failed:", error);
  }
}

/**
 * Clear all jobs from D1
 */
export async function clearAllJobs(): Promise<void> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) return;

  try {
    await fetchWithTimeout("/api/prompt/jobs", { method: "DELETE" });
  } catch (error) {
    logger.warn("[Cache] D1 clear failed:", error);
  }
}

/**
 * Get all jobs for a specific video
 */
export async function getCachedJobsForVideo(videoId: string): Promise<CachedPromptJobInfo[]> {
  const allJobs = await getCachedJobList();
  return allJobs.filter((job) => job.videoId === videoId);
}

/**
 * Get the latest job for a video
 */
export async function getLatestCachedJob(videoId: string): Promise<CachedPromptJob | null> {
  const jobs = await getCachedJobsForVideo(videoId);
  if (jobs.length === 0) return null;

  const sorted = jobs.sort((a, b) => b.timestamp - a.timestamp);
  return getCachedJob(sorted[0].jobId);
}

/**
 * Fix orphaned jobs (in_progress with scenes → completed)
 * Returns number of jobs fixed
 */
export async function fixOrphanedJobs(): Promise<number> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) return 0;

  try {
    const response = await fetchWithTimeout("/api/prompt/jobs/fix-orphaned", {
      method: "POST",
    });

    if (response.ok) {
      const data = await response.json();
      return data.fixed || 0;
    }

    return 0;
  } catch (error) {
    logger.warn("[Cache] Failed to fix orphaned jobs:", error);
    return 0;
  }
}

/**
 * No-op - expired jobs are cleaned by D1 queries
 */
export function clearExpiredJobs(): number {
  return 0;
}

// Backward compatibility aliases
export const deleteJobFromLocal = deleteCachedJob;
export const deleteJobFromCloud = deleteCachedJob;
export const syncJobToCloud = async (_jobId: string): Promise<boolean> => true;
