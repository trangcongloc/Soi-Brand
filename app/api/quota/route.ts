/**
 * API Quota Status Endpoint
 * Returns current quota usage percentages for YouTube and Gemini APIs
 * Protected: Requires valid database key to prevent reconnaissance attacks
 */

import { NextRequest, NextResponse } from "next/server";
import { getQuotaUsage, getQuotaPercentage } from "@/lib/apiQuota";
import { logger } from "@/lib/logger";
import { isValidDatabaseKey, extractDatabaseKey } from "@/lib/prompt/auth";

export async function GET(request: NextRequest) {
  try {
    // Validate database key to prevent reconnaissance attacks
    const userKey = extractDatabaseKey(request.headers);
    if (!isValidDatabaseKey(userKey)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing database key" },
        { status: 401 }
      );
    }
    // Get current quota usage (will auto-reset if needed)
    const usage = getQuotaUsage();

    // Calculate percentages
    const youtubePercentage = getQuotaPercentage('youtube');
    const geminiPercentage = getQuotaPercentage('gemini');

    return NextResponse.json({
      success: true,
      data: {
        youtube: youtubePercentage,
        gemini: geminiPercentage,
        details: {
          youtube: {
            used: usage.youtube.used,
            total: usage.youtube.total,
            lastReset: usage.youtube.lastReset,
          },
          gemini: {
            requestsUsed: usage.gemini.requestsUsed,
            requestsTotal: usage.gemini.requestsTotal,
            lastReset: usage.gemini.lastReset,
          },
          lastUpdated: usage.lastUpdated,
        },
      },
    });
  } catch (error) {
    logger.error("[Quota API] Error fetching quota status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch quota status",
      },
      { status: 500 }
    );
  }
}
