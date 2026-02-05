"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getUserSettingsAsync, saveUserSettingsAsync } from "@/lib/userSettings";
import { updateGeminiQuotaLimits } from "@/lib/apiQuota";
import {
    validateYouTubeApiKey,
    validateGeminiApiKey,
} from "@/lib/apiValidation";
import { GeminiModel } from "@/lib/types";
import { GEMINI_MODELS, DEFAULT_MODEL } from "@/lib/geminiModels";

export interface ValidationState {
    youtube: "idle" | "validating" | "valid" | "invalid";
    gemini: "idle" | "validating" | "valid" | "invalid";
    youtubeError?: string;
    geminiError?: string;
    geminiTier?: "free" | "paid";
}

export function useSettingsValidation(selectedModel: GeminiModel | null) {
    const [validation, setValidation] = useState<ValidationState>({
        youtube: "idle",
        gemini: "idle",
    });

    // Hide validation badges after 5 seconds (keep tier info)
    // FIX: Use refs to track stable status values and avoid effect churn
    const youtubeStatusRef = useRef(validation.youtube);
    const geminiStatusRef = useRef(validation.gemini);

    useEffect(() => {
        youtubeStatusRef.current = validation.youtube;
        geminiStatusRef.current = validation.gemini;
    }, [validation.youtube, validation.gemini]);

    useEffect(() => {
        const hasActiveValidation =
            validation.youtube !== "idle" || validation.gemini !== "idle";
        const hasNonValidatingStatus =
            validation.youtube === "valid" ||
            validation.youtube === "invalid" ||
            validation.gemini === "valid" ||
            validation.gemini === "invalid";

        if (hasActiveValidation && hasNonValidatingStatus) {
            const timer = setTimeout(() => {
                // Use refs to get current status at timeout time
                setValidation((prev) => ({
                    youtube: "idle",
                    gemini: "idle",
                    geminiTier: prev.geminiTier,
                    youtubeError: prev.youtubeError,
                    geminiError: prev.geminiError,
                }));
            }, 5000);

            return () => clearTimeout(timer);
        }
        // Only trigger on status changes, not entire validation object
    }, [validation.youtube, validation.gemini]);

    const saveAndValidateKey = useCallback(
        async (provider: "youtube" | "gemini", key: string): Promise<{ modelChanged?: boolean; newModel?: GeminiModel }> => {
            const settings = await getUserSettingsAsync();
            if (provider === "youtube") {
                await saveUserSettingsAsync({
                    ...settings,
                    youtubeApiKey: key || undefined,
                });
            } else {
                await saveUserSettingsAsync({
                    ...settings,
                    geminiApiKey: key || undefined,
                });
            }

            if (!key) {
                setValidation((prev) => ({
                    ...prev,
                    [provider]: "idle",
                    [`${provider}Error`]: undefined,
                    ...(provider === "gemini" ? { geminiTier: undefined } : {}),
                }));
                return {};
            }

            setValidation((prev) => ({ ...prev, [provider]: "validating" }));

            if (provider === "youtube") {
                const result = await validateYouTubeApiKey(key);
                setValidation((prev) => ({
                    ...prev,
                    youtube: result.valid ? "valid" : "invalid",
                    youtubeError: result.error,
                }));
                return {};
            } else {
                const result = await validateGeminiApiKey(key);
                setValidation((prev) => ({
                    ...prev,
                    gemini: result.valid ? "valid" : "invalid",
                    geminiError: result.error,
                    geminiTier: result.tier,
                }));

                // Check if current model is compatible with the detected tier
                let modelChanged = false;
                let newModel: GeminiModel | undefined;

                if (result.tier && selectedModel) {
                    const currentModelInfo = GEMINI_MODELS.find(m => m.id === selectedModel);

                    // If free tier detected but current model is paid, switch to default free model
                    if (result.tier === "free" && currentModelInfo?.tier === "paid") {
                        newModel = DEFAULT_MODEL;
                        modelChanged = true;

                        // Update settings with the new model
                        await saveUserSettingsAsync({
                            ...settings,
                            geminiModel: newModel,
                        });

                        updateGeminiQuotaLimits(newModel, result.tier);
                    } else {
                        updateGeminiQuotaLimits(selectedModel, result.tier);
                    }
                }

                return { modelChanged, newModel };
            }
        },
        [selectedModel]
    );

    const resetValidation = useCallback((provider: "youtube" | "gemini") => {
        setValidation((prev) => ({
            ...prev,
            [provider]: "idle",
        }));
    }, []);

    const setGeminiTier = useCallback((tier: "free" | "paid" | undefined) => {
        setValidation((prev) => ({
            ...prev,
            geminiTier: tier,
        }));
    }, []);

    return {
        validation,
        saveAndValidateKey,
        resetValidation,
        setGeminiTier,
    };
}

export function maskApiKey(key: string): string {
    if (!key || key.length < 8) return key;
    return (
        key.slice(0, 4) +
        "•".repeat(Math.min(key.length - 8, 20)) +
        key.slice(-4)
    );
}
