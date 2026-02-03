/**
 * VEO Jobs API - List and manage all jobs
 * GET /api/veo/jobs - List all non-expired jobs
 * DELETE /api/veo/jobs - Clear all jobs
 */

import { NextResponse } from "next/server";
import { listJobs, deleteAllJobs } from "@/lib/veo/d1-client";

export const runtime = "nodejs"; // Use Node.js runtime for zlib

/**
 * GET /api/veo/jobs - List all non-expired jobs
 */
export async function GET() {
  try {
    const jobs = await listJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("[D1 API] List jobs failed:", error);
    return NextResponse.json(
      { error: "Failed to list jobs" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/veo/jobs - Clear all jobs
 */
export async function DELETE() {
  try {
    await deleteAllJobs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[D1 API] Delete all jobs failed:", error);
    return NextResponse.json(
      { error: "Failed to delete jobs" },
      { status: 500 }
    );
  }
}
