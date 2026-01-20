/**
 * API Key Validation
 * Validates YouTube and Gemini API keys by making test requests
 */

import { apiClient } from "./axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ValidationResult {
    valid: boolean;
    error?: string;
    tier?: "free" | "paid";
}

// Cache for validation results to avoid redundant API calls
interface CachedValidation {
    result: ValidationResult;
    timestamp: number;
}
const validationCache: Record<string, CachedValidation> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate YouTube API key by making a test request
 */
export async function validateYouTubeApiKey(
    apiKey: string,
): Promise<ValidationResult> {
    if (!apiKey || apiKey.trim().length === 0) {
        return { valid: false, error: "API key is empty" };
    }

    // Check cache first
    const cacheKey = `youtube:${apiKey}`;
    const cached = validationCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.result;
    }

    try {
        // Make a simple test request to YouTube API (search with minimal quota cost)
        const response = await apiClient.get(
            "https://www.googleapis.com/youtube/v3/search",
            {
                params: {
                    part: "snippet",
                    maxResults: 1,
                    q: "test",
                    type: "video",
                    key: apiKey,
                },
            },
        );

        if (response.status === 200 && response.data) {
            const result = { valid: true };
            validationCache[cacheKey] = { result, timestamp: Date.now() };
            return result;
        }

        const result = { valid: false, error: "Invalid response from YouTube API" };
        validationCache[cacheKey] = { result, timestamp: Date.now() };
        return result;
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.error?.message || error.message;

        let result: ValidationResult;
        if (error.response?.status === 400) {
            if (errorMessage.includes("API key")) {
                result = { valid: false, error: "Invalid API key format" };
            } else if (errorMessage.includes("quota")) {
                // Key is valid but quota exceeded
                result = { valid: true };
            } else {
                result = { valid: false, error: `Verification failed: ${errorMessage}` };
            }
        } else if (error.response?.status === 403) {
            result = {
                valid: false,
                error: "API key not authorized for YouTube Data API",
            };
        } else {
            result = { valid: false, error: `Verification failed: ${errorMessage}` };
        }

        validationCache[cacheKey] = { result, timestamp: Date.now() };
        return result;
    }
}

/**
 * Validate Gemini API key by making a single test request
 * Uses paid model to detect both validity and tier in one request:
 * - Success → valid, paid tier
 * - 429 with "free_tier" → valid, free tier
 * - 429 without "free_tier" → valid, paid tier (quota exhausted)
 * - Invalid key error → invalid
 */
export async function validateGeminiApiKey(
    apiKey: string,
): Promise<ValidationResult> {
    if (!apiKey || apiKey.trim().length === 0) {
        return { valid: false, error: "API key is empty" };
    }

    // Check cache first
    const cacheKey = `gemini:${apiKey}`;
    const cached = validationCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.result;
    }

    try {
        // Single request to paid model - determines both validity and tier
        const genAI = new GoogleGenerativeAI(apiKey);
        const paidModel = genAI.getGenerativeModel({
            model: "gemini-2.5-pro",
        });

        const paidResult = await paidModel.generateContent("Hi");
        const paidResponse = await paidResult.response;
        const paidText = paidResponse.text();

        if (paidText && paidText.length > 0) {
            // Paid model works = valid key, paid tier
            const result = { valid: true, tier: "paid" as const };
            validationCache[cacheKey] = { result, timestamp: Date.now() };
            return result;
        }

        // Empty response but no error - assume valid, paid tier
        const result = { valid: true, tier: "paid" as const };
        validationCache[cacheKey] = { result, timestamp: Date.now() };
        return result;
    } catch (error: any) {
        const errorMessage = error.message || String(error);

        let result: ValidationResult;

        // Check for invalid key errors first
        if (
            errorMessage.includes("API_KEY_INVALID") ||
            errorMessage.includes("API key not valid")
        ) {
            result = { valid: false, error: "Invalid API key" };
        }
        // Permission denied = key not authorized
        else if (errorMessage.includes("PERMISSION_DENIED")) {
            result = {
                valid: false,
                error: "API key not authorized for Gemini API",
            };
        }
        // Quota/rate limit errors - key is valid, determine tier from error message
        else if (
            errorMessage.includes("RESOURCE_EXHAUSTED") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("429")
        ) {
            // Free tier keys have "free_tier" in quota error messages
            if (errorMessage.includes("free_tier")) {
                result = { valid: true, tier: "free" };
            } else {
                // Paid tier key with exhausted quota
                result = { valid: true, tier: "paid" };
            }
        }
        // Model not available/supported = valid key, free tier
        else if (
            errorMessage.includes("not available") ||
            errorMessage.includes("not supported")
        ) {
            result = { valid: true, tier: "free" };
        }
        // Unknown error
        else {
            result = { valid: false, error: `Verification failed: ${errorMessage}` };
        }

        validationCache[cacheKey] = { result, timestamp: Date.now() };
        return result;
    }
}

/**
 * Detect Gemini API key tier
 * Returns the tier (free/paid) if detectable, otherwise undefined
 * Note: This is a best-effort detection and may not be 100% accurate
 */
export async function detectGeminiTier(
    _apiKey: string,
): Promise<"free" | "paid" | undefined> {
    // Unfortunately, Google Gemini API doesn't provide a direct way to detect tier
    // The only reliable way is to monitor rate limits over time
    // For now, we return undefined and let the user assume free tier
    return undefined;
}
