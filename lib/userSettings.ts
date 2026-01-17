// User settings management using localStorage

import { isBrowser } from "./utils";
import { logger } from "./logger";

export interface UserSettings {
    youtubeApiKey?: string;
    geminiApiKey?: string;
}

const SETTINGS_KEY = "ourtube_user_settings";

/**
 * Get user settings from localStorage
 */
export function getUserSettings(): UserSettings {
    if (!isBrowser()) {
        return {};
    }

    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) {
            return {};
        }
        const parsed = JSON.parse(stored) as UserSettings;
        return parsed;
    } catch (error) {
        logger.error("[UserSettings] Error reading user settings:", error);
        return {};
    }
}

/**
 * Save user settings to localStorage
 */
export function saveUserSettings(settings: UserSettings): void {
    if (!isBrowser()) {
        return;
    }

    try {
        const stringified = JSON.stringify(settings);
        localStorage.setItem(SETTINGS_KEY, stringified);
    } catch (error) {
        logger.error("[UserSettings] Error saving user settings:", error);
    }
}

/**
 * Clear user settings
 */
export function clearUserSettings(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(SETTINGS_KEY);
}

/**
 * Validate API key format (basic check)
 */
export function isValidApiKeyFormat(key: string, type: "youtube" | "gemini"): boolean {
    if (!key || key.trim().length === 0) return false;

    // Basic format validation
    if (type === "youtube") {
        // YouTube API keys are typically 39 characters
        return key.length >= 30 && /^[A-Za-z0-9_-]+$/.test(key);
    } else if (type === "gemini") {
        // Gemini API keys typically start with specific patterns
        return key.length >= 30;
    }

    return false;
}
