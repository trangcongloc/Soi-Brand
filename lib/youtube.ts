// YouTube Data API Service
import axios from "axios";
import { YouTubeChannel, YouTubeVideo } from "./types";
import { extractChannelId, extractUsername } from "./utils";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Get channel ID from username or custom URL
 */
export async function resolveChannelId(url: string): Promise<string | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
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
    } catch (error) {
        console.error("Error resolving channel ID:", error);
        return null;
    }
}

/**
 * Get channel information
 */
export async function getChannelInfo(
    channelId: string
): Promise<YouTubeChannel | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
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
    } catch (error) {
        console.error("Error fetching channel info:", error);
        return null;
    }
}

/**
 * Get recent videos from channel
 */
export async function getChannelVideos(
    channelId: string,
    maxResults: number = 10
): Promise<YouTubeVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
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
    } catch (error) {
        console.error("Error fetching channel videos:", error);
        return [];
    }
}

/**
 * Get full channel data (info + videos)
 */
export async function getFullChannelData(channelUrl: string) {
    const channelId = await resolveChannelId(channelUrl);
    if (!channelId) {
        throw new Error("Could not resolve channel ID from URL");
    }

    const [channelInfo, allVideos] = await Promise.all([
        getChannelInfo(channelId),
        getChannelVideos(channelId, 50), // Fetch up to 50 videos
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
