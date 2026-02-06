/**
 * Prompt API Log Helpers
 * Factory functions for creating GeminiLogEntry objects
 * Extracted from workflows.ts to eliminate 8 inline log constructions
 */

import type { GeminiLogEntry, GeminiResponse } from "@/lib/prompt/types";

interface LogRequestInfo {
  model: string;
  body: string;
  promptLength: number;
  videoUrl?: string;
}

interface LogMeta {
  model: string;
  promptLength: number;
  responseLength: number;
  durationMs: number;
  retries: number;
  tokens?: { prompt: number; candidates: number; total: number };
}

/**
 * Create a pending log entry before an API call
 */
export function createPendingLog(
  id: string,
  phase: GeminiLogEntry["phase"],
  request: LogRequestInfo,
  batchNumber?: number,
): GeminiLogEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    phase,
    ...(batchNumber !== undefined && { batchNumber }),
    status: "pending",
    request: {
      model: request.model,
      body: request.body,
      promptLength: request.promptLength,
      ...(request.videoUrl && { videoUrl: request.videoUrl }),
    },
    response: { success: false, body: "", responseLength: 0, parsedSummary: "awaiting response..." },
    timing: { durationMs: 0, retries: 0 },
  };
}

/**
 * Create a completed log entry after a successful API call
 */
export function createCompletedLog(
  id: string,
  phase: GeminiLogEntry["phase"],
  request: LogRequestInfo,
  response: GeminiResponse,
  meta: LogMeta,
  parsedSummary: string,
  batchNumber?: number,
  parsedItemCount?: number,
): GeminiLogEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    phase,
    ...(batchNumber !== undefined && { batchNumber }),
    status: "completed",
    request: {
      model: meta.model,
      body: request.body,
      promptLength: meta.promptLength,
      ...(request.videoUrl && { videoUrl: request.videoUrl }),
    },
    response: {
      success: true,
      finishReason: response.candidates?.[0]?.finishReason,
      body: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
      responseLength: meta.responseLength,
      ...(parsedItemCount !== undefined && { parsedItemCount }),
      parsedSummary,
    },
    timing: { durationMs: meta.durationMs, retries: meta.retries },
    ...(meta.tokens && { tokens: meta.tokens }),
  };
}

/**
 * Create an error log entry for a failed API call
 */
export function createErrorLog(
  id: string,
  phase: GeminiLogEntry["phase"],
  errorType: string,
  errorMessage: string,
  request: Partial<LogRequestInfo>,
  batchNumber?: number,
  durationMs?: number,
): GeminiLogEntry {
  return {
    id,
    timestamp: new Date().toISOString(),
    phase,
    ...(batchNumber !== undefined && { batchNumber }),
    status: "completed",
    error: { type: errorType, message: errorMessage },
    request: {
      model: request.model || "unknown",
      body: request.body || "",
      promptLength: request.promptLength || 0,
      ...(request.videoUrl && { videoUrl: request.videoUrl }),
    },
    response: {
      success: false,
      body: "",
      responseLength: 0,
      parsedSummary: `Error: ${errorMessage}`,
    },
    timing: { durationMs: durationMs || 0, retries: 0 },
  };
}
