import React from "react";
import { useLanguage } from "@/lib/lang";
import { colors } from "@/lib/theme";

interface CachedReportOption {
    timestamp: number;
    createdAt: string;
}

interface CachePromptDialogProps {
    channelName: string;
    cachedReports: CachedReportOption[];
    onSelectReport: (timestamp: number) => void;
    onReanalyze: () => void;
    onCancel: () => void;
}

const CachePromptDialog: React.FC<CachePromptDialogProps> = ({
    channelName,
    cachedReports,
    onSelectReport,
    onReanalyze,
    onCancel,
}) => {
    const { langCode } = useLanguage();

    const formatDate = (dateStr: string, timestamp: number) => {
        const date = new Date(dateStr || timestamp);
        const dateFormatted = date.toLocaleDateString("vi-VN");
        const timeFormatted = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        return `${dateFormatted} ${timeFormatted}`;
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: colors.overlay,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "1rem",
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    background: colors.bgCard,
                    borderRadius: "16px",
                    padding: "1.5rem",
                    maxWidth: "420px",
                    width: "100%",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    maxHeight: "80vh",
                    overflow: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            background: colors.infoLight,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 1rem",
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.info} strokeWidth="2">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: colors.textMain, margin: 0 }}>
                        {langCode === "vi" ? "Đã có báo cáo cho kênh này" : "Reports exist for this channel"}
                    </h3>
                    <p style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "0.5rem" }}>
                        <strong style={{ color: colors.textMain }}>{channelName}</strong>
                    </p>
                </div>

                {/* Cached report options */}
                <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "12px", color: colors.textLight, marginBottom: "0.75rem" }}>
                        {langCode === "vi"
                            ? `${cachedReports.length} báo cáo đã lưu:`
                            : `${cachedReports.length} cached report${cachedReports.length > 1 ? 's' : ''}:`}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {cachedReports.map((report, idx) => (
                            <button
                                key={report.timestamp}
                                onClick={() => onSelectReport(report.timestamp)}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1rem",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    background: idx === 0 ? colors.info : colors.bgMuted,
                                    color: idx === 0 ? "#ffffff" : colors.textMain,
                                    border: idx === 0 ? "none" : `1px solid ${colors.borderLight}`,
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "0.5rem",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>{formatDate(report.createdAt, report.timestamp)}</span>
                                </div>
                                {idx === 0 && (
                                    <span style={{
                                        fontSize: "10px",
                                        padding: "2px 6px",
                                        background: "rgba(255,255,255,0.2)",
                                        borderRadius: "4px"
                                    }}>
                                        {langCode === "vi" ? "Mới nhất" : "Latest"}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Re-analyze button */}
                <button
                    onClick={onReanalyze}
                    style={{
                        width: "100%",
                        padding: "0.875rem 1rem",
                        fontSize: "13px",
                        fontWeight: "600",
                        background: colors.brand,
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {langCode === "vi" ? "Phân tích lại (dữ liệu mới)" : "Re-analyze (fresh data)"}
                </button>

                {/* Cancel button */}
                <button
                    onClick={onCancel}
                    style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        fontSize: "13px",
                        fontWeight: "500",
                        background: "transparent",
                        color: colors.textSecondary,
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                    }}
                >
                    {langCode === "vi" ? "Hủy" : "Cancel"}
                </button>
            </div>
        </div>
    );
};

export default CachePromptDialog;
