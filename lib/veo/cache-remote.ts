/**
 * VEO Pipeline - Async cache with D1 + localStorage fallback
 * Provides cross-device sync via Cloudflare D1
 */

import { CachedVeoJob, CachedVeoJobInfo } from "./types";
import * as localCache from "./cache-local";

const API_TIMEOUT_MS = 5000; // 5 seconds

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Get all cached jobs (D1 with localStorage fallback)
 */
export async function getCachedJobList(): Promise<CachedVeoJobInfo[]> {
  try {
    const response = await fetchWithTimeout("/api/veo/jobs");
    if (!response.ok) throw new Error("D1 request failed");
    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.warn("[Cache] D1 failed, using localStorage fallback:", error);
    return localCache.getCachedJobListLocal();
  }
}

/**
 * Get job by ID (D1 with localStorage fallback)
 */
export async function getCachedJob(jobId: string): Promise<CachedVeoJob | null> {
  try {
    const response = await fetchWithTimeout(`/api/veo/jobs/${jobId}`);
    if (response.status === 404) return null;
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

  // Then try D1 (fire-and-forget)
  try {
    const job = localCache.getCachedJobLocal(jobId);
    if (!job) return;

    await fetchWithTimeout(`/api/veo/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
  } catch (error) {
    console.warn("[Cache] D1 write failed, localStorage persisted:", error);
  }
}

/**
 * Delete job (D1 with localStorage fallback)
 */
export async function deleteCachedJob(jobId: string): Promise<void> {
  // Always delete from localStorage first
  localCache.deleteCachedJobLocal(jobId);

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

  // Then try D1
  try {
    await fetchWithTimeout("/api/veo/jobs", { method: "DELETE" });
  } catch (error) {
    console.warn("[Cache] D1 clear failed, localStorage cleared:", error);
  }
}

// Re-export local-only functions (these don't need D1 sync)
export const getCachedJobsForVideo = localCache.getCachedJobsForVideoLocal;
export const getLatestCachedJob = localCache.getLatestCachedJobLocal;
export const clearExpiredJobs = localCache.clearExpiredJobsLocal;
