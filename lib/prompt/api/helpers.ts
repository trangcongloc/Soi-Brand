/**
 * Prompt API Helpers
 * SSE encoder, error mapping, and utility functions
 */

import { handleAPIError, type UnifiedErrorType } from "@/lib/error-handler";
import type {
  PromptSSEEvent,
  PromptErrorType,
  GeminiApiError,
  TrackedSSEEvent,
} from "@/lib/prompt/types";
import {
  BASE_STREAM_TIMEOUT_MS,
  STREAM_TIMEOUT_PER_SCENE_MS,
  MAX_STREAM_TIMEOUT_MS,
  MAX_RECOVERY_EVENTS,
  EVENT_ID_SEPARATOR,
} from "@/lib/prompt/constants";

const isDev = process.env.NODE_ENV === "development";

/**
 * SSE-003 FIX: Calculate dynamic stream timeout based on scene count
 * Longer videos need more time for processing
 */
export function calculateStreamTimeout(sceneCount: number): number {
  const dynamicTimeout = BASE_STREAM_TIMEOUT_MS + (sceneCount * STREAM_TIMEOUT_PER_SCENE_MS);
  return Math.min(dynamicTimeout, MAX_STREAM_TIMEOUT_MS);
}

/**
 * Map UnifiedErrorType to PromptErrorType
 * Converts general error types to VEO-specific error types
 */
export function mapToPromptErrorType(unifiedType: UnifiedErrorType): PromptErrorType {
  const mapping: Record<string, PromptErrorType> = {
    INVALID_URL: "INVALID_URL",
    GEMINI_API_ERROR: "GEMINI_API_ERROR",
    GEMINI_QUOTA: "GEMINI_QUOTA",
    GEMINI_RATE_LIMIT: "GEMINI_RATE_LIMIT",
    NETWORK_ERROR: "NETWORK_ERROR",
    PARSE_ERROR: "PARSE_ERROR",
    AI_PARSE_ERROR: "PARSE_ERROR",
    TIMEOUT: "TIMEOUT",
    YOUTUBE_QUOTA: "GEMINI_QUOTA",
    YOUTUBE_API_ERROR: "GEMINI_API_ERROR",
    RATE_LIMIT: "GEMINI_RATE_LIMIT",
    MODEL_OVERLOAD: "GEMINI_API_ERROR",
    API_CONFIG: "GEMINI_API_ERROR",
    CHANNEL_NOT_FOUND: "INVALID_URL",
    UNKNOWN: "UNKNOWN_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
  };

  return mapping[unifiedType] || "UNKNOWN_ERROR";
}

/**
 * Format error for SSE response with detailed info
 * Uses unified error handler for consistent error messages
 */
export function formatErrorMessage(error: unknown, context?: string): string {
  const errorResult = handleAPIError(error, context);
  let message = errorResult.message.en;

  if (isDev && typeof error === "object" && error !== null) {
    const geminiError = error as GeminiApiError;
    if (geminiError.status) {
      message += ` [${geminiError.status}]`;
    }
    if (geminiError.response?.error?.message) {
      message += ` - ${geminiError.response.error.message}`;
    }
  }

  return message;
}

/**
 * SSE Encoder for streaming events
 */
export interface SSEEncoder {
  encode: (event: PromptSSEEvent, eventId?: string) => Uint8Array;
  encodeKeepAlive: () => Uint8Array;
}

/**
 * Create SSE encoder for streaming events with optional event ID support
 */
export function createSSEEncoder(): SSEEncoder {
  const encoder = new TextEncoder();

  return {
    encode: (event: PromptSSEEvent, eventId?: string): Uint8Array => {
      const data = JSON.stringify(event);
      // Include event ID if provided (for stream recovery)
      const idLine = eventId ? `id: ${eventId}\n` : "";
      return encoder.encode(`${idLine}data: ${data}\n\n`);
    },
    encodeKeepAlive: (): Uint8Array => {
      return encoder.encode(`: keepalive\n\n`);
    },
  };
}

// ============================================================================
// Event ID Generation and Tracking
// ============================================================================

/**
 * Generate event ID for SSE stream recovery
 * Format: {jobId}-{batchNum}-{eventNum}
 */
export function generateEventId(jobId: string, batchNum: number, eventNum: number): string {
  return `${jobId}${EVENT_ID_SEPARATOR}${batchNum}${EVENT_ID_SEPARATOR}${eventNum}`;
}

/**
 * Parse event ID to extract job ID, batch number, and event number
 */
export function parseEventId(eventId: string): { jobId: string; batchNum: number; eventNum: number } | null {
  const parts = eventId.split(EVENT_ID_SEPARATOR);
  if (parts.length < 3) return null;

  // Job ID may contain dashes, so we need to reconstruct it
  const eventNum = parseInt(parts[parts.length - 1], 10);
  const batchNum = parseInt(parts[parts.length - 2], 10);
  const jobId = parts.slice(0, -2).join(EVENT_ID_SEPARATOR);

  if (isNaN(eventNum) || isNaN(batchNum)) return null;

  return { jobId, batchNum, eventNum };
}

/**
 * Event tracker for stream recovery
 * Stores recent events in memory keyed by job ID
 */
export class EventTracker {
  private events: Map<string, TrackedSSEEvent[]> = new Map();

  /**
   * Track an event for potential recovery
   */
  track(jobId: string, eventId: string, event: PromptSSEEvent): void {
    const jobEvents = this.events.get(jobId) ?? [];
    jobEvents.push({
      eventId,
      event,
      timestamp: Date.now(),
    });

    // Limit stored events per job to prevent memory bloat
    if (jobEvents.length > MAX_RECOVERY_EVENTS) {
      jobEvents.shift();
    }

    this.events.set(jobId, jobEvents);
  }

  /**
   * Get events since a given event ID
   */
  getEventsSince(jobId: string, lastEventId: string): TrackedSSEEvent[] {
    const jobEvents = this.events.get(jobId) ?? [];
    const lastEventIndex = jobEvents.findIndex(e => e.eventId === lastEventId);

    if (lastEventIndex === -1) {
      // Event not found - return all events (client may need to restart)
      return jobEvents;
    }

    // Return events after the last one client received
    return jobEvents.slice(lastEventIndex + 1);
  }

  /**
   * Get all events for a job
   */
  getAllEvents(jobId: string): TrackedSSEEvent[] {
    return this.events.get(jobId) ?? [];
  }

  /**
   * Clear events for a job (call when job completes)
   */
  clear(jobId: string): void {
    this.events.delete(jobId);
  }

  /**
   * Check if job has tracked events
   */
  has(jobId: string): boolean {
    return this.events.has(jobId) && (this.events.get(jobId)?.length ?? 0) > 0;
  }
}

// Global event tracker instance
export const eventTracker = new EventTracker();

/**
 * Create JSON error response
 */
export function createErrorResponse(
  type: PromptErrorType,
  message: string,
  retryable: boolean,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      event: "error",
      data: { type, message, retryable },
    }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Create rate limit error response with headers
 */
export function createRateLimitResponse(
  tier: "free" | "paid",
  limit: number,
  resetTime: number,
  remaining: number
): Response {
  const tierLabel = tier === "paid" ? "paid tier" : "free tier";
  return new Response(
    JSON.stringify({
      event: "error",
      data: {
        type: "RATE_LIMIT",
        message: `Rate limit exceeded for ${tierLabel} (${limit} requests per minute). Please try again later.`,
        retryable: true,
        tier,
        limit,
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetTime),
        "X-RateLimit-Tier": tier,
      },
    }
  );
}
