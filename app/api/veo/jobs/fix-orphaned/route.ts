/**
 * Fix Orphaned Jobs API
 * POST /api/veo/jobs/fix-orphaned - Fix jobs stuck in "in_progress" that have scenes
 */

import { NextRequest, NextResponse } from "next/server";
import { listJobs, getJob, upsertJob } from "@/lib/veo/d1-client";
import { isValidDatabaseKey, extractDatabaseKey } from "@/lib/veo/auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * POST /api/veo/jobs/fix-orphaned - Fix orphaned jobs
 * Jobs are considered orphaned if:
 * - Status is "in_progress" but they have scenes (completed but status not updated)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate database key
    const userKey = extractDatabaseKey(request.headers);
    if (!isValidDatabaseKey(userKey)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid database key" },
        { status: 401 }
      );
    }

    // Get all job summaries from D1
    const jobSummaries = await listJobs();
    let fixedCount = 0;
    const fixedJobIds: string[] = [];

    // Find and fix orphaned jobs
    for (const summary of jobSummaries) {
      // Check if job is "in_progress" but has scenes (meaning it completed)
      if (summary.status === "in_progress" && summary.sceneCount > 0) {
        // Fetch full job data
        const job = await getJob(summary.jobId);
        if (!job) continue;

        // Fix the status to "completed"
        job.status = "completed";

        // Update in D1
        await upsertJob(job.jobId, job);

        fixedCount++;
        fixedJobIds.push(job.jobId);

        logger.info(
          `[D1 API] Fixed orphaned job ${job.jobId}: ${summary.sceneCount} scenes, status now "completed"`
        );
      }
    }

    return NextResponse.json({
      success: true,
      fixedCount,
      fixedJobIds,
      message: fixedCount > 0
        ? `Fixed ${fixedCount} orphaned job(s)`
        : "No orphaned jobs found",
    });
  } catch (error) {
    logger.error("[D1 API] Fix orphaned jobs failed:", error);
    return NextResponse.json(
      { error: "Failed to fix orphaned jobs" },
      { status: 500 }
    );
  }
}
