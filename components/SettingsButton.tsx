"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage, LanguageCode } from "@/lib/lang";
import { getUserSettings, saveUserSettings } from "@/lib/userSettings";
import styles from "./SettingsButton.module.css";

export default function SettingsButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [geminiKey, setGeminiKey] = useState("");
    const [youtubeKey, setYoutubeKey] = useState("");
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const { langCode, setLanguage } = useLanguage();
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const handleSave = () => {
        setSaveStatus("saving");
        saveUserSettings({
            geminiApiKey: geminiKey || undefined,
            youtubeApiKey: youtubeKey || undefined,
        });

        setTimeout(() => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
        }, 300);
    };

    const handleLanguageSwitch = (code: LanguageCode) => {
        setLanguage(code);
    };

    const maskApiKey = (key: string) => {
        if (!key || key.length < 8) return key;
        return key.slice(0, 4) + "•".repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        {langCode === 'vi' ? 'Cài đặt' : 'Settings'}
                    </h3>
                    <button
                        className={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                        aria-label="Close"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* API Keys Section */}
                <div className={styles.section}>
                    <label className={styles.label}>
                        <span className={styles.labelIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </span>
                        Gemini API Key
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="AIza..."
                            className={styles.input}
                        />
                        {geminiKey && (
                            <span className={styles.keyPreview}>{maskApiKey(geminiKey)}</span>
                        )}
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>
                        <span className={styles.labelIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                            </svg>
                        </span>
                        YouTube API Key
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            type="password"
                            value={youtubeKey}
                            onChange={(e) => setYoutubeKey(e.target.value)}
                            placeholder="AIza..."
                            className={styles.input}
                        />
                        {youtubeKey && (
                            <span className={styles.keyPreview}>{maskApiKey(youtubeKey)}</span>
                        )}
                    </div>
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {langCode === 'vi' ? 'Đã lưu!' : 'Saved!'}
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            {langCode === 'vi' ? 'Lưu cài đặt' : 'Save Settings'}
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className={styles.divider}>
                    <span>{langCode === 'vi' ? 'Ngôn ngữ' : 'Language'}</span>
                </div>

                {/* Language Toggle */}
                <div className={styles.languageSection}>
                    <div className={styles.languageToggle}>
                        <div
                            className={`${styles.langSlider} ${langCode === 'en' ? styles.langSliderRight : ''}`}
                        />
                        <button
                            onClick={() => handleLanguageSwitch('vi')}
                            className={`${styles.langOption} ${langCode === 'vi' ? styles.langActive : ''}`}
                        >
                            <span className={styles.langFlag}>🇻🇳</span>
                            <span className={styles.langLabel}>Tiếng Việt</span>
                        </button>
                        <button
                            onClick={() => handleLanguageSwitch('en')}
                            className={`${styles.langOption} ${langCode === 'en' ? styles.langActive : ''}`}
                        >
                            <span className={styles.langFlag}>🇬🇧</span>
                            <span className={styles.langLabel}>English</span>
                        </button>
                    </div>
                </div>

                {/* Footer Note */}
                <p className={styles.footerNote}>
                    {langCode === 'vi'
                        ? 'API keys được lưu trữ cục bộ trên trình duyệt của bạn.'
                        : 'API keys are stored locally in your browser.'}
                </p>
            </div>

            {/* Backdrop */}
            {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} />}
        </>
    );
}
