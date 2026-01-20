"use client";

import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { isValidYouTubeUrl } from "@/lib/utils";
import styles from "./AnalysisForm.module.css";
import { useLang } from "@/lib/lang";

// Smooth spring transition for layout animations
const layoutTransition = {
    type: "spring" as const,
    stiffness: 500,
    damping: 40,
    mass: 1,
};

interface AnalysisFormProps {
    onSubmit: (url: string) => void;
    onError: (msg: string) => void;
    isLoading: boolean;
    filteredChannelName?: string;
    onClearFilter?: () => void;
    onReanalyze?: () => void;
}

function AnalysisForm({
    onSubmit,
    onError,
    isLoading,
    filteredChannelName,
    onClearFilter,
    onReanalyze,
}: AnalysisFormProps) {
    const lang = useLang();
    const [url, setUrl] = useState("");

    // Display channel name when filter is active
    const isFilterMode = !!filteredChannelName;

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            onError(lang.form.errors.emptyUrl);
            return;
        }

        // More strict regex for youtube channel urls
        const ytRegex =
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(@|channel\/|c\/|user\/)[a-zA-Z0-9_-]+/;
        if (!ytRegex.test(url) && !isValidYouTubeUrl(url)) {
            onError(lang.form.errors.invalidUrl);
            return;
        }

        onSubmit(url);
    }, [url, onError, onSubmit, lang.form.errors.emptyUrl, lang.form.errors.invalidUrl]);

    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
    }, []);

    return (
        <LayoutGroup>
            <motion.div
                className={styles.container}
                role="search"
                layout
                transition={layoutTransition}
            >
                <motion.form
                    onSubmit={handleSubmit}
                    className={styles.form}
                    aria-label="YouTube Channel Analysis"
                    layout
                    transition={layoutTransition}
                >
                    <motion.div
                        className={styles.inputGroup}
                        layout
                        transition={layoutTransition}
                    >
                        <label htmlFor="channel-url" className="sr-only">
                            {isFilterMode ? "Channel Name" : "YouTube Channel URL"}
                        </label>
                        <AnimatePresence mode="wait">
                            {isFilterMode ? (
                                <motion.div
                                    key="channel-name"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    className={styles.channelNameDisplay}
                                >
                                    {onClearFilter && (
                                        <button
                                            type="button"
                                            onClick={onClearFilter}
                                            className={styles.backButton}
                                            aria-label="Go back"
                                            title="Back"
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                            >
                                                <path d="M19 12H5M12 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    )}
                                    <span className={styles.channelNameText}>
                                        {filteredChannelName}
                                    </span>
                                    {onReanalyze && (
                                        <button
                                            type="button"
                                            onClick={onReanalyze}
                                            className={styles.arrowButton}
                                            disabled={isLoading}
                                            aria-label={isLoading ? lang.form.submitButtonLoading : lang.form.submitButton}
                                            title="Reanalyze"
                                        >
                                            {isLoading ? (
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    className={styles.spinner}
                                                >
                                                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                >
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="url-input"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className={styles.inputWrapper}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <input
                                            id="channel-url"
                                            type="text"
                                            value={url}
                                            onChange={handleUrlChange}
                                            placeholder={lang.form.placeholder}
                                            className="input"
                                            disabled={isLoading}
                                            aria-describedby="url-hint"
                                            autoComplete="url"
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {url.trim().length > 0 && (
                                            <motion.div
                                                initial={{ width: 0, marginLeft: 0 }}
                                                animate={{ width: 32, marginLeft: "0.4rem" }}
                                                exit={{ width: 0, marginLeft: 0 }}
                                                transition={{ duration: 0.15, ease: "easeInOut" }}
                                                style={{ overflow: "hidden", flexShrink: 0 }}
                                            >
                                                <motion.button
                                                    type="submit"
                                                    className={styles.arrowButton}
                                                    disabled={isLoading}
                                                    aria-label={isLoading ? lang.form.submitButtonLoading : lang.form.submitButton}
                                                    aria-busy={isLoading}
                                                    title="Analyze"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ duration: 0.15, ease: "easeInOut" }}
                                                >
                                                {isLoading ? (
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        className={styles.spinner}
                                                    >
                                                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                    >
                                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                                    </svg>
                                                )}
                                            </motion.button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <span id="url-hint" className="sr-only">
                            {isFilterMode
                                ? "Showing cached channel reports"
                                : "Enter a YouTube channel URL like youtube.com/@username"}
                        </span>
                    </motion.div>
                </motion.form>
            </motion.div>
        </LayoutGroup>
    );
}

export default memo(AnalysisForm);
