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
   */
  set(id: string, data: T, timestamp?: number): void {
    if (!isBrowser()) return;

    try {
      const ts = timestamp ?? Date.now();

      // Enforce max item limit
      const allKeys = this.getAllCacheKeys();
      if (allKeys.length >= this.maxItems) {
        this.removeOldestItem(allKeys);
      }

      const cacheData: CachedItem<T> = {
        data,
        timestamp: ts,
      };

      const key = this.getCacheKey(id);
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      logger.error(`Error writing to cache (${this.prefix})`, error);
      if (error instanceof Error && error.name === "QuotaExceededError") {
        this.clearOldItems();
      }
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
