// API Route: /api/analyze
import { NextRequest, NextResponse } from "next/server";
import { getFullChannelData } from "@/lib/youtube";
import { generateMarketingReport } from "@/lib/gemini";
import { isValidYouTubeUrl } from "@/lib/utils";
import { AnalyzeResponse } from "@/lib/types";
import { isOriginAllowed, validateEnv } from "@/lib/config";
import { withRetry } from "@/lib/retry";
import { logger } from "@/lib/logger";
import { AnalyzeRequestSchema } from "@/lib/schemas";
import { handleAPIError } from "@/lib/error-handler";
import {
  checkRateLimit,
  getClientIdentifier,
  detectApiKeyTier,
  getTierRateLimit
} from "@/lib/rateLimit";

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

        // Parse and validate request body with Zod first to get API key for tier detection
        let rawBody: unknown;
        try {
            rawBody = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Dữ liệu yêu cầu không hợp lệ" : "Invalid request body",
                    errorType: "UNKNOWN",
                } as AnalyzeResponse,
                { status: 400, headers: corsHeaders }
            );
        }

        const parseResult = AnalyzeRequestSchema.safeParse(rawBody);
        if (!parseResult.success) {
            const errorMessage = parseResult.error.issues
                .map((issue) => issue.message)
                .join(", ");
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? `Dữ liệu không hợp lệ: ${errorMessage}` : `Invalid input: ${errorMessage}`,
                    errorType: "UNKNOWN",
                } as AnalyzeResponse,
                { status: 400, headers: corsHeaders }
            );
        }

        const { channelUrl, youtubeApiKey, geminiApiKey, geminiModel, apiKeyTier, language } = parseResult.data;
        isVi = language !== 'en';

        // Get API key (from request or environment)
        const effectiveGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;
        if (!effectiveGeminiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: isVi ? "Thiếu Gemini API key" : "Gemini API key is required",
                    errorType: "API_CONFIG",
                } as AnalyzeResponse,
                { status: 400, headers: corsHeaders }
            );
        }

        // Detect API key tier and get appropriate rate limit
        const tier = detectApiKeyTier(effectiveGeminiKey, apiKeyTier);
        const tierRateLimit = getTierRateLimit("analyze", tier);

        // Tier-based rate limiting check
        const clientId = getClientIdentifier(request);
        const rateLimitResult = checkRateLimit(clientId, tierRateLimit, tier);

        if (!rateLimitResult.success) {
            const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
            const tierLabel = tier === "paid" ? (isVi ? "trả phí" : "paid tier") : (isVi ? "miễn phí" : "free tier");
            const limitText = isVi
                ? `Vượt quá giới hạn cho tài khoản ${tierLabel} (${tierRateLimit.limit} yêu cầu/phút)`
                : `Rate limit exceeded for ${tierLabel} (${tierRateLimit.limit} requests per minute)`;

            return NextResponse.json(
                {
                    success: false,
                    error: limitText,
                    errorType: "RATE_LIMIT",
                } as AnalyzeResponse,
                {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        "Retry-After": String(retryAfter),
                        "X-RateLimit-Limit": String(tierRateLimit.limit),
                        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
                        "X-RateLimit-Reset": String(rateLimitResult.resetTime),
                        "X-RateLimit-Tier": tier,
                    },
                }
            );
        }

        // Validate YouTube URL format
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

        // Use unified error handler
        const errorResult = handleAPIError(error, "Analysis");
        const errorMessage = isVi ? errorResult.message.vi : errorResult.message.en;

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                errorType: errorResult.type,
            } as AnalyzeResponse,
            { status: errorResult.statusCode, headers: corsHeaders }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
