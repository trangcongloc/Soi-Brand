"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import AnalysisForm from "@/components/AnalysisForm";
import LoadingState from "@/components/LoadingState";
import ReportDisplay from "@/components/ReportDisplay";
import { MarketingReport, AnalyzeResponse } from "@/lib/types";
import { useLang } from "@/lib/lang";

export default function Home() {
    const lang = useLang();
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<MarketingReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async (channelUrl: string) => {
        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await axios.post<AnalyzeResponse>("/api/analyze", {
                channelUrl,
            });

            if (response.data.success && response.data.data) {
                const reportData = response.data.data;
                setReport(reportData);
            } else {
                setError(response.data.error || lang.form.errors.analysisError);
            }
        } catch (err: any) {
            console.error("Analysis error:", err);

            // Try to get error from response
            const errorData = err.response?.data;
            const errorMessage = errorData?.error;
            const errorType = errorData?.errorType;

            // Display error message
            let displayError = errorMessage;

            // Fallback for network errors without response
            if (!err.response) {
                displayError = lang.form.errors.networkError;
            }
            // Fallback for unknown errors
            else if (!displayError) {
                displayError = lang.form.errors.unknownError;
            }

            setError(displayError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = (uploadedReport: MarketingReport) => {
        setReport(uploadedReport);
        setError(null);
    };

    return (
        <main className="min-h-screen flex flex-col">
            {/* Ultracompact Header - Clean Branding (50px) */}
            <div
                className={`pt-[50px] flex-1 ${!report ? "center-screen" : ""}`}
            >
                {!report && !isLoading && (
                    <div className="container max-w-2xl mx-auto text-center fade-in py-16 md:py-24">
                        <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-tight mb-5 leading-[1.1] letter-spacing-[-0.03em]">
                            {lang.home.title}
                        </h1>
                        <div className="max-w-md mx-auto mb-16 px-4">
                            <AnalysisForm
                                onSubmit={handleAnalyze}
                                onUpload={handleUpload}
                                onError={(msg) => setError(msg)}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="container py-8">
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
                <div className="toast-container">
                    <div className="toast toast-error">
                        <span className="text-[12px]">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-1 opacity-50 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            <footer className="py-4"></footer>
        </main>
    );
}
