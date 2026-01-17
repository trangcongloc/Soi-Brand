// Client-side caching for reports using localStorage

import { MarketingReport } from "./types";

const CACHE_PREFIX = "ourtube_report_";
const ALIAS_PREFIX = "ourtube_alias_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_REPORTS_PER_CHANNEL = 5;
const MAX_TOTAL_REPORTS = 20;

interface CachedReport {
    report: MarketingReport;
    timestamp: number;
    channelId: string;
}

interface CachedReportInfo {
    channelId: string;
    brandName: string;
    timestamp: number;
    createdAt: string;
    channelAvatar?: string;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Get cache key for a channel report (includes timestamp for multiple reports)
 */
function getCacheKey(channelId: string, timestamp: number): string {
    return `${CACHE_PREFIX}${channelId}_${timestamp}`;
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
 * Store alias mapping (URL-extracted ID -> actual channel ID)
 */
export function setChannelAlias(urlId: string, actualChannelId: string): void {
    if (!isBrowser() || !urlId || !actualChannelId) return;
    localStorage.setItem(`${ALIAS_PREFIX}${urlId}`, actualChannelId);
}

/**
 * Get actual channel ID from URL-extracted ID
 */
export function resolveChannelId(urlId: string): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(`${ALIAS_PREFIX}${urlId}`);
}

/**
 * Get all cached reports for a channel (sorted by date, newest first)
 */
export function getCachedReportsForChannel(
    channelId: string
): CachedReportInfo[] {
    if (!isBrowser()) return [];

    const keys = getAllCacheKeys();
    const reports: CachedReportInfo[] = [];

    for (const key of keys) {
        try {
            const data: CachedReport = JSON.parse(
                localStorage.getItem(key) || "{}"
            );
            if (data.channelId === channelId && data.report) {
                // Check if not expired
                if (Date.now() - data.timestamp <= CACHE_TTL) {
                    reports.push({
                        channelId: data.channelId,
                        brandName: data.report.brand_name,
                        timestamp: data.timestamp,
                        createdAt: data.report.created_at,
                        channelAvatar:
                            data.report.report_part_1?.channel_info?.avatar,
                    });
                } else {
                    localStorage.removeItem(key);
                }
            }
        } catch {
            // Skip corrupted entries
        }
    }

    return reports.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get a specific cached report by channel ID and timestamp
 */
export function getCachedReportByTimestamp(
    channelId: string,
    timestamp: number
): MarketingReport | null {
    if (!isBrowser()) return null;

    try {
        const key = getCacheKey(channelId, timestamp);
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
 * Get the most recent cached report for a channel (backward compatible)
 */
export function getCachedReport(channelId: string): MarketingReport | null {
    const reports = getCachedReportsForChannel(channelId);
    if (reports.length === 0) return null;
    return getCachedReportByTimestamp(channelId, reports[0].timestamp);
}

/**
 * Save a report to cache
 */
export function setCachedReport(
    channelId: string,
    report: MarketingReport,
    urlId?: string
): void {
    if (!isBrowser()) return;

    try {
        const timestamp = Date.now();

        // Store alias if provided
        if (urlId && urlId !== channelId) {
            setChannelAlias(urlId, channelId);
        }

        // Check reports for this channel and enforce limit
        const channelReports = getCachedReportsForChannel(channelId);
        if (channelReports.length >= MAX_REPORTS_PER_CHANNEL) {
            // Remove oldest report for this channel
            const oldest = channelReports[channelReports.length - 1];
            const oldKey = getCacheKey(channelId, oldest.timestamp);
            localStorage.removeItem(oldKey);
        }

        // Enforce total report limit
        const allKeys = getAllCacheKeys();
        if (allKeys.length >= MAX_TOTAL_REPORTS) {
            // Find and remove oldest report globally
            let oldestKey = allKeys[0];
            let oldestTime = Infinity;

            for (const key of allKeys) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || "{}");
                    if (data.timestamp < oldestTime) {
                        oldestTime = data.timestamp;
                        oldestKey = key;
                    }
                } catch {
                    localStorage.removeItem(key);
                }
            }
            localStorage.removeItem(oldestKey);
        }

        const cacheData: CachedReport = {
            report,
            timestamp,
            channelId,
        };

        const key = getCacheKey(channelId, timestamp);
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.error("Error writing to cache:", error);
        if (error instanceof Error && error.name === "QuotaExceededError") {
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
 * Clear old reports (keep only most recent per channel)
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

    // Sort by timestamp descending and keep only 10
    reports.sort((a, b) => b.timestamp - a.timestamp);
    const toRemove = reports.slice(10);

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
 * Delete a specific cached report by channel ID and timestamp
 */
export function deleteCachedReportByTimestamp(
    channelId: string,
    timestamp: number
): void {
    if (!isBrowser()) return;

    const key = getCacheKey(channelId, timestamp);
    localStorage.removeItem(key);
}

/**
 * Delete all cached reports for a channel (backward compatible)
 */
export function deleteCachedReport(channelId: string): void {
    if (!isBrowser()) return;

    const keys = getAllCacheKeys();
    for (const key of keys) {
        if (key.startsWith(`${CACHE_PREFIX}${channelId}_`)) {
            localStorage.removeItem(key);
        }
    }
}

/**
 * Get list of cached channels (for history feature)
 */
export function getCachedChannelList(): CachedReportInfo[] {
    if (!isBrowser()) return [];

    const keys = getAllCacheKeys();
    const reports: CachedReportInfo[] = [];

    for (const key of keys) {
        try {
            const data: CachedReport = JSON.parse(
                localStorage.getItem(key) || "{}"
            );
            if (data.report && data.channelId) {
                // Check if not expired
                if (Date.now() - data.timestamp <= CACHE_TTL) {
                    reports.push({
                        channelId: data.channelId,
                        brandName: data.report.brand_name,
                        timestamp: data.timestamp,
                        createdAt: data.report.created_at,
                        channelAvatar:
                            data.report.report_part_1?.channel_info?.avatar,
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
    return reports.sort((a, b) => b.timestamp - a.timestamp);
}
