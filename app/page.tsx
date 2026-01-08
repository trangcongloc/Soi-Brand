"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import AnalysisForm from "@/components/AnalysisForm";
import LoadingState from "@/components/LoadingState";
import ReportDisplay from "@/components/ReportDisplay";
import { MarketingReport, AnalyzeResponse } from "@/lib/types";

export default function Home() {
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
                setError(response.data.error || "Có lỗi xảy ra khi phân tích");
            }
        } catch (err: any) {
            console.error("Analysis error:", err);
            setError(
                err.response?.data?.error ||
                    "Không thể kết nối với máy chủ. Vui lòng thử lại sau."
            );
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
            <header className="fixed top-0 left-0 right-0 bg-[#f7f7f7]/80 backdrop-blur-md z-50 h-[50px] border-b border-black/5">
                <div className="container h-full flex justify-between items-center">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                            setReport(null);
                            setError(null);
                        }}
                    >
                        <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-[16px] tracking-tight">
                            OurTube.
                        </span>
                    </div>
                </div>
            </header>

            <div
                className={`pt-[50px] flex-1 ${!report ? "center-screen" : ""}`}
            >
                {!report && !isLoading && (
                    <div className="container max-w-2xl mx-auto text-center fade-in py-16 md:py-24">
                        <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-tight mb-5 leading-[1.1] letter-spacing-[-0.03em]">
                            'Soi' Brand
                        </h1>
                        <p className="text-[#666] text-[15px] mb-14 max-w-lg mx-auto opacity-80 leading-relaxed">
                            Phân tích hoạt động marketing của đối thủ <br /> một
                            cách tinh gọn và hiệu quả.
                        </p>

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
                        <ReportDisplay report={report} />
                    </div>
                )}

                {report && !isLoading && (
                    <div className="fixed bottom-6 left-6 z-40">
                        <button
                            onClick={() => setReport(null)}
                            className="btn bg-white/90 backdrop-blur shadow-lg border border-gray-200 text-xs px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all flex items-center gap-2"
                        >
                            ← Phân tích kênh khác
                        </button>
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
