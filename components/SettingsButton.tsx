"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage, LanguageCode } from "@/lib/lang";
import { getUserSettings, saveUserSettings } from "@/lib/userSettings";
import {
    getQuotaPercentage,
    getQuotaColor,
    getQuotaUsage,
    updateGeminiQuotaLimits,
} from "@/lib/apiQuota";
import { GEMINI_MODELS, DEFAULT_MODEL } from "@/lib/geminiModels";
import { GeminiModel } from "@/lib/types";
import {
    validateYouTubeApiKey,
    validateGeminiApiKey,
} from "@/lib/apiValidation";
import styles from "./SettingsButton.module.css";

interface QuotaState {
    youtube: number | null;
    gemini: number | null;
    loading: boolean;
}

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
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
        "idle",
    );
    const [validation, setValidation] = useState<ValidationState>({
        youtube: "idle",
        gemini: "idle",
    });
    const [quota, setQuota] = useState<QuotaState>({
        youtube: null,
        gemini: null,
        loading: false,
    });
    const { langCode, setLanguage } = useLanguage();
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    // Load saved keys from localStorage
    useEffect(() => {
        // Migrate old keys to new format if they exist
        const oldGemini = localStorage.getItem("gemini_api_key");
        const oldYoutube = localStorage.getItem("youtube_api_key");

        if (oldGemini || oldYoutube) {
            // Migrate to new format
            saveUserSettings({
                geminiApiKey: oldGemini || undefined,
                youtubeApiKey: oldYoutube || undefined,
            });
            // Remove old keys
            localStorage.removeItem("gemini_api_key");
            localStorage.removeItem("youtube_api_key");
        }

        const settings = getUserSettings();
        setGeminiKey(settings.geminiApiKey || "");
        setYoutubeKey(settings.youtubeApiKey || "");
        setSelectedModel(settings.geminiModel || DEFAULT_MODEL);
    }, []);

    // Fetch quota when panel opens
    useEffect(() => {
        if (isOpen) {
            fetchQuota();
        }
    }, [isOpen]);

    const fetchQuota = () => {
        setQuota({ youtube: null, gemini: null, loading: true });

        try {
            const youtubePercentage = getQuotaPercentage("youtube");
            const geminiPercentage = getQuotaPercentage("gemini");

            // Get tier from quota storage to persist tier info
            const quotaUsage = getQuotaUsage();
            if (quotaUsage.gemini.tier) {
                setValidation((prev) => ({
                    ...prev,
                    geminiTier: quotaUsage.gemini.tier,
                }));
            }

            setQuota({
                youtube: youtubePercentage,
                gemini: geminiPercentage,
                loading: false,
            });
        } catch (error) {
            console.error("Failed to fetch quota:", error);
            setQuota({ youtube: null, gemini: null, loading: false });
        }
    };

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

    const handleSave = async () => {
        setSaveStatus("saving");

        // Reset validation state
        setValidation({
            youtube: youtubeKey ? "validating" : "idle",
            gemini: geminiKey ? "validating" : "idle",
        });

        // Validate API keys in parallel
        const validationPromises: Promise<void>[] = [];
        let detectedTier: "free" | "paid" | undefined;

        if (youtubeKey) {
            validationPromises.push(
                validateYouTubeApiKey(youtubeKey).then((result) => {
                    setValidation((prev) => ({
                        ...prev,
                        youtube: result.valid ? "valid" : "invalid",
                        youtubeError: result.error,
                    }));
                }),
            );
        }

        if (geminiKey) {
            validationPromises.push(
                validateGeminiApiKey(geminiKey).then((result) => {
                    detectedTier = result.tier; // Store tier for quota update
                    setValidation((prev) => ({
                        ...prev,
                        gemini: result.valid ? "valid" : "invalid",
                        geminiError: result.error,
                        geminiTier: result.tier,
                    }));
                }),
            );
        }

        // Wait for all validations to complete
        await Promise.all(validationPromises);

        // Update Gemini quota limits based on detected tier and selected model
        if (detectedTier && selectedModel) {
            updateGeminiQuotaLimits(selectedModel, detectedTier);
        }

        // Save settings regardless of validation (user might want to save invalid keys)
        saveUserSettings({
            geminiApiKey: geminiKey || undefined,
            youtubeApiKey: youtubeKey || undefined,
            geminiModel: selectedModel,
        });

        setSaveStatus("saved");
        fetchQuota(); // Refresh quota after saving

        setTimeout(() => {
            setSaveStatus("idle");
        }, 3000);
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

    const renderValidationBadge = (provider: "youtube" | "gemini") => {
        const status =
            provider === "youtube" ? validation.youtube : validation.gemini;
        const error =
            provider === "youtube"
                ? validation.youtubeError
                : validation.geminiError;

        if (status === "idle") return null;

        if (status === "validating") {
            return (
                <div className={styles.validationBadge}>
                    <span className={styles.spinner} />
                    <span className={styles.validationText}>
                        {langCode === "vi"
                            ? "Đang xác thực..."
                            : "Verifying..."}
                    </span>
                </div>
            );
        }

        if (status === "valid") {
            return (
                <div
                    className={`${styles.validationBadge} ${styles.validationSuccess}`}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className={styles.validationText}>
                        {langCode === "vi" ? "Hợp lệ" : "Valid"}
                    </span>
                </div>
            );
        }

        if (status === "invalid") {
            return (
                <div
                    className={`${styles.validationBadge} ${styles.validationError}`}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span className={styles.validationText}>
                        {error ||
                            (langCode === "vi" ? "Không hợp lệ" : "Invalid")}
                    </span>
                </div>
            );
        }

        return null;
    };

    const formatLastReset = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) {
            return langCode === "vi" ? "Vừa xong" : "just now";
        } else if (diffMins < 60) {
            return langCode === "vi"
                ? `${diffMins} Phút`
                : `${diffMins} Min ago`;
        } else if (diffHours < 24) {
            return langCode === "vi"
                ? `${diffHours} Giờ`
                : `${diffHours} Hours ago`;
        } else {
            return date.toLocaleDateString(
                langCode === "vi" ? "vi-VN" : "en-US",
                {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                },
            );
        }
    };

    const renderQuotaBadge = (
        provider: "youtube" | "gemini",
        hasKey: boolean,
    ) => {
        if (!hasKey) {
            return (
                <span className={styles.quotaBadge}>
                    {langCode === "vi" ? "chưa cấu hình" : "not configured"}
                </span>
            );
        }

        if (quota.loading) {
            return (
                <span className={styles.quotaBadge}>
                    {langCode === "vi" ? "đang kiểm tra..." : "checking..."}
                </span>
            );
        }

        const percentage =
            provider === "youtube" ? quota.youtube : quota.gemini;
        if (percentage === null) return null;

        const color = getQuotaColor(percentage);
        const quotaData = getQuotaUsage();

        let used: number;
        let total: number;
        let lastReset: string;
        let usedDaily: number | undefined;
        let totalDaily: number | undefined;

        if (provider === "youtube") {
            used = quotaData.youtube.used;
            total = quotaData.youtube.total;
            lastReset = quotaData.youtube.lastReset;
        } else {
            used = quotaData.gemini.requestsUsed;
            total = quotaData.gemini.requestsTotal;
            usedDaily = quotaData.gemini.requestsUsedDaily;
            totalDaily = quotaData.gemini.requestsTotalDaily;
            lastReset = quotaData.gemini.lastReset;
        }

        const remaining = total - used;
        const remainingDaily =
            totalDaily !== undefined && usedDaily !== undefined
                ? totalDaily - usedDaily
                : undefined;
        const formattedLastReset = formatLastReset(lastReset);

        // Get model-specific rate limits for Gemini
        let modelRateLimits = null;
        if (provider === "gemini") {
            const model = GEMINI_MODELS.find((m) => m.id === selectedModel);
            const tier = validation.geminiTier || "free";
            const rpm = tier === "free" ? model?.rpmFree : model?.rpmPaid;
            const rpd = tier === "free" ? model?.rpdFree : model?.rpdPaid;

            if (rpm !== undefined || rpd !== undefined) {
                modelRateLimits = { rpm, rpd, modelName: model?.name, tier };
            }
        }

        // Determine tier text
        let tierText = "";
        if (provider === "gemini" && validation.geminiTier) {
            tierText =
                validation.geminiTier === "free"
                    ? langCode === "vi"
                        ? " Miễn phí"
                        : " Free"
                    : langCode === "vi"
                      ? " Trả phí"
                      : " Paid";
        }

        return (
            <span className={styles.quotaBadgeWrapper}>
                <span
                    className={styles.quotaBadge}
                    style={{ backgroundColor: color }}
                >
                    {percentage}%{tierText}
                </span>
                <div className={styles.quotaTooltip}>
                    {provider === "gemini" ? (
                        <>
                            <div className={styles.tooltipRow}>
                                <span className={styles.tooltipLabel}>
                                    {langCode === "vi"
                                        ? "Đã dùng (RPM):"
                                        : "Used (RPM):"}
                                </span>
                                <span className={styles.tooltipValue}>
                                    {used.toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.tooltipRow}>
                                <span className={styles.tooltipLabel}>
                                    {langCode === "vi"
                                        ? "Tổng cộng (RPM):"
                                        : "Total (RPM):"}
                                </span>
                                <span className={styles.tooltipValue}>
                                    {total.toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.tooltipRow}>
                                <span className={styles.tooltipLabel}>
                                    {langCode === "vi"
                                        ? "Còn lại (RPM):"
                                        : "Remaining (RPM):"}
                                </span>
                                <span className={styles.tooltipValue}>
                                    {remaining.toLocaleString()}
                                </span>
                            </div>
                            {usedDaily !== undefined &&
                                totalDaily !== undefined &&
                                remainingDaily !== undefined && (
                                    <>
                                        <div
                                            className={styles.tooltipDivider}
                                        />
                                        <div className={styles.tooltipRow}>
                                            <span
                                                className={styles.tooltipLabel}
                                            >
                                                {langCode === "vi"
                                                    ? "Đã dùng (RPD):"
                                                    : "Used (RPD):"}
                                            </span>
                                            <span
                                                className={styles.tooltipValue}
                                            >
                                                {usedDaily.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={styles.tooltipRow}>
                                            <span
                                                className={styles.tooltipLabel}
                                            >
                                                {langCode === "vi"
                                                    ? "Tổng cộng (RPD):"
                                                    : "Total (RPD):"}
                                            </span>
                                            <span
                                                className={styles.tooltipValue}
                                            >
                                                {totalDaily.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={styles.tooltipRow}>
                                            <span
                                                className={styles.tooltipLabel}
                                            >
                                                {langCode === "vi"
                                                    ? "Còn lại (RPD):"
                                                    : "Remaining (RPD):"}
                                            </span>
                                            <span
                                                className={styles.tooltipValue}
                                            >
                                                {remainingDaily.toLocaleString()}
                                            </span>
                                        </div>
                                    </>
                                )}
                        </>
                    ) : (
                        <>
                            <div className={styles.tooltipRow}>
                                <span className={styles.tooltipLabel}>
                                    {langCode === "vi" ? "Đã dùng:" : "Used:"}
                                </span>
                                <span className={styles.tooltipValue}>
                                    {used.toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.tooltipRow}>
                                <span className={styles.tooltipLabel}>
                                    {langCode === "vi"
                                        ? "Tổng cộng:"
                                        : "Total:"}
                                </span>
                                <span className={styles.tooltipValue}>
                                    {total.toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.tooltipRow}>
                                <span className={styles.tooltipLabel}>
                                    {langCode === "vi"
                                        ? "Còn lại:"
                                        : "Remaining:"}
                                </span>
                                <span className={styles.tooltipValue}>
                                    {remaining.toLocaleString()}
                                </span>
                            </div>
                        </>
                    )}
                    <div className={styles.tooltipDivider} />
                    <div className={styles.tooltipRow}>
                        <span className={styles.tooltipLabel}>
                            {langCode === "vi" ? "Làm mới:" : "Reset:"}
                        </span>
                        <span className={styles.tooltipValue}>
                            {formattedLastReset}
                        </span>
                    </div>
                    {provider === "youtube" && (
                        <div className={styles.tooltipNote}>
                            {langCode === "vi"
                                ? "Làm mới hàng ngày lúc 12:00 AM PT"
                                : "Resets daily at 12:00 AM PT"}
                        </div>
                    )}
                    {provider === "gemini" && modelRateLimits && (
                        <>
                            <div className={styles.tooltipDivider} />
                            <div className={styles.tooltipSection}>
                                <div className={styles.tooltipSectionTitle}>
                                    {modelRateLimits.modelName}
                                    <span
                                        className={`${styles.tierBadgeSmall} ${styles[`tierBadge${modelRateLimits.tier === "free" ? "Free" : "Paid"}`]}`}
                                    >
                                        {langCode === "vi"
                                            ? modelRateLimits.tier === "free"
                                                ? "miễn phí"
                                                : "trả phí"
                                            : modelRateLimits.tier}
                                    </span>
                                </div>
                                {modelRateLimits.rpm !== undefined && (
                                    <div className={styles.tooltipRow}>
                                        <span className={styles.tooltipLabel}>
                                            RPM:
                                        </span>
                                        <span className={styles.tooltipValue}>
                                            {modelRateLimits.rpm}{" "}
                                            {langCode === "vi"
                                                ? "yêu cầu/phút"
                                                : "req/min"}
                                        </span>
                                    </div>
                                )}
                                {modelRateLimits.rpd !== undefined && (
                                    <div className={styles.tooltipRow}>
                                        <span className={styles.tooltipLabel}>
                                            RPD:
                                        </span>
                                        <span className={styles.tooltipValue}>
                                            {modelRateLimits.rpd.toLocaleString()}{" "}
                                            {langCode === "vi"
                                                ? "yêu cầu/ngày"
                                                : "req/day"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    {provider === "gemini" && !modelRateLimits && (
                        <div className={styles.tooltipNote}>
                            {langCode === "vi"
                                ? "Làm mới mỗi phút"
                                : "Resets every minute"}
                        </div>
                    )}
                </div>
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
                        {langCode === "vi" ? "Cài đặt" : "Settings"}
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
                        {langCode === "vi" ? "Mô hình AI" : "AI Model"}
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
                                {langCode === "vi"
                                    ? GEMINI_MODELS.find(
                                          (m) => m.id === selectedModel,
                                      )?.tier === "free"
                                        ? "miễn phí"
                                        : "trả phí"
                                    : GEMINI_MODELS.find(
                                            (m) => m.id === selectedModel,
                                        )?.tier === "free"
                                      ? "free"
                                      : "paid"}
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
                                        onClick={() => {
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
                                                fetchQuota(); // Refresh quota display
                                            }

                                            // Auto-save model selection
                                            const settings = getUserSettings();
                                            saveUserSettings({
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
                                                {langCode === "vi"
                                                    ? model.tier === "free"
                                                        ? "miễn phí"
                                                        : "trả phí"
                                                    : model.tier === "free"
                                                      ? "free"
                                                      : "paid"}
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
                        {renderQuotaBadge("gemini", !!geminiKey)}
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
                            placeholder="AIza..."
                            className={styles.input}
                        />
                        {geminiKey && (
                            <span className={styles.keyPreview}>
                                {maskApiKey(geminiKey)}
                            </span>
                        )}
                    </div>
                    {renderValidationBadge("gemini")}
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
                        {renderQuotaBadge("youtube", !!youtubeKey)}
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
                            placeholder="AIza..."
                            className={styles.input}
                        />
                        {youtubeKey && (
                            <span className={styles.keyPreview}>
                                {maskApiKey(youtubeKey)}
                            </span>
                        )}
                    </div>
                    {renderValidationBadge("youtube")}
                </div>

                {/* Save Button */}
                <button
                    className={`${styles.saveButton} ${saveStatus === "saved" ? styles.saved : ""}`}
                    onClick={handleSave}
                    disabled={saveStatus === "saving"}
                >
                    {saveStatus === "saving" ? (
                        <span className={styles.spinner} />
                    ) : saveStatus === "saved" ? (
                        <>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {langCode === "vi" ? "Đã lưu!" : "Saved!"}
                        </>
                    ) : (
                        <>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            {langCode === "vi"
                                ? "Lưu cài đặt"
                                : "Save Settings"}
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className={styles.divider}>
                    <span>{langCode === "vi" ? "Ngôn ngữ" : "Language"}</span>
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
                    {langCode === "vi"
                        ? "API keys được lưu trữ cục bộ trên trình duyệt của bạn."
                        : "API keys are stored locally in your browser."}
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
