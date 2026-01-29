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

/**
 * Gets all localStorage keys, optionally filtered by prefix
 * @param prefix Optional prefix to filter keys
 * @returns Array of matching keys
 */
export function getAllStorageKeys(prefix?: string): string[] {
  if (!isBrowser()) return [];

  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.error("Failed to get storage keys:", error);
  }
  return keys;
}

/**
 * Dispatches a custom event to notify components of VEO job updates
 * @param jobId ID of the updated job, or null for general update
 */
export function dispatchJobUpdateEvent(jobId: string | null): void {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent("veo-job-updated", { detail: { jobId } })
  );
}
