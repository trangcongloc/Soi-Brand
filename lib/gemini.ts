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
import { GEMINI_ERROR_MAPPINGS, matchAndThrowError } from "./errorMappings";
import { validateAIResponseSchema, AIResponse } from "./schemas";

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
        generationConfig: {
            temperature: 1.0, // Recommended for both Gemini 2.5 and 3 models
            maxOutputTokens: 16384, // Large enough for comprehensive reports
            responseMimeType: "application/json",
        },
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
    const avgViews = videosData.length > 0
        ? Math.round(videosData.reduce((sum, v) => sum + v.views, 0) / videosData.length)
        : 0;
    const topVideoViews = videosData.length > 0
        ? Math.max(...videosData.map((v) => v.views))
        : 0;

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
        const rawAnalysis = extractAndParseJSON(text);

        // Validate response structure using zod schema
        const aiAnalysis: AIResponse = validateAIResponseSchema(rawAnalysis);

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
        logger.error("Error generating marketing report", error);

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

        // Check for validation errors (including zod schema validation)
        if (
            errorMessage.includes("Missing or invalid") ||
            errorMessage.includes("AI response is not") ||
            errorMessage.includes("validation failed")
        ) {
            throw new APIError(
                "The AI response is missing required information. Please try again.",
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

        // Match against error mappings (will throw or fall through to generic)
        matchAndThrowError(
            GEMINI_ERROR_MAPPINGS,
            errorMessage,
            errorStatus,
            undefined,
            "Failed to generate marketing analysis"
        );
    }
}
