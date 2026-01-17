// Gemini AI Service for Marketing Analysis
import { GoogleGenerativeAI } from "@google/generative-ai";
import { YouTubeChannel, YouTubeVideo, MarketingReport, APIError } from "./types";
import { generateUUID } from "./utils";
import { buildMarketingReportPrompt } from "./prompts/marketing-report";

/**
 * Initialize Gemini AI
 */
function initGemini(customApiKey?: string) {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key not configured");
    }
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate marketing analysis report using Gemini AI
 */
export async function generateMarketingReport(
    channelInfo: YouTubeChannel,
    videos: YouTubeVideo[],
    customApiKey?: string
): Promise<MarketingReport> {
    const genAI = initGemini(customApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Prepare data for analysis
    const channelData = {
        name: channelInfo.title,
        description: channelInfo.description,
        subscriberCount: parseInt(channelInfo.statistics.subscriberCount),
        videoCount: parseInt(channelInfo.statistics.videoCount),
        totalViews: parseInt(channelInfo.statistics.viewCount),
    };

    const videosData = videos.map((video) => ({
        title: video.title,
        description: video.description,
        views: parseInt(video.statistics.viewCount),
        likes: parseInt(video.statistics.likeCount),
        comments: parseInt(video.statistics.commentCount),
        publishedAt: video.publishedAt,
        tags: video.tags || [],
    }));

    // Analyze posting patterns for content calendar insights
    const postingDays: { [key: string]: number } = {};
    const postingHours: { [key: string]: number } = {};
    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    videosData.forEach((v) => {
        const date = new Date(v.publishedAt);
        const dayName = dayNames[date.getDay()];
        const hour = date.getHours();
        postingDays[dayName] = (postingDays[dayName] || 0) + 1;
        postingHours[hour] = (postingHours[hour] || 0) + 1;
    });

    const topPostingDays = Object.entries(postingDays)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => day);

    const topPostingHours = Object.entries(postingHours)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

    // Calculate average engagement for video idea estimates
    const avgViews = Math.round(
        videosData.reduce((sum, v) => sum + v.views, 0) / videosData.length
    );
    const topVideoViews = Math.max(...videosData.map((v) => v.views));

    // Build prompt using extracted template
    const prompt = buildMarketingReportPrompt({
        channelName: channelData.name,
        channelDescription: channelData.description,
        subscriberCount: channelData.subscriberCount,
        videoCount: channelData.videoCount,
        totalViews: channelData.totalViews,
        avgViews,
        topVideoViews,
        topPostingDays,
        topPostingHours,
        videosData: videosData.map((v) => ({
            title: v.title,
            views: v.views,
            likes: v.likes,
            comments: v.comments,
            publishedAt: v.publishedAt,
            tags: v.tags,
            description: v.description,
        })),
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (remove markdown code blocks if present)
        let jsonText = text.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, "");
        }

        const aiAnalysis = JSON.parse(jsonText);

        // Construct full report
        const report: MarketingReport = {
            report_id: generateUUID(),
            job_id: generateUUID(),
            brand_name: channelInfo.title,
            report_part_1: {
                posts: videos.map((video) => ({
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                    desc: video.description.substring(0, 200),
                    is_ad: false,
                    title: video.title,
                    gallery: [
                        video.thumbnails.maxres?.url ||
                            video.thumbnails.high?.url ||
                            "",
                    ],
                    post_id: video.id,
                    is_pinned: false,
                    post_type: "Video",
                    thumbnail: video.thumbnails.medium?.url || "",
                    created_at: video.publishedAt,
                    statistics: {
                        digg_count: parseInt(video.statistics.likeCount),
                        play_count: parseInt(video.statistics.viewCount),
                        share_count: 0,
                        collect_count: 0,
                        comment_count: parseInt(video.statistics.commentCount),
                    },
                    tags: video.tags || [],
                    transcript: "",
                    raw_content_for_ai: null,
                    published_at: video.publishedAt,
                    duration: video.contentDetails?.duration || "PT0S",
                })),
                channel_info: {
                    stats: {
                        heartCount: videos.reduce(
                            (sum, v) =>
                                sum + parseInt(v.statistics.likeCount || "0"),
                            0
                        ),
                        videoCount: parseInt(channelInfo.statistics.videoCount),
                        followerCount: parseInt(
                            channelInfo.statistics.subscriberCount
                        ),
                        followingCount: 0,
                        viewCount: parseInt(channelInfo.statistics.viewCount),
                    },
                    avatar: channelInfo.thumbnails.high?.url || "",
                    bioLink: "",
                    nickname: channelInfo.title,
                    uniqueId: channelInfo.customUrl || channelInfo.id,
                    channelId: channelInfo.id,
                    signature: channelInfo.description,
                    joinedAt: channelInfo.publishedAt,
                },
            },
            report_part_2: aiAnalysis.report_part_2,
            report_part_3: aiAnalysis.report_part_3,
            created_at: new Date().toISOString(),
        };

        return report;
    } catch (error: any) {
        console.error("Error generating marketing report:", error);

        // Extract error details
        const errorMessage = error?.message || "";
        const errorStatus = error?.status || error?.response?.status;

        // Handle specific Gemini API errors based on official documentation
        // Reference: https://ai.google.dev/gemini-api/docs/troubleshooting

        // 400 Bad Request - Invalid parameters
        if (
            errorStatus === 400 ||
            errorMessage.includes("400") ||
            errorMessage.includes("Bad Request") ||
            errorMessage.includes("invalid")
        ) {
            throw new APIError(
                "Invalid request parameters: The model parameters or request format is incorrect.",
                "GEMINI_API_ERROR",
                400
            );
        }

        // 401 Unauthorized - Authentication failure
        if (
            errorStatus === 401 ||
            errorMessage.includes("401") ||
            errorMessage.includes("Unauthorized") ||
            errorMessage.includes("API key")
        ) {
            throw new APIError(
                "Gemini API authentication failed: Invalid or missing API key.",
                "API_CONFIG",
                401
            );
        }

        // 403 Forbidden - Permission denied
        if (
            errorStatus === 403 ||
            errorMessage.includes("403") ||
            errorMessage.includes("Forbidden") ||
            errorMessage.includes("Permission denied")
        ) {
            throw new APIError(
                "Permission denied: Your Gemini API key doesn't have access to this model.",
                "API_CONFIG",
                403
            );
        }

        // 404 Not Found - Resource not found
        if (
            errorStatus === 404 ||
            errorMessage.includes("404") ||
            errorMessage.includes("Not Found")
        ) {
            throw new APIError(
                "Gemini model not found. The requested model may not exist or be unavailable.",
                "GEMINI_API_ERROR",
                404
            );
        }

        // 429 Resource Exhausted - Rate limit or quota exceeded
        if (
            errorStatus === 429 ||
            errorMessage.includes("429") ||
            errorMessage.includes("Resource Exhausted") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("rate limit")
        ) {
            throw new APIError(
                "Gemini API quota exceeded. Please wait a few minutes before retrying.",
                "GEMINI_QUOTA",
                429
            );
        }

        // 500 Internal Server Error
        if (
            errorStatus === 500 ||
            errorMessage.includes("500") ||
            errorMessage.includes("Internal Server Error")
        ) {
            throw new APIError(
                "Gemini API internal server error. Please try again in a moment.",
                "GEMINI_API_ERROR",
                500
            );
        }

        // 503 Service Unavailable / Model Overload
        if (
            errorStatus === 503 ||
            errorMessage.includes("503") ||
            errorMessage.includes("Service Unavailable") ||
            errorMessage.includes("overloaded") ||
            errorMessage.includes("RESOURCE_EXHAUSTED")
        ) {
            throw new APIError(
                "Gemini AI model is currently overloaded. Please try again in 1-2 minutes.",
                "MODEL_OVERLOAD",
                503
            );
        }

        // 504 Gateway Timeout / Deadline Exceeded
        if (
            errorStatus === 504 ||
            errorMessage.includes("504") ||
            errorMessage.includes("Deadline Exceeded") ||
            errorMessage.includes("timeout")
        ) {
            throw new APIError(
                "Request timeout: The analysis took too long. Try with fewer videos.",
                "NETWORK_ERROR",
                504
            );
        }

        // Safety/Content filtering
        if (
            errorMessage.includes("SAFETY") ||
            errorMessage.includes("blocked") ||
            errorMessage.includes("BlockedReason")
        ) {
            throw new APIError(
                "Content blocked by Gemini safety filters.",
                "GEMINI_API_ERROR",
                400
            );
        }

        // Recitation issue
        if (
            errorMessage.includes("RECITATION") ||
            errorMessage.includes("recitation")
        ) {
            throw new APIError(
                "AI response issue detected. Please try again.",
                "AI_PARSE_ERROR",
                500
            );
        }

        // JSON parsing errors
        if (error instanceof SyntaxError || errorMessage.includes("JSON")) {
            throw new APIError(
                "AI returned invalid response format. Please try again.",
                "AI_PARSE_ERROR",
                500
            );
        }

        // Generic fallback error
        throw new APIError(
            `Failed to generate marketing analysis: ${errorMessage || "Unknown error occurred"}`,
            "UNKNOWN",
            500
        );
    }
}
