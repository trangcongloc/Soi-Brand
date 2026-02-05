/**
 * Generic localStorage cache manager
 * Provides TTL-based expiration, max item enforcement, and batch operations
 */

import { logger } from "./logger";
import { isBrowser } from "./utils";

export interface CacheConfig {
  prefix: string;
  maxItems: number;
  ttlMs: number;
}

export interface CachedItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Generic localStorage cache with TTL and max item enforcement
 */
export class LocalStorageCache<T> {
  private prefix: string;
  private maxItems: number;
  private ttlMs: number;

  constructor(config: CacheConfig) {
    this.prefix = config.prefix;
    this.maxItems = config.maxItems;
    this.ttlMs = config.ttlMs;
  }

  /**
   * Get cache key with prefix
   */
  private getCacheKey(id: string): string {
    return `${this.prefix}${id}`;
  }

  /**
   * Get all cache keys with this prefix
   */
  private getAllCacheKeys(): string[] {
    if (!isBrowser()) return [];

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Check if an item is expired
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.ttlMs;
  }

  /**
   * Get a cached item by ID
   */
  get(id: string): T | null {
    if (!isBrowser()) return null;

    try {
      const key = this.getCacheKey(id);
      const cached = localStorage.getItem(key);

      if (!cached) return null;

      const item: CachedItem<T> = JSON.parse(cached);

      // Check if cache has expired
      if (this.isExpired(item.timestamp)) {
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      logger.error(`Error reading from cache (${this.prefix})`, error);
      return null;
    }
  }

  /**
   * Set a cached item
   * BUG FIX #5: Improved storage quota handling for large jobs
   */
  set(id: string, data: T, timestamp?: number): void {
    if (!isBrowser()) return;

    try {
      const ts = timestamp ?? Date.now();

      // Enforce max item limit
      let allKeys = this.getAllCacheKeys();
      if (allKeys.length >= this.maxItems) {
        this.removeOldestItem(allKeys);
        allKeys = this.getAllCacheKeys(); // Refresh after removal
      }

      const cacheData: CachedItem<T> = {
        data,
        timestamp: ts,
      };

      const key = this.getCacheKey(id);
      const serialized = JSON.stringify(cacheData);

      // Try to write - if quota exceeded, clear space and retry
      try {
        localStorage.setItem(key, serialized);
      } catch (writeError) {
        if (writeError instanceof Error && writeError.name === "QuotaExceededError") {
          // Estimate how much space we need
          const requiredBytes = serialized.length * 2; // UTF-16

          // Remove items until we have enough space or run out of items
          let removedCount = 0;
          const maxRemovals = Math.min(allKeys.length, 10); // Safety limit

          while (removedCount < maxRemovals) {
            // Get fresh key list after each removal
            const currentKeys = this.getAllCacheKeys();
            if (currentKeys.length === 0) break;

            // Skip if this is the key we're trying to write
            const keysToRemove = currentKeys.filter(k => k !== key);
            if (keysToRemove.length === 0) break;

            this.removeOldestItem(keysToRemove);
            removedCount++;

            // Try writing again
            try {
              localStorage.setItem(key, serialized);
              logger.info(`Cache quota recovery: removed ${removedCount} item(s) to fit new data`, {
                prefix: this.prefix,
                dataSize: requiredBytes,
              });
              return; // Success
            } catch {
              // Still not enough space - continue removing
            }
          }

          // Final attempt after maximum removals
          logger.warn(`Cache quota exhausted after removing ${removedCount} items`, {
            prefix: this.prefix,
            dataSize: requiredBytes,
          });
          // Clear more aggressively if still failing
          this.clearOldItems(5);
          try {
            localStorage.setItem(key, serialized);
          } catch {
            logger.error(`Failed to cache item even after aggressive cleanup`, { prefix: this.prefix });
          }
        } else {
          throw writeError;
        }
      }
    } catch (error) {
      logger.error(`Error writing to cache (${this.prefix})`, error);
    }
  }

  /**
   * Get all cached items (non-expired)
   */
  getAll(): Array<{ id: string; data: T; timestamp: number }> {
    if (!isBrowser()) return [];

    const keys = this.getAllCacheKeys();
    const items: Array<{ id: string; data: T; timestamp: number }> = [];

    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const item: CachedItem<T> = JSON.parse(cached);

        // Check if not expired
        if (!this.isExpired(item.timestamp)) {
          const id = key.substring(this.prefix.length);
          items.push({
            id,
            data: item.data,
            timestamp: item.timestamp,
          });
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        // Skip corrupted entries
        localStorage.removeItem(key);
      }
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear expired items from cache
   */
  clearExpired(): void {
    if (!isBrowser()) return;

    const keys = this.getAllCacheKeys();

    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const item: CachedItem<T> = JSON.parse(cached);
        if (this.isExpired(item.timestamp)) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Clear all items from cache
   */
  clearAll(): void {
    if (!isBrowser()) return;

    const keys = this.getAllCacheKeys();
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Delete a specific item by ID
   */
  delete(id: string): void {
    if (!isBrowser()) return;

    const key = this.getCacheKey(id);
    localStorage.removeItem(key);
  }

  /**
   * Remove oldest item from cache
   */
  private removeOldestItem(keys: string[]): void {
    let oldestKey = keys[0];
    let oldestTime = Infinity;

    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const item: CachedItem<T> = JSON.parse(cached);
        if (item.timestamp < oldestTime) {
          oldestTime = item.timestamp;
          oldestKey = key;
        }
      } catch {
        localStorage.removeItem(key);
      }
    }

    localStorage.removeItem(oldestKey);
  }

  /**
   * Clear old items (keep only most recent)
   */
  private clearOldItems(keepCount: number = 10): void {
    if (!isBrowser()) return;

    const keys = this.getAllCacheKeys();
    const items: { key: string; timestamp: number }[] = [];

    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const item: CachedItem<T> = JSON.parse(cached);
        items.push({ key, timestamp: item.timestamp || 0 });
      } catch {
        localStorage.removeItem(key);
      }
    }

    // Sort by timestamp descending and keep only specified count
    items.sort((a, b) => b.timestamp - a.timestamp);
    const toRemove = items.slice(keepCount);

    for (const { key } of toRemove) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Get count of cached items
   */
  count(): number {
    return this.getAllCacheKeys().length;
  }
}
