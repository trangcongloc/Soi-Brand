/**
 * VEO Pipeline - Gemini API client
 */

import {
  GeminiRequestBody,
  GeminiResponse,
  GeminiApiError,
  Scene,
  VeoErrorType,
} from "./types";

const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_TIMEOUT_MS = 300000; // 5 minutes
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

/**
 * Get Gemini API URL for a model
 */
function getGeminiApiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/**
 * Map error to VeoErrorType
 */
export function mapErrorToType(error: GeminiApiError): VeoErrorType {
  if (error.status === 429) return "GEMINI_RATE_LIMIT";
  if (error.status === 403) return "GEMINI_QUOTA";
  if (error.status && error.status >= 400 && error.status < 500)
    return "GEMINI_API_ERROR";
  if (error.status && error.status >= 500) return "GEMINI_API_ERROR";
  if (error.name === "AbortError") return "TIMEOUT";
  if (error.message?.includes("fetch")) return "NETWORK_ERROR";
  return "UNKNOWN_ERROR";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: GeminiApiError): boolean {
  // Don't retry on client errors (4xx) except rate limiting (429)
  if (
    error.status &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 429
  ) {
    return false;
  }
  return true;
}

/**
 * Call the Gemini API with a request body
 */
export async function callGeminiAPI(
  requestBody: GeminiRequestBody,
  options: {
    apiKey: string;
    model?: string;
    timeoutMs?: number;
  }
): Promise<GeminiResponse> {
  const { apiKey, model = DEFAULT_MODEL, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  if (!apiKey) {
    const error = new Error("Gemini API key is required") as GeminiApiError;
    error.status = 401;
    throw error;
  }

  const url = getGeminiApiUrl(model);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
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
        `Gemini API error: ${response.status} ${response.statusText}`
      ) as GeminiApiError;
      error.response = errorData as GeminiApiError["response"];
      error.status = response.status;
      throw error;
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse Gemini API response and extract JSON content
 */
export function parseGeminiResponse(response: GeminiResponse): Scene[] {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates in response");
  }

  const content = candidates[0].content;
  if (!content || !content.parts || content.parts.length === 0) {
    throw new Error("No content parts in response");
  }

  const text = content.parts[0].text;

  try {
    return JSON.parse(text) as Scene[];
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as Scene[];
    }
    throw new Error("Failed to parse JSON from response");
  }
}

/**
 * Call Gemini API with retry logic
 */
export async function callGeminiAPIWithRetry(
  requestBody: GeminiRequestBody,
  options: {
    apiKey: string;
    model?: string;
    timeoutMs?: number;
    maxRetries?: number;
    baseDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<GeminiResponse> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    onRetry,
    ...callOptions
  } = options;

  let lastError: GeminiApiError | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callGeminiAPI(requestBody, callOptions);
    } catch (err) {
      lastError = err as GeminiApiError;

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        onRetry?.(attempt + 1, lastError);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Generate scenes from a video URL (direct mode)
 */
export async function generateScenesDirect(
  requestBody: GeminiRequestBody,
  options: {
    apiKey: string;
    model?: string;
    onProgress?: (message: string) => void;
  }
): Promise<Scene[]> {
  const { apiKey, model, onProgress } = options;

  onProgress?.("Sending request to Gemini API...");

  const response = await callGeminiAPIWithRetry(requestBody, {
    apiKey,
    model,
    onRetry: (attempt) => {
      onProgress?.(`Retry ${attempt}...`);
    },
  });

  onProgress?.("Parsing response...");

  return parseGeminiResponse(response);
}

/**
 * Generate scenes with batching (hybrid mode)
 */
export async function generateScenesHybrid(
  buildRequestFn: (batchNum: number) => GeminiRequestBody,
  options: {
    apiKey: string;
    model?: string;
    totalBatches: number;
    startBatch?: number;
    delayBetweenBatches?: number;
    onBatchStart?: (batchNum: number, totalBatches: number) => void;
    onBatchComplete?: (
      batchNum: number,
      scenes: Scene[],
      totalScenes: number
    ) => void;
    onError?: (batchNum: number, error: Error) => void;
  }
): Promise<{
  scenes: Scene[];
  failedBatch?: number;
  error?: Error;
}> {
  const {
    apiKey,
    model,
    totalBatches,
    startBatch = 0,
    delayBetweenBatches = 2000,
    onBatchStart,
    onBatchComplete,
    onError,
  } = options;

  const allScenes: Scene[] = [];

  for (let batchNum = startBatch; batchNum < totalBatches; batchNum++) {
    onBatchStart?.(batchNum + 1, totalBatches);

    try {
      const requestBody = buildRequestFn(batchNum);

      const response = await callGeminiAPIWithRetry(requestBody, {
        apiKey,
        model,
      });

      const batchScenes = parseGeminiResponse(response);

      if (Array.isArray(batchScenes)) {
        allScenes.push(...batchScenes);
        onBatchComplete?.(batchNum + 1, batchScenes, allScenes.length);
      }

      // Delay between batches (except for last batch)
      if (batchNum < totalBatches - 1) {
        await new Promise((r) => setTimeout(r, delayBetweenBatches));
      }
    } catch (err) {
      const error = err as Error;
      onError?.(batchNum + 1, error);
      return {
        scenes: allScenes,
        failedBatch: batchNum + 1,
        error,
      };
    }
  }

  return { scenes: allScenes };
}

/**
 * Extract character registry from scenes
 */
export function extractCharacterRegistry(
  scenes: Scene[]
): Record<string, string> {
  const characters: Record<string, string> = {};

  for (const scene of scenes) {
    if (scene.character && scene.character.toLowerCase() !== "none") {
      const match = scene.character.match(/^([^-]+)/);
      if (match) {
        const name = match[1].trim();
        if (!characters[name]) {
          characters[name] = scene.character;
        }
      }
    }
  }

  return characters;
}
