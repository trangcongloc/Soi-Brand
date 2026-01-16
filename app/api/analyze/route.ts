// API Route: /api/analyze
import { NextRequest, NextResponse } from "next/server";
import { getFullChannelData } from "@/lib/youtube";
import { generateMarketingReport } from "@/lib/gemini";
import { isValidYouTubeUrl } from "@/lib/utils";
import { AnalyzeRequest, AnalyzeResponse, APIError } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body: AnalyzeRequest = await request.json();
        const { channelUrl } = body;

        // Validate input
        if (!channelUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Channel URL is required",
                } as AnalyzeResponse,
                { status: 400 }
            );
        }

        if (!isValidYouTubeUrl(channelUrl)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid YouTube channel URL",
                } as AnalyzeResponse,
                { status: 400 }
            );
        }

        // Check API keys
        if (!process.env.YOUTUBE_API_KEY) {
            return NextResponse.json(
                {
                    success: false,
                    error: "YouTube API key not configured",
                } as AnalyzeResponse,
                { status: 500 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Gemini API key not configured",
                } as AnalyzeResponse,
                { status: 500 }
            );
        }

        // Fetch YouTube data
        console.log("Fetching YouTube data for:", channelUrl);
        const { channelInfo, videos } = await getFullChannelData(channelUrl);

        if (!channelInfo) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Channel not found or could not be accessed",
                } as AnalyzeResponse,
                { status: 404 }
            );
        }

        if (videos.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No videos found on this channel",
                } as AnalyzeResponse,
                { status: 404 }
            );
        }

        // Generate marketing report using Gemini AI
        console.log("Generating marketing report with Gemini AI...");
        const report = await generateMarketingReport(channelInfo, videos);

        // Return success response
        return NextResponse.json(
            {
                success: true,
                data: report,
            } as AnalyzeResponse,
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error in analyze API:", error);

        // Handle typed APIError from youtube.ts and gemini.ts
        if (error instanceof APIError) {
            const errorMessages: Record<string, string> = {
                YOUTUBE_QUOTA: "Đã hết hạn mức YouTube API hôm nay. Vui lòng thử lại vào ngày mai.",
                GEMINI_QUOTA: "Đã hết hạn mức Gemini API. Vui lòng thử lại sau vài phút.",
                MODEL_OVERLOAD: "Mô hình AI đang quá tải. Vui lòng thử lại sau 1-2 phút.",
                RATE_LIMIT: "Đã vượt quá giới hạn số lần truy cập. Vui lòng thử lại sau.",
                API_CONFIG: "Lỗi cấu hình API key. Vui lòng liên hệ quản trị viên.",
                YOUTUBE_API_ERROR: "Lỗi từ YouTube API. Vui lòng thử lại sau.",
                GEMINI_API_ERROR: "Lỗi từ Gemini AI. Vui lòng thử lại sau.",
                NETWORK_ERROR: "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối internet.",
                AI_PARSE_ERROR: "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.",
                CHANNEL_NOT_FOUND: "Không tìm thấy kênh YouTube. Vui lòng kiểm tra lại URL.",
                UNKNOWN: "Có lỗi không xác định. Vui lòng thử lại sau.",
            };

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessages[error.errorType || "UNKNOWN"] || error.message,
                    errorType: error.errorType,
                } as AnalyzeResponse,
                { status: error.statusCode || 500 }
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
                    error: "Mô hình AI đang quá tải. Vui lòng thử lại sau 1-2 phút.",
                    errorType: "MODEL_OVERLOAD",
                } as AnalyzeResponse,
                { status: 503 }
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
                    error: "Đã hết hạn mức Gemini API. Vui lòng thử lại sau vài phút.",
                    errorType: "GEMINI_QUOTA",
                } as AnalyzeResponse,
                { status: 429 }
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
                    error: "Đã hết hạn mức YouTube API hôm nay. Vui lòng thử lại vào ngày mai.",
                    errorType: "YOUTUBE_QUOTA",
                } as AnalyzeResponse,
                { status: 429 }
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
                    error: "Đã vượt quá giới hạn số lần truy cập. Vui lòng thử lại sau.",
                    errorType: "RATE_LIMIT",
                } as AnalyzeResponse,
                { status: 429 }
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
                    error: "Lỗi cấu hình API key. Vui lòng liên hệ quản trị viên.",
                    errorType: "API_CONFIG",
                } as AnalyzeResponse,
                { status: 500 }
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
                    error: "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối internet.",
                    errorType: "NETWORK_ERROR",
                } as AnalyzeResponse,
                { status: 503 }
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
                    error: "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.",
                    errorType: "AI_PARSE_ERROR",
                } as AnalyzeResponse,
                { status: 500 }
            );
        }

        // Channel not found (404 from YouTube)
        if (statusCode === 404 || errorMessage.includes("not found")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Không tìm thấy kênh YouTube. Vui lòng kiểm tra lại URL.",
                    errorType: "CHANNEL_NOT_FOUND",
                } as AnalyzeResponse,
                { status: 404 }
            );
        }

        // Generic error with more context
        return NextResponse.json(
            {
                success: false,
                error: errorMessage || "Có lỗi không xác định. Vui lòng thử lại sau.",
                errorType: "UNKNOWN",
            } as AnalyzeResponse,
            { status: 500 }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
    return NextResponse.json(
        {},
        {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        }
    );
}
