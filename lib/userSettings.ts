// User settings management using localStorage with encryption for API keys

import { isBrowser } from "./utils";
import { logger } from "./logger";
import { ApiQuotaUsage, GeminiModel } from "./types";
import { encrypt, decrypt, isEncryptionAvailable } from "./crypto";

export interface UserSettings {
    youtubeApiKey?: string;
    geminiApiKey?: string;
    geminiModel?: GeminiModel;
    quotaUsage?: ApiQuotaUsage;
}

interface StoredSettings {
    youtubeApiKey?: string; // encrypted
    geminiApiKey?: string; // encrypted
    geminiModel?: GeminiModel;
    quotaUsage?: ApiQuotaUsage;
    encrypted?: boolean;
}

const SETTINGS_KEY = "soibrand_user_settings";

// In-memory cache for decrypted settings
let cachedSettings: UserSettings | null = null;

/**
 * Get user settings from localStorage (async for decryption)
 */
export async function getUserSettingsAsync(): Promise<UserSettings> {
    if (!isBrowser()) {
        return {};
    }

    // Return cached if available
    if (cachedSettings) {
        return cachedSettings;
    }

    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) {
            return {};
        }

        const parsed = JSON.parse(stored) as StoredSettings;

        // Decrypt API keys if they were encrypted
        if (parsed.encrypted && isEncryptionAvailable()) {
            const settings: UserSettings = {
                geminiModel: parsed.geminiModel,
                quotaUsage: parsed.quotaUsage,
            };

            if (parsed.youtubeApiKey) {
                const decrypted = await decrypt(parsed.youtubeApiKey);
                if (decrypted) settings.youtubeApiKey = decrypted;
            }

            if (parsed.geminiApiKey) {
                const decrypted = await decrypt(parsed.geminiApiKey);
                if (decrypted) settings.geminiApiKey = decrypted;
            }

            cachedSettings = settings;
            return settings;
        }

        // Legacy unencrypted settings - migrate on next save
        cachedSettings = parsed as UserSettings;
        return parsed as UserSettings;
    } catch (error) {
        logger.error("[UserSettings] Error reading user settings", error);
        return {};
    }
}

/**
 * Get user settings synchronously (uses cache or returns empty)
 * For initial render, use getUserSettingsAsync in useEffect
 */
export function getUserSettings(): UserSettings {
    if (cachedSettings) {
        return cachedSettings;
    }

    if (!isBrowser()) {
        return {};
    }

    // Fallback: try to read synchronously (won't decrypt)
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) {
            return {};
        }
        const parsed = JSON.parse(stored) as StoredSettings;

        // If encrypted, return non-sensitive settings only
        if (parsed.encrypted) {
            return {
                geminiModel: parsed.geminiModel,
                quotaUsage: parsed.quotaUsage,
            };
        }

        return parsed as UserSettings;
    } catch {
        return {};
    }
}

/**
 * Save user settings to localStorage with encryption
 */
export async function saveUserSettingsAsync(settings: UserSettings): Promise<void> {
    if (!isBrowser()) {
        return;
    }

    try {
        const stored: StoredSettings = {
            geminiModel: settings.geminiModel,
            quotaUsage: settings.quotaUsage,
        };

        // Encrypt API keys if crypto is available
        if (isEncryptionAvailable()) {
            stored.encrypted = true;

            if (settings.youtubeApiKey) {
                const encrypted = await encrypt(settings.youtubeApiKey);
                if (encrypted) stored.youtubeApiKey = encrypted;
            }

            if (settings.geminiApiKey) {
                const encrypted = await encrypt(settings.geminiApiKey);
                if (encrypted) stored.geminiApiKey = encrypted;
            }
        } else {
            // Fallback: store unencrypted (less secure)
            stored.youtubeApiKey = settings.youtubeApiKey;
            stored.geminiApiKey = settings.geminiApiKey;
            stored.encrypted = false;
        }

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored));
        cachedSettings = settings;
    } catch (error) {
        logger.error("[UserSettings] Error saving user settings", error);
    }
}

/**
 * Save user settings synchronously (deprecated, use saveUserSettingsAsync)
 */
export function saveUserSettings(settings: UserSettings): void {
    // Fire and forget async save
    saveUserSettingsAsync(settings).catch((error) => {
        logger.error("[UserSettings] Error in async save", error);
    });
    // Update cache immediately
    cachedSettings = settings;
}

/**
 * Clear user settings and cache
 */
export function clearUserSettings(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(SETTINGS_KEY);
    cachedSettings = null;
}

/**
 * Clear the in-memory cache (useful after settings change)
 */
export function clearSettingsCache(): void {
    cachedSettings = null;
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
