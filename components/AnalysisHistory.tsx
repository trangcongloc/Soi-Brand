import React, { useState } from "react";
import { getCachedChannelList, getCachedReportByTimestamp, deleteCachedReportByTimestamp } from "@/lib/cache";
import { MarketingReport } from "@/lib/types";
import { useLanguage } from "@/lib/lang";
import { colors } from "@/lib/theme";

interface AnalysisHistoryProps {
    onLoadReport: (report: MarketingReport) => void;
    onHistoryChange?: () => void;
}

interface HistoryItem {
    channelId: string;
    brandName: string;
    timestamp: number;
    createdAt: string;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ onLoadReport, onHistoryChange }) => {
    const { langCode } = useLanguage();
    const [history, setHistory] = useState<HistoryItem[]>(() => getCachedChannelList());
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    if (history.length === 0) {
        return null;
    }

    const handleLoadReport = (channelId: string, timestamp: number) => {
        const report = getCachedReportByTimestamp(channelId, timestamp);
        if (report) {
            onLoadReport(report);
        }
    };

    const handleDeleteReport = (channelId: string, timestamp: number) => {
        deleteCachedReportByTimestamp(channelId, timestamp);
        setHistory(getCachedChannelList());
        setConfirmDelete(null);
        onHistoryChange?.();
    };

    const formatDate = (createdAt: string, timestamp: number) => {
        const date = new Date(createdAt || timestamp);
        const dateStr = date.toLocaleDateString("vi-VN");
        const timeStr = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        return `${dateStr} ${timeStr}`;
    };

    // Get first letter for avatar
    const getInitial = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    // Generate consistent color from string
    const getAvatarColor = (name: string) => {
        const colors = ["#e53935", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
        const index = name.length % colors.length;
        return colors[index];
    };

    return (
        <div style={{ marginTop: "2rem" }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: `1px solid ${colors.borderLight}`,
            }}>
                <h3 style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: colors.textMain,
                    margin: 0,
                }}>
                    {langCode === "vi" ? "Lịch sử phân tích" : "Analysis History"}
                </h3>
                <span style={{ fontSize: "10px", color: colors.textMuted, fontWeight: "500" }}>
                    {history.length}
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {history.map((item) => (
                    <div
                        key={`${item.channelId}_${item.timestamp}`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.5rem 0",
                            borderBottom: `1px solid ${colors.borderLight}`,
                            transition: "all 0.2s",
                        }}
                    >
                        {/* Avatar */}
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: getAvatarColor(item.brandName),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "14px",
                                fontWeight: "700",
                                flexShrink: 0,
                            }}
                        >
                            {getInitial(item.brandName)}
                        </div>

                        {/* Channel Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: colors.textMain,
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                                {item.brandName}
                            </p>
                            <p style={{
                                fontSize: "11px",
                                color: colors.textSecondary,
                                margin: "2px 0 0 0",
                            }}>
                                {formatDate(item.createdAt, item.timestamp)}
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                            {confirmDelete === item.timestamp ? (
                                <>
                                    <button
                                        onClick={() => handleDeleteReport(item.channelId, item.timestamp)}
                                        style={{
                                            padding: "0.375rem 0.625rem",
                                            fontSize: "11px",
                                            fontWeight: "600",
                                            background: colors.error,
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                        }}
                                        title={langCode === "vi" ? "Xác nhận xóa" : "Confirm delete"}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(null)}
                                        style={{
                                            padding: "0.375rem 0.625rem",
                                            fontSize: "11px",
                                            fontWeight: "600",
                                            background: colors.bgHover,
                                            color: colors.textMain,
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                        }}
                                        title={langCode === "vi" ? "Hủy" : "Cancel"}
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleLoadReport(item.channelId, item.timestamp)}
                                        style={{
                                            padding: "0.375rem 0.625rem",
                                            fontSize: "11px",
                                            fontWeight: "600",
                                            background: "transparent",
                                            color: colors.info,
                                            border: `1px solid ${colors.info}`,
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.25rem",
                                        }}
                                        title={langCode === "vi" ? "Xem báo cáo" : "View report"}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(item.timestamp)}
                                        style={{
                                            padding: "0.375rem 0.625rem",
                                            fontSize: "11px",
                                            fontWeight: "600",
                                            background: "transparent",
                                            color: colors.textSecondary,
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                        title={langCode === "vi" ? "Xóa" : "Delete"}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <p style={{
                fontSize: "10px",
                color: colors.textMuted,
                marginTop: "0.75rem",
                textAlign: "center",
            }}>
                {langCode === "vi"
                    ? "Tối đa 5 báo cáo/kênh • Lưu trong 24h"
                    : "Max 5 reports/channel • Cached for 24h"}
            </p>
        </div>
    );
};

export default AnalysisHistory;
