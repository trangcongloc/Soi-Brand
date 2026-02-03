/**
 * VEO Pipeline - Async cache with D1 + localStorage fallback
 * Provides cross-device sync via Cloudflare D1
 */

import { CachedVeoJob, CachedVeoJobInfo } from "./types";
import * as localCache from "./cache-local";
import { getUserSettings } from "@/lib/userSettings";

const API_TIMEOUT_MS = 5000; // 5 seconds

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
      console.warn("[Cache] Invalid database key, using localStorage only");
      return localJobs.map(job => ({ ...job, storageSource: 'local' as const }));
    }

    if (response.ok) {
      const data = await response.json();
      cloudJobs = data.jobs || [];
    }
  } catch (error) {
    console.warn("[Cache] D1 failed, using localStorage only:", error);
    return localJobs.map(job => ({ ...job, storageSource: 'local' as const }));
  }

  // Merge cloud and local jobs
  const jobMap = new Map<string, CachedVeoJobInfo>();

  // Add cloud jobs first
  for (const job of cloudJobs) {
    jobMap.set(job.jobId, { ...job, storageSource: 'cloud' as const });
  }

  // Add local jobs (only if not already in cloud)
  for (const job of localJobs) {
    if (!jobMap.has(job.jobId)) {
      // Job only in local, not in cloud
      jobMap.set(job.jobId, { ...job, storageSource: 'local' as const });
    }
    // If job exists in cloud, ignore local copy (cloud is source of truth)
  }

  // Convert to array and sort by timestamp (newest first)
  return Array.from(jobMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get job by ID (D1 with localStorage fallback)
 */
export async function getCachedJob(jobId: string): Promise<CachedVeoJob | null> {
  const databaseKey = getDatabaseKey();

  // If no key, use localStorage directly
  if (!databaseKey) {
    return localCache.getCachedJobLocal(jobId);
  }

  try {
    const response = await fetchWithTimeout(`/api/veo/jobs/${jobId}`);
    if (response.status === 404) return null;

    // 401 = Invalid key, use localStorage
    if (response.status === 401) {
      return localCache.getCachedJobLocal(jobId);
    }

    if (!response.ok) throw new Error("D1 request failed");
    const data = await response.json();
    return data.job || null;
  } catch (error) {
    console.warn("[Cache] D1 failed, using localStorage fallback:", error);
    return localCache.getCachedJobLocal(jobId);
  }
}

/**
 * Save job (D1 with localStorage fallback)
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

  // Then try D1 (fire-and-forget)
  try {
    const job = localCache.getCachedJobLocal(jobId);
    if (!job) return;

    const response = await fetchWithTimeout(`/api/veo/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });

    // Log if unauthorized (invalid key)
    if (response.status === 401) {
      console.warn("[Cache] Invalid database key, using localStorage only");
    }
  } catch (error) {
    console.warn("[Cache] D1 write failed, localStorage persisted:", error);
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
    console.warn("[Cache] No database key, cannot delete from cloud");
    return;
  }

  try {
    await fetchWithTimeout(`/api/veo/jobs/${jobId}`, { method: "DELETE" });
  } catch (error) {
    console.warn("[Cache] D1 delete failed:", error);
    throw error;
  }
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
    console.warn("[Cache] D1 delete failed, localStorage deleted:", error);
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
    console.warn("[Cache] D1 clear failed, localStorage cleared:", error);
  }
}

/**
 * Sync a local job to cloud (upload to D1 and delete from localStorage)
 */
export async function syncJobToCloud(jobId: string): Promise<boolean> {
  const databaseKey = getDatabaseKey();
  if (!databaseKey) {
    console.warn("[Cache] No database key, cannot sync to cloud");
    return false;
  }

  try {
    // Get job from localStorage
    const job = localCache.getCachedJobLocal(jobId);
    if (!job) {
      console.warn("[Cache] Job not found in localStorage:", jobId);
      return false;
    }

    // Upload to D1
    const response = await fetchWithTimeout(`/api/veo/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });

    if (response.status === 401) {
      console.warn("[Cache] Invalid database key, cannot sync");
      return false;
    }

    if (!response.ok) {
      throw new Error("Failed to sync job to cloud");
    }

    // Delete from localStorage after successful sync
    localCache.deleteCachedJobLocal(jobId);
    console.log("[Cache] Job synced to cloud and removed from localStorage:", jobId);
    return true;
  } catch (error) {
    console.error("[Cache] Failed to sync job to cloud:", error);
    return false;
  }
}

// Re-export local-only functions (these don't need D1 sync)
export const getCachedJobsForVideo = localCache.getCachedJobsForVideoLocal;
export const getLatestCachedJob = localCache.getLatestCachedJobLocal;
export const clearExpiredJobs = localCache.clearExpiredJobsLocal;
