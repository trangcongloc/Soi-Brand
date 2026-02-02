// User settings management using localStorage with encryption for API keys

import { isBrowser } from "./utils";
import { logger } from "./logger";
import { ApiQuotaUsage, GeminiModel, GeminiImageModel } from "./types";
import { encrypt, decrypt, isEncryptionAvailable } from "./crypto";

export interface UserSettings {
    youtubeApiKey?: string;
    geminiApiKey?: string;
    geminiModel?: GeminiModel;
    geminiImageModel?: GeminiImageModel;
    quotaUsage?: ApiQuotaUsage;
}

interface StoredSettings {
    youtubeApiKey?: string; // encrypted
    geminiApiKey?: string; // encrypted
    geminiModel?: GeminiModel;
    geminiImageModel?: GeminiImageModel;
    quotaUsage?: ApiQuotaUsage;
    encrypted?: boolean;
}

const SETTINGS_KEY = "soibrand_user_settings";
export const SETTINGS_CHANGE_EVENT = "soibrand_settings_changed";

// In-memory cache for decrypted settings
let cachedSettings: UserSettings | null = null;

/**
 * Custom event for settings changes
 */
export interface SettingsChangeEvent extends CustomEvent {
    detail: UserSettings;
}

/**
 * Dispatch a settings change event
 */
function notifySettingsChange(settings: UserSettings): void {
    if (isBrowser()) {
        const event = new CustomEvent<UserSettings>(SETTINGS_CHANGE_EVENT, { detail: settings });
        window.dispatchEvent(event);
    }
}

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
                geminiImageModel: parsed.geminiImageModel,
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
                geminiImageModel: parsed.geminiImageModel,
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
            geminiImageModel: settings.geminiImageModel,
            quotaUsage: settings.quotaUsage,
        };

        // Encrypt API keys if crypto is available
        if (isEncryptionAvailable()) {
            stored.encrypted = true;

            if (settings.youtubeApiKey) {
                const encrypted = await encrypt(settings.youtubeApiKey);
                if (encrypted) {
                    stored.youtubeApiKey = encrypted;
                } else {
                    logger.warn("[UserSettings] Encryption failed for YouTube key, storing unencrypted");
                    stored.youtubeApiKey = settings.youtubeApiKey;
                    stored.encrypted = false;
                }
            }

            if (settings.geminiApiKey) {
                const encrypted = await encrypt(settings.geminiApiKey);
                if (encrypted) {
                    stored.geminiApiKey = encrypted;
                } else {
                    logger.warn("[UserSettings] Encryption failed for Gemini key, storing unencrypted");
                    stored.geminiApiKey = settings.geminiApiKey;
                    stored.encrypted = false;
                }
            }
        } else {
            // Fallback: store unencrypted (less secure)
            stored.youtubeApiKey = settings.youtubeApiKey;
            stored.geminiApiKey = settings.geminiApiKey;
            stored.encrypted = false;
        }

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored));
        cachedSettings = settings;

        // Notify listeners that settings changed
        notifySettingsChange(settings);
    } catch (error) {
        logger.error("[UserSettings] Error saving user settings", error);
    }
}

