/**
 * Unified error handler for API routes
 * Consolidates error mapping logic from analyze and VEO routes
 */

import { ErrorType as AnalyzeErrorType } from "./errorMappings";
import type { PromptErrorType } from "./prompt/types";

export type UnifiedErrorType = AnalyzeErrorType | PromptErrorType;

export interface ErrorHandlerResult {
  type: UnifiedErrorType;
  message: {
    vi: string;
    en: string;
  };
  statusCode: number;
  retryable: boolean;
}

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
  response?: {
    status?: number;
    error?: {
      message?: string;
    };
  };
}

/**
 * Error message mappings (bilingual)
 */
const ERROR_MESSAGES: Record<
  UnifiedErrorType,
  { vi: string; en: string; statusCode: number; retryable: boolean }
> = {
  // YouTube API errors
  YOUTUBE_QUOTA: {
    vi: "Đã hết hạn mức YouTube API hôm nay. Vui lòng thử lại vào ngày mai.",
    en: "YouTube API quota exceeded for today. Please try again tomorrow.",
    statusCode: 429,
    retryable: false,
  },
  CHANNEL_NOT_FOUND: {
    vi: "Không tìm thấy kênh YouTube. Vui lòng kiểm tra lại URL.",
    en: "YouTube channel not found. Please check the URL.",
    statusCode: 404,
    retryable: false,
  },
  YOUTUBE_API_ERROR: {
    vi: "Lỗi từ YouTube API.",
    en: "Error from YouTube API.",
    statusCode: 500,
    retryable: true,
  },

  // Gemini API errors
  GEMINI_QUOTA: {
    vi: "Đã hết hạn mức Gemini API.",
    en: "Gemini API quota exceeded.",
    statusCode: 403,
    retryable: false,
  },
  GEMINI_API_ERROR: {
    vi: "Lỗi từ Gemini AI.",
    en: "Error from Gemini AI.",
    statusCode: 500,
    retryable: true,
  },
  GEMINI_RATE_LIMIT: {
    vi: "Đã vượt quá giới hạn tốc độ Gemini API. Vui lòng thử lại sau vài giây.",
    en: "Gemini API rate limit exceeded. Please try again in a few seconds.",
    statusCode: 429,
    retryable: true,
  },
  MODEL_OVERLOAD: {
    vi: "Mô hình AI đang quá tải. Vui lòng thử lại sau 1-2 phút.",
    en: "AI model is overloaded. Please try again in 1-2 minutes.",
    statusCode: 503,
    retryable: true,
  },

  // Rate limiting
  RATE_LIMIT: {
    vi: "Đã vượt quá giới hạn số lần truy cập. Vui lòng chờ một chút và thử lại.",
    en: "Rate limit exceeded. Please wait a moment and try again.",
    statusCode: 429,
    retryable: true,
  },

  // Network and timeout errors
  NETWORK_ERROR: {
    vi: "Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối internet.",
    en: "Cannot connect to server. Please check your internet connection.",
    statusCode: 503,
    retryable: true,
  },
  TIMEOUT: {
    vi: "Yêu cầu hết thời gian chờ. Vui lòng thử lại.",
    en: "Request timeout. Please try again.",
    statusCode: 504,
    retryable: true,
  },

  // Configuration errors
  API_CONFIG: {
    vi: "Lỗi cấu hình API key. Vui lòng liên hệ quản trị viên.",
    en: "API key configuration error. Please contact administrator.",
    statusCode: 401,
    retryable: false,
  },

  // Parse and validation errors
  AI_PARSE_ERROR: {
    vi: "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.",
    en: "AI returned invalid data. Please try again.",
    statusCode: 500,
    retryable: true,
  },
  PARSE_ERROR: {
    vi: "Lỗi phân tích dữ liệu. Vui lòng thử lại.",
    en: "Data parsing error. Please try again.",
    statusCode: 500,
    retryable: true,
  },
  INVALID_URL: {
    vi: "URL không hợp lệ. Vui lòng kiểm tra lại.",
    en: "Invalid URL. Please check again.",
    statusCode: 400,
    retryable: false,
  },

  // Unknown errors
  UNKNOWN: {
    vi: "Có lỗi không xác định.",
    en: "An unknown error occurred.",
    statusCode: 500,
    retryable: false,
  },
  UNKNOWN_ERROR: {
    vi: "Có lỗi không xác định.",
    en: "An unknown error occurred.",
    statusCode: 500,
    retryable: false,
  },
};

/**
 * Detect error type from error object
 */
function detectErrorType(error: ErrorLike): UnifiedErrorType {
  const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
  const code = typeof error.code === "string" ? error.code.toLowerCase() : "";
  const status = error.status || error.response?.status || 0;
  const apiErrorMsg = error.response?.error?.message;
  const apiError = typeof apiErrorMsg === "string" ? apiErrorMsg.toLowerCase() : "";
  const name = typeof error.name === "string" ? error.name : "";

  // YouTube API errors
  if (
    message.includes("quota") ||
    message.includes("quotaexceeded") ||
    apiError.includes("quota")
  ) {
    return "YOUTUBE_QUOTA";
  }
  if (
    message.includes("channel not found") ||
    message.includes("channelnotfound") ||
    status === 404
  ) {
    return "CHANNEL_NOT_FOUND";
  }
  if (message.includes("youtube") && status >= 400 && status < 500) {
    return "YOUTUBE_API_ERROR";
  }

  // Gemini API errors
  if (status === 429 || message.includes("rate limit")) {
    return "GEMINI_RATE_LIMIT";
  }
  if (
    status === 403 ||
    message.includes("resource_exhausted") ||
    apiError.includes("resource_exhausted")
  ) {
    return "GEMINI_QUOTA";
  }
  if (
    status === 503 ||
    message.includes("overload") ||
    message.includes("overloaded") ||
    message.includes("unavailable") ||
    apiError.includes("overload")
  ) {
    return "MODEL_OVERLOAD";
  }
  if (
    message.includes("gemini") ||
    message.includes("invalid_argument") ||
    message.includes("permission_denied")
  ) {
    return "GEMINI_API_ERROR";
  }

  // Network and timeout errors
  if (name === "aborterror" || message.includes("timeout")) {
    return "TIMEOUT";
  }
  if (
    code.includes("econnrefused") ||
    code.includes("etimedout") ||
    code.includes("enotfound") ||
    message.includes("fetch failed") ||
    message.includes("network")
  ) {
    return "NETWORK_ERROR";
  }

  // Configuration errors
  if (
    status === 401 ||
    message.includes("api key") ||
    message.includes("unauthorized") ||
    message.includes("apikey")
  ) {
    return "API_CONFIG";
  }

  // Parse errors
  if (
    message.includes("json") ||
    message.includes("parse") ||
    message.includes("invalid response")
  ) {
    return "PARSE_ERROR";
  }

  // URL validation errors
  if (
    message.includes("invalid url") ||
    message.includes("video id") ||
    message.includes("extract")
  ) {
    return "INVALID_URL";
  }

  // Default
  return "UNKNOWN_ERROR";
}

/**
 * Handle API errors with unified error mapping
 */
export function handleAPIError(
  error: unknown,
  context?: string
): ErrorHandlerResult {
  // If it's already a structured error with errorType
  if (
    error &&
    typeof error === "object" &&
    "errorType" in error &&
    typeof error.errorType === "string"
  ) {
    const errorType = error.errorType as UnifiedErrorType;
    const mapping = ERROR_MESSAGES[errorType];

    if (mapping) {
      return {
        type: errorType,
        message: {
          vi: mapping.vi,
          en: mapping.en,
        },
        statusCode: mapping.statusCode,
        retryable: mapping.retryable,
      };
    }
  }

  // Detect error type from error object
  let errorType: UnifiedErrorType;
  try {
    const errorLike = error as ErrorLike;
    errorType = detectErrorType(errorLike);
  } catch (detectionError) {
    // If error detection itself fails, fall back to UNKNOWN_ERROR
    console.error("Error during error type detection:", detectionError);
    errorType = "UNKNOWN_ERROR";
  }

  const mapping = ERROR_MESSAGES[errorType] || ERROR_MESSAGES["UNKNOWN_ERROR"];

  // Build contextual message if available
  let contextMessage = "";
  if (context) {
    contextMessage = `${context}: `;
  }

  return {
    type: errorType,
    message: {
      vi: contextMessage + mapping.vi,
      en: contextMessage + mapping.en,
    },
    statusCode: mapping.statusCode,
    retryable: mapping.retryable,
  };
}

/**
 * Format error message for logging or display
 */
export function formatErrorMessage(
  error: unknown,
  context?: string
): string {
  const result = handleAPIError(error, context);
  return result.message.en; // Default to English for logs
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const result = handleAPIError(error);
  return result.retryable;
}
