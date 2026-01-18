"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import AnalysisForm from "@/components/AnalysisForm";
import LoadingState from "@/components/LoadingState";
import ReportDisplay from "@/components/ReportDisplay";
import AnalysisHistory from "@/components/AnalysisHistory";
import { MarketingReport, AnalyzeResponse } from "@/lib/types";
import { useLang } from "@/lib/lang";
import { getUserSettings } from "@/lib/userSettings";
import { extractChannelId, extractUsername } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
    getCachedReportsForChannel,
    setCachedReport,
    clearExpiredReports,
    resolveChannelId,
} from "@/lib/cache";

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
};

interface FilterState {
    channelId: string;
    channelName: string;
    channelUrl: string;
    urlExtractedId: string;
}

export default function Home() {
    const lang = useLang();
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<MarketingReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterState | null>(null);

    // Clear expired cache on mount
    useEffect(() => {
        clearExpiredReports();
    }, []);

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
        setReport(null);
        setFilter(null);

        try {
            // Get user settings for API keys
            const userSettings = getUserSettings();

            const response = await axios.post<AnalyzeResponse>("/api/analyze", {
                channelUrl,
                youtubeApiKey: userSettings.youtubeApiKey,
                geminiApiKey: userSettings.geminiApiKey,
            });

            if (response.data.success && response.data.data) {
                const newReport = response.data.data;
                setReport(newReport);

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
            } else {
                setError(response.data.error || lang.form.errors.analysisError);
            }
        } catch (err: any) {
            logger.error("Analysis error:", err);

            const errorData = err.response?.data;
            const errorMessage = errorData?.error;

            let displayError = errorMessage;

            if (!err.response) {
                displayError = lang.form.errors.networkError;
            } else if (!displayError) {
                displayError = lang.form.errors.unknownError;
            }

            setError(displayError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearFilter = () => {
        setFilter(null);
    };

    const handleUpload = (uploadedReport: MarketingReport) => {
        setReport(uploadedReport);
        setError(null);
        setFilter(null);
    };

    return (
        <main id="main-content" className="min-h-screen flex flex-col">
            <div
                className={`flex-1 ${!report ? "center-screen" : ""}`}
                role="main"
            >
                <AnimatePresence mode="wait">
                    {!report && !isLoading && (
                        <motion.div
                            key="home"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={staggerContainer}
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
                                        filteredChannelName={filter?.channelName}
                                        onClearFilter={handleClearFilter}
                                        onReanalyze={filter ? () => performAnalysis(filter.channelUrl, filter.urlExtractedId) : undefined}
                                    />
                                </motion.div>
                            </div>
                            <motion.div
                                className="container max-w-lg mx-auto px-4 pb-16"
                                variants={fadeInUp}
                            >
                                <AnalysisHistory
                                    onLoadReport={(loadedReport) => {
                                        setReport(loadedReport);
                                        setError(null);
                                        setFilter(null);
                                    }}
                                    filteredChannelId={filter?.channelId}
                                    filteredChannelName={filter?.channelName}
                                    onClearFilter={handleClearFilter}
                                    onUpload={handleUpload}
                                    onError={(msg) => setError(msg)}
                                />
                            </motion.div>
                        </motion.div>
                    )}

                    {isLoading && (
                        <motion.div
                            key="loading"
                            className="container py-8"
                            aria-live="polite"
                            aria-busy="true"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <LoadingState />
                        </motion.div>
                    )}

                    {report && !isLoading && (
                        <motion.div
                            key="report"
                            className="container py-8"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <ReportDisplay
                                report={report}
                                onReset={() => setReport(null)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        className="toast-container"
                        role="alert"
                        aria-live="assertive"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div className="toast toast-error">
                            <span className="text-[12px]">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-1 opacity-50 hover:opacity-100"
                                aria-label="Dismiss error"
                            >
                                ✕
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
