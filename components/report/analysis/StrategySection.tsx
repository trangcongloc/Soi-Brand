"use client";

import React from "react";
import { ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang } from "@/lib/lang";

interface StrategySectionProps {
    report_part_2: ReportPart2;
}

const StrategySection: React.FC<StrategySectionProps> = ({ report_part_2 }) => {
    const lang = useLang();

    return (
        <section id="section-strategy">
            <h3 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                </svg>
                {lang.analysis.strategyTitle}
            </h3>
            <div className={styles.grid2}>
                {/* Brand Identity */}
                <div className={styles.card}>
                    <h4 className={styles.cardTitle}>
                        {lang.analysis.brandIdentity.title}
                    </h4>
                    <div className={styles.analysisText}>
                        <p>
                            <span className="font-semibold">
                                {lang.analysis.brandIdentity.style}
                            </span>{" "}
                            {
                                report_part_2.strategy_analysis
                                    .brand_identity.visual_style
                            }
                        </p>
                        <p>
                            <span className="font-semibold">
                                {lang.analysis.brandIdentity.tone}
                            </span>{" "}
                            {
                                report_part_2.strategy_analysis
                                    .brand_identity.tone_of_voice
                            }
                        </p>
                        <p>
                            <span className="font-semibold">
                                {lang.analysis.brandIdentity.positioning}
                            </span>{" "}
                            {
                                report_part_2.strategy_analysis
                                    .brand_identity.brand_positioning
                            }
                        </p>
                    </div>
                </div>

                {/* Content Focus */}
                <div className={styles.card}>
                    <h4 className={styles.cardTitle}>
                        {lang.analysis.contentFocus.title}
                    </h4>
                    <p
                        className={`${styles.analysisText} ${styles.mutedText}`}
                    >
                        {report_part_2.strategy_analysis.content_focus
                            ?.overview || lang.analysis.contentFocus.noData}
                    </p>
                    <div className={styles.adAngles}>
                        {report_part_2.strategy_analysis.content_focus?.topics?.map(
                            (topic, i) => (
                                <span key={i} className={styles.angleTag}>
                                    {topic}
                                </span>
                            )
                        )}
                    </div>
                </div>

                {/* Content Niche Analysis */}
                {report_part_2.content_niche_analysis && (
                    <div
                        className={styles.card}
                        style={{ marginTop: "1rem" }}
                    >
                        <h4 className={styles.cardTitle}>
                            {lang.analysis.contentNicheAnalysis.title}
                        </h4>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                            }}
                        >
                            <div>
                                <span className={styles.statLabel}>
                                    {
                                        lang.analysis.contentNicheAnalysis
                                            .primaryNiche
                                    }
                                </span>
                                <span
                                    style={{
                                        marginLeft: "0.5rem",
                                        fontWeight: "600",
                                        color: "#e53935",
                                    }}
                                >
                                    {
                                        report_part_2.content_niche_analysis
                                            .primary_niche
                                    }
                                </span>
                            </div>
                            {report_part_2.content_niche_analysis.sub_niches
                                ?.length > 0 && (
                                <div>
                                    <span className={styles.statLabel}>
                                        {
                                            lang.analysis
                                                .contentNicheAnalysis
                                                .subNiches
                                        }
                                    </span>
                                    <div
                                        className={styles.adAngles}
                                        style={{ marginTop: "0.5rem" }}
                                    >
                                        {report_part_2.content_niche_analysis.sub_niches.map(
                                            (niche, i) => (
                                                <span
                                                    key={i}
                                                    className={
                                                        styles.angleTag
                                                    }
                                                >
                                                    {niche}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                            {report_part_2.content_niche_analysis
                                .content_categories?.length > 0 && (
                                <div>
                                    <span className={styles.statLabel}>
                                        {
                                            lang.analysis
                                                .contentNicheAnalysis
                                                .contentCategories
                                        }
                                    </span>
                                    <div
                                        style={{
                                            marginTop: "0.5rem",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        {report_part_2.content_niche_analysis.content_categories.map(
                                            (cat, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        display: "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "0.75rem",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: "60px",
                                                            height: "8px",
                                                            background:
                                                                "#f0f0f0",
                                                            borderRadius:
                                                                "4px",
                                                            overflow:
                                                                "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: `${cat.percentage}%`,
                                                                height: "100%",
                                                                background:
                                                                    i === 0
                                                                        ? "#e53935"
                                                                        : i ===
                                                                          1
                                                                        ? "#ff7043"
                                                                        : "#ffab91",
                                                                borderRadius:
                                                                    "4px",
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "11px",
                                                            fontWeight:
                                                                "600",
                                                            minWidth:
                                                                "35px",
                                                        }}
                                                    >
                                                        {cat.percentage}%
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize:
                                                                "12px",
                                                            color: "#333",
                                                        }}
                                                    >
                                                        {cat.category}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                            <div
                                style={{
                                    borderTop: "1px solid #eee",
                                    paddingTop: "0.75rem",
                                }}
                            >
                                <p
                                    className={`${styles.analysisText} ${styles.mutedText}`}
                                    style={{ marginBottom: "0.5rem" }}
                                >
                                    <strong>
                                        {
                                            lang.analysis
                                                .contentNicheAnalysis
                                                .nichePositioning
                                        }
                                    </strong>{" "}
                                    {
                                        report_part_2.content_niche_analysis
                                            .niche_positioning
                                    }
                                </p>
                                <p
                                    className={`${styles.analysisText} ${styles.mutedText}`}
                                    style={{ marginBottom: "0.5rem" }}
                                >
                                    <strong>
                                        {
                                            lang.analysis
                                                .contentNicheAnalysis
                                                .competitorLandscape
                                        }
                                    </strong>{" "}
                                    {
                                        report_part_2.content_niche_analysis
                                            .competitor_landscape
                                    }
                                </p>
                                <p
                                    className={`${styles.analysisText} ${styles.mutedText}`}
                                >
                                    <strong>
                                        {
                                            lang.analysis
                                                .contentNicheAnalysis
                                                .contentUniqueness
                                        }
                                    </strong>{" "}
                                    {
                                        report_part_2.content_niche_analysis
                                            .content_uniqueness
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Ad Strategy */}
            <div style={{ marginTop: "1rem" }}>
                <div className={styles.card}>
                    <h4 className={styles.cardTitle}>
                        {lang.analysis.adStrategy.title}
                    </h4>
                    <p
                        className={`${styles.analysisText} ${styles.mutedText}`}
                    >
                        {report_part_2.ad_strategy.overview}
                    </p>
                    <div className={styles.adAngles}>
                        {report_part_2.ad_strategy.ad_angles.map(
                            (angle, i) => (
                                <span key={i} className={styles.angleTag}>
                                    {angle}
                                </span>
                            )
                        )}
                    </div>
                    {report_part_2.ad_strategy.target_audience_clues && (
                        <div style={{ marginTop: "1rem" }}>
                            <p className={styles.mutedText} style={{ fontSize: "10px", marginBottom: "0.5rem" }}>
                                {lang.analysis.adStrategy.targetAudience}
                            </p>
                            <p className={styles.analysisText}>
                                {report_part_2.ad_strategy.target_audience_clues}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default StrategySection;
