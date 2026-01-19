// YouTube Data API Service
import axios from "axios";
import { YouTubeChannel, YouTubeVideo, APIError } from "./types";
import { extractChannelId, extractUsername } from "./utils";
import { logger } from "./logger";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Parse YouTube API error and throw appropriate APIError
 * Reference: https://developers.google.com/youtube/v3/docs/errors
 */
function handleYouTubeError(error: any, context: string): never {
    const statusCode = error?.response?.status || error?.status;
    const errorData = error?.response?.data?.error;
    const errorMessage =
        errorData?.message || error?.message || "Unknown YouTube API error";
    const errorReason = errorData?.errors?.[0]?.reason || "";

    logger.error(`YouTube API Error (${context}):`, {
        status: statusCode,
        message: errorMessage,
        reason: errorReason,
    });

    // Error mapping based on official YouTube Data API documentation
    const errorMappings: Array<{
        reasons?: string[];
        status?: number[];
        patterns?: string[];
        type: NonNullable<import("./types").AnalyzeResponse["errorType"]>;
        message: string;
        statusCode: number;
    }> = [
        // Quota exceeded (403 quotaExceeded, dailyLimitExceeded)
        {
            reasons: ["quotaExceeded", "dailyLimitExceeded"],
            patterns: ["quota", "Quota exceeded"],
            type: "YOUTUBE_QUOTA",
            message:
                "YouTube API quota exceeded for today. Please try again tomorrow.",
            statusCode: 429,
        },
        // Rate limit (429 rateLimitExceeded)
        {
            reasons: ["rateLimitExceeded"],
            status: [429],
            type: "RATE_LIMIT",
            message:
                "YouTube API rate limit exceeded. Please wait a moment and try again.",
            statusCode: 429,
        },
        // Invalid API key (400/401 keyInvalid)
        {
            reasons: ["keyInvalid"],
            status: [401],
            patterns: ["API key"],
            type: "API_CONFIG",
            message: "Invalid YouTube API key configuration.",
            statusCode: 401,
        },
        // Channel not found (404 channelNotFound)
        {
            reasons: ["channelNotFound"],
            status: [404],
            type: "CHANNEL_NOT_FOUND",
            message: "YouTube channel not found.",
            statusCode: 404,
        },
        // Channel forbidden (403 channelForbidden)
        {
            reasons: ["channelForbidden", "forbidden"],
            status: [403],
            type: "YOUTUBE_API_ERROR",
            message: "Access to this YouTube channel is forbidden.",
            statusCode: 403,
        },
        // Bad request (400 - various reasons)
        {
            reasons: [
                "badRequest",
                "invalidFilters",
                "missingRequiredParameter",
            ],
            status: [400],
            type: "YOUTUBE_API_ERROR",
            message: "Invalid YouTube API request parameters.",
            statusCode: 400,
        },
    ];

    // Find matching error
    for (const mapping of errorMappings) {
        const reasonMatch = mapping.reasons?.includes(errorReason);
        const statusMatch = mapping.status?.includes(statusCode);
        const patternMatch = mapping.patterns?.some((p) =>
            errorMessage.toLowerCase().includes(p.toLowerCase())
        );

        if (reasonMatch || statusMatch || patternMatch) {
            throw new APIError(
                mapping.message,
                mapping.type,
                mapping.statusCode
            );
        }
    }

    // Network errors
    if (
        error?.code === "ECONNREFUSED" ||
        error?.code === "ETIMEDOUT" ||
        error?.code === "ENOTFOUND"
    ) {
        throw new APIError(
            "Network error while connecting to YouTube API.",
            "NETWORK_ERROR",
            503
        );
    }

    // Generic YouTube API error
    throw new APIError(
        `YouTube API error: ${errorMessage}`,
        "YOUTUBE_API_ERROR",
        statusCode || 500
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
        const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
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

        logger.error("Error resolving channel ID:", error);
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
        const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
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
 * Get all videos from the last 30 days using pagination
 */
export async function getChannelVideos(
    channelId: string,
    _maxResults: number = 50, // Kept for API compatibility, but function fetches all 30-day videos
    customApiKey?: string
): Promise<YouTubeVideo[]> {
    const apiKey = customApiKey || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error("YouTube API key not configured");
    }

    try {
        // First, get the uploads playlist ID
        const channelResponse = await axios.get(
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

        // Calculate 30 days ago for filtering
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Helper function to fetch playlist page
        const fetchPlaylistPage = async (pageToken?: string) => {
            const response = await axios.get(
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

        // Fetch all videos from last 30 days using pagination
        let allVideoIds: string[] = [];
        const MAX_PAGES = 10; // Safety limit: 10 pages * 50 = 500 max videos
        let nextPageToken: string | undefined = undefined;
        let stopFetching = false;

        for (let pageCount = 0; pageCount < MAX_PAGES && !stopFetching; pageCount++) {
            const data = await fetchPlaylistPage(nextPageToken);

            const items = data.items;
            if (!items || items.length === 0) {
                break;
            }

            // Check each video's publish date
            for (const item of items) {
                const publishedAt = new Date(item.contentDetails.videoPublishedAt || item.snippet.publishedAt);

                if (publishedAt >= thirtyDaysAgo) {
                    allVideoIds.push(item.contentDetails.videoId);
                } else {
                    // Videos are sorted by date, so once we find an older video,
                    // all subsequent videos will also be older
                    stopFetching = true;
                    break;
                }
            }

            nextPageToken = data.nextPageToken;
            if (!nextPageToken) {
                break;
            }
        }

        // If no videos in last 30 days, get the 10 most recent
        if (allVideoIds.length === 0) {
            const fallbackResponse = await axios.get(
                `${YOUTUBE_API_BASE}/playlistItems`,
                {
                    params: {
                        part: "snippet,contentDetails",
                        playlistId: uploadsPlaylistId,
                        maxResults: 10,
                        key: apiKey,
                    },
                }
            );

            if (fallbackResponse.data.items) {
                allVideoIds = fallbackResponse.data.items.map(
                    (item: any) => item.contentDetails.videoId
                );
            }
        }

        if (allVideoIds.length === 0) {
            return [];
        }

        // Fetch detailed video information in batches of 50
        const allVideos: YouTubeVideo[] = [];

        for (let i = 0; i < allVideoIds.length; i += 50) {
            const batchIds = allVideoIds.slice(i, i + 50);

            const videosResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
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
 * Get full channel data (info + videos)
 * Videos are filtered to last 30 days (or 10 most recent if none in 30 days)
 */
export async function getFullChannelData(
    channelUrl: string,
    customApiKey?: string
) {
    const channelId = await resolveChannelId(channelUrl, customApiKey);
    if (!channelId) {
        throw new Error("Could not resolve channel ID from URL");
    }

    const [channelInfo, videos] = await Promise.all([
        getChannelInfo(channelId, customApiKey),
        getChannelVideos(channelId, 50, customApiKey), // Fetches all videos from last 30 days
    ]);

    if (!channelInfo) {
        throw new Error("Channel not found");
    }

    return {
        channelInfo,
        videos,
    };
}
