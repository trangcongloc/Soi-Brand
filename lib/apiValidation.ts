/**
 * API Key Validation
 * Validates YouTube and Gemini API keys by making test requests
 */

import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ValidationResult {
    valid: boolean;
    error?: string;
    tier?: "free" | "paid";
}

/**
 * Validate YouTube API key by making a test request
 */
export async function validateYouTubeApiKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey || apiKey.trim().length === 0) {
        return { valid: false, error: "API key is empty" };
    }

    try {
        // Make a simple test request to YouTube API (search with minimal quota cost)
        const response = await axios.get(
            "https://www.googleapis.com/youtube/v3/search",
            {
                params: {
                    part: "snippet",
                    maxResults: 1,
                    q: "test",
                    type: "video",
                    key: apiKey,
                },
                timeout: 10000,
            }
        );

        if (response.status === 200 && response.data) {
            return { valid: true };
        }

        return { valid: false, error: "Invalid response from YouTube API" };
    } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message || error.message;

        if (error.response?.status === 400) {
            if (errorMessage.includes("API key")) {
                return { valid: false, error: "Invalid API key format" };
            }
            if (errorMessage.includes("quota")) {
                // Key is valid but quota exceeded
                return { valid: true };
            }
        }

        if (error.response?.status === 403) {
            return { valid: false, error: "API key not authorized for YouTube Data API" };
        }

        return { valid: false, error: `Verification failed: ${errorMessage}` };
    }
}

/**
 * Validate Gemini API key by making a test request
 * Detects tier by testing with a paid-only model
 */
export async function validateGeminiApiKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey || apiKey.trim().length === 0) {
        return { valid: false, error: "API key is empty" };
    }

    try {
        // First, validate the key works with a free model
        const genAI = new GoogleGenerativeAI(apiKey);
        const freeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const freeResult = await freeModel.generateContent("Hi");
        const freeResponse = await freeResult.response;
        const freeText = freeResponse.text();

        if (!freeText || freeText.length === 0) {
            return { valid: false, error: "Invalid response from Gemini API" };
        }

        // Key is valid, now detect tier by testing with a paid-only model
        try {
            const paidModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
            const paidResult = await paidModel.generateContent("Hi");
            const paidResponse = await paidResult.response;
            const paidText = paidResponse.text();

            if (paidText && paidText.length > 0) {
                // Paid model works = paid tier
                return { valid: true, tier: "paid" };
            }
        } catch (paidError: any) {
            const paidErrorMessage = paidError.message || String(paidError);

            // If permission denied or model not available, it's a free tier key
            if (
                paidErrorMessage.includes("PERMISSION_DENIED") ||
                paidErrorMessage.includes("not available") ||
                paidErrorMessage.includes("not supported")
            ) {
                return { valid: true, tier: "free" };
            }

            // If quota error with "free_tier" in message, it's a free tier key
            // Free tier keys get 429 errors with "free_tier" quota metrics when accessing paid models
            if (paidErrorMessage.includes("free_tier")) {
                return { valid: true, tier: "free" };
            }

            // If quota exhausted WITHOUT "free_tier", it's a paid tier key that ran out of quota
            if (paidErrorMessage.includes("RESOURCE_EXHAUSTED") || paidErrorMessage.includes("quota")) {
                return { valid: true, tier: "paid" };
            }

            // Other errors on paid model don't necessarily mean free tier
            // Could be temporary issues, so we'll assume free tier as default
        }

        // Default to free tier if paid model test was inconclusive
        return { valid: true, tier: "free" };
    } catch (error: any) {
        const errorMessage = error.message || String(error);

        if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API key")) {
            return { valid: false, error: "Invalid API key" };
        }

        if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
            // Key is valid but quota exceeded (assume free tier)
            return { valid: true, tier: "free" };
        }

        if (errorMessage.includes("PERMISSION_DENIED")) {
            return { valid: false, error: "API key not authorized for Gemini API" };
        }

        return { valid: false, error: `Verification failed: ${errorMessage}` };
    }
}

/**
 * Detect Gemini API key tier
 * Returns the tier (free/paid) if detectable, otherwise undefined
 * Note: This is a best-effort detection and may not be 100% accurate
 */
export async function detectGeminiTier(_apiKey: string): Promise<"free" | "paid" | undefined> {
    // Unfortunately, Google Gemini API doesn't provide a direct way to detect tier
    // The only reliable way is to monitor rate limits over time
    // For now, we return undefined and let the user assume free tier
    return undefined;
}
