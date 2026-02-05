/**
 * VEO Single Job API - Get, update, or delete a specific job
 * GET /api/veo/jobs/[jobId] - Get job by ID
 * PUT /api/veo/jobs/[jobId] - Upsert job
 * DELETE /api/veo/jobs/[jobId] - Delete job
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob, upsertJob, deleteJob } from "@/lib/veo/d1-client";
import { CachedVeoJob } from "@/lib/veo/types";
import { isValidDatabaseKey, extractDatabaseKey } from "@/lib/veo/auth";

export const runtime = "nodejs"; // Use Node.js runtime for zlib

// Maximum request body size: 10MB to prevent memory exhaustion attacks
const MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024;

// Job ID format validation: UUID-like format with prefix
const JOB_ID_PATTERN = /^veo_[a-zA-Z0-9_-]{8,64}$/;

/**
 * Validate job ID format to prevent enumeration attacks
 */
function isValidJobIdFormat(jobId: string): boolean {
  return JOB_ID_PATTERN.test(jobId);
}

/**
 * GET /api/veo/jobs/[jobId] - Get job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Validate job ID format to prevent enumeration
    if (!isValidJobIdFormat(params.jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Validate database key
    const userKey = extractDatabaseKey(request.headers);
    if (!isValidDatabaseKey(userKey)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid database key" },
        { status: 401 }
      );
    }

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
    // Validate job ID format to prevent enumeration
    if (!isValidJobIdFormat(params.jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Check request size to prevent memory exhaustion (DoS)
    const contentLength = request.headers.get("content-length");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_REQUEST_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Request body too large. Maximum size is ${MAX_REQUEST_SIZE_BYTES / 1024 / 1024}MB` },
          { status: 413 }
        );
      }
    }

    // Validate database key
    const userKey = extractDatabaseKey(request.headers);
    if (!isValidDatabaseKey(userKey)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid database key" },
        { status: 401 }
      );
    }

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
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Validate job ID format to prevent enumeration
    if (!isValidJobIdFormat(params.jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Validate database key
    const userKey = extractDatabaseKey(request.headers);
    if (!isValidDatabaseKey(userKey)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid database key" },
        { status: 401 }
      );
    }

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
