// Shared error mappings for API error handling
import { APIError, AnalyzeResponse } from "./types";

export type ErrorType = NonNullable<AnalyzeResponse["errorType"]>;

export interface ErrorMapping {
    reasons?: string[];
    status?: number[];
    patterns?: string[];
    type: ErrorType;
    message: string;
    statusCode: number;
}

// YouTube API error mappings
// Reference: https://developers.google.com/youtube/v3/docs/errors
export const YOUTUBE_ERROR_MAPPINGS: ErrorMapping[] = [
    {
        reasons: ["quotaExceeded", "dailyLimitExceeded"],
        patterns: ["quota", "Quota exceeded"],
        type: "YOUTUBE_QUOTA",
        message: "YouTube API quota exceeded for today. Please try again tomorrow.",
        statusCode: 429,
    },
    {
        reasons: ["rateLimitExceeded"],
        status: [429],
        type: "RATE_LIMIT",
        message: "YouTube API rate limit exceeded. Please wait a moment and try again.",
        statusCode: 429,
    },
    {
        reasons: ["keyInvalid"],
        status: [401],
        patterns: ["API key"],
        type: "API_CONFIG",
        message: "Invalid YouTube API key configuration.",
        statusCode: 401,
    },
    {
        reasons: ["channelNotFound"],
        status: [404],
        type: "CHANNEL_NOT_FOUND",
        message: "YouTube channel not found.",
        statusCode: 404,
    },
    {
        reasons: ["channelForbidden", "forbidden"],
        status: [403],
        type: "YOUTUBE_API_ERROR",
        message: "Access to this YouTube channel is forbidden.",
        statusCode: 403,
    },
    {
        reasons: ["badRequest", "invalidFilters", "missingRequiredParameter"],
        status: [400],
        type: "YOUTUBE_API_ERROR",
        message: "Invalid YouTube API request parameters.",
        statusCode: 400,
    },
];

// Gemini API error mappings
// Reference: https://ai.google.dev/gemini-api/docs/troubleshooting
export const GEMINI_ERROR_MAPPINGS: ErrorMapping[] = [
    {
        status: [400],
        patterns: ["INVALID_ARGUMENT", "Bad Request", "invalid"],
        type: "GEMINI_API_ERROR",
        message: "Invalid request parameters: The model parameters or request format is incorrect.",
        statusCode: 400,
    },
    {
        status: [401, 403],
        patterns: ["PERMISSION_DENIED", "Unauthorized", "Forbidden", "API key"],
        type: "API_CONFIG",
        message: "Gemini API authentication failed: Invalid or missing API key.",
        statusCode: 401,
    },
    {
        status: [404],
        patterns: ["NOT_FOUND", "Not Found"],
        type: "GEMINI_API_ERROR",
        message: "Gemini model not found. The requested model may not exist or be unavailable.",
        statusCode: 404,
    },
    {
        status: [429],
        patterns: ["RESOURCE_EXHAUSTED", "quota", "rate limit"],
        type: "GEMINI_QUOTA",
        message: "Gemini API quota exceeded. Please wait a few minutes before retrying.",
        statusCode: 429,
    },
    {
        status: [500],
        patterns: ["INTERNAL", "Internal Server Error"],
        type: "GEMINI_API_ERROR",
        message: "Gemini API internal server error. Please try again in a moment.",
        statusCode: 500,
    },
    {
        status: [503],
        patterns: ["UNAVAILABLE", "Service Unavailable", "overloaded"],
        type: "MODEL_OVERLOAD",
        message: "Gemini AI model is currently overloaded. Please try again in 1-2 minutes.",
        statusCode: 503,
    },
    {
        status: [504],
        patterns: ["Deadline Exceeded", "timeout"],
        type: "NETWORK_ERROR",
        message: "Request timeout: The analysis took too long. Try with fewer videos.",
        statusCode: 504,
    },
    {
        patterns: ["SAFETY", "blocked", "BlockedReason"],
        type: "GEMINI_API_ERROR",
        message: "Content blocked by Gemini safety filters.",
        statusCode: 400,
    },
    {
        patterns: ["RECITATION", "recitation"],
        type: "AI_PARSE_ERROR",
        message: "AI response issue detected. Please try again.",
        statusCode: 500,
    },
];

// Network error patterns
export const NETWORK_ERROR_CODES = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"];

/**
 * Find matching error from mappings and throw APIError
 */
export function matchAndThrowError(
    mappings: ErrorMapping[],
    errorMessage: string,
    errorStatus?: number,
    errorReason?: string,
    context?: string
): never {
    // Find matching error
    for (const mapping of mappings) {
        const reasonMatch = mapping.reasons?.includes(errorReason || "");
        const statusMatch = mapping.status?.includes(errorStatus || 0);
        const patternMatch = mapping.patterns?.some((p) =>
            errorMessage.toLowerCase().includes(p.toLowerCase())
        );

        if (reasonMatch || statusMatch || patternMatch) {
            throw new APIError(mapping.message, mapping.type, mapping.statusCode);
        }
    }

    // No match found - throw generic error
    throw new APIError(
        `${context || "API"} error: ${errorMessage || "Unknown error occurred"}`,
        "UNKNOWN",
        errorStatus || 500
    );
}

/**
 * Check if error code indicates a network error
 */
export function isNetworkError(errorCode?: string): boolean {
    return !!errorCode && NETWORK_ERROR_CODES.includes(errorCode);
}
