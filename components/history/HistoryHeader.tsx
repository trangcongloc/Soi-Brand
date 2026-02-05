"use client";

import { useRef } from "react";
import { colors } from "@/lib/theme";
import { MarketingReport } from "@/lib/types";

interface HistoryHeaderProps {
    isFiltered: boolean;
    historyCount: number;
    confirmDeleteAll: boolean;
    onDeleteAll: () => void;
    onCancelDeleteAll: () => void;
    onConfirmDeleteAll: () => void;
    onUpload?: (report: MarketingReport) => void;
    onError?: (msg: string) => void;
    lang: {
        title: string;
        savedReports: string;
        clearAll: string;
        uploadButtonTitle: string;
        invalidJson: string;
        cannotReadJson: string;
    };
}

export default function HistoryHeader({
    isFiltered,
    historyCount,
    confirmDeleteAll,
    onDeleteAll,
    onCancelDeleteAll,
    onConfirmDeleteAll,
    onUpload,
    onError,
    lang,
}: HistoryHeaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.report_part_1 && json.brand_name) {
                    onUpload?.(json as MarketingReport);
                } else {
                    onError?.(lang.invalidJson);
                }
            } catch {
                onError?.(lang.cannotReadJson);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: `1px solid ${colors.borderLight}`,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                }}
            >
                <h3
                    style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: colors.textMain,
                        margin: 0,
                    }}
                >
                    {isFiltered ? lang.savedReports : lang.title}
                </h3>
                <span
                    style={{
                        fontSize: "10px",
                        color: colors.textMuted,
                        fontWeight: "500",
                    }}
                >
                    {historyCount}
                </span>
            </div>

            {!isFiltered && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                    }}
                >
                    {onUpload && (
                        <>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: "0.25rem",
                                    cursor: "pointer",
                                    color: colors.textSecondary,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                title={lang.uploadButtonTitle}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                </svg>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".json"
                                style={{ display: "none" }}
                                aria-label="Upload JSON report"
                            />
                        </>
                    )}
                    {confirmDeleteAll ? (
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                            <button
                                onClick={onDeleteAll}
                                style={{
                                    padding: "0.25rem 0.5rem",
                                    fontSize: "10px",
                                    background: colors.error,
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                ✓
                            </button>
                            <button
                                onClick={onCancelDeleteAll}
                                style={{
                                    padding: "0.25rem 0.5rem",
                                    fontSize: "10px",
                                    background: colors.bgHover,
                                    color: colors.textMain,
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onConfirmDeleteAll}
                            style={{
                                background: "transparent",
                                border: "none",
                                padding: "0.25rem",
                                cursor: "pointer",
                                color: "#ef4444",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "10px",
                                gap: "0.25rem",
                            }}
                            title={lang.clearAll}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
