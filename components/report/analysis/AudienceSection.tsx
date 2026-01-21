"use client";

import React from "react";
import { ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang } from "@/lib/lang";

interface AudienceSectionProps {
    report_part_2: ReportPart2;
}

const AudienceSection: React.FC<AudienceSectionProps> = ({ report_part_2 }) => {
    const lang = useLang();

    if (!report_part_2.audience_analysis) {
        return null;
    }

    return (
        <section id="section-audience">
            <h3 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {lang.analysis.audienceAnalysis.title}
            </h3>
            <div className={styles.grid2}>
                {/* Demographics */}
                <div className={styles.card}>
                    <h4 className={styles.cardTitle}>
                        {
                            lang.analysis.audienceAnalysis
                                .demographicsTitle
                        }
                    </h4>
                    <div
                        style={{ fontSize: "11px", lineHeight: "1.8" }}
                    >
                        {report_part_2.audience_analysis.demographics
                            ?.age_distribution && (
                            <div style={{ marginBottom: "1rem" }}>
                                <strong>
                                    {
                                        lang.analysis.audienceAnalysis
                                            .ageDistribution
                                    }
                                </strong>
                                <div
                                    style={{
                                        marginTop: "0.5rem",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.25rem",
                                    }}
                                >
                                    {report_part_2.audience_analysis.demographics.age_distribution.map(
                                        (age, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        minWidth:
                                                            "50px",
                                                        fontSize:
                                                            "10px",
                                                    }}
                                                >
                                                    {age.range}
                                                </span>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        height: "6px",
                                                        background:
                                                            "#f0f0f0",
                                                        borderRadius:
                                                            "3px",
                                                        overflow:
                                                            "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${age.percentage}%`,
                                                            height: "100%",
                                                            background:
                                                                "#e53935",
                                                            borderRadius:
                                                                "3px",
                                                        }}
                                                    ></div>
                                                </div>
                                                <span
                                                    style={{
                                                        minWidth:
                                                            "30px",
                                                        fontSize:
                                                            "10px",
                                                        textAlign:
                                                            "right",
                                                    }}
                                                >
                                                    {age.percentage}%
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        {report_part_2.audience_analysis.demographics
                            ?.gender_split && (
                            <div style={{ marginBottom: "1rem" }}>
                                <strong>
                                    {
                                        lang.analysis.audienceAnalysis
                                            .genderSplit
                                    }
                                </strong>
                                <div
                                    style={{
                                        marginTop: "0.5rem",
                                        display: "flex",
                                        gap: "1rem",
                                    }}
                                >
                                    <span style={{ color: "#3b82f6" }}>
                                        {
                                            lang.analysis
                                                .audienceAnalysis.male
                                        }
                                        :{" "}
                                        {
                                            report_part_2
                                                .audience_analysis
                                                .demographics
                                                .gender_split.male
                                        }
                                        %
                                    </span>
                                    <span style={{ color: "#ec4899" }}>
                                        {
                                            lang.analysis
                                                .audienceAnalysis.female
                                        }
                                        :{" "}
                                        {
                                            report_part_2
                                                .audience_analysis
                                                .demographics
                                                .gender_split.female
                                        }
                                        %
                                    </span>
                                    {report_part_2.audience_analysis
                                        .demographics.gender_split
                                        .other > 0 && (
                                        <span
                                            style={{ color: "#8b5cf6" }}
                                        >
                                            {
                                                lang.analysis
                                                    .audienceAnalysis
                                                    .other
                                            }
                                            :{" "}
                                            {
                                                report_part_2
                                                    .audience_analysis
                                                    .demographics
                                                    .gender_split.other
                                            }
                                            %
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        {report_part_2.audience_analysis.demographics
                            ?.top_countries && (
                            <div style={{ marginBottom: "1rem" }}>
                                <strong>
                                    {
                                        lang.analysis.audienceAnalysis
                                            .topCountries
                                    }
                                </strong>
                                <div
                                    style={{
                                        marginTop: "0.5rem",
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "0.5rem",
                                    }}
                                >
                                    {report_part_2.audience_analysis.demographics.top_countries.map(
                                        (country, i) => (
                                            <span
                                                key={i}
                                                className={
                                                    styles.angleTag
                                                }
                                            >
                                                {country.country} (
                                                {country.percentage}%)
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        <p>
                            <strong>
                                {
                                    lang.analysis.audienceAnalysis
                                        .primaryLanguages
                                }
                            </strong>{" "}
                            {report_part_2.audience_analysis.demographics?.primary_languages?.join(
                                ", "
                            )}
                        </p>
                    </div>
                </div>
                {/* Behavior */}
                <div
                    className={`${styles.card} ${styles.accentPurple}`}
                >
                    <h4 className={styles.cardTitle}>
                        {
                            lang.analysis.audienceAnalysis
                                .behaviorTitle
                        }
                    </h4>
                    <div
                        style={{ fontSize: "11px", lineHeight: "1.8" }}
                    >
                        <p>
                            <strong>
                                {
                                    lang.analysis.audienceAnalysis
                                        .estimatedWatchTime
                                }
                            </strong>{" "}
                            {
                                report_part_2.audience_analysis.behavior
                                    ?.estimated_watch_time
                            }
                        </p>
                        <p>
                            <strong>
                                {
                                    lang.analysis.audienceAnalysis
                                        .returningVsNew
                                }
                            </strong>{" "}
                            {
                                report_part_2.audience_analysis.behavior
                                    ?.returning_vs_new_ratio
                            }
                        </p>
                        <p>
                            <strong>
                                {
                                    lang.analysis.audienceAnalysis
                                        .subscriberGrowth
                                }
                            </strong>{" "}
                            {
                                report_part_2.audience_analysis.behavior
                                    ?.subscriber_growth_trend
                            }
                        </p>
                        <p>
                            <strong>
                                {
                                    lang.analysis.audienceAnalysis
                                        .peakViewingDays
                                }
                            </strong>{" "}
                            {report_part_2.audience_analysis.behavior?.peak_viewing_days?.join(
                                ", "
                            )}
                        </p>
                        <p>
                            <strong>
                                {
                                    lang.analysis.audienceAnalysis
                                        .peakViewingHours
                                }
                            </strong>{" "}
                            {report_part_2.audience_analysis.behavior?.peak_viewing_hours?.join(
                                ", "
                            )}
                        </p>
                        <p>
                            <strong>
                                {
                                    lang.analysis.audienceAnalysis
                                        .engagementPatterns
                                }
                            </strong>{" "}
                            {
                                report_part_2.audience_analysis.behavior
                                    ?.engagement_patterns
                            }
                        </p>
                        <p>
                            <strong>
                                {
                                    lang.analysis.audienceAnalysis
                                        .devicePreferences
                                }
                            </strong>{" "}
                            {
                                report_part_2.audience_analysis.behavior
                                    ?.device_preferences
                            }
                        </p>
                        {report_part_2.audience_analysis
                            .psychographics && (
                            <div
                                style={{
                                    marginTop: "1rem",
                                    borderTop: "1px solid #eee",
                                    paddingTop: "0.75rem",
                                }}
                            >
                                <strong>
                                    {
                                        lang.analysis.audienceAnalysis
                                            .psychographicsTitle
                                    }
                                </strong>
                                <p style={{ marginTop: "0.5rem" }}>
                                    <strong>
                                        {
                                            lang.analysis
                                                .audienceAnalysis.values
                                        }
                                    </strong>{" "}
                                    {report_part_2.audience_analysis.psychographics.values?.join(
                                        ", "
                                    )}
                                </p>
                                <p>
                                    <strong>
                                        {
                                            lang.analysis
                                                .audienceAnalysis
                                                .lifestyle
                                        }
                                    </strong>{" "}
                                    {
                                        report_part_2.audience_analysis
                                            .psychographics.lifestyle
                                    }
                                </p>
                                <p>
                                    <strong>
                                        {
                                            lang.analysis
                                                .audienceAnalysis
                                                .purchaseBehavior
                                        }
                                    </strong>{" "}
                                    {
                                        report_part_2.audience_analysis
                                            .psychographics
                                            .purchase_behavior
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AudienceSection;
