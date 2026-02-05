/**
 * Prompt API Helpers
 * SSE encoder, error mapping, and utility functions
 */

import { handleAPIError, type UnifiedErrorType } from "@/lib/error-handler";
import type { PromptSSEEvent, PromptErrorType, GeminiApiError } from "@/lib/prompt/types";
import {
  BASE_STREAM_TIMEOUT_MS,
  STREAM_TIMEOUT_PER_SCENE_MS,
  MAX_STREAM_TIMEOUT_MS,
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
  encode: (event: PromptSSEEvent) => Uint8Array;
  encodeKeepAlive: () => Uint8Array;
}

/**
 * Create SSE encoder for streaming events
 */
export function createSSEEncoder(): SSEEncoder {
  const encoder = new TextEncoder();

  return {
    encode: (event: PromptSSEEvent): Uint8Array => {
      const data = JSON.stringify(event);
      return encoder.encode(`data: ${data}\n\n`);
    },
    encodeKeepAlive: (): Uint8Array => {
      return encoder.encode(`: keepalive\n\n`);
    },
  };
}

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
