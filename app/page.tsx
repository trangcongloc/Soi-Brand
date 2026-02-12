"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import AnalysisForm from "@/components/AnalysisForm";
import SplashScreen from "@/components/SplashScreen";

// Lazy load heavy components for better initial bundle size
const LoadingState = dynamic(() => import("@/components/LoadingState"), {
    ssr: false,
});
const AnalysisHistory = dynamic(() => import("@/components/AnalysisHistory"), {
    ssr: false,
});
import { MarketingReport, AnalyzeResponse } from "@/lib/types";
import { useLanguage } from "@/lib/lang";
import { getUserSettings } from "@/lib/userSettings";
import { extractChannelId, extractUsername } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { updateYouTubeQuota, updateGeminiQuota } from "@/lib/apiQuota";
import { STORAGE_KEYS } from "@/lib/ui-config";
import {
    getCachedReportsForChannel,
    setCachedReport,
    clearExpiredReports,
    resolveChannelId,
} from "@/lib/cache";

const CURRENT_REPORT_KEY = STORAGE_KEYS.CURRENT_REPORT;

const staggerContainer = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.01,
        },
    },
};

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" as const },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.01 },
    },
};

interface FilterState {
    channelId: string;
    channelName: string;
    channelUrl: string;
    urlExtractedId: string;
}

export default function Home() {
    const router = useRouter();
    const { lang, langCode } = useLanguage();
    const [showSplash, setShowSplash] = useState(() => {
        if (typeof window === "undefined") return false;
        return !sessionStorage.getItem(STORAGE_KEYS.SPLASH_SHOWN);
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterState | null>(null);
    const lastAnalysisRef = useRef<{ channelUrl: string; urlExtractedId: string | null } | null>(null);

    // Clear expired cache on mount
    useEffect(() => {
        clearExpiredReports();
    }, []);

    // Auto dismiss error after 5 seconds (only for toast errors, not loading errors)
    useEffect(() => {
        if (error && !isLoading) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, isLoading]);

    const handleAnalyze = async (channelUrl: string) => {
        setError(null);

        // If already filtered for this channel, do re-analyze
        if (filter) {
            await performAnalysis(filter.channelUrl, filter.urlExtractedId);
            return;
        }

        // Extract URL ID and try to resolve to actual channel ID
        const urlExtractedId =
            extractChannelId(channelUrl) || extractUsername(channelUrl);
        if (urlExtractedId) {
            // Try to resolve URL ID to actual channel ID
            const actualChannelId =
                resolveChannelId(urlExtractedId) || urlExtractedId;

            // Check for cached reports using actual channel ID
            const cachedReports = getCachedReportsForChannel(actualChannelId);

            if (cachedReports.length > 0) {
                // Set filter to show only this channel's reports
                setFilter({
                    channelId: actualChannelId,
                    channelName: cachedReports[0].brandName,
                    channelUrl,
                    urlExtractedId,
                });
                return;
            }
        }

        // No cache, proceed with analysis
        await performAnalysis(channelUrl, urlExtractedId);
    };

    const performAnalysis = async (
        channelUrl: string,
        urlExtractedId: string | null
    ) => {
        setIsLoading(true);
        setError(null);
        setErrorType(null);
        setFilter(null);
        lastAnalysisRef.current = { channelUrl, urlExtractedId };

        try {
            // Get user settings for API keys
            const userSettings = getUserSettings();

            const response = await axios.post<AnalyzeResponse>("/api/analyze", {
                channelUrl,
                youtubeApiKey: userSettings.youtubeApiKey,
                geminiApiKey: userSettings.geminiApiKey,
                geminiModel: userSettings.geminiModel,
                language: langCode,
            });

            if (response.data.success && response.data.data) {
                const newReport = response.data.data;

                // Update API quota usage
                try {
                    updateYouTubeQuota(103);
                    updateGeminiQuota();
                    logger.log("API quota updated");
                } catch (quotaError) {
                    logger.error("Failed to update quota", quotaError);
                }

                // Cache the report using actual channel ID
                const actualChannelId =
                    newReport.report_part_1?.channel_info?.channelId;
                if (actualChannelId) {
                    setCachedReport(
                        actualChannelId,
                        newReport,
                        urlExtractedId || undefined
                    );
                    logger.log("Report cached for:", actualChannelId);
                }

                // Store current report and redirect to /report
                localStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(newReport));
                router.push("/report");
            } else {
                // Error from API response
                setError(response.data.error || lang.form.errors.analysisError);
                setErrorType(response.data.errorType || null);
            }
        } catch (err: any) {
            logger.error("Analysis error", err);

            const errorData = err.response?.data;
            const errorMessage = errorData?.error;
            const apiErrorType = errorData?.errorType;

            let displayError: string;
            let displayErrorType: string | null = apiErrorType || null;

            if (!err.response) {
                displayError = lang.form.errors.networkError;
                displayErrorType = 'NETWORK_ERROR';
            } else if (!errorMessage) {
                displayError = lang.form.errors.unknownError;
                displayErrorType = displayErrorType || 'UNKNOWN';
            } else if (typeof errorMessage === "string") {
                displayError = errorMessage;
            } else {
                displayError = errorMessage.message || lang.form.errors.unknownError;
            }

            setError(displayError);
            setErrorType(displayErrorType);
        }
    };

    const handleClearFilter = () => {
        setFilter(null);
    };

    const handleLoadReport = (loadedReport: MarketingReport) => {
        localStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(loadedReport));
        router.push("/report");
    };

    const handleUpload = (uploadedReport: MarketingReport) => {
        localStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(uploadedReport));
        router.push("/report");
    };

    return (
        <main id="main-content" className="min-h-screen flex flex-col">
            <AnimatePresence>
                {showSplash && (
                    <SplashScreen onComplete={() => {
                        sessionStorage.setItem(STORAGE_KEYS.SPLASH_SHOWN, "true");
                        setShowSplash(false);
                    }} />
                )}
            </AnimatePresence>

            <div
                className="flex-1 center-screen"
                role="main"
            >
                <AnimatePresence mode="wait">
                    {!isLoading && !showSplash && (
                        <motion.div
                            key="home"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={staggerContainer}
                            transition={{ duration: 0.12 }}
                        >
                            <div className="container max-w-2xl mx-auto text-center py-16 md:py-24">
                                {lang.home.title && (
                                    <motion.h1
                                        className="text-[36px] md:text-[52px] font-extrabold tracking-tight mb-5 leading-[1.1] letter-spacing-[-0.03em]"
                                        variants={fadeInUp}
                                    >
                                        {lang.home.title}
                                    </motion.h1>
                                )}
                                <motion.div
                                    className="max-w-md mx-auto mb-8 px-4"
                                    variants={fadeInUp}
                                >
                                    <AnalysisForm
                                        onSubmit={handleAnalyze}
                                        onError={(msg) => setError(msg)}
                                        isLoading={isLoading}
                                        filteredChannelName={
                                            filter?.channelName
                                        }
                                        onClearFilter={handleClearFilter}
                                        onReanalyze={
                                            filter
                                                ? () =>
                                                      performAnalysis(
                                                          filter.channelUrl,
                                                          filter.urlExtractedId
                                                      )
                                                : undefined
                                        }
                                    />
                                </motion.div>
                            </div>
                            <motion.div
                                className="container max-w-lg mx-auto px-4 pb-16"
                                variants={fadeInUp}
                            >
                                <AnalysisHistory
                                    onLoadReport={handleLoadReport}
                                    filteredChannelId={filter?.channelId}
                                    filteredChannelName={filter?.channelName}
                                    onClearFilter={handleClearFilter}
                                    onUpload={handleUpload}
                                    onError={(msg) => setError(msg)}
                                />
                            </motion.div>
                        </motion.div>
                    )}

                    {isLoading && !showSplash && (
                        <motion.div
                            key="loading"
                            className="container py-8"
                            aria-live="polite"
                            aria-busy="true"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <LoadingState
                                error={error}
                                errorType={errorType}
                                onRetry={
                                    lastAnalysisRef.current
                                        ? () => {
                                              const { channelUrl, urlExtractedId } =
                                                  lastAnalysisRef.current!;
                                              performAnalysis(channelUrl, urlExtractedId);
                                          }
                                        : undefined
                                }
                                onCancel={() => {
                                    setIsLoading(false);
                                    setError(null);
                                    setErrorType(null);
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {error && !isLoading && (
                    <div className="toast-container">
                        <motion.div
                            className="toast toast-error"
                            role="alert"
                            aria-live="assertive"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <span className="text-[12px]">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-1 opacity-50 hover:opacity-100"
                                aria-label="Dismiss error"
                            >
                                ✕
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
