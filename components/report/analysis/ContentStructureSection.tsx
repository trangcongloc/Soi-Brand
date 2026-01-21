"use client";

import React from "react";
import { Post, ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang, useLanguage } from "@/lib/lang";

interface CurrentStats {
    frequency: string;
    bestDays: string[];
    bestTimes: string[];
    totalPosts: number;
    analyzedPeriod: number;
}

interface ContentStructureSectionProps {
    report_part_2: ReportPart2;
    posts: Post[];
    currentStats: CurrentStats | null;
}

const ContentStructureSection: React.FC<ContentStructureSectionProps> = ({
    report_part_2,
    currentStats,
}) => {
    const lang = useLang();
    const { langCode } = useLanguage();

    return (
        <>
            {/* Content Structure Analysis */}
            {report_part_2.strategy_analysis.content_structure_analysis && (
                <section id="section-content-structure">
                    <h3 className={styles.sectionTitle}>
                        <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="2" y1="7" x2="7" y2="7"></line>
                            <line x1="2" y1="17" x2="7" y2="17"></line>
                            <line x1="17" y1="17" x2="22" y2="17"></line>
                            <line x1="17" y1="7" x2="22" y2="7"></line>
                        </svg>
                        {lang.analysis.contentStructureAnalysis.title}
                    </h3>
                    <div className={styles.grid2}>
                        <div className={styles.card}>
                            <h4 className={`${styles.cardTitle} ${styles.textPurple}`}>
                                {lang.analysis.contentStructureAnalysis.hookTactics}
                            </h4>
                            <p className={styles.analysisText} style={{ marginTop: "0.5rem" }}>
                                {report_part_2.strategy_analysis.content_structure_analysis.hook_tactics}
                            </p>
                        </div>
                        <div className={styles.card}>
                            <h4 className={`${styles.cardTitle} ${styles.textBlue}`}>
                                {lang.analysis.contentStructureAnalysis.storytelling}
                            </h4>
                            <p className={styles.analysisText} style={{ marginTop: "0.5rem" }}>
                                {report_part_2.strategy_analysis.content_structure_analysis.storytelling}
                            </p>
                        </div>
                        <div className={styles.card}>
                            <h4 className={`${styles.cardTitle} ${styles.textGreen}`}>
                                {lang.analysis.contentStructureAnalysis.ctaStrategy}
                            </h4>
                            <p className={styles.analysisText} style={{ marginTop: "0.5rem" }}>
                                {report_part_2.strategy_analysis.content_structure_analysis.cta_strategy}
                            </p>
                        </div>
                        <div className={styles.card}>
                            <h4 className={`${styles.cardTitle} ${styles.textPink}`}>
                                {lang.analysis.contentStructureAnalysis.emotionalTriggers}
                            </h4>
                            <p className={styles.analysisText} style={{ marginTop: "0.5rem" }}>
                                {report_part_2.strategy_analysis.content_structure_analysis.emotional_triggers}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Content Calendar Insights - Current vs Recommended */}
            {(currentStats || report_part_2.content_calendar) && (
                <section>
                    <h3 className={styles.sectionTitle}>
                        <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {langCode === "vi"
                            ? "Lich dang noi dung"
                            : "Content Calendar Insights"}
                    </h3>

                    <div className={styles.grid2} style={{ gap: "1rem" }}>
                        {/* Current Posting Stats */}
                        {currentStats && (
                            <div className={styles.card}>
                                <h4 className={styles.cardHeaderBrand}>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    {langCode === "vi"
                                        ? "Hien trang kenh"
                                        : "Current Channel Stats"}
                                </h4>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <div>
                                        <p className={styles.statLabelSmall}>
                                            {langCode === "vi"
                                                ? "TAN SUAT DANG"
                                                : "POSTING FREQUENCY"}
                                        </p>
                                        <p className={styles.statValueBrand}>
                                            {currentStats.frequency}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={styles.statLabelSmall}>
                                            {langCode === "vi"
                                                ? "NGAY HAY DANG NHAT"
                                                : "MOST ACTIVE DAYS"}
                                        </p>
                                        <p className={styles.statValueDefault}>
                                            {currentStats.bestDays.join(", ") ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={styles.statLabelSmall}>
                                            {langCode === "vi"
                                                ? "GIO HAY DANG NHAT"
                                                : "MOST ACTIVE TIMES"}
                                        </p>
                                        <p className={styles.statValueDefault}>
                                            {currentStats.bestTimes.join(
                                                ", "
                                            ) || "N/A"}
                                        </p>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: "0.5rem",
                                            paddingTop: "0.75rem",
                                            borderTop: "1px dashed #e5e7eb",
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                color: "#9ca3af",
                                                fontStyle: "italic",
                                                margin: 0,
                                            }}
                                        >
                                            {langCode === "vi"
                                                ? `${currentStats.totalPosts} video trong ${currentStats.analyzedPeriod} ngay`
                                                : `${currentStats.totalPosts} videos over ${currentStats.analyzedPeriod} days`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recommended Posting Schedule */}
                        {report_part_2.content_calendar && (
                            <div className={styles.card}>
                                <h4 className={styles.cardHeaderSuccess}>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    {langCode === "vi"
                                        ? "Lich de xuat"
                                        : "Recommended Schedule"}
                                </h4>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <div>
                                        <p className={styles.statLabelSmall}>
                                            {langCode === "vi"
                                                ? "TAN SUAT TOI UU"
                                                : "OPTIMAL FREQUENCY"}
                                        </p>
                                        <p className={styles.statValueSuccess}>
                                            {
                                                report_part_2.content_calendar
                                                    .recommended_frequency
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className={styles.statLabelSmall}>
                                            {langCode === "vi"
                                                ? "NGAY TOT NHAT"
                                                : "BEST DAYS TO POST"}
                                        </p>
                                        <p className={styles.statValueDefault}>
                                            {report_part_2.content_calendar.best_posting_days.join(
                                                ", "
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={styles.statLabelSmall}>
                                            {langCode === "vi"
                                                ? "KHUNG GIO VANG"
                                                : "BEST TIMES TO POST"}
                                        </p>
                                        <p className={styles.statValueDefault}>
                                            {report_part_2.content_calendar.best_posting_times.join(
                                                ", "
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Performance Overview */}
            {(report_part_2.content_calendar?.best_performing_overview ||
                report_part_2.content_calendar?.worst_performing_overview) && (
                <section>
                    <h3 className={styles.sectionTitle}>
                        <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        {langCode === "vi"
                            ? "Tong quan hieu suat noi dung"
                            : "Content Performance Overview"}
                    </h3>
                    <div className={styles.grid2}>
                        {report_part_2.content_calendar.best_performing_overview && (
                            <div className={`${styles.card} ${styles.bgGreen}`}>
                                <h4 className={`${styles.cardTitle} ${styles.textGreen}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    {langCode === "vi" ? "Video hieu suat tot nhat" : "Best Performing Videos"}
                                </h4>
                                <p className={styles.analysisText} style={{ marginTop: "0.75rem" }}>
                                    {report_part_2.content_calendar.best_performing_overview}
                                </p>
                            </div>
                        )}
                        {report_part_2.content_calendar.worst_performing_overview && (
                            <div className={`${styles.card} ${styles.bgOrange}`}>
                                <h4 className={`${styles.cardTitle} ${styles.textOrange}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    {langCode === "vi" ? "Video hieu suat thap" : "Underperforming Videos"}
                                </h4>
                                <p className={styles.analysisText} style={{ marginTop: "0.75rem" }}>
                                    {report_part_2.content_calendar.worst_performing_overview}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Content Mix */}
            {report_part_2.content_calendar?.content_mix &&
                report_part_2.content_calendar.content_mix.length > 0 && (
                    <section>
                        <h3 className={styles.sectionTitle}>
                            <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            {langCode === "vi"
                                ? "Phoi hop noi dung"
                                : "Content Mix"}
                        </h3>
                        <div className={styles.card}>
                            <div style={{ display: "grid", gap: "1rem" }}>
                                {report_part_2.content_calendar.content_mix.map(
                                    (mix, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: "1rem",
                                                background: "#f9fafb",
                                                borderRadius: "8px",
                                                borderLeft: `4px solid ${
                                                    idx === 0
                                                        ? "#e53935"
                                                        : idx === 1
                                                        ? "#ff7043"
                                                        : "#3b82f6"
                                                }`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        color: "#333",
                                                    }}
                                                >
                                                    {mix.content_type ||
                                                        (mix as { pillar?: string }).pillar}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "12px",
                                                        fontWeight: "700",
                                                        color:
                                                            idx === 0
                                                                ? "#e53935"
                                                                : idx === 1
                                                                ? "#ff7043"
                                                                : "#3b82f6",
                                                    }}
                                                >
                                                    {mix.percentage}%
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    height: "6px",
                                                    background: "#e5e7eb",
                                                    borderRadius: "3px",
                                                    overflow: "hidden",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${mix.percentage}%`,
                                                        height: "100%",
                                                        background:
                                                            idx === 0
                                                                ? "#e53935"
                                                                : idx === 1
                                                                ? "#ff7043"
                                                                : "#3b82f6",
                                                        borderRadius: "3px",
                                                    }}
                                                ></div>
                                            </div>
                                            {mix.pillar_purpose && (
                                                <div style={{ marginBottom: "0.75rem" }}>
                                                    <span style={{ fontSize: "10px", color: "#666", fontWeight: "600" }}>
                                                        {langCode === "vi" ? "Muc dich chien luoc:" : "Strategic Purpose:"}
                                                    </span>
                                                    <p style={{ fontSize: "11px", color: "#555", marginTop: "0.25rem", marginBottom: 0 }}>
                                                        {mix.pillar_purpose}
                                                    </p>
                                                </div>
                                            )}
                                            {mix.performance_insight && (
                                                <div style={{ marginBottom: "0.75rem" }}>
                                                    <span style={{ fontSize: "10px", color: "#666", fontWeight: "600" }}>
                                                        {langCode === "vi" ? "Phan tich hieu suat:" : "Performance Insight:"}
                                                    </span>
                                                    <p style={{ fontSize: "11px", color: "#555", marginTop: "0.25rem", marginBottom: 0 }}>
                                                        {mix.performance_insight}
                                                    </p>
                                                </div>
                                            )}
                                            {mix.specific_topics &&
                                                mix.specific_topics.length >
                                                    0 && (
                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "0.75rem",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "10px",
                                                                color: "#666",
                                                                fontWeight:
                                                                    "600",
                                                            }}
                                                        >
                                                            {
                                                                lang.analysis
                                                                    .contentCalendar
                                                                    .specificTopics
                                                            }
                                                        </span>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexWrap:
                                                                    "wrap",
                                                                gap: "0.35rem",
                                                                marginTop:
                                                                    "0.5rem",
                                                            }}
                                                        >
                                                            {mix.specific_topics.map(
                                                                (topic, i) => (
                                                                    <span
                                                                        key={i}
                                                                        style={{
                                                                            fontSize:
                                                                                "10px",
                                                                            padding:
                                                                                "3px 10px",
                                                                            background:
                                                                                "#fff",
                                                                            border: "1px solid #e5e7eb",
                                                                            borderRadius:
                                                                                "4px",
                                                                            color: "#333",
                                                                        }}
                                                                    >
                                                                        {topic}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            {mix.example_videos &&
                                                mix.example_videos.length >
                                                    0 && (
                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "0.75rem",
                                                            fontSize: "10px",
                                                            color: "#888",
                                                        }}
                                                    >
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .contentCalendar
                                                                    .exampleVideos
                                                            }
                                                        </strong>{" "}
                                                        {mix.example_videos.join(
                                                            ", "
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </section>
                )}
        </>
    );
};

export default ContentStructureSection;
