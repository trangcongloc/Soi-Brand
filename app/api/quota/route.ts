/**
 * API Quota Status Endpoint
 * Returns current quota usage percentages for YouTube and Gemini APIs
 */

import { NextResponse } from "next/server";
import { getQuotaUsage, getQuotaPercentage } from "@/lib/apiQuota";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
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
