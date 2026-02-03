/**
 * Safe localStorage operations with error handling
 * Eliminates duplicate JSON.parse/try-catch patterns across the VEO module
 */

import { isBrowser } from "./browser-utils";

/**
 * Safely retrieves and parses a value from localStorage
 * @param key Storage key to retrieve
 * @param defaultValue Value to return if key doesn't exist or parsing fails
 * @returns Parsed value or default value
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue;

  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to parse storage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely stores a value in localStorage as JSON
 * @param key Storage key to set
 * @param value Value to store (will be JSON stringified)
 * @returns true if successful, false if failed or not in browser
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to set storage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely removes an item from localStorage
 * @param key Storage key to remove
 */
export function removeStorageItem(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage item "${key}":`, error);
  }
}

// Create BroadcastChannel for cross-tab updates
const jobUpdateChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("veo-job-updates")
    : null;

/**
 * Dispatches a custom event to notify components of VEO job updates
 * Uses both CustomEvent (same tab) and BroadcastChannel (cross-tab)
 * @param jobId ID of the updated job, or null for general update
 */
export function dispatchJobUpdateEvent(jobId: string | null): void {
  if (!isBrowser()) return;

  // CustomEvent for same-tab updates
  window.dispatchEvent(
    new CustomEvent("veo-job-updated", { detail: { jobId } })
  );

  // BroadcastChannel for cross-tab updates
  jobUpdateChannel?.postMessage({ jobId, timestamp: Date.now() });
}

/**
 * Listen to job updates from both same tab and other tabs
 * @param callback Function to call when job updates
 * @returns Cleanup function to remove listeners
 */
export function listenToJobUpdates(
  callback: (jobId: string | null) => void
): () => void {
  if (!isBrowser()) return () => {};

  // CustomEvent listener (same tab)
  const handleCustomEvent = (e: Event) => {
    callback((e as CustomEvent).detail.jobId);
  };

  // BroadcastChannel listener (cross-tab)
  const handleBroadcast = (e: MessageEvent) => {
    callback(e.data.jobId);
  };

  window.addEventListener("veo-job-updated", handleCustomEvent);
  jobUpdateChannel?.addEventListener("message", handleBroadcast);

  return () => {
    window.removeEventListener("veo-job-updated", handleCustomEvent);
    jobUpdateChannel?.removeEventListener("message", handleBroadcast);
  };
}
