// Gemini AI Service for Marketing Analysis
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    YouTubeChannel,
    YouTubeVideo,
    MarketingReport,
    APIError,
    GeminiModel,
} from "./types";
import { generateUUID } from "./utils";
import { buildMarketingReportPrompt } from "./prompts/marketing-report";
import { logger } from "./logger";
import { DEFAULT_MODEL } from "./geminiModels";

/**
 * Validate that the AI response has the required structure
 */
function validateAIResponse(data: any): void {
    if (!data || typeof data !== "object") {
        throw new Error("AI response is not an object");
    }

    if (!data.report_part_2 || typeof data.report_part_2 !== "object") {
        throw new Error("Missing or invalid report_part_2 in AI response");
    }

    if (!data.report_part_3 || typeof data.report_part_3 !== "object") {
        throw new Error("Missing or invalid report_part_3 in AI response");
    }

    // Check for required sections in report_part_2
    const requiredPart2Sections = [
        "ad_strategy",
        "funnel_analysis",
        "strategy_analysis",
    ];

    for (const section of requiredPart2Sections) {
        if (!data.report_part_2[section]) {
            logger.log(
                `Warning: Missing section '${section}' in report_part_2`
            );
        }
    }

    // Check for required sections in report_part_3
    const requiredPart3Sections = ["strengths", "actionable_insights"];

    for (const section of requiredPart3Sections) {
        if (!data.report_part_3[section]) {
            logger.log(
                `Warning: Missing section '${section}' in report_part_3`
            );
        }
    }
}

/**
 * Extract and parse JSON from AI response
 * Handles markdown code blocks and attempts to repair common JSON issues
 */
function extractAndParseJSON(text: string): any {
    let jsonText = text.trim();

    // Remove markdown code block markers if present
    if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
    } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    // Try parsing as-is first
    try {
        return JSON.parse(jsonText);
    } catch (firstError) {
        logger.log("Initial JSON parse failed, attempting repairs...");

        // Common repair attempts
        const repairs = [
            // Fix trailing commas in arrays and objects
            (text: string) => text.replace(/,(\s*[}\]])/g, "$1"),

            // Fix missing commas between array elements
            (text: string) => text.replace(/\}\s*\{/g, "},{"),

            // Fix missing commas between object properties
            (text: string) => text.replace(/"\s*\n\s*"/g, '",\n"'),

            // Fix single quotes to double quotes
            (text: string) => text.replace(/'/g, '"'),

            // Remove comments (single-line)
            (text: string) => text.replace(/\/\/.*$/gm, ""),

            // Remove comments (multi-line)
            (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, ""),
        ];

        let repairedText = jsonText;
        for (const repair of repairs) {
            try {
                repairedText = repair(repairedText);
                return JSON.parse(repairedText);
            } catch {
                // Continue to next repair attempt
            }
        }

        // If all repairs failed, try to extract just the JSON object
        const jsonMatch = repairedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                // Fall through to error
            }
        }

        // All attempts failed
        throw new Error(
            `Failed to parse JSON from AI response. Original error: ${
                (firstError as Error).message
            }. Response preview: ${jsonText.substring(0, 500)}...`
        );
    }
}

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
    customApiKey?: string,
    modelId?: GeminiModel,
    language?: "vi" | "en"
): Promise<MarketingReport> {
    const genAI = initGemini(customApiKey);
    const model = genAI.getGenerativeModel({
        model: modelId || DEFAULT_MODEL,
        generationConfig: { responseMimeType: "application/json" },
    });

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

    // Sort days chronologically (Monday to Sunday)
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const topPostingDays = Object.keys(postingDays)
        .filter(day => postingDays[day] > 0)
        .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

    // Sort hours chronologically (0:00 to 23:00)
    const topPostingHours = Object.keys(postingHours)
        .filter(hour => postingHours[hour] > 0)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(hour => `${hour}:00`);

    // Calculate average engagement for video idea estimates
    const avgViews = Math.round(
        videosData.reduce((sum, v) => sum + v.views, 0) / videosData.length
    );
    const topVideoViews = Math.max(...videosData.map((v) => v.views));

    // Extract all unique tags from all videos
    const allUniqueTags = Array.from(new Set(
        videosData.flatMap((v) => v.tags)
    )).filter(tag => tag && tag.trim() !== "");

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
        allUniqueTags,
        videosData: videosData.map((v) => ({
            title: v.title,
            views: v.views,
            likes: v.likes,
            comments: v.comments,
            publishedAt: v.publishedAt,
            tags: v.tags,
            description: v.description,
        })),
    }, language || "vi");

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON with automatic repair attempts
        const aiAnalysis = extractAndParseJSON(text);

        // Validate response structure
        validateAIResponse(aiAnalysis);

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
        logger.error("Error generating marketing report:", error);

        // Extract error details
        const errorMessage = error?.message || "";
        const errorStatus = error?.status || error?.response?.status;

        // Check for JSON parsing errors specifically
        if (
            errorMessage.includes("Failed to parse JSON") ||
            errorMessage.includes("JSON") ||
            errorMessage.includes("Unexpected token") ||
            errorMessage.includes("Expected")
        ) {
            throw new APIError(
                "The AI generated an invalid response format. This is usually temporary. Please try again.",
                "AI_PARSE_ERROR",
                500
            );
        }

        // Check for validation errors
        if (
            errorMessage.includes("Missing or invalid") ||
            errorMessage.includes("AI response is not")
        ) {
            throw new APIError(
                "The AI response is missing required information. Please try again.",
                "AI_PARSE_ERROR",
                500
            );
        }

        // Error mapping based on official Gemini API documentation
        // Reference: https://ai.google.dev/gemini-api/docs/troubleshooting
        const errorMappings: Array<{
            status?: number[];
            patterns?: string[];
            type: NonNullable<import("./types").AnalyzeResponse["errorType"]>;
            message: string;
            statusCode: number;
        }> = [
            // 400 Bad Request - Invalid parameters (INVALID_ARGUMENT)
            {
                status: [400],
                patterns: ["INVALID_ARGUMENT", "Bad Request", "invalid"],
                type: "GEMINI_API_ERROR",
                message:
                    "Invalid request parameters: The model parameters or request format is incorrect.",
                statusCode: 400,
            },
            // 401/403 Unauthorized/Forbidden - API key issues (PERMISSION_DENIED)
            {
                status: [401, 403],
                patterns: [
                    "PERMISSION_DENIED",
                    "Unauthorized",
                    "Forbidden",
                    "API key",
                ],
                type: "API_CONFIG",
                message:
                    "Gemini API authentication failed: Invalid or missing API key.",
                statusCode: 401,
            },
            // 404 Not Found - Model not found
            {
                status: [404],
                patterns: ["NOT_FOUND", "Not Found"],
                type: "GEMINI_API_ERROR",
                message:
                    "Gemini model not found. The requested model may not exist or be unavailable.",
                statusCode: 404,
            },
            // 429 Resource Exhausted - Rate limit or quota exceeded
            {
                status: [429],
                patterns: ["RESOURCE_EXHAUSTED", "quota", "rate limit"],
                type: "GEMINI_QUOTA",
                message:
                    "Gemini API quota exceeded. Please wait a few minutes before retrying.",
                statusCode: 429,
            },
            // 500 Internal Server Error
            {
                status: [500],
                patterns: ["INTERNAL", "Internal Server Error"],
                type: "GEMINI_API_ERROR",
                message:
                    "Gemini API internal server error. Please try again in a moment.",
                statusCode: 500,
            },
            // 503 Service Unavailable / Model Overload (UNAVAILABLE)
            {
                status: [503],
                patterns: ["UNAVAILABLE", "Service Unavailable", "overloaded"],
                type: "MODEL_OVERLOAD",
                message:
                    "Gemini AI model is currently overloaded. Please try again in 1-2 minutes.",
                statusCode: 503,
            },
            // 504 Gateway Timeout / Deadline Exceeded
            {
                status: [504],
                patterns: ["Deadline Exceeded", "timeout"],
                type: "NETWORK_ERROR",
                message:
                    "Request timeout: The analysis took too long. Try with fewer videos.",
                statusCode: 504,
            },
            // Safety/Content filtering (BlockedReason)
            {
                patterns: ["SAFETY", "blocked", "BlockedReason"],
                type: "GEMINI_API_ERROR",
                message: "Content blocked by Gemini safety filters.",
                statusCode: 400,
            },
            // Recitation issue
            {
                patterns: ["RECITATION", "recitation"],
                type: "AI_PARSE_ERROR",
                message: "AI response issue detected. Please try again.",
                statusCode: 500,
            },
        ];

        // Find matching error
        for (const mapping of errorMappings) {
            const statusMatch = mapping.status?.includes(errorStatus);
            const patternMatch = mapping.patterns?.some((p) =>
                errorMessage.toLowerCase().includes(p.toLowerCase())
            );

            if (statusMatch || patternMatch) {
                throw new APIError(
                    mapping.message,
                    mapping.type,
                    mapping.statusCode
                );
            }
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
            `Failed to generate marketing analysis: ${
                errorMessage || "Unknown error occurred"
            }`,
            "UNKNOWN",
            500
        );
    }
}
