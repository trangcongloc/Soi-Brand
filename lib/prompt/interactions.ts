/**
 * Gemini Interactions API Client
 *
 * Provides:
 * - Video analysis with native timestamped scene segmentation
 * - Multi-turn chat sessions with server-side state
 * - Streaming responses with event tracking
 * - Session management for batch continuity
 */

import {
  InteractionEvent,
  InteractionOptions,
  InteractionSession,
  GeminiApiError,
} from "./types";

import {
  INTERACTIONS_API_URL,
  INTERACTIONS_MODEL,
  DEFAULT_API_TIMEOUT_MS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_BASE_DELAY_MS,
  DEFAULT_MAX_RETRY_DELAY_MS,
} from "./constants";

import { logger } from "@/lib/logger";

// ============================================================================
// Session Management
// ============================================================================

/**
 * In-memory session storage
 * Maps jobId to InteractionSession
 */
const sessions = new Map<string, InteractionSession>();

/**
 * Start a new interaction session for a job
 */
export function startSession(jobId: string): InteractionSession {
  const session: InteractionSession = {
    jobId,
    currentInteractionId: null,
    batchCount: 0,
    createdAt: Date.now(),
  };
  sessions.set(jobId, session);
  return session;
}

/**
 * Get session for a job
 */
export function getSession(jobId: string): InteractionSession | undefined {
  return sessions.get(jobId);
}

/**
 * Update session with new interaction ID
 */
export function updateSession(jobId: string, interactionId: string): void {
  const session = sessions.get(jobId);
  if (session) {
    session.currentInteractionId = interactionId;
    session.batchCount++;
  }
}

/**
 * Close and cleanup session
 */
export function closeSession(jobId: string): void {
  sessions.delete(jobId);
}

// ============================================================================
// SSE Parser for Gemini Streams
// ============================================================================

/**
 * Parse SSE stream from Gemini Interactions API
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<InteractionEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

      let currentEvent: Partial<InteractionEvent> = {};

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            continue;
          }
          try {
            const parsed = JSON.parse(data) as InteractionEvent;
            yield parsed;
          } catch (e) {
            // Try to parse as partial JSON or continue
            logger.warn("Failed to parse SSE data", { data, error: e });
          }
        } else if (line.startsWith("id: ")) {
          currentEvent.event_id = line.slice(4);
        } else if (line === "") {
          // Empty line indicates end of event
          currentEvent = {};
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateRetryDelay(
  attempt: number,
  baseDelayMs: number = DEFAULT_RETRY_BASE_DELAY_MS,
  maxDelayMs: number = DEFAULT_MAX_RETRY_DELAY_MS
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);
  return Math.round(cappedDelay + jitter);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: GeminiApiError): boolean {
  if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
    return false;
  }
  return true;
}

// ============================================================================
// Interactions API Client
// ============================================================================

/**
 * Build request body for Interactions API
 */
function buildInteractionRequest(options: InteractionOptions): Record<string, unknown> {
  const input: Array<{ type: string; [key: string]: unknown }> = [];

  // Add video if provided
  if (options.videoUrl) {
    input.push({
      type: "video",
      fileUri: options.videoUrl,
      mimeType: "video/*",
    });
  }

  // Add text prompt
  input.push({
    type: "text",
    text: options.prompt,
  });

  const body: Record<string, unknown> = {
    model: options.model ?? INTERACTIONS_MODEL,
    input,
    stream: options.stream ?? false,
  };

  // Add previous interaction ID for multi-turn continuity
  if (options.previousInteractionId) {
    body.previous_interaction_id = options.previousInteractionId;
  }

  return body;
}

/**
 * Create a video interaction (non-streaming)
 * Used for single-shot video analysis requests
 */
export async function createInteraction(
  options: InteractionOptions
): Promise<{ response: InteractionEvent; interactionId: string }> {
  const requestBody = buildInteractionRequest({ ...options, stream: false });

  const response = await fetch(INTERACTIONS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": options.apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: Record<string, unknown>;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { raw: errorText };
    }

    const error = new Error(
      `Interactions API error: ${response.status} ${response.statusText}`
    ) as GeminiApiError;
    error.response = errorData as GeminiApiError["response"];
    error.status = response.status;
    throw error;
  }

  const data = await response.json() as InteractionEvent;
  const interactionId = data.interaction?.id ?? "";

  return { response: data, interactionId };
}

/**
 * Create a streaming video interaction
 * Returns an async generator of interaction events
 */
export async function* createInteractionStream(
  options: InteractionOptions
): AsyncGenerator<InteractionEvent> {
  const requestBody = buildInteractionRequest({ ...options, stream: true });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_API_TIMEOUT_MS);

  try {
    const response = await fetch(INTERACTIONS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Record<string, unknown>;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }

      const error = new Error(
        `Interactions API error: ${response.status} ${response.statusText}`
      ) as GeminiApiError;
      error.response = errorData as GeminiApiError["response"];
      error.status = response.status;
      throw error;
    }

    if (!response.body) {
      throw new Error("No response body from Interactions API");
    }

    // Parse and yield SSE events
    for await (const event of parseSSEStream(response.body)) {
      yield event;
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Create interaction with retry logic
 */
export async function createInteractionWithRetry(
  options: InteractionOptions,
  retryOptions?: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<{ response: InteractionEvent; interactionId: string }> {
  const maxRetries = retryOptions?.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastError: GeminiApiError | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await createInteraction(options);
    } catch (err) {
      lastError = err as GeminiApiError;

      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = calculateRetryDelay(attempt);
        retryOptions?.onRetry?.(attempt + 1, lastError);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Multi-turn Session Continuity
// ============================================================================

/**
 * Continue an interaction session with a new prompt
 * Uses previous_interaction_id for server-side context retention
 */
export async function continueSession(
  jobId: string,
  prompt: string,
  options: Omit<InteractionOptions, "prompt" | "previousInteractionId">
): Promise<{ response: InteractionEvent; interactionId: string }> {
  const session = getSession(jobId);
  if (!session) {
    throw new Error(`No session found for job ${jobId}`);
  }

  const result = await createInteractionWithRetry({
    ...options,
    prompt,
    previousInteractionId: session.currentInteractionId ?? undefined,
  });

  // Update session with new interaction ID
  updateSession(jobId, result.interactionId);

  return result;
}

/**
 * Continue an interaction session with streaming
 */
export async function* continueSessionStream(
  jobId: string,
  prompt: string,
  options: Omit<InteractionOptions, "prompt" | "previousInteractionId">
): AsyncGenerator<InteractionEvent> {
  const session = getSession(jobId);
  if (!session) {
    throw new Error(`No session found for job ${jobId}`);
  }

  let newInteractionId: string | null = null;

  for await (const event of createInteractionStream({
    ...options,
    prompt,
    previousInteractionId: session.currentInteractionId ?? undefined,
  })) {
    // Capture interaction ID from start event
    if (event.event_type === "interaction.start" && event.interaction?.id) {
      newInteractionId = event.interaction.id;
    }

    yield event;

    // Update session when interaction completes
    if (event.event_type === "interaction.complete" && newInteractionId) {
      updateSession(jobId, newInteractionId);
    }
  }
}

// ============================================================================
// Video Analysis with Interactions API
// ============================================================================

/**
 * Extract scenes from video using Interactions API
 * Uses native video understanding for better timestamp extraction
 */
export async function* extractScenesWithInteractions(
  videoUrl: string,
  prompt: string,
  options: {
    apiKey: string;
    model?: string;
    jobId?: string;
    onProgress?: (message: string) => void;
  }
): AsyncGenerator<InteractionEvent> {
  const { apiKey, model, jobId, onProgress } = options;

  onProgress?.("Starting video analysis with Interactions API...");

  // Start or continue session if jobId provided
  if (jobId) {
    let session = getSession(jobId);
    if (!session) {
      session = startSession(jobId);
    }

    // Use session continuity if we have a previous interaction
    if (session.currentInteractionId) {
      onProgress?.("Continuing with previous interaction context...");
      yield* continueSessionStream(jobId, prompt, { apiKey, model });
      return;
    }
  }

  // First interaction with video
  for await (const event of createInteractionStream({
    apiKey,
    model,
    videoUrl,
    prompt,
    stream: true,
  })) {
    // Track interaction ID for future use
    if (jobId && event.event_type === "interaction.start" && event.interaction?.id) {
      updateSession(jobId, event.interaction.id);
    }

    yield event;
  }
}

// ============================================================================
// Feature Flag Check
// ============================================================================

/**
 * Check if Interactions API should be used
 * Currently behind feature flag for gradual rollout
 */
export function shouldUseInteractionsAPI(options?: {
  featureFlag?: boolean;
  forceInteractions?: boolean;
}): boolean {
  // Check explicit force flag
  if (options?.forceInteractions) {
    return true;
  }

  // Check feature flag (defaults to false)
  return options?.featureFlag ?? false;
}

/**
 * Get interaction history for debugging
 */
export function getSessionInfo(jobId: string): {
  exists: boolean;
  interactionId: string | null;
  batchCount: number;
} {
  const session = sessions.get(jobId);
  return {
    exists: !!session,
    interactionId: session?.currentInteractionId ?? null,
    batchCount: session?.batchCount ?? 0,
  };
}
