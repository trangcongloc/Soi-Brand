/**
 * VEO Single Job API - Get, update, or delete a specific job
 * GET /api/prompt/jobs/[jobId] - Get job by ID
 * GET /api/prompt/jobs/[jobId]?stream=true&last_event_id=xxx - Resume SSE stream
 * PUT /api/prompt/jobs/[jobId] - Upsert job
 * DELETE /api/prompt/jobs/[jobId] - Delete job
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob, upsertJob, deleteJob } from "@/lib/prompt/d1-client";
import { CachedPromptJob } from "@/lib/prompt/types";
import { isValidDatabaseKey, extractDatabaseKey } from "@/lib/prompt/auth";
import {
  eventTracker,
  createSSEEncoder,
} from "@/lib/prompt/api/helpers";
import { UI_SSE_REPLAY_DELAY_MS } from "@/lib/ui-config";

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
 * GET /api/prompt/jobs/[jobId]?stream=true&last_event_id=xxx - Resume SSE stream
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const isStreamRecovery = searchParams.get("stream") === "true";
    const lastEventId = searchParams.get("last_event_id");

    // Validate job ID format to prevent enumeration
    if (!isValidJobIdFormat(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Handle stream recovery request
    if (isStreamRecovery) {
      return handleStreamRecovery(jobId, lastEventId);
    }

    // Regular job fetch requires database key validation
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
 * Handle SSE stream recovery request
 * Returns missed events since last_event_id as an SSE stream
 */
function handleStreamRecovery(jobId: string, lastEventId: string | null): Response {
  // Check if we have tracked events for this job
  if (!eventTracker.has(jobId)) {
    return new Response(
      JSON.stringify({
        error: "No stream recovery data available for this job",
        recovery_available: false,
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Get events to replay
  const events = lastEventId
    ? eventTracker.getEventsSince(jobId, lastEventId)
    : eventTracker.getAllEvents(jobId);

  // Create SSE stream to replay events
  const sse = createSSEEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let streamClosed = false;

      const safeClose = () => {
        if (!streamClosed) {
          streamClosed = true;
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      };

      try {
        // Send recovery start event
        controller.enqueue(
          sse.encode(
            {
              event: "progress",
              data: {
                batch: 0,
                total: 0,
                scenes: 0,
                message: `Recovering stream: ${events.length} events to replay...`,
              },
            },
            `${jobId}-recovery-start`
          )
        );

        // Replay missed events
        for (const trackedEvent of events) {
          if (streamClosed) break;
          controller.enqueue(sse.encode(trackedEvent.event, trackedEvent.eventId));
          // Small delay between events to not overwhelm client
          await new Promise(r => setTimeout(r, UI_SSE_REPLAY_DELAY_MS));
        }

        // Send recovery complete event
        controller.enqueue(
          sse.encode(
            {
              event: "progress",
              data: {
                batch: 0,
                total: 0,
                scenes: 0,
                message: "Stream recovery complete. Reconnect to live stream for new events.",
              },
            },
            `${jobId}-recovery-complete`
          )
        );
      } catch (error) {
        console.error("[Stream Recovery] Error replaying events:", error);
      } finally {
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Recovery-Events": String(events.length),
    },
  });
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
