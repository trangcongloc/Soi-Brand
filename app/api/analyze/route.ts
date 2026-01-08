// API Route: /api/analyze
import { NextRequest, NextResponse } from "next/server";
import { getFullChannelData } from "@/lib/youtube";
import { generateMarketingReport } from "@/lib/gemini";
import { isValidYouTubeUrl } from "@/lib/utils";
import { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";

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

        // Handle specific errors
        if (error.message?.includes("quota")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "API quota exceeded. Please try again later.",
                } as AnalyzeResponse,
                { status: 429 }
            );
        }

        if (error.message?.includes("API key")) {
            return NextResponse.json(
                {
                    success: false,
                    error: "API configuration error",
                } as AnalyzeResponse,
                { status: 500 }
            );
        }

        // Generic error response
        return NextResponse.json(
            {
                success: false,
                error: error.message || "An unexpected error occurred",
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
