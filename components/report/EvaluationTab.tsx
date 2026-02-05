import { useState } from "react";
import { ReportPart3 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang } from "@/lib/lang";
import { ActionPlanPhase } from "./report-utils";

interface EvaluationTabProps {
    report_part_3: ReportPart3;
}

const EvaluationTab: React.FC<EvaluationTabProps> = ({ report_part_3 }) => {
    const lang = useLang();
    const [actionPlanPhase, setActionPlanPhase] = useState<ActionPlanPhase>("30");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Overall Evaluation */}
            <section id="section-overall">
                <h3 className={styles.sectionTitle}>
                    <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="7"></circle>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                    </svg>
                    {lang.evaluation.overallTitle}
                </h3>
                <div className={`${styles.card} ${styles.summaryCard}`}>
                    <h4 className={`${styles.cardTitle} ${styles.textBlue}`}>
                        {lang.evaluation.executiveSummary}
                    </h4>
                    <p className={styles.analysisText} style={{ color: "#333" }}>
                        {report_part_3.executive_summary}
                    </p>
                </div>

                <div className={styles.grid2}>
                    {/* Strengths */}
                    <div className={`${styles.card} ${styles.bgGreen}`}>
                        <h4
                            className={`${styles.cardTitle} ${styles.textGreen}`}
                            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }}></span>
                            {lang.evaluation.strengths.title}
                        </h4>
                        <ul className={styles.list}>
                            {report_part_3.strengths.map((s, i) => (
                                <li key={i} className={`${styles.listItem} ${styles.listGreen}`}>{s}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className={`${styles.card} ${styles.bgOrange}`}>
                        <h4
                            className={`${styles.cardTitle} ${styles.textOrange}`}
                            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316" }}></span>
                            {lang.evaluation.weaknesses.title}
                        </h4>
                        <ul className={styles.list}>
                            {report_part_3.weaknesses_opportunities.map((w, i) => (
                                <li key={i} className={`${styles.listItem} ${styles.listOrange}`}>{w}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Actionable Insights - Learn From and Avoid */}
            {(report_part_3.actionable_insights.learn_from || report_part_3.actionable_insights.avoid) && (
                <section id="section-insights">
                    <h3 className={styles.sectionTitle}>
                        <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        {lang.evaluation.insights.title}
                    </h3>
                    <div className={styles.grid2}>
                        {/* Learn From */}
                        {report_part_3.actionable_insights.learn_from && (
                            <div className={`${styles.card} ${styles.bgGreen}`}>
                                <h4
                                    className={`${styles.cardTitle} ${styles.textGreen}`}
                                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                    {lang.evaluation.insights.learnFrom}
                                </h4>
                                <p className={styles.analysisText} style={{ marginTop: "0.75rem" }}>
                                    {report_part_3.actionable_insights.learn_from}
                                </p>
                            </div>
                        )}

                        {/* Avoid */}
                        {report_part_3.actionable_insights.avoid && (
                            <div className={`${styles.card} ${styles.bgOrange}`}>
                                <h4
                                    className={`${styles.cardTitle} ${styles.textOrange}`}
                                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                    {lang.evaluation.insights.avoid}
                                </h4>
                                <p className={styles.analysisText} style={{ marginTop: "0.75rem" }}>
                                    {report_part_3.actionable_insights.avoid}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Video Ideas */}
            <section id="section-video-ideas">
                <h3 className={styles.sectionTitle}>
                    <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                    {lang.evaluation.videoIdeas.title}
                </h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                    {report_part_3.actionable_insights.video_ideas.map((idea, idx) => (
                        <div key={idx} className={styles.ideaCard}>
                            <div className={styles.ideaIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 className={styles.ideaTitle}>{idea.title}</h4>
                                <p className={styles.ideaDesc}>{idea.concept}</p>
                                {(idea.estimated_views || idea.content_type) && (
                                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "10px" }}>
                                        {idea.content_type && (
                                            <span style={{ color: "#6366f1", fontWeight: "500" }}>{idea.content_type}</span>
                                        )}
                                        {idea.estimated_views && (
                                            <span style={{ color: "#10b981", fontWeight: "500" }}>
                                                {lang.evaluation.videoIdeas.estimatedPerformance} {idea.estimated_views}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Action Plan */}
            {report_part_3.action_plan && (
                <section id="section-action-plan">
                    <h3 className={styles.sectionTitle}>
                        <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11l3 3L22 4"></path>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                        {lang.evaluation.actionPlan.title}
                    </h3>

                    {/* Tab Navigation */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                        {(["30", "60", "90"] as const).map((phase) => (
                            <button
                                key={phase}
                                onClick={() => setActionPlanPhase(phase)}
                                className={`${styles.actionPlanTab} ${actionPlanPhase === phase ? styles.actionPlanTabActive : ""}`}
                            >
                                {phase === "30"
                                    ? lang.evaluation.actionPlan.phase30
                                    : phase === "60"
                                    ? lang.evaluation.actionPlan.phase60
                                    : lang.evaluation.actionPlan.phase90}
                            </button>
                        ))}
                    </div>

                    {/* Action Plan Content */}
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                        {(actionPlanPhase === "30"
                            ? report_part_3.action_plan.phase_30_days
                            : actionPlanPhase === "60"
                            ? report_part_3.action_plan.phase_60_days
                            : report_part_3.action_plan.phase_90_days
                        ).map((task, idx) => (
                            <div
                                key={idx}
                                className={styles.card}
                                style={{
                                    borderLeft: `4px solid ${
                                        task.priority === "high"
                                            ? "#ef4444"
                                            : task.priority === "medium"
                                            ? "#f59e0b"
                                            : "#10b981"
                                    }`,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                    <div
                                        style={{
                                            minWidth: "24px",
                                            height: "24px",
                                            borderRadius: "50%",
                                            background:
                                                task.priority === "high"
                                                    ? "#fef2f2"
                                                    : task.priority === "medium"
                                                    ? "#fffbeb"
                                                    : "#f0fdf4",
                                            color:
                                                task.priority === "high"
                                                    ? "#ef4444"
                                                    : task.priority === "medium"
                                                    ? "#f59e0b"
                                                    : "#10b981",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        {idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h5
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                marginBottom: "0.5rem",
                                                color: "#333",
                                            }}
                                        >
                                            {task.action}
                                        </h5>
                                        <div style={{ fontSize: "10px", lineHeight: "1.6" }}>
                                            <p style={{ marginBottom: "0.25rem", color: "#666" }}>
                                                <strong>{lang.evaluation.actionPlan.priority}</strong>{" "}
                                                <span
                                                    style={{
                                                        padding: "0.125rem 0.375rem",
                                                        borderRadius: "0.25rem",
                                                        background:
                                                            task.priority === "high"
                                                                ? "#fef2f2"
                                                                : task.priority === "medium"
                                                                ? "#fffbeb"
                                                                : "#f0fdf4",
                                                        color:
                                                            task.priority === "high"
                                                                ? "#ef4444"
                                                                : task.priority === "medium"
                                                                ? "#f59e0b"
                                                                : "#10b981",
                                                        fontWeight: "600",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {lang.evaluation.actionPlan.priorityLevels[task.priority]}
                                                </span>
                                            </p>
                                            <p style={{ marginBottom: "0.25rem", color: "#666" }}>
                                                <strong>{lang.evaluation.actionPlan.expectedImpact}</strong>{" "}
                                                {task.expected_impact}
                                            </p>
                                            <p style={{ marginBottom: 0, color: "#666" }}>
                                                <strong>{lang.evaluation.actionPlan.resourcesNeeded}</strong>{" "}
                                                {task.resources_needed}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default EvaluationTab;
