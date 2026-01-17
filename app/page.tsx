"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import AnalysisForm from "@/components/AnalysisForm";
import LoadingState from "@/components/LoadingState";
import ReportDisplay from "@/components/ReportDisplay";
import AnalysisHistory from "@/components/AnalysisHistory";
import CachePromptDialog from "@/components/CachePromptDialog";
import { MarketingReport, AnalyzeResponse } from "@/lib/types";
import { useLang } from "@/lib/lang";
import { getUserSettings } from "@/lib/userSettings";
import {
    getCachedReportsForChannel,
    getCachedReportByTimestamp,
    setCachedReport,
    clearExpiredReports,
    resolveChannelId,
} from "@/lib/cache";

interface CachedReportOption {
    timestamp: number;
    createdAt: string;
}

interface CachePromptState {
    show: boolean;
    channelUrl: string;
    urlExtractedId: string;
    actualChannelId: string;
    channelName: string;
    cachedReports: CachedReportOption[];
}

export default function Home() {
    const lang = useLang();
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<MarketingReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cachePrompt, setCachePrompt] = useState<CachePromptState>({
        show: false,
        channelUrl: "",
        urlExtractedId: "",
        actualChannelId: "",
        channelName: "",
        cachedReports: [],
    });

    // Clear expired cache on mount
    useEffect(() => {
        clearExpiredReports();
    }, []);

    // Extract channel ID from URL for caching
    const extractChannelIdFromUrl = (url: string): string | null => {
        const patterns = [
            /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
            /youtube\.com\/@([a-zA-Z0-9_-]+)/,
            /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
            /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const handleAnalyze = async (channelUrl: string) => {
        setError(null);

        // Extract URL ID and try to resolve to actual channel ID
        const urlExtractedId = extractChannelIdFromUrl(channelUrl);
        if (urlExtractedId) {
            // Try to resolve URL ID to actual channel ID
            const actualChannelId =
                resolveChannelId(urlExtractedId) || urlExtractedId;

            // Check for cached reports using actual channel ID
            const cachedReports = getCachedReportsForChannel(actualChannelId);

            if (cachedReports.length > 0) {
                // Show prompt dialog with all cached reports
                setCachePrompt({
                    show: true,
                    channelUrl,
                    urlExtractedId,
                    actualChannelId,
                    channelName: cachedReports[0].brandName,
                    cachedReports: cachedReports.map((r) => ({
                        timestamp: r.timestamp,
                        createdAt: r.createdAt,
                    })),
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
                    console.log("Report cached for:", actualChannelId);
                }
            } else {
                setError(response.data.error || lang.form.errors.analysisError);
            }
        } catch (err: any) {
            console.error("Analysis error:", err);

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

    const handleSelectReport = (timestamp: number) => {
        const report = getCachedReportByTimestamp(
            cachePrompt.actualChannelId,
            timestamp
        );
        if (report) {
            setReport(report);
        }
        setCachePrompt({
            show: false,
            channelUrl: "",
            urlExtractedId: "",
            actualChannelId: "",
            channelName: "",
            cachedReports: [],
        });
    };

    const handleReanalyze = async () => {
        const { channelUrl, urlExtractedId } = cachePrompt;
        setCachePrompt({
            show: false,
            channelUrl: "",
            urlExtractedId: "",
            actualChannelId: "",
            channelName: "",
            cachedReports: [],
        });

        await performAnalysis(channelUrl, urlExtractedId);
    };

    const handleCancelPrompt = () => {
        setCachePrompt({
            show: false,
            channelUrl: "",
            urlExtractedId: "",
            actualChannelId: "",
            channelName: "",
            cachedReports: [],
        });
    };

    const handleUpload = (uploadedReport: MarketingReport) => {
        setReport(uploadedReport);
        setError(null);
    };

    return (
        <main id="main-content" className="min-h-screen flex flex-col">
            <div
                className={`flex-1 ${!report ? "center-screen" : ""}`}
                role="main"
            >
                {!report && !isLoading && (
                    <div className="container max-w-2xl mx-auto text-center fade-in py-16 md:py-24">
                        <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-tight mb-5 leading-[1.1] letter-spacing-[-0.03em]">
                            {lang.home.title}
                        </h1>
                        <div className="max-w-md mx-auto mb-8 px-4">
                            <AnalysisForm
                                onSubmit={handleAnalyze}
                                onUpload={handleUpload}
                                onError={(msg) => setError(msg)}
                                isLoading={isLoading}
                            />
                        </div>
                        <div className="max-w-lg mx-auto px-4">
                            <AnalysisHistory
                                onLoadReport={(loadedReport) => {
                                    setReport(loadedReport);
                                    setError(null);
                                }}
                            />
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div
                        className="container py-8"
                        aria-live="polite"
                        aria-busy="true"
                    >
                        <LoadingState />
                    </div>
                )}

                {report && !isLoading && (
                    <div className="container py-8 fade-in">
                        <ReportDisplay
                            report={report}
                            onReset={() => setReport(null)}
                        />
                    </div>
                )}
            </div>

            {error && (
                <div
                    className="toast-container"
                    role="alert"
                    aria-live="assertive"
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
                </div>
            )}

            {/* Cache Prompt Dialog */}
            {cachePrompt.show && cachePrompt.cachedReports.length > 0 && (
                <CachePromptDialog
                    channelName={cachePrompt.channelName}
                    cachedReports={cachePrompt.cachedReports}
                    onSelectReport={handleSelectReport}
                    onReanalyze={handleReanalyze}
                    onCancel={handleCancelPrompt}
                />
            )}
        </main>
    );
}
