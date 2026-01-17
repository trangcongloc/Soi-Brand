// YouTube Data API Service
import axios from "axios";
import { YouTubeChannel, YouTubeVideo, APIError } from "./types";
import { extractChannelId, extractUsername } from "./utils";

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

    console.error(`YouTube API Error (${context}):`, {
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

        console.error("Error resolving channel ID:", error);
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
 * Get recent videos from channel
 */
export async function getChannelVideos(
    channelId: string,
    maxResults: number = 10,
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

        // Get videos from uploads playlist
        const playlistResponse = await axios.get(
            `${YOUTUBE_API_BASE}/playlistItems`,
            {
                params: {
                    part: "snippet,contentDetails",
                    playlistId: uploadsPlaylistId,
                    maxResults,
                    key: apiKey,
                },
            }
        );

        if (!playlistResponse.data.items) {
            return [];
        }

        // Get video IDs
        const videoIds = playlistResponse.data.items.map(
            (item: any) => item.contentDetails.videoId
        );

        // Get detailed video information
        const videosResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
            params: {
                part: "snippet,statistics,contentDetails",
                id: videoIds.join(","),
                key: apiKey,
            },
        });

        if (!videosResponse.data.items) {
            return [];
        }

        return videosResponse.data.items.map((video: any) => ({
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
    } catch (error: any) {
        if (error instanceof APIError) {
            throw error;
        }
        handleYouTubeError(error, "getChannelVideos");
    }
}

/**
 * Get full channel data (info + videos)
 */
export async function getFullChannelData(
    channelUrl: string,
    customApiKey?: string
) {
    const channelId = await resolveChannelId(channelUrl, customApiKey);
    if (!channelId) {
        throw new Error("Could not resolve channel ID from URL");
    }

    const [channelInfo, allVideos] = await Promise.all([
        getChannelInfo(channelId, customApiKey),
        getChannelVideos(channelId, 50, customApiKey), // Fetch up to 50 videos
    ]);

    if (!channelInfo) {
        throw new Error("Channel not found");
    }

    // Filter videos for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let videos = allVideos.filter(
        (video) => new Date(video.publishedAt) >= thirtyDaysAgo
    );

    // If no videos in last 30 days, keep the top 10 most recent to ensure we have data
    if (videos.length === 0) {
        videos = allVideos.slice(0, 10);
    }

    return {
        channelInfo,
        videos,
    };
}
