import React from "react";
import { motion } from "framer-motion";
import { Post } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang, formatString } from "@/lib/lang";
import { sortAnimations } from "@/lib/animations";

interface UploadHeatmapProps {
    posts: Post[];
    selectedDate: string | null;
    onDateClick: (dateIso: string) => void;
    isSelectedFromChart?: boolean;
}

// Format date as yyyy-mm-dd using local timezone
const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const UploadHeatmap: React.FC<UploadHeatmapProps> = ({ posts, selectedDate, onDateClick, isSelectedFromChart = false }) => {
    const lang = useLang();
    // Generate last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
            date: d,
            dateStr: d.toLocaleDateString("vi-VN"), // dd/mm/yyyy
            isoStr: getLocalDateStr(d), // yyyy-mm-dd for matching (local timezone)
            count: 0,
        };
    });

    // Count posts per day
    posts.forEach((post) => {
        if (!post.published_at) return;
        const postDate = getLocalDateStr(new Date(post.published_at));
        const day = days.find((d) => d.isoStr === postDate);
        if (day) {
            day.count++;
        }
    });

    const max = Math.max(...days.map((d) => d.count), 1);

    const getLevel = (count: number) => {
        if (count === 0) return 0;
        if (max === 1) return 1;
        const level = Math.ceil((count / max) * 5);
        return Math.min(level, 5);
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                }}
            >
                <h4 className={styles.cardTitle} style={{ marginBottom: 0 }}>
                    {lang.heatmap.title}
                </h4>
            </div>

            <div className={styles.heatmapContainer} style={{ marginTop: 0 }}>
                {/* Render as a 7-column grid naturally */}
                <div className={styles.dailyHeatmapGrid}>
                    {days.map((day, idx) => {
                        const isSelected = selectedDate === day.isoStr;
                        const shouldPulse = isSelected && isSelectedFromChart;
                        return (
                            <motion.div
                                key={idx}
                                className={`${styles.dailyCell} ${isSelected ? styles.dailyCellSelected : ""}`}
                                data-level={getLevel(day.count)}
                                title={`${day.dateStr}: ${formatString(
                                    lang.heatmap.videoCount,
                                    { count: day.count.toString() }
                                )}`}
                                onClick={() => onDateClick(day.isoStr)}
                                style={{ cursor: "pointer" }}
                                whileHover={{ scale: sortAnimations.heatmapHover }}
                                whileTap={{ scale: sortAnimations.heatmapTap }}
                                animate={
                                    shouldPulse
                                        ? {
                                              scale: [...sortAnimations.pulseScale],
                                              borderWidth: 2,
                                              borderColor: "#fa9191",
                                              boxShadow: [
                                                  "0 0 0 0 rgba(250, 145, 145, 0.7)",
                                                  "0 0 0 10px rgba(250, 145, 145, 0)",
                                                  "0 0 0 0 rgba(250, 145, 145, 0)"
                                              ],
                                          }
                                        : isSelected
                                        ? {
                                              scale: sortAnimations.heatmapSelected,
                                              borderWidth: 2,
                                              borderColor: "#fa9191",
                                              boxShadow: "0 0 0 0 rgba(250, 145, 145, 0)",
                                          }
                                        : {
                                              scale: 1,
                                              borderWidth: 0,
                                              boxShadow: "0 0 0 0 rgba(250, 145, 145, 0)",
                                          }
                                }
                                transition={{
                                    duration: shouldPulse ? sortAnimations.pulseDuration : sortAnimations.heatmapDuration,
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                            >
                                {/* Show day number if needed, or just boolean */}
                                <span className={styles.dayNumber}>
                                    {day.date.getDate()}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                <div className={styles.heatmapLegend}>
                    <span>0</span>
                    <div className={styles.legendScale}>
                        <div
                            className={styles.legendBox}
                            style={{
                                background: "#ffe4e4",
                            }}
                        ></div>
                        <div
                            className={styles.legendBox}
                            style={{ background: "#ffd9d9" }}
                        ></div>
                        <div
                            className={styles.legendBox}
                            style={{ background: "#ffc8c8" }}
                        ></div>
                        <div
                            className={styles.legendBox}
                            style={{ background: "#ffa8a8" }}
                        ></div>
                        <div
                            className={styles.legendBox}
                            style={{ background: "#fa9191" }}
                        ></div>
                    </div>
                    <span>5</span>
                </div>
            </div>
        </div>
    );
};

export default UploadHeatmap;
