/**
 * VEO Single Job API - Get, update, or delete a specific job
 * GET /api/veo/jobs/[jobId] - Get job by ID
 * PUT /api/veo/jobs/[jobId] - Upsert job
 * DELETE /api/veo/jobs/[jobId] - Delete job
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob, upsertJob, deleteJob } from "@/lib/veo/d1-client";
import { CachedVeoJob } from "@/lib/veo/types";

export const runtime = "nodejs"; // Use Node.js runtime for zlib

/**
 * GET /api/veo/jobs/[jobId] - Get job by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await getJob(params.jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found or expired" },
        { status: 404 }
      );
    }
    return NextResponse.json({ job });
  } catch (error) {
    console.error("[D1 API] Get job failed:", error);
    return NextResponse.json(
      { error: "Failed to get job" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/veo/jobs/[jobId] - Upsert job
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job: CachedVeoJob = await request.json();
    await upsertJob(params.jobId, job);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[D1 API] Upsert job failed:", error);
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/veo/jobs/[jobId] - Delete job
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await deleteJob(params.jobId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[D1 API] Delete job failed:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
