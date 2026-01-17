import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    getCachedChannelList,
    getCachedReportByTimestamp,
    deleteCachedReportByTimestamp,
    clearAllReports,
} from "@/lib/cache";
import { MarketingReport } from "@/lib/types";
import { useLanguage } from "@/lib/lang";
import { colors } from "@/lib/theme";

interface AnalysisHistoryProps {
    onLoadReport: (report: MarketingReport) => void;
    onHistoryChange?: () => void;
    // Filter props - when set, only show reports for this channel
    filteredChannelId?: string;
    filteredChannelName?: string;
    onClearFilter?: () => void;
}

interface HistoryItem {
    channelId: string;
    brandName: string;
    timestamp: number;
    createdAt: string;
    channelAvatar?: string;
}

// Animation variants using custom prop for direction
// direction: 1 = forward (history->cache), -1 = backward (cache->history)
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 40 : -40,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -40 : 40,
        opacity: 0,
    }),
};

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
    onLoadReport,
    onHistoryChange,
    filteredChannelId,
    filteredChannelName,
    onClearFilter,
}) => {
    const { langCode } = useLanguage();
    const [allHistory, setAllHistory] = useState<HistoryItem[]>(() =>
        getCachedChannelList()
    );
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Track direction for animations using a ref (updated synchronously during render)
    const directionRef = useRef<1 | -1>(1); // 1 = forward, -1 = backward
    const prevIsFilteredRef = useRef<boolean>(!!filteredChannelId);
    const pageSize = 5;

    // Compute direction synchronously when filter changes (before animation starts)
    const isFiltered = !!filteredChannelId;
    if (isFiltered !== prevIsFilteredRef.current) {
        directionRef.current = isFiltered ? 1 : -1;
        prevIsFilteredRef.current = isFiltered;
    }
    const direction = directionRef.current;

    // Use filteredChannelId directly for content
    const history = filteredChannelId
        ? allHistory.filter((item) => item.channelId === filteredChannelId)
        : allHistory;

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredChannelId]);

    if (history.length === 0 && !isFiltered) {
        return null;
    }

    const totalPages = Math.ceil(history.length / pageSize);
    const paginatedHistory = history.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleLoadReport = (channelId: string, timestamp: number) => {
        const report = getCachedReportByTimestamp(channelId, timestamp);
        if (report) {
            onLoadReport(report);
        }
    };

    const handleDeleteReport = (channelId: string, timestamp: number) => {
        deleteCachedReportByTimestamp(channelId, timestamp);
        const newHistory = getCachedChannelList();
        setAllHistory(newHistory);
        setConfirmDelete(null);

        // Adjust page if necessary
        const filteredNew = filteredChannelId
            ? newHistory.filter((item) => item.channelId === filteredChannelId)
            : newHistory;
        const newTotalPages = Math.ceil(filteredNew.length / pageSize);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            handlePageChange(newTotalPages);
        }

        // If filtered and no more reports, clear filter
        if (filteredChannelId && filteredNew.length === 0) {
            onClearFilter?.();
        }

        onHistoryChange?.();
    };

    const handleClearAll = () => {
        clearAllReports();
        setAllHistory([]);
        setConfirmDeleteAll(false);
        setCurrentPage(1);
        onHistoryChange?.();
    };

    const handlePageChange = (newPage: number) => {
        if (newPage === currentPage) return;

        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentPage(newPage);
            setIsTransitioning(false);
        }, 150);
    };

    const formatDate = (createdAt: string, timestamp: number) => {
        const date = new Date(createdAt || timestamp);
        const dateStr = date.toLocaleDateString("vi-VN");
        const timeStr = date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${dateStr} ${timeStr}`;
    };

    const getInitial = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const avatarColors = [
            "#e53935",
            "#f59e0b",
            "#10b981",
            "#3b82f6",
            "#8b5cf6",
            "#ec4899",
        ];
        const index = name.length % avatarColors.length;
        return avatarColors[index];
    };

    return (
        <div style={{ marginTop: "2rem", width: "512px", overflow: "hidden" }}>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                    key={isFiltered ? "filtered" : "all"}
                    custom={direction}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    variants={slideVariants}
                    transition={{ duration: 0.23, ease: [0.4, 0, 0.2, 1] }}
                >
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
                            {isFiltered && onClearFilter && (
                                <button
                                    onClick={onClearFilter}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        padding: "0.25rem",
                                        cursor: "pointer",
                                        color: colors.textSecondary,
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                    title={
                                        langCode === "vi"
                                            ? "Quay lại"
                                            : "Go back"
                                    }
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M19 12H5M12 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            <h3
                                style={{
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: colors.textMain,
                                    margin: 0,
                                }}
                            >
                                {isFiltered
                                    ? filteredChannelName ||
                                      (langCode === "vi"
                                          ? "Báo cáo đã lưu"
                                          : "Cached Reports")
                                    : langCode === "vi"
                                    ? "Lịch sử phân tích"
                                    : "Analysis History"}
                            </h3>
                            <span
                                style={{
                                    fontSize: "10px",
                                    color: colors.textMuted,
                                    fontWeight: "500",
                                }}
                            >
                                {history.length}
                            </span>
                        </div>

                        {!isFiltered && (
                            <>
                                {confirmDeleteAll ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "0.375rem",
                                        }}
                                    >
                                        <button
                                            onClick={handleClearAll}
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
                                            onClick={() =>
                                                setConfirmDeleteAll(false)
                                            }
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
                                        onClick={() =>
                                            setConfirmDeleteAll(true)
                                        }
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            padding: "0.25rem",
                                            cursor: "pointer",
                                            color: colors.textSecondary,
                                            display: "flex",
                                            alignItems: "center",
                                            fontSize: "10px",
                                            gap: "0.25rem",
                                        }}
                                        title={
                                            langCode === "vi"
                                                ? "Xóa tất cả"
                                                : "Clear all"
                                        }
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
                            </>
                        )}
                    </div>

                    {history.length === 0 && isFiltered ? (
                        <div
                            style={{
                                minHeight: "220px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: colors.textMuted,
                                fontSize: "12px",
                            }}
                        >
                            {langCode === "vi"
                                ? "Không có báo cáo"
                                : "No reports"}
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                minHeight: "220px",
                                opacity: isTransitioning ? 0.4 : 1,
                                transform: isTransitioning
                                    ? "translateY(-10px)"
                                    : "translateY(0)",
                                transition:
                                    "opacity 0.3s ease, transform 0.3s ease",
                            }}
                        >
                            {paginatedHistory.map((item, idx) => (
                                <div
                                    key={`${item.channelId}_${item.timestamp}`}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "0.5rem",
                                        padding: "0.5rem 0",
                                        borderBottom: `1px solid ${colors.borderLight}`,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {/* Left Side: Avatar + Channel Name (or just date if filtered) */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            overflow: "hidden",
                                            minWidth: 0,
                                            flex: "1 1 auto",
                                            maxWidth: "320px",
                                        }}
                                    >
                                        {!isFiltered && (
                                            <>
                                                {item.channelAvatar ? (
                                                    <img
                                                        src={item.channelAvatar}
                                                        alt={item.brandName}
                                                        style={{
                                                            width: "22px",
                                                            height: "22px",
                                                            borderRadius: "50%",
                                                            objectFit: "cover",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: "22px",
                                                            height: "22px",
                                                            borderRadius: "50%",
                                                            background:
                                                                getAvatarColor(
                                                                    item.brandName
                                                                ),
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            color: "white",
                                                            fontSize: "9px",
                                                            fontWeight: "700",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {getInitial(
                                                            item.brandName
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {isFiltered ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke={
                                                        idx === 0
                                                            ? colors.info
                                                            : colors.textSecondary
                                                    }
                                                    strokeWidth="2"
                                                    style={{ flexShrink: 0 }}
                                                >
                                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p
                                                    style={{
                                                        fontSize: "12px",
                                                        fontWeight:
                                                            idx === 0
                                                                ? "600"
                                                                : "500",
                                                        color:
                                                            idx === 0
                                                                ? colors.textMain
                                                                : colors.textSecondary,
                                                        margin: 0,
                                                    }}
                                                >
                                                    {formatDate(
                                                        item.createdAt,
                                                        item.timestamp
                                                    )}
                                                </p>
                                                {idx === 0 && (
                                                    <span
                                                        style={{
                                                            fontSize: "9px",
                                                            color: colors.textMuted,
                                                        }}
                                                    >
                                                        {langCode === "vi"
                                                            ? "Mới nhất"
                                                            : "Latest"}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <p
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    color: colors.textMain,
                                                    margin: 0,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    minWidth: 0,
                                                    flex: "1 1 auto",
                                                }}
                                            >
                                                {item.brandName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Right Side: Date/Time + Actions */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            flexShrink: 0,
                                            minWidth: isFiltered
                                                ? "auto"
                                                : "160px",
                                            justifyContent: "flex-end",
                                        }}
                                    >
                                        {!isFiltered && (
                                            <span
                                                style={{
                                                    fontSize: "9px",
                                                    color: colors.textSecondary,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {formatDate(
                                                    item.createdAt,
                                                    item.timestamp
                                                )}
                                            </span>
                                        )}

                                        {/* Actions Group */}
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "0.25rem",
                                                alignItems: "center",
                                            }}
                                        >
                                            {confirmDelete ===
                                            item.timestamp ? (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteReport(
                                                                item.channelId,
                                                                item.timestamp
                                                            )
                                                        }
                                                        style={{
                                                            padding:
                                                                "0.25rem 0.5rem",
                                                            fontSize: "10px",
                                                            fontWeight: "600",
                                                            background:
                                                                colors.error,
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                        }}
                                                        title={
                                                            langCode === "vi"
                                                                ? "Xác nhận xóa"
                                                                : "Confirm delete"
                                                        }
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setConfirmDelete(
                                                                null
                                                            )
                                                        }
                                                        style={{
                                                            padding:
                                                                "0.25rem 0.5rem",
                                                            fontSize: "10px",
                                                            fontWeight: "600",
                                                            background:
                                                                colors.bgHover,
                                                            color: colors.textMain,
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                        }}
                                                        title={
                                                            langCode === "vi"
                                                                ? "Hủy"
                                                                : "Cancel"
                                                        }
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleLoadReport(
                                                                item.channelId,
                                                                item.timestamp
                                                            )
                                                        }
                                                        style={{
                                                            padding:
                                                                "0.25rem 0.5rem",
                                                            fontSize: "10px",
                                                            fontWeight: "600",
                                                            background:
                                                                "transparent",
                                                            color: colors.info,
                                                            border: `1px solid ${colors.info}`,
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "0.25rem",
                                                        }}
                                                        title={
                                                            langCode === "vi"
                                                                ? "Xem báo cáo"
                                                                : "View report"
                                                        }
                                                    >
                                                        <svg
                                                            width="10"
                                                            height="10"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setConfirmDelete(
                                                                item.timestamp
                                                            )
                                                        }
                                                        style={{
                                                            padding: "0.25rem",
                                                            fontSize: "10px",
                                                            fontWeight: "600",
                                                            background:
                                                                "transparent",
                                                            color: colors.textSecondary,
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                        }}
                                                        title={
                                                            langCode === "vi"
                                                                ? "Xóa"
                                                                : "Delete"
                                                        }
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
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "1rem",
                                marginTop: "1rem",
                            }}
                        >
                            <button
                                onClick={() =>
                                    handlePageChange(
                                        Math.max(1, currentPage - 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                style={{
                                    background: "transparent",
                                    border: `1px solid ${colors.borderLight}`,
                                    borderRadius: "4px",
                                    padding: "0.25rem 0.5rem",
                                    cursor:
                                        currentPage === 1
                                            ? "default"
                                            : "pointer",
                                    opacity: currentPage === 1 ? 0.3 : 1,
                                    color: colors.textMain,
                                    fontSize: "10px",
                                }}
                            >
                                {"<"}
                            </button>
                            <span
                                style={{
                                    fontSize: "10px",
                                    color: colors.textSecondary,
                                }}
                            >
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() =>
                                    handlePageChange(
                                        Math.min(totalPages, currentPage + 1)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                style={{
                                    background: "transparent",
                                    border: `1px solid ${colors.borderLight}`,
                                    borderRadius: "4px",
                                    padding: "0.25rem 0.5rem",
                                    cursor:
                                        currentPage === totalPages
                                            ? "default"
                                            : "pointer",
                                    opacity:
                                        currentPage === totalPages ? 0.3 : 1,
                                    color: colors.textMain,
                                    fontSize: "10px",
                                }}
                            >
                                {">"}
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AnalysisHistory;
