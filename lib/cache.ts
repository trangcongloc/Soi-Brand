// Client-side caching for reports using localStorage

import { MarketingReport } from "./types";

const CACHE_PREFIX = "ourtube_report_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHED_REPORTS = 10;

interface CachedReport {
    report: MarketingReport;
    timestamp: number;
    channelId: string;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Get cache key for a channel
 */
function getCacheKey(channelId: string): string {
    return `${CACHE_PREFIX}${channelId}`;
}

/**
 * Get all cached report keys
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
 * Get a cached report by channel ID
 */
export function getCachedReport(channelId: string): MarketingReport | null {
    if (!isBrowser()) return null;

    try {
        const key = getCacheKey(channelId);
        const cached = localStorage.getItem(key);

        if (!cached) return null;

        const data: CachedReport = JSON.parse(cached);

        // Check if cache has expired
        if (Date.now() - data.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }

        return data.report;
    } catch (error) {
        console.error("Error reading from cache:", error);
        return null;
    }
}

/**
 * Save a report to cache
 */
export function setCachedReport(
    channelId: string,
    report: MarketingReport
): void {
    if (!isBrowser()) return;

    try {
        // Enforce max cache size
        const keys = getAllCacheKeys();
        if (keys.length >= MAX_CACHED_REPORTS) {
            // Remove oldest cached report
            let oldestKey = keys[0];
            let oldestTime = Infinity;

            for (const key of keys) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || "{}");
                    if (data.timestamp < oldestTime) {
                        oldestTime = data.timestamp;
                        oldestKey = key;
                    }
                } catch {
                    // Remove corrupted entries
                    localStorage.removeItem(key);
                }
            }

            localStorage.removeItem(oldestKey);
        }

        const cacheData: CachedReport = {
            report,
            timestamp: Date.now(),
            channelId,
        };

        const key = getCacheKey(channelId);
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.error("Error writing to cache:", error);
        // If localStorage is full, clear old reports
        if (
            error instanceof Error &&
            error.name === "QuotaExceededError"
        ) {
            clearOldReports();
        }
    }
}

/**
 * Clear expired reports from cache
 */
export function clearExpiredReports(): void {
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
 * Clear old reports (keep only most recent 5)
 */
export function clearOldReports(): void {
    if (!isBrowser()) return;

    const keys = getAllCacheKeys();
    const reports: { key: string; timestamp: number }[] = [];

    for (const key of keys) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "{}");
            reports.push({ key, timestamp: data.timestamp || 0 });
        } catch {
            localStorage.removeItem(key);
        }
    }

    // Sort by timestamp descending and keep only 5
    reports.sort((a, b) => b.timestamp - a.timestamp);
    const toRemove = reports.slice(5);

    for (const { key } of toRemove) {
        localStorage.removeItem(key);
    }
}

/**
 * Clear all cached reports
 */
export function clearAllReports(): void {
    if (!isBrowser()) return;

    const keys = getAllCacheKeys();
    for (const key of keys) {
        localStorage.removeItem(key);
    }
}

/**
 * Get list of cached channels (for history feature)
 */
export function getCachedChannelList(): {
    channelId: string;
    brandName: string;
    timestamp: number;
}[] {
    if (!isBrowser()) return [];

    const keys = getAllCacheKeys();
    const channels: { channelId: string; brandName: string; timestamp: number }[] = [];

    for (const key of keys) {
        try {
            const data: CachedReport = JSON.parse(
                localStorage.getItem(key) || "{}"
            );
            if (data.report && data.channelId) {
                channels.push({
                    channelId: data.channelId,
                    brandName: data.report.brand_name,
                    timestamp: data.timestamp,
                });
            }
        } catch {
            // Skip corrupted entries
        }
    }

    // Sort by most recent first
    return channels.sort((a, b) => b.timestamp - a.timestamp);
}
