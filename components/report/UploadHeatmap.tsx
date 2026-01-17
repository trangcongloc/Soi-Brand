import React from "react";
import { Post } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang, formatString } from "@/lib/lang";

interface UploadHeatmapProps {
    posts: Post[];
}

const UploadHeatmap: React.FC<UploadHeatmapProps> = ({ posts }) => {
    const lang = useLang();
    // Generate last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
            date: d,
            dateStr: d.toLocaleDateString("vi-VN"), // dd/mm/yyyy
            isoStr: d.toISOString().split("T")[0], // yyyy-mm-dd for matching
            count: 0,
        };
    });

    // Count posts per day
    posts.forEach((post) => {
        if (!post.published_at) return;
        const postDate = new Date(post.published_at)
            .toISOString()
            .split("T")[0];
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
                    {days.map((day, idx) => (
                        <div
                            key={idx}
                            className={styles.dailyCell}
                            data-level={getLevel(day.count)}
                            title={`${day.dateStr}: ${formatString(
                                lang.heatmap.videoCount,
                                { count: day.count.toString() }
                            )}`}
                        >
                            {/* Show day number if needed, or just boolean */}
                            <span className={styles.dayNumber}>
                                {day.date.getDate()}
                            </span>
                        </div>
                    ))}
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
