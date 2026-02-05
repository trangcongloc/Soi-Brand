/**
 * VEO Single Job API - Get, update, or delete a specific job
 * GET /api/prompt/jobs/[jobId] - Get job by ID
 * PUT /api/prompt/jobs/[jobId] - Upsert job
 * DELETE /api/prompt/jobs/[jobId] - Delete job
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob, upsertJob, deleteJob } from "@/lib/prompt/d1-client";
import { CachedPromptJob } from "@/lib/prompt/types";
import { isValidDatabaseKey, extractDatabaseKey } from "@/lib/prompt/auth";

export const runtime = "nodejs"; // Use Node.js runtime for zlib

// Maximum request body size: 10MB to prevent memory exhaustion attacks
const MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024;

// Job ID format validation: UUID-like format with optional "prompt_" prefix
// Supports both old format (timestamp_random) and new format (prompt_timestamp_random)
const JOB_ID_PATTERN = /^(prompt_)?[a-zA-Z0-9_-]{8,64}$/;

/**
 * Validate job ID format to prevent enumeration attacks
 */
function isValidJobIdFormat(jobId: string): boolean {
  return JOB_ID_PATTERN.test(jobId);
}

/**
 * GET /api/prompt/jobs/[jobId] - Get job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate job ID format to prevent enumeration
    if (!isValidJobIdFormat(jobId)) {
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

    const job = await getJob(jobId);
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
 * PUT /api/prompt/jobs/[jobId] - Upsert job
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate job ID format to prevent enumeration
    if (!isValidJobIdFormat(jobId)) {
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

    const job: CachedPromptJob = await request.json();
    await upsertJob(jobId, job);
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
 * DELETE /api/prompt/jobs/[jobId] - Delete job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate job ID format to prevent enumeration
    if (!isValidJobIdFormat(jobId)) {
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

    await deleteJob(jobId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[D1 API] Delete job failed:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
