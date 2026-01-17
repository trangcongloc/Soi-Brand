import React, { useState } from "react";
import { MarketingReport } from "@/lib/types";
import styles from "./ReportDisplay.module.css";
import { downloadJSON } from "@/lib/utils";
import { useLang, formatString } from "@/lib/lang";
import DataTab from "./report/DataTab";
import AnalysisTab from "./report/AnalysisTab";
import EvaluationTab from "./report/EvaluationTab";

type TabType = "data" | "analysis" | "evaluation";

interface ReportDisplayProps {
    report: MarketingReport;
    onReset?: () => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, onReset }) => {
    const lang = useLang();
    const [activeTab, setActiveTab] = useState<TabType>("data");

    const { report_part_1, report_part_2, report_part_3 } = report;
    const posts = report_part_1?.posts || [];
    const channelInfo = report_part_1?.channel_info;

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.stickyWrapper}>
                    {onReset && (
                        <button
                            onClick={onReset}
                            className="btn btn-primary"
                            style={{
                                width: "100%",
                                marginBottom: "1rem",
                                fontSize: "12px",
                            }}
                        >
                            {lang.sidebar.backButton}
                        </button>
                    )}
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarTitle}>
                            {lang.sidebar.title}
                        </h2>
                        <nav className={styles.nav}>
                            {[
                                { id: "data" as const, label: lang.sidebar.tabs.data },
                                { id: "analysis" as const, label: lang.sidebar.tabs.analysis },
                                { id: "evaluation" as const, label: lang.sidebar.tabs.evaluation },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${styles.tabButton} ${
                                        activeTab === tab.id ? styles.activeTab : ""
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div style={{ padding: "0 0.5rem" }}>
                        <div className={styles.downloadBox}>
                            <p className={styles.downloadText}>
                                {lang.sidebar.downloadBox.text}
                            </p>
                            <button
                                onClick={() => downloadJSON(report, report.brand_name)}
                                className={styles.downloadBtn}
                            >
                                {lang.sidebar.downloadBox.button}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={styles.main}>
                {/* Header Section */}
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {activeTab === "data"
                            ? lang.report.headers.data
                            : activeTab === "analysis"
                            ? lang.report.headers.analysis
                            : lang.report.headers.evaluation}
                    </h1>
                    <p className={styles.description}>
                        {formatString(lang.report.description, {
                            brandName: report.brand_name,
                            reportDate: (() => {
                                const date = new Date(report.created_at);
                                const dateStr = date.toLocaleDateString("vi-VN");
                                const timeStr = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                                const tzAbbr = date.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop();
                                return `${dateStr} ${timeStr} (${tzAbbr})`;
                            })(),
                        })}
                    </p>
                </div>

                {/* Content based on Active Tab */}
                <div className="fade-in">
                    {activeTab === "data" && (
                        <DataTab posts={posts} channelInfo={channelInfo} />
                    )}

                    {activeTab === "analysis" && (
                        <AnalysisTab report_part_2={report_part_2} posts={posts} />
                    )}

                    {activeTab === "evaluation" && (
                        <EvaluationTab report_part_3={report_part_3} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportDisplay;
