"use client";

import React from "react";
import { ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang } from "@/lib/lang";

interface GrowthSectionProps {
    report_part_2: ReportPart2;
}

const GrowthSection: React.FC<GrowthSectionProps> = ({ report_part_2 }) => {
    const lang = useLang();

    if (!report_part_2.growth_opportunities || report_part_2.growth_opportunities.length === 0) {
        return null;
    }

    return (
        <section id="section-growth">
            <h3 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                {lang.analysis.growthOpportunities.title}
            </h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
                {report_part_2.growth_opportunities.map(
                    (opp, idx) => (
                        <div
                            key={idx}
                            className={styles.card}
                            style={{
                                borderLeft: `3px solid ${
                                    opp.priority === "high"
                                        ? "#ef4444"
                                        : opp.priority === "medium"
                                        ? "#f59e0b"
                                        : "#10b981"
                                }`,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "9px",
                                        fontWeight: "700",
                                        padding:
                                            "0.125rem 0.375rem",
                                        borderRadius: "0.25rem",
                                        textTransform: "uppercase",
                                        background:
                                            opp.priority === "high"
                                                ? "#fef2f2"
                                                : opp.priority ===
                                                  "medium"
                                                ? "#fffbeb"
                                                : "#f0fdf4",
                                        color:
                                            opp.priority === "high"
                                                ? "#ef4444"
                                                : opp.priority ===
                                                  "medium"
                                                ? "#f59e0b"
                                                : "#10b981",
                                    }}
                                >
                                    {opp.priority}
                                </span>
                                <h4
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        margin: 0,
                                    }}
                                >
                                    {opp.opportunity}
                                </h4>
                            </div>
                            <p
                                style={{
                                    fontSize: "11px",
                                    color: "#666",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                {opp.description}
                            </p>
                            <p
                                style={{
                                    fontSize: "10px",
                                    color: "#10b981",
                                    fontWeight: "500",
                                }}
                            >
                                {opp.expected_impact}
                            </p>
                        </div>
                    )
                )}
            </div>
        </section>
    );
};

export default GrowthSection;
