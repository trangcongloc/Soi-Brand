"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    getCachedChannelList,
    getCachedReportByTimestamp,
    deleteCachedReportByTimestamp,
    clearAllReports,
} from "@/lib/cache";
import { MarketingReport } from "@/lib/types";
import { useLanguage, useLang } from "@/lib/lang";
import { colors } from "@/lib/theme";
import { HistoryItem as HistoryItemType, PAGE_SIZE, slideVariants } from "./historyUtils";
import HistoryHeader from "./HistoryHeader";
import HistoryItem from "./HistoryItem";
import HistoryPagination from "./HistoryPagination";

interface AnalysisHistoryProps {
    onLoadReport: (report: MarketingReport) => void;
    onHistoryChange?: () => void;
    filteredChannelId?: string;
    filteredChannelName?: string;
    onClearFilter?: () => void;
    onUpload?: (report: MarketingReport) => void;
    onError?: (msg: string) => void;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
    onLoadReport,
    onHistoryChange,
    filteredChannelId,
    filteredChannelName: _filteredChannelName,
    onClearFilter,
    onUpload,
    onError,
}) => {
    void _filteredChannelName;
    useLanguage();
    const lang = useLang();
    const [allHistory, setAllHistory] = useState<HistoryItemType[]>(() =>
        getCachedChannelList()
    );
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const directionRef = useRef<1 | -1>(1);
    const prevIsFilteredRef = useRef<boolean>(!!filteredChannelId);

    const isFiltered = !!filteredChannelId;
    if (isFiltered !== prevIsFilteredRef.current) {
        directionRef.current = isFiltered ? 1 : -1;
        prevIsFilteredRef.current = isFiltered;
    }
    const direction = directionRef.current;

    const history = filteredChannelId
        ? allHistory.filter((item) => item.channelId === filteredChannelId)
        : allHistory;

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredChannelId]);

    if (history.length === 0 && !isFiltered) {
        return null;
    }

    const totalPages = Math.ceil(history.length / PAGE_SIZE);
    const paginatedHistory = history.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
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

        const filteredNew = filteredChannelId
            ? newHistory.filter((item) => item.channelId === filteredChannelId)
            : newHistory;
        const newTotalPages = Math.ceil(filteredNew.length / PAGE_SIZE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            handlePageChange(newTotalPages);
        }

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
                    <HistoryHeader
                        isFiltered={isFiltered}
                        historyCount={history.length}
                        confirmDeleteAll={confirmDeleteAll}
                        onDeleteAll={handleClearAll}
                        onCancelDeleteAll={() => setConfirmDeleteAll(false)}
                        onConfirmDeleteAll={() => setConfirmDeleteAll(true)}
                        onUpload={onUpload}
                        onError={onError}
                        lang={{
                            title: lang.history.title,
                            savedReports: lang.history.savedReports,
                            clearAll: lang.history.clearAll,
                            uploadButtonTitle: lang.form.uploadButtonTitle,
                            invalidJson: lang.form.errors.invalidJson,
                            cannotReadJson: lang.form.errors.cannotReadJson,
                        }}
                    />

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
                            {lang.history.noReports}
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
                                <HistoryItem
                                    key={`${item.channelId}_${item.timestamp}`}
                                    item={item}
                                    index={idx}
                                    isFiltered={isFiltered}
                                    confirmDelete={confirmDelete}
                                    onLoad={handleLoadReport}
                                    onDelete={handleDeleteReport}
                                    onConfirmDelete={setConfirmDelete}
                                    onCancelDelete={() => setConfirmDelete(null)}
                                    lang={{
                                        latest: lang.history.latest,
                                        viewReport: lang.history.viewReport,
                                        deleteReport: lang.history.deleteReport,
                                        confirmDelete: lang.history.confirmDelete,
                                        cancelAction: lang.history.cancelAction,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <HistoryPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AnalysisHistory;
