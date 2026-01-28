// Client-side caching for reports using localStorage

import { MarketingReport } from "./types";
import { isBrowser } from "./utils";
import { LocalStorageCache } from "./cache-manager";

const CACHE_PREFIX = "soibrand_report_";
const ALIAS_PREFIX = "soibrand_alias_";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_TOTAL_REPORTS = 50; // Increased total limit, no per-channel limit

interface CachedReport {
    report: MarketingReport;
    timestamp: number;
    channelId: string;
}

// Create cache manager instance
const reportCache = new LocalStorageCache<CachedReport>({
    prefix: CACHE_PREFIX,
    maxItems: MAX_TOTAL_REPORTS,
    ttlMs: CACHE_TTL,
});

interface CachedReportInfo {
    channelId: string;
    brandName: string;
    timestamp: number;
    createdAt: string;
    channelAvatar?: string;
}

/**
 * Get cache ID for a channel report (includes timestamp for multiple reports)
 */
function getCacheId(channelId: string, timestamp: number): string {
    return `${channelId}_${timestamp}`;
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

    const allItems = reportCache.getAll();
    const reports: CachedReportInfo[] = [];

    for (const item of allItems) {
        if (item.data.channelId === channelId && item.data.report) {
            reports.push({
                channelId: item.data.channelId,
                brandName: item.data.report.brand_name,
                timestamp: item.data.timestamp,
                createdAt: item.data.report.created_at,
                channelAvatar:
                    item.data.report.report_part_1?.channel_info?.avatar,
            });
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

    const id = getCacheId(channelId, timestamp);
    const cached = reportCache.get(id);

    return cached?.report || null;
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

    const timestamp = Date.now();

    // Store alias if provided
    if (urlId && urlId !== channelId) {
        setChannelAlias(urlId, channelId);
    }

    const cacheData: CachedReport = {
        report,
        timestamp,
        channelId,
    };

    const id = getCacheId(channelId, timestamp);
    reportCache.set(id, cacheData, timestamp);
}

/**
 * Clear expired reports from cache
 */
export function clearExpiredReports(): void {
    reportCache.clearExpired();
}

/**
 * Clear all cached reports
 */
export function clearAllReports(): void {
    reportCache.clearAll();
}

/**
 * Delete a specific cached report by channel ID and timestamp
 */
export function deleteCachedReportByTimestamp(
    channelId: string,
    timestamp: number
): void {
    if (!isBrowser()) return;

    const id = getCacheId(channelId, timestamp);
    reportCache.delete(id);
}

/**
 * Delete all cached reports for a channel (backward compatible)
 */
export function deleteCachedReport(channelId: string): void {
    if (!isBrowser()) return;

    const allItems = reportCache.getAll();
    for (const item of allItems) {
        if (item.data.channelId === channelId) {
            reportCache.delete(item.id);
        }
    }
}

/**
 * Get list of cached channels (for history feature)
 */
export function getCachedChannelList(): CachedReportInfo[] {
    if (!isBrowser()) return [];

    const allItems = reportCache.getAll();
    const reports: CachedReportInfo[] = [];

    for (const item of allItems) {
        if (item.data.report && item.data.channelId) {
            reports.push({
                channelId: item.data.channelId,
                brandName: item.data.report.brand_name,
                timestamp: item.data.timestamp,
                createdAt: item.data.report.created_at,
                channelAvatar:
                    item.data.report.report_part_1?.channel_info?.avatar,
            });
        }
    }

    // Sort by most recent first
    return reports.sort((a, b) => b.timestamp - a.timestamp);
}
