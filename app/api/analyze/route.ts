// API Route: /api/analyze
import { NextRequest, NextResponse } from "next/server";
import { getFullChannelData } from "@/lib/youtube";
import { generateMarketingReport } from "@/lib/gemini";
import { isValidYouTubeUrl } from "@/lib/utils";
import { AnalyzeRequest, AnalyzeResponse, APIError } from "@/lib/types";
import { isOriginAllowed, validateEnv } from "@/lib/config";
import { withRetry } from "@/lib/retry";
import { logger } from "@/lib/logger";

// CORS headers helper
function getCorsHeaders(origin: string | null): HeadersInit {
    const headers: HeadersInit = {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // In development, allow all origins
    if (process.env.NODE_ENV !== "production") {
        headers["Access-Control-Allow-Origin"] = "*";
    } else if (origin && isOriginAllowed(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }

    return headers;
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    let isVi = true; // Default to Vietnamese

    try {
        // Validate environment configuration
        try {
            validateEnv();
        } catch (envError) {
            logger.error("Environment validation failed", envError);
            return NextResponse.json(
                {
                    success: false,
                    error: "Server configuration error. Please contact administrator.",
                    errorType: "API_CONFIG",
                } as AnalyzeResponse,
                { status: 500, headers: corsHeaders }
            );
        }

        // Parse request body
        const body: AnalyzeRequest = await request.json();
        const { channelUrl, youtubeApiKey, geminiApiKey, geminiModel, language } = body;
        isVi = language !== 'en';

        // Validate input
        if (!channelUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Vui lòng nhập URL kênh YouTube" : "Channel URL is required",
                    errorType: "CHANNEL_NOT_FOUND",
                } as AnalyzeResponse,
                { status: 400, headers: corsHeaders }
            );
        }

        if (!isValidYouTubeUrl(channelUrl)) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "URL kênh YouTube không hợp lệ" : "Invalid YouTube channel URL",
                    errorType: "CHANNEL_NOT_FOUND",
                } as AnalyzeResponse,
                { status: 400, headers: corsHeaders }
            );
        }

        // Fetch YouTube data with retry
        logger.log("Fetching YouTube data for:", channelUrl);
        const { channelInfo, videos } = await withRetry(
            () => getFullChannelData(channelUrl, youtubeApiKey),
            {
                maxAttempts: 3,
                initialDelayMs: 1000,
                onRetry: (attempt, error) => {
                    logger.log(`YouTube API retry ${attempt}: ${error.message}`);
                },
            }
        );

        if (!channelInfo) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Không tìm thấy kênh hoặc không thể truy cập" : "Channel not found or could not be accessed",
                    errorType: "CHANNEL_NOT_FOUND",
                } as AnalyzeResponse,
                { status: 404, headers: corsHeaders }
            );
        }

        if (videos.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Không tìm thấy video nào trên kênh này" : "No videos found on this channel",
                    errorType: "CHANNEL_NOT_FOUND",
                } as AnalyzeResponse,
                { status: 404, headers: corsHeaders }
            );
        }

        // Generate marketing report using Gemini AI with retry
        logger.log("Generating marketing report with Gemini AI...");
        const report = await withRetry(
            () => generateMarketingReport(channelInfo, videos, geminiApiKey, geminiModel, language),
            {
                maxAttempts: 3,
                initialDelayMs: 2000,
                onRetry: (attempt, error) => {
                    logger.log(`Gemini API retry ${attempt}: ${error.message}`);
                },
            }
        );

        // Return success response
        return NextResponse.json(
            {
                success: true,
                data: report,
            } as AnalyzeResponse,
            { status: 200, headers: corsHeaders }
        );
    } catch (error: any) {
        logger.error("Error in analyze API", error);

        // Handle typed APIError from youtube.ts and gemini.ts
        if (error instanceof APIError) {
            const errorMessagesVi: Record<string, string> = {
                YOUTUBE_QUOTA: "Đã hết hạn mức YouTube API hôm nay. Vui lòng thử lại vào ngày mai.",
                GEMINI_QUOTA: "Đã hết hạn mức Gemini API.",
                MODEL_OVERLOAD: "Mô hình AI đang quá tải.",
                RATE_LIMIT: "Đã vượt quá giới hạn số lần truy cập.",
                API_CONFIG: "Lỗi cấu hình API key. Vui lòng liên hệ quản trị viên.",
                YOUTUBE_API_ERROR: "Lỗi từ YouTube API.",
                GEMINI_API_ERROR: "Lỗi từ Gemini AI.",
                NETWORK_ERROR: "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối internet.",
                AI_PARSE_ERROR: "AI trả về dữ liệu không hợp lệ.",
                CHANNEL_NOT_FOUND: "Không tìm thấy kênh YouTube. Vui lòng kiểm tra lại URL.",
                UNKNOWN: "Có lỗi không xác định.",
            };

            const errorMessagesEn: Record<string, string> = {
                YOUTUBE_QUOTA: "YouTube API quota exceeded for today. Please try again tomorrow.",
                GEMINI_QUOTA: "Gemini API quota exceeded.",
                MODEL_OVERLOAD: "AI model is overloaded.",
                RATE_LIMIT: "Rate limit exceeded.",
                API_CONFIG: "API key configuration error. Please contact administrator.",
                YOUTUBE_API_ERROR: "Error from YouTube API.",
                GEMINI_API_ERROR: "Error from Gemini AI.",
                NETWORK_ERROR: "Cannot connect to server. Please check your internet connection.",
                AI_PARSE_ERROR: "AI returned invalid data.",
                CHANNEL_NOT_FOUND: "YouTube channel not found. Please check the URL.",
                UNKNOWN: "An unknown error occurred.",
            };

            const errorMessages = isVi ? errorMessagesVi : errorMessagesEn;

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessages[error.errorType || "UNKNOWN"] || error.message,
                    errorType: error.errorType,
                } as AnalyzeResponse,
                { status: error.statusCode || 500, headers: corsHeaders }
            );
        }

        // Fallback for non-APIError exceptions
        const errorMessage = error.message || "";
        const errorCode = error.code || "";
        const statusCode = error.status || error.response?.status || 500;

        // Gemini AI specific errors - Model overload
        if (
            errorMessage.includes("RESOURCE_EXHAUSTED") ||
            errorMessage.includes("overload") ||
            errorMessage.includes("overloaded") ||
            errorCode === "RESOURCE_EXHAUSTED"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Mô hình AI đang quá tải." : "AI model is overloaded.",
                    errorType: "MODEL_OVERLOAD",
                } as AnalyzeResponse,
                { status: 503, headers: corsHeaders }
            );
        }

        // Gemini API quota errors (check before generic rate limit)
        if (
            errorMessage.includes("Gemini") &&
            (errorMessage.includes("quota") || errorMessage.includes("429"))
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Đã hết hạn mức Gemini API." : "Gemini API quota exceeded.",
                    errorType: "GEMINI_QUOTA",
                } as AnalyzeResponse,
                { status: 429, headers: corsHeaders }
            );
        }

        // YouTube API quota errors
        if (
            errorMessage.includes("YouTube") &&
            (errorMessage.includes("quota") ||
                errorMessage.includes("quotaExceeded") ||
                errorMessage.includes("dailyLimitExceeded"))
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Đã hết hạn mức YouTube API hôm nay. Vui lòng thử lại vào ngày mai." : "YouTube API quota exceeded for today. Please try again tomorrow.",
                    errorType: "YOUTUBE_QUOTA",
                } as AnalyzeResponse,
                { status: 429, headers: corsHeaders }
            );
        }

        // Generic rate limit errors
        if (
            errorMessage.includes("RATE_LIMIT_EXCEEDED") ||
            errorMessage.includes("Too Many Requests") ||
            statusCode === 429
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Đã vượt quá giới hạn số lần truy cập." : "Rate limit exceeded.",
                    errorType: "RATE_LIMIT",
                } as AnalyzeResponse,
                { status: 429, headers: corsHeaders }
            );
        }

        // API key errors
        if (
            errorMessage.includes("API key") ||
            errorMessage.includes("INVALID_ARGUMENT") ||
            errorMessage.includes("API_KEY_INVALID") ||
            errorCode === "INVALID_ARGUMENT"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Lỗi cấu hình API key. Vui lòng liên hệ quản trị viên." : "API key configuration error. Please contact administrator.",
                    errorType: "API_CONFIG",
                } as AnalyzeResponse,
                { status: 500, headers: corsHeaders }
            );
        }

        // Network/timeout errors
        if (
            errorMessage.includes("ECONNREFUSED") ||
            errorMessage.includes("ETIMEDOUT") ||
            errorMessage.includes("ENOTFOUND") ||
            errorMessage.includes("network") ||
            errorCode === "ECONNREFUSED" ||
            errorCode === "ETIMEDOUT"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối internet." : "Cannot connect to server. Please check your internet connection.",
                    errorType: "NETWORK_ERROR",
                } as AnalyzeResponse,
                { status: 503, headers: corsHeaders }
            );
        }

        // JSON parsing errors (from Gemini)
        if (
            errorMessage.includes("JSON") ||
            errorMessage.includes("parse") ||
            errorMessage.includes("Unexpected token") ||
            errorMessage.includes("SyntaxError")
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "AI trả về dữ liệu không hợp lệ." : "AI returned invalid data.",
                    errorType: "AI_PARSE_ERROR",
                } as AnalyzeResponse,
                { status: 500, headers: corsHeaders }
            );
        }

        // Channel not found (404 from YouTube)
        if (statusCode === 404 || errorMessage.includes("not found")) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Không tìm thấy kênh YouTube. Vui lòng kiểm tra lại URL." : "YouTube channel not found. Please check the URL.",
                    errorType: "CHANNEL_NOT_FOUND",
                } as AnalyzeResponse,
                { status: 404, headers: corsHeaders }
            );
        }

        // Generic error with more context
        return NextResponse.json(
            {
                success: false,
                error: errorMessage || (isVi ? "Có lỗi không xác định." : "An unknown error occurred."),
                errorType: "UNKNOWN",
            } as AnalyzeResponse,
            { status: 500, headers: corsHeaders }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
