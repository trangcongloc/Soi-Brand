"use client";

import { ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang } from "@/lib/lang";

interface FunnelSectionProps {
    report_part_2: ReportPart2;
}

const FunnelSection: React.FC<FunnelSectionProps> = ({ report_part_2 }) => {
    const lang = useLang();

    return (
        <section id="section-funnel">
            <h3 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                {lang.analysis.funnelAnalysis.title}
            </h3>
            <div style={{ marginTop: "1rem" }}>
                <div className={styles.card}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1.5rem",
                        }}
                    >
                        {/* TOFU */}
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        padding: "0.25rem 0.5rem",
                                        background: "#3b82f6",
                                        color: "white",
                                        borderRadius: "0.25rem",
                                    }}
                                >
                                    TOFU
                                </span>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#666",
                                    }}
                                >
                                    {lang.analysis.funnelAnalysis.tofu}
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: "12px",
                                    lineHeight: "1.6",
                                    color: "#444",
                                }}
                            >
                                {report_part_2.funnel_analysis.tofu}
                            </p>
                        </div>
                        {/* MOFU */}
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        padding: "0.25rem 0.5rem",
                                        background: "#f59e0b",
                                        color: "white",
                                        borderRadius: "0.25rem",
                                    }}
                                >
                                    MOFU
                                </span>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#666",
                                    }}
                                >
                                    {lang.analysis.funnelAnalysis.mofu}
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: "12px",
                                    lineHeight: "1.6",
                                    color: "#444",
                                }}
                            >
                                {report_part_2.funnel_analysis.mofu}
                            </p>
                        </div>
                        {/* BOFU */}
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        padding: "0.25rem 0.5rem",
                                        background: "#10b981",
                                        color: "white",
                                        borderRadius: "0.25rem",
                                    }}
                                >
                                    BOFU
                                </span>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#666",
                                    }}
                                >
                                    {lang.analysis.funnelAnalysis.bofu}
                                </span>
                            </div>
                            <p
                                style={{
                                    fontSize: "12px",
                                    lineHeight: "1.6",
                                    color: "#444",
                                }}
                            >
                                {report_part_2.funnel_analysis.bofu}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FunnelSection;
