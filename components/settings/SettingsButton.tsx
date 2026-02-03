"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage, useLang } from "@/lib/lang";
import { getUserSettingsAsync, saveUserSettingsAsync } from "@/lib/userSettings";
import { getQuotaUsage, updateGeminiQuotaLimits } from "@/lib/apiQuota";
import { isUsingCloudStorage } from "@/lib/veo";
import { DEFAULT_MODEL, DEFAULT_IMAGE_MODEL } from "@/lib/geminiModels";
import { GeminiModel, GeminiImageModel } from "@/lib/types";
import { useSettingsValidation } from "./useSettingsValidation";
import ModelSelector from "./ModelSelector";
import ImageModelSelector from "./ImageModelSelector";
import ApiKeyInput from "./ApiKeyInput";
import LanguageToggle from "./LanguageToggle";
import styles from "./SettingsButton.module.css";

export default function SettingsButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [geminiKey, setGeminiKey] = useState("");
    const [youtubeKey, setYoutubeKey] = useState("");
    const [databaseKey, setDatabaseKey] = useState("");
    const [databaseKeyStatus, setDatabaseKeyStatus] = useState<"not-configured" | "synced" | "error">("not-configured");
    const [selectedModel, setSelectedModel] =
        useState<GeminiModel>(DEFAULT_MODEL);
    const [selectedImageModel, setSelectedImageModel] =
        useState<GeminiImageModel>(DEFAULT_IMAGE_MODEL);
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [imageModelDropdownOpen, setImageModelDropdownOpen] = useState(false);

    const { langCode, setLanguage } = useLanguage();
    const lang = useLang();
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { validation, saveAndValidateKey, resetValidation, setGeminiTier } =
        useSettingsValidation(selectedModel);

    // Load saved keys from localStorage
    useEffect(() => {
        const loadSettings = async () => {
            const oldGemini = localStorage.getItem("gemini_api_key");
            const oldYoutube = localStorage.getItem("youtube_api_key");

            if (oldGemini || oldYoutube) {
                await saveUserSettingsAsync({
                    geminiApiKey: oldGemini || undefined,
                    youtubeApiKey: oldYoutube || undefined,
                });
                localStorage.removeItem("gemini_api_key");
                localStorage.removeItem("youtube_api_key");
            }

            const settings = await getUserSettingsAsync();
            setGeminiKey(settings.geminiApiKey || "");
            setYoutubeKey(settings.youtubeApiKey || "");
            setDatabaseKey(settings.databaseKey || "");
            setSelectedModel(settings.geminiModel || DEFAULT_MODEL);
            setSelectedImageModel(settings.geminiImageModel || DEFAULT_IMAGE_MODEL);

            // Validate database key on load
            if (settings.databaseKey) {
                const isValid = await isUsingCloudStorage();
                setDatabaseKeyStatus(isValid ? "synced" : "error");
            } else {
                setDatabaseKeyStatus("not-configured");
            }
        };

        loadSettings();
    }, []);

    // Load tier from storage when panel opens
    useEffect(() => {
        if (isOpen) {
            const quotaUsage = getQuotaUsage();
            if (quotaUsage.gemini.tier) {
                setGeminiTier(quotaUsage.gemini.tier);
            }
        }
    }, [isOpen, setGeminiTier]);

    // Cross-tab synchronization
    useEffect(() => {
        const handleStorageChange = async (e: StorageEvent) => {
            if (e.key === "soibrand_user_settings") {
                const settings = await getUserSettingsAsync();
                setGeminiKey(settings.geminiApiKey || "");
                setYoutubeKey(settings.youtubeApiKey || "");
                setDatabaseKey(settings.databaseKey || "");
                setSelectedModel(settings.geminiModel || DEFAULT_MODEL);
                setSelectedImageModel(settings.geminiImageModel || DEFAULT_IMAGE_MODEL);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                isOpen &&
                panelRef.current &&
                buttonRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
            if (e.key === "Escape" && modelDropdownOpen) {
                setModelDropdownOpen(false);
            }
            if (e.key === "Escape" && imageModelDropdownOpen) {
                setImageModelDropdownOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, modelDropdownOpen, imageModelDropdownOpen]);

    const handleModelSelect = async (modelId: GeminiModel) => {
        setSelectedModel(modelId);
        setModelDropdownOpen(false);

        const currentQuota = getQuotaUsage();
        if (currentQuota.gemini.tier) {
            updateGeminiQuotaLimits(modelId, currentQuota.gemini.tier);
        }

        const settings = await getUserSettingsAsync();
        await saveUserSettingsAsync({
            ...settings,
            geminiModel: modelId,
        });
    };

    const handleImageModelSelect = async (modelId: GeminiImageModel) => {
        setSelectedImageModel(modelId);
        setImageModelDropdownOpen(false);

        const settings = await getUserSettingsAsync();
        await saveUserSettingsAsync({
            ...settings,
            geminiImageModel: modelId,
        });
    };

    const handleDatabaseKeyBlur = async (value: string) => {
        const settings = await getUserSettingsAsync();
        await saveUserSettingsAsync({
            ...settings,
            databaseKey: value || undefined,
        });

        // Validate the key
        if (!value) {
            setDatabaseKeyStatus("not-configured");
        } else {
            // Check if key has permissions (is valid)
            const isValid = await isUsingCloudStorage();
            setDatabaseKeyStatus(isValid ? "synced" : "error");
        }

        // Trigger a custom event to notify VeoHistoryPanel to refresh
        window.dispatchEvent(new CustomEvent('database-key-changed', {
            detail: { hasKey: !!value }
        }));
    };

    return (
        <>
            {/* Settings Button */}
            <button
                ref={buttonRef}
                className={`${styles.settingsButton} ${isOpen ? styles.active : ""}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Settings"
                aria-expanded={isOpen}
            >
                <svg
                    className={styles.settingsIcon}
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </button>

            {/* Settings Panel */}
            <div
                ref={panelRef}
                className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
            >
                {/* Panel Header */}
                <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        {lang.settings.title}
                    </h3>
                    <button
                        className={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                        aria-label="Close"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* AI Model Selection */}
                <ModelSelector
                    selectedModel={selectedModel}
                    isOpen={modelDropdownOpen}
                    onToggle={() => setModelDropdownOpen(!modelDropdownOpen)}
                    onSelect={handleModelSelect}
                    langCode={langCode}
                    lang={{
                        aiModel: lang.settings.aiModel,
                        free: lang.settings.free,
                        paid: lang.settings.paid,
                    }}
                />

                {/* Image Generation Model Selection */}
                <ImageModelSelector
                    selectedModel={selectedImageModel}
                    isOpen={imageModelDropdownOpen}
                    onToggle={() => setImageModelDropdownOpen(!imageModelDropdownOpen)}
                    onSelect={handleImageModelSelect}
                    langCode={langCode}
                    lang={{
                        imageModel: lang.settings.imageModel || "Image Model",
                        free: lang.settings.free,
                        paid: lang.settings.paid,
                    }}
                />

                {/* Gemini API Key */}
                <ApiKeyInput
                    provider="gemini"
                    label="Gemini API Key"
                    value={geminiKey}
                    onChange={setGeminiKey}
                    onBlur={(value) => saveAndValidateKey("gemini", value)}
                    onResetValidation={() => resetValidation("gemini")}
                    validation={validation}
                    lang={{
                        verifying: lang.settings.verifying,
                        invalid: lang.settings.invalid,
                        notConfigured: lang.settings.notConfigured,
                        configured: lang.settings.configured,
                        free: lang.settings.free,
                        paid: lang.settings.paid,
                    }}
                    icon={
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    }
                />

                {/* YouTube API Key */}
                <ApiKeyInput
                    provider="youtube"
                    label="YouTube API Key"
                    value={youtubeKey}
                    onChange={setYoutubeKey}
                    onBlur={(value) => saveAndValidateKey("youtube", value)}
                    onResetValidation={() => resetValidation("youtube")}
                    validation={validation}
                    lang={{
                        verifying: lang.settings.verifying,
                        invalid: lang.settings.invalid,
                        notConfigured: lang.settings.notConfigured,
                        configured: lang.settings.configured,
                        free: lang.settings.free,
                        paid: lang.settings.paid,
                    }}
                    icon={
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                        </svg>
                    }
                />

                {/* Database Key */}
                <div className={styles.section}>
                    <label className={styles.label}>
                        <span className={styles.labelIcon}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                        {lang.settings.databaseKey || "Database Key"}
                        {databaseKeyStatus === "not-configured" && (
                            <span className={styles.quotaBadge}>
                                {lang.settings.notConfigured}
                            </span>
                        )}
                        {databaseKeyStatus === "synced" && (
                            <span className={`${styles.tierBadge} ${styles.tierBadgeFree}`}>
                                {lang.settings.synced || "Synced"}
                            </span>
                        )}
                        {databaseKeyStatus === "error" && (
                            <span className={`${styles.tierBadge} ${styles.tierBadgeInvalid}`}>
                                {lang.settings.error || "ERROR"}
                            </span>
                        )}
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder={lang.settings.databaseKeyPlaceholder || "Enter your database key..."}
                            value={databaseKey}
                            onChange={(e) => setDatabaseKey(e.target.value)}
                            onBlur={(e) => handleDatabaseKeyBlur(e.target.value)}
                        />
                    </div>
                </div>

                {/* Language Toggle */}
                <LanguageToggle
                    langCode={langCode}
                    onSwitch={setLanguage}
                    label={lang.settings.language}
                />

                {/* Footer Note */}
                <p className={styles.footerNote}>{lang.settings.footerNote}</p>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className={styles.backdrop}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
