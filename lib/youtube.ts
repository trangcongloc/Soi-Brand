// YouTube Data API Service
import { apiClient } from "./axios";
import { YouTubeChannel, YouTubeVideo, APIError } from "./types";
import { extractChannelId, extractUsername } from "./utils";
import { logger } from "./logger";
import {
    YOUTUBE_ERROR_MAPPINGS,
    matchAndThrowError,
    isNetworkError,
} from "./errorMappings";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// ============================================================================
// Video Description Parsing Types
// ============================================================================

export interface VideoChapter {
  timestamp: string;  // "00:00", "01:50", etc.
  seconds: number;    // Parsed to seconds
  title: string;      // "Preparing Beef", "Grill & Meat Searing"
  endSeconds?: number; // Calculated from next chapter
}

export interface VideoDescription {
  fullText: string;
  chapters?: VideoChapter[];  // Parsed timestamp sections
}

/**
 * Type guard for axios-like errors
 */
function isAxiosError(error: unknown): error is {
    response?: { status?: number; data?: { error?: { message?: string; errors?: Array<{ reason?: string }> } } };
    status?: number;
    message?: string;
    code?: string;
} {
    return (
        error !== null &&
        typeof error === "object" &&
        ("response" in error || "status" in error || "message" in error || "code" in error)
    );
}

/**
 * Parse YouTube API error and throw appropriate APIError
 */
function handleYouTubeError(error: unknown, context: string): never {
    if (!isAxiosError(error)) {
        throw new APIError(
            `YouTube API error (${context}): Unknown error`,
            "UNKNOWN",
            500
        );
    }

    const statusCode = error?.response?.status || error?.status;
    const errorData = error?.response?.data?.error;
    const errorMessage = errorData?.message || error?.message || "Unknown YouTube API error";
    const errorReason = errorData?.errors?.[0]?.reason || "";

    logger.error(`YouTube API Error (${context})`, {
        status: statusCode,
        message: errorMessage,
        reason: errorReason,
    });

    // Check for network errors
    if (isNetworkError(error?.code)) {
        throw new APIError(
            "Network error while connecting to YouTube API.",
            "NETWORK_ERROR",
            503
        );
    }

    // Match against error mappings
    matchAndThrowError(
        YOUTUBE_ERROR_MAPPINGS,
        errorMessage,
        statusCode,
        errorReason,
        "YouTube API"
    );
}

/**
 * Get channel ID from username or custom URL
 */
export async function resolveChannelId(
    url: string,
    customApiKey?: string
): Promise<string | null> {
    const apiKey = customApiKey || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YouTube API key not configured");
    }

    // Try to extract channel ID directly
    const channelId = extractChannelId(url);
    if (channelId) {
        return channelId;
    }

    // Try to extract username
    const username = extractUsername(url);
    if (!username) {
        return null;
    }

    try {
        // Search for channel by username
        const response = await apiClient.get(`${YOUTUBE_API_BASE}/search`, {
            params: {
                part: "snippet",
                q: username,
                type: "channel",
                maxResults: 1,
                key: apiKey,
            },
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].snippet.channelId;
        }

        return null;
    } catch (error: any) {
        // For channel resolution, we can return null for some errors
        // but should propagate quota/auth errors
        if (error instanceof APIError) {
            throw error;
        }
        const statusCode = error?.response?.status;
        const errorReason = error?.response?.data?.error?.errors?.[0]?.reason;

        // Propagate critical errors
        if (
            errorReason === "quotaExceeded" ||
            errorReason === "dailyLimitExceeded" ||
            errorReason === "keyInvalid" ||
            statusCode === 401 ||
            statusCode === 429
        ) {
            handleYouTubeError(error, "resolveChannelId");
        }

        logger.error("Error resolving channel ID", error);
        return null;
    }
}

/**
 * Get channel information
 */
export async function getChannelInfo(
    channelId: string,
    customApiKey?: string
): Promise<YouTubeChannel | null> {
    const apiKey = customApiKey || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YouTube API key not configured");
    }

    try {
        const response = await apiClient.get(`${YOUTUBE_API_BASE}/channels`, {
            params: {
                part: "snippet,statistics,contentDetails",
                id: channelId,
                key: apiKey,
            },
        });

        if (!response.data.items || response.data.items.length === 0) {
            return null;
        }

        const channel = response.data.items[0];
        return {
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            customUrl: channel.snippet.customUrl,
            publishedAt: channel.snippet.publishedAt,
            thumbnails: channel.snippet.thumbnails,
            statistics: {
                viewCount: channel.statistics.viewCount || "0",
                subscriberCount: channel.statistics.subscriberCount || "0",
                videoCount: channel.statistics.videoCount || "0",
            },
        };
    } catch (error: any) {
        if (error instanceof APIError) {
            throw error;
        }
        handleYouTubeError(error, "getChannelInfo");
    }
}

/**
 * Get all videos from last 30 days. If fewer than 50, fetch at least 50 videos total.
 */
export async function getChannelVideos(
    channelId: string,
    _maxResults: number = 50, // Kept for API compatibility
    customApiKey?: string
): Promise<YouTubeVideo[]> {
    const apiKey = customApiKey || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YouTube API key not configured");
    }

    try {
        // First, get the uploads playlist ID
        const channelResponse = await apiClient.get(
            `${YOUTUBE_API_BASE}/channels`,
            {
                params: {
                    part: "contentDetails",
                    id: channelId,
                    key: apiKey,
                },
            }
        );

        if (
            !channelResponse.data.items ||
            channelResponse.data.items.length === 0
        ) {
            return [];
        }

        const uploadsPlaylistId =
            channelResponse.data.items[0].contentDetails.relatedPlaylists
                .uploads;

        // Calculate 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Helper function to fetch playlist page
        const fetchPlaylistPage = async (pageToken?: string) => {
            const response = await apiClient.get(
                `${YOUTUBE_API_BASE}/playlistItems`,
                {
                    params: {
                        part: "snippet,contentDetails",
                        playlistId: uploadsPlaylistId,
                        maxResults: 50,
                        pageToken,
                        key: apiKey,
                    },
                }
            );
            return response.data as {
                items?: Array<{
                    contentDetails: { videoId: string; videoPublishedAt?: string };
                    snippet: { publishedAt: string };
                }>;
                nextPageToken?: string;
            };
        };

        // Fetch videos: all from 30 days, or minimum 50 total
        let allVideoIds: string[] = [];
        const MIN_VIDEOS = 50;
        const MAX_PAGES = 10; // Safety limit: 10 pages * 50 = 500 max videos
        let nextPageToken: string | undefined = undefined;
        let reachedOldVideos = false;

        for (let pageCount = 0; pageCount < MAX_PAGES; pageCount++) {
            const data = await fetchPlaylistPage(nextPageToken);

            const items = data.items;
            if (!items || items.length === 0) {
                break;
            }

            // Collect videos and check dates
            for (const item of items) {
                const publishedAt = new Date(
                    item.contentDetails.videoPublishedAt || item.snippet.publishedAt
                );

                allVideoIds.push(item.contentDetails.videoId);

                // Mark when we pass the 30-day threshold
                if (publishedAt < thirtyDaysAgo) {
                    reachedOldVideos = true;
                }
            }

            // Stop conditions:
            // 1. If we have 50+ videos and we've passed the 30-day mark
            if (reachedOldVideos && allVideoIds.length >= MIN_VIDEOS) {
                break;
            }

            nextPageToken = data.nextPageToken;
            if (!nextPageToken) {
                break;
            }
        }

        if (allVideoIds.length === 0) {
            return [];
        }

        // Fetch detailed video information in batches of 50
        const allVideos: YouTubeVideo[] = [];

        for (let i = 0; i < allVideoIds.length; i += 50) {
            const batchIds = allVideoIds.slice(i, i + 50);

            const videosResponse = await apiClient.get(`${YOUTUBE_API_BASE}/videos`, {
                params: {
                    part: "snippet,statistics,contentDetails",
                    id: batchIds.join(","),
                    key: apiKey,
                },
            });

            if (videosResponse.data.items) {
                const videos = videosResponse.data.items.map((video: any) => ({
                    id: video.id,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    publishedAt: video.snippet.publishedAt,
                    thumbnails: video.snippet.thumbnails,
                    statistics: {
                        viewCount: video.statistics.viewCount || "0",
                        likeCount: video.statistics.likeCount || "0",
                        commentCount: video.statistics.commentCount || "0",
                    },
                    tags: video.snippet.tags || [],
                    contentDetails: {
                        duration: video.contentDetails.duration,
                    },
                }));
                allVideos.push(...videos);
            }
        }

        return allVideos;
    } catch (error: any) {
        if (error instanceof APIError) {
            throw error;
        }
        handleYouTubeError(error, "getChannelVideos");
    }
}

/**
 * Get video information by video ID
 * Returns detailed video info including duration in ISO 8601 format
 */
export async function getVideoInfo(
    videoId: string,
    customApiKey?: string
): Promise<YouTubeVideo | null> {
    const apiKey = customApiKey || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YouTube API key not configured");
    }

    try {
        const response = await apiClient.get(`${YOUTUBE_API_BASE}/videos`, {
            params: {
                part: "snippet,statistics,contentDetails",
                id: videoId,
                key: apiKey,
            },
        });

        if (!response.data.items || response.data.items.length === 0) {
            return null;
        }

        const video = response.data.items[0];
        return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            thumbnails: video.snippet.thumbnails,
            statistics: {
                viewCount: video.statistics.viewCount || "0",
                likeCount: video.statistics.likeCount || "0",
                commentCount: video.statistics.commentCount || "0",
            },
            tags: video.snippet.tags || [],
            contentDetails: {
                duration: video.contentDetails.duration,
            },
        };
    } catch (error: unknown) {
        if (error instanceof APIError) {
            throw error;
        }
        handleYouTubeError(error, "getVideoInfo");
    }
}

/**
 * Parse ISO 8601 duration (e.g., "PT25M30S") to seconds
 */
export function parseISO8601Duration(duration: string): number {
    if (!duration) return 0;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Parse timestamp string (e.g., "1:23" or "01:23:45") to seconds
 */
function parseTimestampToSeconds(timestamp: string): number {
    const parts = timestamp.split(":").map((p) => parseInt(p, 10));

    if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
}

/**
 * Parse video description for chapter timestamps
 * Supports formats:
 * - "00:00 – 01:50 Title" (range format)
 * - "0:00 Title" (simple format)
 * - "00:00 - Title" (dash separator)
 * - "00:00 Title" (space separator)
 */
export function parseVideoDescription(descText: string): VideoDescription {
    const chapters: VideoChapter[] = [];
    const lines = descText.split("\n");

    // Regex patterns for different timestamp formats
    // Pattern 1: "00:00 – 01:50 Title" (range with end time)
    const rangeTimestampRegex = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?\s+(.+)$/;
    // Pattern 2: "00:00 - Title" or "00:00 – Title" (with dash)
    const dashTimestampRegex = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+)$/;
    // Pattern 3: "00:00 Title" (simple space separator)
    const simpleTimestampRegex = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        let match =
            trimmedLine.match(rangeTimestampRegex) ||
            trimmedLine.match(dashTimestampRegex) ||
            trimmedLine.match(simpleTimestampRegex);

        if (match) {
            const [, timestamp, title] = match;
            chapters.push({
                timestamp,
                seconds: parseTimestampToSeconds(timestamp),
                title: title.trim(),
            });
        }
    }

    // Calculate end times based on next chapter's start time
    for (let i = 0; i < chapters.length - 1; i++) {
        chapters[i].endSeconds = chapters[i + 1].seconds;
    }

    return {
        fullText: descText,
        chapters: chapters.length > 0 ? chapters : undefined,
    };
}

/**
 * Get full channel data (info + videos)
 * Videos: All from last 30 days, or minimum 50 videos if fewer
 */
export async function getFullChannelData(
    channelUrl: string,
    customApiKey?: string
) {
    const channelId = await resolveChannelId(channelUrl, customApiKey);
    if (!channelId) {
        throw new APIError("Could not resolve channel ID from URL", "CHANNEL_NOT_FOUND", 404);
    }

    const [channelInfo, videos] = await Promise.all([
        getChannelInfo(channelId, customApiKey),
        getChannelVideos(channelId, 50, customApiKey), // All from 30 days, or min 50 if fewer
    ]);

    if (!channelInfo) {
        throw new APIError("Channel not found", "CHANNEL_NOT_FOUND", 404);
    }

    return {
        channelInfo,
        videos,
    };
}
