"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage, useLang, LanguageCode } from "@/lib/lang";
import { getUserSettingsAsync, saveUserSettingsAsync } from "@/lib/userSettings";
import { getQuotaUsage, updateGeminiQuotaLimits } from "@/lib/apiQuota";
import { GEMINI_MODELS, DEFAULT_MODEL } from "@/lib/geminiModels";
import { GeminiModel } from "@/lib/types";
import {
    validateYouTubeApiKey,
    validateGeminiApiKey,
} from "@/lib/apiValidation";
import styles from "./SettingsButton.module.css";

interface ValidationState {
    youtube: "idle" | "validating" | "valid" | "invalid";
    gemini: "idle" | "validating" | "valid" | "invalid";
    youtubeError?: string;
    geminiError?: string;
    geminiTier?: "free" | "paid";
}

export default function SettingsButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [geminiKey, setGeminiKey] = useState("");
    const [youtubeKey, setYoutubeKey] = useState("");
    const [selectedModel, setSelectedModel] =
        useState<GeminiModel>(DEFAULT_MODEL);
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [validation, setValidation] = useState<ValidationState>({
        youtube: "idle",
        gemini: "idle",
    });
    const { langCode, setLanguage } = useLanguage();
    const lang = useLang();
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    // Load saved keys from localStorage
    useEffect(() => {
        const loadSettings = async () => {
            // Migrate old keys to new format if they exist
            const oldGemini = localStorage.getItem("gemini_api_key");
            const oldYoutube = localStorage.getItem("youtube_api_key");

            if (oldGemini || oldYoutube) {
                // Migrate to new format
                await saveUserSettingsAsync({
                    geminiApiKey: oldGemini || undefined,
                    youtubeApiKey: oldYoutube || undefined,
                });
                // Remove old keys
                localStorage.removeItem("gemini_api_key");
                localStorage.removeItem("youtube_api_key");
            }

            const settings = await getUserSettingsAsync();
            setGeminiKey(settings.geminiApiKey || "");
            setYoutubeKey(settings.youtubeApiKey || "");
            setSelectedModel(settings.geminiModel || DEFAULT_MODEL);
        };

        loadSettings();
    }, []);

    // Load tier from storage when panel opens
    useEffect(() => {
        if (isOpen) {
            const quotaUsage = getQuotaUsage();
            if (quotaUsage.gemini.tier) {
                setValidation((prev) => ({
                    ...prev,
                    geminiTier: quotaUsage.gemini.tier,
                }));
            }
        }
    }, [isOpen]);

    // Cross-tab synchronization for settings changes
    useEffect(() => {
        const handleStorageChange = async (e: StorageEvent) => {
            if (e.key === 'soibrand_user_settings') {
                const settings = await getUserSettingsAsync();
                setGeminiKey(settings.geminiApiKey || "");
                setYoutubeKey(settings.youtubeApiKey || "");
                setSelectedModel(settings.geminiModel || DEFAULT_MODEL);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
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
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, modelDropdownOpen]);

    // Close model dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                modelDropdownOpen &&
                modelDropdownRef.current &&
                !modelDropdownRef.current.contains(e.target as Node)
            ) {
                setModelDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [modelDropdownOpen]);

    // Hide validation badges after 5 seconds (keep tier info)
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
                setValidation((prev) => ({
                    youtube: "idle",
                    gemini: "idle",
                    // Keep tier and error info
                    geminiTier: prev.geminiTier,
                    youtubeError: prev.youtubeError,
                    geminiError: prev.geminiError,
                }));
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [validation]);

    // Auto-save and validate API key
    const saveAndValidateKey = async (
        provider: "youtube" | "gemini",
        key: string,
    ) => {
        // Save immediately
        const settings = await getUserSettingsAsync();
        if (provider === "youtube") {
            await saveUserSettingsAsync({ ...settings, youtubeApiKey: key || undefined });
        } else {
            await saveUserSettingsAsync({ ...settings, geminiApiKey: key || undefined });
        }

        // Validate if key is present
        if (!key) {
            setValidation((prev) => ({
                ...prev,
                [provider]: "idle",
                [`${provider}Error`]: undefined,
                ...(provider === "gemini" ? { geminiTier: undefined } : {}),
            }));
            return;
        }

        setValidation((prev) => ({ ...prev, [provider]: "validating" }));

        if (provider === "youtube") {
            const result = await validateYouTubeApiKey(key);
            setValidation((prev) => ({
                ...prev,
                youtube: result.valid ? "valid" : "invalid",
                youtubeError: result.error,
            }));
        } else {
            const result = await validateGeminiApiKey(key);
            setValidation((prev) => ({
                ...prev,
                gemini: result.valid ? "valid" : "invalid",
                geminiError: result.error,
                geminiTier: result.tier,
            }));

            // Update quota limits based on tier
            if (result.tier && selectedModel) {
                updateGeminiQuotaLimits(selectedModel, result.tier);
            }
        }
    };

    const handleLanguageSwitch = (code: LanguageCode) => {
        setLanguage(code);
    };

    const maskApiKey = (key: string) => {
        if (!key || key.length < 8) return key;
        return (
            key.slice(0, 4) +
            "•".repeat(Math.min(key.length - 8, 20)) +
            key.slice(-4)
        );
    };

    const renderApiKeyBadge = (
        provider: "youtube" | "gemini",
        hasKey: boolean,
    ) => {
        const status =
            provider === "youtube" ? validation.youtube : validation.gemini;

        // Show spinner while validating
        if (status === "validating") {
            return (
                <span className={`${styles.tierBadge} ${styles.tierBadgeValidating}`}>
                    <span className={styles.spinnerSmall} />
                    {lang.settings.verifying}
                </span>
            );
        }

        // Show error when invalid
        if (status === "invalid") {
            const error =
                provider === "youtube"
                    ? validation.youtubeError
                    : validation.geminiError;
            return (
                <span className={`${styles.tierBadge} ${styles.tierBadgeInvalid}`}>
                    {error || lang.settings.invalid.toLowerCase()}
                </span>
            );
        }

        // No key configured
        if (!hasKey) {
            return (
                <span className={styles.quotaBadge}>
                    {lang.settings.notConfigured}
                </span>
            );
        }

        // Valid or idle with key: show tier badge for Gemini
        if (provider === "gemini" && validation.geminiTier) {
            const isFree = validation.geminiTier === "free";
            return (
                <span
                    className={`${styles.tierBadge} ${styles[isFree ? "tierBadgeFree" : "tierBadgePaid"]}`}
                >
                    {isFree ? lang.settings.free : lang.settings.paid}
                </span>
            );
        }

        // YouTube or Gemini without tier info: show configured
        return (
            <span className={`${styles.tierBadge} ${styles.tierBadgeFree}`}>
                {lang.settings.configured}
            </span>
        );
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
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                        </span>
                        {lang.settings.aiModel}
                    </label>
                    <div
                        className={styles.customDropdown}
                        ref={modelDropdownRef}
                    >
                        <button
                            className={`${styles.dropdownButton} ${modelDropdownOpen ? styles.dropdownButtonOpen : ""}`}
                            onClick={() =>
                                setModelDropdownOpen(!modelDropdownOpen)
                            }
                            type="button"
                        >
                            <span className={styles.dropdownButtonText}>
                                {GEMINI_MODELS.find(
                                    (m) => m.id === selectedModel,
                                )?.name || "Select Model"}
                            </span>
                            <span
                                className={`${styles.tierBadge} ${styles[`tierBadge${GEMINI_MODELS.find((m) => m.id === selectedModel)?.tier === "free" ? "Free" : "Paid"}`]}`}
                            >
                                {GEMINI_MODELS.find((m) => m.id === selectedModel)?.tier === "free"
                                    ? lang.settings.free
                                    : lang.settings.paid}
                            </span>
                            <svg
                                className={`${styles.dropdownIcon} ${modelDropdownOpen ? styles.dropdownIconOpen : ""}`}
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                            >
                                <path
                                    d="M2 4L6 8L10 4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        {modelDropdownOpen && (
                            <div className={styles.dropdownMenu}>
                                {GEMINI_MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        className={`${styles.dropdownItem} ${model.id === selectedModel ? styles.dropdownItemSelected : ""}`}
                                        onClick={async () => {
                                            setSelectedModel(model.id);
                                            setModelDropdownOpen(false);

                                            // Update quota limits when model changes
                                            const currentQuota =
                                                getQuotaUsage();
                                            if (currentQuota.gemini.tier) {
                                                updateGeminiQuotaLimits(
                                                    model.id,
                                                    currentQuota.gemini.tier,
                                                );
                                            }

                                            // Auto-save model selection
                                            const settings = await getUserSettingsAsync();
                                            await saveUserSettingsAsync({
                                                ...settings,
                                                geminiModel: model.id,
                                            });
                                        }}
                                        type="button"
                                    >
                                        <div
                                            className={
                                                styles.dropdownItemContent
                                            }
                                        >
                                            <span
                                                className={
                                                    styles.dropdownItemName
                                                }
                                            >
                                                {model.name}
                                            </span>
                                            <span
                                                className={`${styles.tierBadge} ${styles[`tierBadge${model.tier === "free" ? "Free" : "Paid"}`]}`}
                                            >
                                                {model.tier === "free"
                                                    ? lang.settings.free
                                                    : lang.settings.paid}
                                            </span>
                                        </div>
                                        <div
                                            className={styles.dropdownItemDesc}
                                        >
                                            {langCode === "vi"
                                                ? model.descriptionVi
                                                : model.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* API Keys Section */}
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
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </span>
                        Gemini API Key
                        {renderApiKeyBadge("gemini", !!geminiKey)}
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => {
                                setGeminiKey(e.target.value);
                                setValidation((prev) => ({
                                    ...prev,
                                    gemini: "idle",
                                }));
                            }}
                            onBlur={(e) =>
                                saveAndValidateKey("gemini", e.target.value)
                            }
                            placeholder="AIza..."
                            className={styles.input}
                        />
                        {geminiKey && (
                            <span className={styles.keyPreview}>
                                {maskApiKey(geminiKey)}
                            </span>
                        )}
                    </div>
                </div>

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
                                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                            </svg>
                        </span>
                        YouTube API Key
                        {renderApiKeyBadge("youtube", !!youtubeKey)}
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="password"
                            value={youtubeKey}
                            onChange={(e) => {
                                setYoutubeKey(e.target.value);
                                setValidation((prev) => ({
                                    ...prev,
                                    youtube: "idle",
                                }));
                            }}
                            onBlur={(e) =>
                                saveAndValidateKey("youtube", e.target.value)
                            }
                            placeholder="AIza..."
                            className={styles.input}
                        />
                        {youtubeKey && (
                            <span className={styles.keyPreview}>
                                {maskApiKey(youtubeKey)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className={styles.divider}>
                    <span>{lang.settings.language}</span>
                </div>

                {/* Language Toggle */}
                <div className={styles.languageSection}>
                    <div className={styles.languageToggle}>
                        <div
                            className={`${styles.langSlider} ${langCode === "en" ? styles.langSliderRight : ""}`}
                        />
                        <button
                            onClick={() => handleLanguageSwitch("vi")}
                            className={`${styles.langOption} ${langCode === "vi" ? styles.langActive : ""}`}
                        >
                            <span className={styles.langFlag}>🇻🇳</span>
                            <span className={styles.langLabel}>Tiếng Việt</span>
                        </button>
                        <button
                            onClick={() => handleLanguageSwitch("en")}
                            className={`${styles.langOption} ${langCode === "en" ? styles.langActive : ""}`}
                        >
                            <span className={styles.langFlag}>🇬🇧</span>
                            <span className={styles.langLabel}>English</span>
                        </button>
                    </div>
                </div>

                {/* Footer Note */}
                <p className={styles.footerNote}>
                    {lang.settings.footerNote}
                </p>
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
