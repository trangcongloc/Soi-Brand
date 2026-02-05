/**
 * Prompt Pipeline - Gemini API client
 */

import {
  GeminiRequestBody,
  GeminiResponse,
  GeminiApiError,
  GeminiLogEntry,
  Scene,
  PromptErrorType,
  CharacterRegistry,
  CharacterSkeleton,
  CharacterExtractionResult,
  ColorProfileExtractionResult,
} from "./types";

import {
  buildCharacterExtractionPrompt,
  parseCharacterExtractionResponse,
  buildColorProfileExtractionPrompt,
  parseColorProfileResponse,
} from "./prompts";

import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_API_TIMEOUT_MS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_BASE_DELAY_MS,
  DEFAULT_MAX_RETRY_DELAY_MS,
  GEMINI_API_BASE_URL,
} from "./constants";

/**
 * Get Gemini API URL for a model
 */
function getGeminiApiUrl(model: string): string {
  return `${GEMINI_API_BASE_URL}${model}:generateContent`;
}

/**
 * Map error to PromptErrorType
 */
export function mapErrorToType(error: GeminiApiError): PromptErrorType {
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
  const { apiKey, model = DEFAULT_GEMINI_MODEL, timeoutMs = DEFAULT_API_TIMEOUT_MS } = options;

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

    const jsonResponse = await response.json();

    return jsonResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse Gemini API response and extract JSON content
 */
export function parseGeminiResponse(response: GeminiResponse): Scene[] {
  // Check for candidates
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error(
      "No candidates in response. This may indicate a safety filter block, API error, or invalid request."
    );
  }

  const candidate = candidates[0];
  const finishReason = candidate.finishReason;

  // Check for blocked content or safety issues
  if (finishReason === "SAFETY") {
    throw new Error(
      `Content blocked by Gemini safety filters. Finish reason: SAFETY. ` +
      `This may be due to video content policy violations.`
    );
  }

  if (finishReason === "RECITATION") {
    throw new Error(
      `Content blocked by Gemini recitation policy. The generated content may contain ` +
      `significant portions of copyrighted material.`
    );
  }

  // Check for content and parts
  const content = candidate.content;
  if (!content || !content.parts || content.parts.length === 0) {
    // This is a transient API error - mark as retryable
    const error = new Error(
      `No content parts in response. Finish reason: ${finishReason || "UNKNOWN"}. ` +
      `This may indicate a transient API error. Retrying...`
    ) as GeminiApiError;
    error.status = 503; // Service unavailable - will be retried
    throw error;
  }

  const text = content.parts[0].text;

  // Check if text is empty
  if (!text || text.trim().length === 0) {
    throw new Error(
      `Empty text in Gemini response. Finish reason: ${finishReason || "UNKNOWN"}`
    );
  }

  // Try direct JSON parse first
  try {
    return JSON.parse(text) as Scene[];
  } catch (directError) {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]) as Scene[];
      } catch (markdownError) {
        // Continue to next extraction attempt
      }
    }

    // Try to find and extract any JSON array in the text
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as Scene[];
      } catch (arrayError) {
        // Continue to error throw
      }
    }

    // Throw detailed error
    const preview = text.substring(0, 500);
    const parseError = directError instanceof Error ? directError.message : String(directError);
    throw new Error(
      `Failed to parse JSON from response. Parse error: ${parseError}. ` +
      `Response starts with: ${preview.substring(0, 100)}...`
    );
  }
}

/**
 * Metadata returned alongside a Gemini API response.
 * Captures timing, token usage, and request/response previews for logging.
 */
export interface GeminiCallMeta {
  promptPreview: string;
  promptLength: number;
  responsePreview: string;
  responseLength: number;
  durationMs: number;
  retries: number;
  model: string;
  tokens?: { prompt: number; candidates: number; total: number };
}

/**
 * API-005 FIX: Calculate delay with exponential backoff, jitter, and max cap
 * Matches the pattern from lib/retry.ts for consistency
 */
function calculateRetryDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number = DEFAULT_MAX_RETRY_DELAY_MS
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (±20%) to prevent thundering herd
  const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);

  return Math.round(cappedDelay + jitter);
}

/**
 * Call Gemini API with retry logic.
 * Returns both the response and metadata for logging.
 *
 * API-005 FIX: Now includes jitter and max delay cap to prevent
 * thundering herd and unbounded retry delays.
 */
export async function callGeminiAPIWithRetry(
  requestBody: GeminiRequestBody,
  options: {
    apiKey: string;
    model?: string;
    timeoutMs?: number;
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<{ response: GeminiResponse; meta: GeminiCallMeta }> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_RETRY_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_RETRY_DELAY_MS,
    onRetry,
    ...callOptions
  } = options;

  const model = options.model || DEFAULT_GEMINI_MODEL;
  let lastError: GeminiApiError | undefined;
  let retryCount = 0;
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await callGeminiAPI(requestBody, callOptions);
      const durationMs = Date.now() - startTime;

      // Extract token usage from response
      const usage = response.usageMetadata;
      const tokens = usage
        ? {
            prompt: usage.promptTokenCount,
            candidates: usage.candidatesTokenCount,
            total: usage.totalTokenCount,
          }
        : undefined;

      // Build request preview from body
      const bodyStr = JSON.stringify(requestBody);
      const responseStr = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const meta: GeminiCallMeta = {
        promptPreview: bodyStr.slice(0, 200),
        promptLength: bodyStr.length,
        responsePreview: responseStr.slice(0, 200),
        responseLength: responseStr.length,
        durationMs,
        retries: retryCount,
        model,
        tokens,
      };

      return { response, meta };
    } catch (err) {
      lastError = err as GeminiApiError;
      retryCount = attempt + 1;

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        // API-005 FIX: Use calculateRetryDelay with jitter and max cap
        const delay = calculateRetryDelay(attempt, baseDelayMs, maxDelayMs);
        onRetry?.(attempt + 1, lastError);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Parse a character string into a CharacterSkeleton if possible
 * Format: "Name - gender, age, ethnicity, bodyType, faceShape, hair, facialHair, distinctiveFeatures, baseOutfit"
 */
function parseCharacterSkeleton(characterStr: string): CharacterSkeleton | null {
  if (!characterStr || characterStr.toLowerCase() === "none") {
    return null;
  }

  // Split on first " - " delimiter (supports hyphenated names like "Jean-Paul")
  const separatorIdx = characterStr.indexOf(" - ");
  if (separatorIdx === -1) {
    return null;
  }

  const name = characterStr.slice(0, separatorIdx).trim();
  const tagsPart = characterStr.slice(separatorIdx + 3).trim();
  const tags = tagsPart.split(",").map(t => t.trim().toLowerCase());

  // Try to identify skeleton fields from tags
  const skeleton: CharacterSkeleton = {
    name,
    gender: "",
    age: "",
    ethnicity: "",
    bodyType: "",
    faceShape: "",
    hair: "",
    baseOutfit: "",
  };

  // Common patterns for each field
  const genderPatterns = /^(male|female|man|woman|boy|girl|non-binary|nb)$/i;
  const agePatterns = /^(\d+s?|teens?|twenties|thirties|forties|fifties|sixties|seventies|young|middle-?aged|elderly|older|senior|\d+-\d+)$/i;
  const ethnicityPatterns = /(asian|caucasian|african|latino|latina|hispanic|indian|middle eastern|mixed|white|black|olive skin|pale skin|tan skin|dark skin|fair skin)/i;
  const bodyPatterns = /(slim|slender|athletic|muscular|stocky|heavyset|petite|tall|short|medium build|average build|curvy|fit)/i;
  const facePatterns = /(round face|oval face|square jaw|heart-?shaped|diamond|oblong|rectangle|angular features|sharp features|soft features)/i;
  const hairPatterns = /(bald|buzz|short|medium|long|very long|curly|wavy|straight|coily|black hair|brown hair|blonde|gray|grey|white hair|red hair|auburn|chestnut|brunette|salt-?and-?pepper|highlighted)/i;
  const facialHairPatterns = /(beard|goatee|mustache|clean-?shaven|stubble|5 o'?clock shadow|sideburns)/i;

  const remainingTags: string[] = [];

  for (const tag of tags) {
    if (genderPatterns.test(tag) && !skeleton.gender) {
      skeleton.gender = tag;
    } else if (agePatterns.test(tag) && !skeleton.age) {
      skeleton.age = tag;
    } else if (ethnicityPatterns.test(tag) && !skeleton.ethnicity) {
      skeleton.ethnicity = skeleton.ethnicity ? `${skeleton.ethnicity}, ${tag}` : tag;
    } else if (bodyPatterns.test(tag) && !skeleton.bodyType) {
      skeleton.bodyType = tag;
    } else if (facePatterns.test(tag) && !skeleton.faceShape) {
      skeleton.faceShape = tag;
    } else if (hairPatterns.test(tag) && !skeleton.hair) {
      skeleton.hair = skeleton.hair ? `${skeleton.hair}, ${tag}` : tag;
    } else if (facialHairPatterns.test(tag)) {
      skeleton.facialHair = skeleton.facialHair ? `${skeleton.facialHair}, ${tag}` : tag;
    } else {
      remainingTags.push(tag);
    }
  }

  // Remaining tags go to baseOutfit or distinctiveFeatures
  const outfitKeywords = ["shirt", "coat", "jacket", "pants", "dress", "suit", "apron", "uniform", "blazer", "jeans", "shorts", "skirt", "blouse", "sweater", "hoodie"];
  const outfitTags: string[] = [];
  const featureTags: string[] = [];

  for (const tag of remainingTags) {
    if (outfitKeywords.some(k => tag.includes(k))) {
      outfitTags.push(tag);
    } else {
      featureTags.push(tag);
    }
  }

  if (outfitTags.length > 0) {
    skeleton.baseOutfit = outfitTags.join(", ");
  }

  if (featureTags.length > 0) {
    skeleton.distinctiveFeatures = featureTags.join(", ");
  }

  // Only return skeleton if we could extract meaningful data
  if (skeleton.gender || skeleton.age || skeleton.hair || skeleton.baseOutfit) {
    return skeleton;
  }

  return null;
}

/**
 * Extract character registry from scenes
 * Returns a registry with both legacy string and parsed skeleton formats
 */
export function extractCharacterRegistry(
  scenes: Scene[]
): CharacterRegistry {
  const characters: CharacterRegistry = {};

  for (const scene of scenes) {
    if (scene.character && scene.character.toLowerCase() !== "none") {
      const match = scene.character.match(/^([^-]+)/);
      if (match) {
        const name = match[1].trim();
        if (!characters[name]) {
          // Try to parse as skeleton; fall back to string
          const skeleton = parseCharacterSkeleton(scene.character);
          if (skeleton) {
            characters[name] = skeleton;
          } else {
            characters[name] = scene.character;
          }
        }
      }
    }
  }

  return characters;
}

/**
 * Get character description string from registry entry
 * Works with both legacy strings and CharacterSkeleton objects
 */
export function getCharacterDescription(charData: string | CharacterSkeleton): string {
  if (typeof charData === "string") {
    return charData;
  }

  // Format CharacterSkeleton as a description string
  const parts = [charData.name];

  if (charData.gender) parts.push(charData.gender);
  if (charData.age) parts.push(charData.age);
  if (charData.ethnicity) parts.push(charData.ethnicity);
  if (charData.bodyType) parts.push(charData.bodyType);
  if (charData.faceShape) parts.push(charData.faceShape);
  if (charData.hair) parts.push(charData.hair);
  if (charData.facialHair) parts.push(charData.facialHair);
  if (charData.distinctiveFeatures) parts.push(charData.distinctiveFeatures);
  if (charData.baseOutfit) parts.push(charData.baseOutfit);

  return parts.join(", ");
}

// ============================================================================
// Phase 1: Character Extraction (BEFORE scene generation)
// ============================================================================

/**
 * Extract all characters from video BEFORE scene generation (Phase 1)
 * Returns a character registry with consistent naming for use in Phase 2
 *
 * This two-phase approach ensures:
 * - Characters are identified upfront with consistent names
 * - No duplicate names (e.g., "Chef" vs "Chef Marco")
 * - No "No visible characters" entries
 * - Background/environment is captured separately
 */
export async function extractCharactersFromVideo(
  videoUrl: string,
  options: {
    apiKey: string;
    model?: string;
    startTime?: string;
    endTime?: string;
    onProgress?: (message: string) => void;
    onLog?: (entry: GeminiLogEntry) => void;
    onLogUpdate?: (entry: GeminiLogEntry) => void;
  }
): Promise<CharacterExtractionResult> {
  const { apiKey, model, startTime, endTime, onProgress, onLog, onLogUpdate } = options;

  onProgress?.("Phase 1: Extracting characters from video...");

  const requestBody = buildCharacterExtractionPrompt({
    videoUrl,
    startTime,
    endTime,
  });

  // Create log ID for tracking
  const logId = `log_phase1_${Date.now()}`;

  // Emit pending log entry BEFORE API call
  if (onLog) {
    const pendingEntry: GeminiLogEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      phase: "phase-1",
      status: "pending",
      request: {
        model: model || "gemini-2.0-flash-exp",
        body: JSON.stringify(requestBody),
        promptLength: JSON.stringify(requestBody).length,
        videoUrl,
      },
      response: {
        success: false,
        body: "",
        responseLength: 0,
        parsedSummary: "Sending request...",
      },
      timing: { durationMs: 0, retries: 0 },
    };
    onLog(pendingEntry);
  }

  const { response, meta } = await callGeminiAPIWithRetry(requestBody, {
    apiKey,
    model,
    onRetry: (attempt) => {
      onProgress?.(`Phase 1 retry ${attempt}...`);
    },
  });

  onProgress?.("Phase 1: Parsing character data...");

  const result = parseCharacterExtractionResponse(response);

  // Emit completed log entry AFTER API call
  if (onLogUpdate) {
    const completedEntry: GeminiLogEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      phase: "phase-1",
      status: "completed",
      request: {
        model: meta.model,
        body: JSON.stringify(requestBody),
        promptLength: meta.promptLength,
        videoUrl,
      },
      response: {
        success: true,
        finishReason: response.candidates?.[0]?.finishReason,
        body: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
        responseLength: meta.responseLength,
        parsedItemCount: result.characters.length,
        parsedSummary: `${result.characters.length} characters`,
      },
      timing: { durationMs: meta.durationMs, retries: meta.retries },
      tokens: meta.tokens,
    };
    onLogUpdate(completedEntry);
  }

  onProgress?.(
    `Phase 1 complete: Found ${result.characters.length} character(s)`
  );

  return result;
}

/**
 * Convert CharacterExtractionResult to CharacterRegistry format
 * Used for backward compatibility with existing code
 */
export function extractionResultToRegistry(
  result: CharacterExtractionResult
): CharacterRegistry {
  const registry: CharacterRegistry = {};

  for (const char of result.characters) {
    registry[char.name] = char;
  }

  return registry;
}

// ============================================================================
// Phase 0: Color Profile Extraction (BEFORE character extraction and scenes)
// ============================================================================

/**
 * Extract cinematic color profile from video BEFORE character extraction (Phase 0)
 * Returns a color profile with consistent values for use in Phase 2
 *
 * This three-phase approach ensures:
 * - Color palette is identified upfront with exact hex values
 * - Consistent color temperature, contrast, and mood across all scenes
 * - Film stock reference for visual consistency
 */
export async function extractColorProfileFromVideo(
  videoUrl: string,
  options: {
    apiKey: string;
    model?: string;
    startTime?: string;
    endTime?: string;
    onProgress?: (message: string) => void;
    onLog?: (entry: GeminiLogEntry) => void;
    onLogUpdate?: (entry: GeminiLogEntry) => void;
  }
): Promise<ColorProfileExtractionResult> {
  const { apiKey, model, startTime, endTime, onProgress, onLog, onLogUpdate } = options;

  onProgress?.("Phase 0: Extracting cinematic color profile from video...");

  const requestBody = buildColorProfileExtractionPrompt({
    videoUrl,
    startTime,
    endTime,
  });

  // Create log ID for tracking
  const logId = `log_phase0_${Date.now()}`;

  // Emit pending log entry BEFORE API call
  if (onLog) {
    const pendingEntry: GeminiLogEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      phase: "phase-0",
      status: "pending",
      request: {
        model: model || "gemini-2.0-flash-exp",
        body: JSON.stringify(requestBody),
        promptLength: JSON.stringify(requestBody).length,
        videoUrl,
      },
      response: {
        success: false,
        body: "",
        responseLength: 0,
        parsedSummary: "Sending request...",
      },
      timing: { durationMs: 0, retries: 0 },
    };
    onLog(pendingEntry);
  }

  const { response, meta } = await callGeminiAPIWithRetry(requestBody, {
    apiKey,
    model,
    onRetry: (attempt) => {
      onProgress?.(`Phase 0 retry ${attempt}...`);
    },
  });

  onProgress?.("Phase 0: Parsing color profile data...");

  const result = parseColorProfileResponse(response);

  // Emit completed log entry AFTER API call
  if (onLogUpdate) {
    const completedEntry: GeminiLogEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      phase: "phase-0",
      status: "completed",
      request: {
        model: meta.model,
        body: JSON.stringify(requestBody),
        promptLength: meta.promptLength,
        videoUrl,
      },
      response: {
        success: true,
        finishReason: response.candidates?.[0]?.finishReason,
        body: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
        responseLength: meta.responseLength,
        parsedItemCount: result.profile.dominantColors.length,
        parsedSummary: `${result.profile.dominantColors.length} colors, ${(result.confidence * 100).toFixed(0)}% confidence`,
      },
      timing: { durationMs: meta.durationMs, retries: meta.retries },
      tokens: meta.tokens,
    };
    onLogUpdate(completedEntry);
  }

  onProgress?.(
    `Phase 0 complete: Extracted ${result.profile.dominantColors.length} dominant colors (confidence: ${(result.confidence * 100).toFixed(0)}%)`
  );

  return result;
}
