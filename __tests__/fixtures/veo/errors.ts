/**
 * VEO Test Fixtures - Error Scenario Fixtures
 * Pre-built error objects for testing error handling
 */

import type {
  VeoErrorType,
  VeoErrorEvent,
  GeminiApiError,
} from "@/lib/veo/types";

// ============================================================================
// Error Type Constants
// ============================================================================

export const ERROR_TYPES: Record<string, VeoErrorType> = {
  INVALID_URL: "INVALID_URL",
  GEMINI_API_ERROR: "GEMINI_API_ERROR",
  GEMINI_QUOTA: "GEMINI_QUOTA",
  GEMINI_RATE_LIMIT: "GEMINI_RATE_LIMIT",
  NETWORK_ERROR: "NETWORK_ERROR",
  PARSE_ERROR: "PARSE_ERROR",
  TIMEOUT: "TIMEOUT",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

// ============================================================================
// Gemini API Errors
// ============================================================================

/**
 * Quota exceeded error from Gemini
 */
export const geminiQuotaError: GeminiApiError = Object.assign(
  new Error("Resource has been exhausted (e.g. check quota)."),
  {
    status: 429,
    response: {
      error: {
        message: "Resource has been exhausted (e.g. check quota).",
        code: 429,
      },
      raw: JSON.stringify({
        error: {
          code: 429,
          message: "Resource has been exhausted (e.g. check quota).",
          status: "RESOURCE_EXHAUSTED",
        },
      }),
    },
  }
);

/**
 * Rate limit error from Gemini
 */
export const geminiRateLimitError: GeminiApiError = Object.assign(
  new Error("Too many requests. Please retry after a few seconds."),
  {
    status: 429,
    response: {
      error: {
        message: "Too many requests. Please retry after a few seconds.",
        code: 429,
      },
      raw: JSON.stringify({
        error: {
          code: 429,
          message: "Too many requests. Please retry after a few seconds.",
          status: "RATE_LIMIT_EXCEEDED",
        },
      }),
    },
  }
);

/**
 * Invalid API key error from Gemini
 */
export const geminiInvalidKeyError: GeminiApiError = Object.assign(
  new Error("API key not valid. Please pass a valid API key."),
  {
    status: 400,
    response: {
      error: {
        message: "API key not valid. Please pass a valid API key.",
        code: 400,
      },
      raw: JSON.stringify({
        error: {
          code: 400,
          message: "API key not valid. Please pass a valid API key.",
          status: "INVALID_ARGUMENT",
        },
      }),
    },
  }
);

/**
 * Internal server error from Gemini
 */
export const geminiServerError: GeminiApiError = Object.assign(
  new Error("An internal error has occurred."),
  {
    status: 500,
    response: {
      error: {
        message: "An internal error has occurred.",
        code: 500,
      },
      raw: JSON.stringify({
        error: {
          code: 500,
          message: "An internal error has occurred.",
          status: "INTERNAL",
        },
      }),
    },
  }
);

/**
 * Content blocked error from Gemini (safety filter)
 */
export const geminiContentBlockedError: GeminiApiError = Object.assign(
  new Error("Response was blocked due to safety settings."),
  {
    status: 400,
    response: {
      error: {
        message: "Response was blocked due to safety settings.",
        code: 400,
      },
      raw: JSON.stringify({
        error: {
          code: 400,
          message: "Response was blocked due to safety settings.",
          status: "BLOCKED",
        },
      }),
    },
  }
);

/**
 * Model not found error from Gemini
 */
export const geminiModelNotFoundError: GeminiApiError = Object.assign(
  new Error("Model not found. Please check the model name."),
  {
    status: 404,
    response: {
      error: {
        message: "Model not found. Please check the model name.",
        code: 404,
      },
      raw: JSON.stringify({
        error: {
          code: 404,
          message: "Model gemini-nonexistent not found.",
          status: "NOT_FOUND",
        },
      }),
    },
  }
);

// ============================================================================
// Network Errors
// ============================================================================

/**
 * Connection refused error
 */
export const networkConnectionRefusedError = new Error("connect ECONNREFUSED 127.0.0.1:443");

/**
 * DNS resolution error
 */
export const networkDnsError = new Error("getaddrinfo ENOTFOUND generativelanguage.googleapis.com");

/**
 * Connection reset error
 */
export const networkResetError = new Error("read ECONNRESET");

/**
 * Socket timeout error
 */
export const networkSocketTimeoutError = new Error("socket hang up");

// ============================================================================
// Timeout Errors
// ============================================================================

/**
 * API request timeout error
 */
export const timeoutError = new Error("Request timed out after 300000ms");

/**
 * Abort controller timeout
 */
export const abortTimeoutError = new DOMException("The operation was aborted.", "AbortError");

// ============================================================================
// Parse Errors
// ============================================================================

/**
 * JSON parse error - unexpected token
 */
export const parseErrorUnexpectedToken = new SyntaxError("Unexpected token '<' at position 0");

/**
 * JSON parse error - unexpected end
 */
export const parseErrorUnexpectedEnd = new SyntaxError("Unexpected end of JSON input");

/**
 * Empty response error
 */
export const parseErrorEmptyResponse = new Error("Gemini returned an empty response");

/**
 * Invalid response structure error
 */
export const parseErrorInvalidStructure = new Error(
  "Invalid Gemini response structure: missing candidates array"
);

/**
 * Scene parsing error
 */
export const parseErrorSceneValidation = new Error(
  "Failed to parse scenes: 3 scenes failed validation"
);

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Invalid YouTube URL error
 */
export const invalidUrlError = new Error("Invalid YouTube URL: must be a valid youtube.com or youtu.be URL");

/**
 * Missing video ID error
 */
export const missingVideoIdError = new Error("Could not extract video ID from URL");

/**
 * Video unavailable error
 */
export const videoUnavailableError = new Error("Video is unavailable or private");

/**
 * Missing API key error
 */
export const missingApiKeyError = new Error("Gemini API key is required but not provided");

/**
 * Invalid scene count error
 */
export const invalidSceneCountError = new Error("Scene count must be between 1 and 100");

// ============================================================================
// VEO Error Event Data
// ============================================================================

export interface ErrorScenario {
  type: VeoErrorType;
  message: string;
  retryable: boolean;
  failedBatch?: number;
  totalBatches?: number;
  scenesCompleted?: number;
  httpStatus?: number;
  originalError?: Error;
}

/**
 * Quota exceeded scenario
 */
export const quotaExceededScenario: ErrorScenario = {
  type: "GEMINI_QUOTA",
  message: "Gemini API quota exceeded. Please try again later or upgrade your plan.",
  retryable: true,
  failedBatch: 2,
  totalBatches: 5,
  scenesCompleted: 10,
  httpStatus: 429,
  originalError: geminiQuotaError,
};

/**
 * Rate limit scenario
 */
export const rateLimitScenario: ErrorScenario = {
  type: "GEMINI_RATE_LIMIT",
  message: "Rate limit exceeded. Please wait 60 seconds before retrying.",
  retryable: true,
  failedBatch: 3,
  totalBatches: 4,
  scenesCompleted: 15,
  httpStatus: 429,
  originalError: geminiRateLimitError,
};

/**
 * Network timeout scenario
 */
export const networkTimeoutScenario: ErrorScenario = {
  type: "TIMEOUT",
  message: "Request timed out after 5 minutes. The video may be too long.",
  retryable: true,
  failedBatch: 0,
  totalBatches: 2,
  scenesCompleted: 0,
  originalError: timeoutError,
};

/**
 * Parse error scenario
 */
export const parseErrorScenario: ErrorScenario = {
  type: "PARSE_ERROR",
  message: "Failed to parse Gemini response. The AI returned invalid JSON.",
  retryable: false,
  failedBatch: 1,
  totalBatches: 3,
  scenesCompleted: 5,
  originalError: parseErrorUnexpectedToken,
};

/**
 * Invalid URL scenario
 */
export const invalidUrlScenario: ErrorScenario = {
  type: "INVALID_URL",
  message: "The provided URL is not a valid YouTube video URL.",
  retryable: false,
  originalError: invalidUrlError,
};

/**
 * Generic API error scenario
 */
export const apiErrorScenario: ErrorScenario = {
  type: "GEMINI_API_ERROR",
  message: "Gemini API returned an error. Please try again.",
  retryable: true,
  failedBatch: 2,
  totalBatches: 5,
  scenesCompleted: 10,
  httpStatus: 500,
  originalError: geminiServerError,
};

/**
 * Network error scenario
 */
export const networkErrorScenario: ErrorScenario = {
  type: "NETWORK_ERROR",
  message: "Network connection failed. Please check your internet connection.",
  retryable: true,
  originalError: networkConnectionRefusedError,
};

/**
 * Unknown error scenario
 */
export const unknownErrorScenario: ErrorScenario = {
  type: "UNKNOWN_ERROR",
  message: "An unexpected error occurred. Please try again.",
  retryable: true,
  originalError: new Error("Something went wrong"),
};

// ============================================================================
// Error Scenario Collections
// ============================================================================

/**
 * All error scenarios
 */
export const allErrorScenarios: ErrorScenario[] = [
  quotaExceededScenario,
  rateLimitScenario,
  networkTimeoutScenario,
  parseErrorScenario,
  invalidUrlScenario,
  apiErrorScenario,
  networkErrorScenario,
  unknownErrorScenario,
];

/**
 * Retryable error scenarios
 */
export const retryableScenarios: ErrorScenario[] = [
  quotaExceededScenario,
  rateLimitScenario,
  networkTimeoutScenario,
  apiErrorScenario,
  networkErrorScenario,
  unknownErrorScenario,
];

/**
 * Non-retryable error scenarios
 */
export const nonRetryableScenarios: ErrorScenario[] = [
  parseErrorScenario,
  invalidUrlScenario,
];

/**
 * Scenarios that occur mid-job (have failedBatch)
 */
export const midJobErrorScenarios: ErrorScenario[] = [
  quotaExceededScenario,
  rateLimitScenario,
  parseErrorScenario,
  apiErrorScenario,
];

/**
 * Scenarios that occur at job start
 */
export const startupErrorScenarios: ErrorScenario[] = [
  networkTimeoutScenario,
  invalidUrlScenario,
  networkErrorScenario,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a VeoErrorEvent from an error scenario
 */
export function createErrorEvent(scenario: ErrorScenario): VeoErrorEvent {
  return {
    event: "error",
    data: {
      type: scenario.type,
      message: scenario.message,
      retryable: scenario.retryable,
      failedBatch: scenario.failedBatch,
      totalBatches: scenario.totalBatches,
      scenesCompleted: scenario.scenesCompleted,
      debug: scenario.httpStatus
        ? {
            status: scenario.httpStatus,
            originalMessage: scenario.originalError?.message,
          }
        : undefined,
    },
  };
}

/**
 * Simulate error occurring at a specific batch
 */
export function createBatchError(
  type: VeoErrorType,
  failedBatch: number,
  totalBatches: number,
  batchSize: number = 5
): ErrorScenario {
  const scenesCompleted = failedBatch * batchSize;

  return {
    type,
    message: `Error occurred at batch ${failedBatch + 1} of ${totalBatches}`,
    retryable: type !== "PARSE_ERROR" && type !== "INVALID_URL",
    failedBatch,
    totalBatches,
    scenesCompleted,
  };
}

/**
 * Check if an error type is retryable
 */
export function isRetryableErrorType(type: VeoErrorType): boolean {
  return type !== "PARSE_ERROR" && type !== "INVALID_URL";
}

/**
 * Get user-friendly error message for error type
 */
export function getErrorMessage(type: VeoErrorType): string {
  const messages: Record<VeoErrorType, string> = {
    INVALID_URL: "The provided URL is not a valid YouTube video URL.",
    GEMINI_API_ERROR: "An error occurred with the AI service. Please try again.",
    GEMINI_QUOTA: "API quota exceeded. Please try again later or check your plan limits.",
    GEMINI_RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
    NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
    PARSE_ERROR: "Failed to process the AI response. Please try again.",
    TIMEOUT: "The request took too long. Please try with a shorter video.",
    UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  };

  return messages[type];
}
