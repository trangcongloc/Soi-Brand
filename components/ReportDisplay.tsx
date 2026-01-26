import React, { useState, useCallback } from "react";
import { MarketingReport } from "@/lib/types";
import styles from "./ReportDisplay.module.css";
import { downloadJSON } from "@/lib/utils";
import { useLanguage, formatString } from "@/lib/lang";
import DataTab from "./report/DataTab";
import AnalysisTab from "./report/AnalysisTab";
import EvaluationTab from "./report/EvaluationTab";

type TabType = "data" | "analysis" | "evaluation";

type SectionId =
    // Data sections
    | "section-channel"
    | "section-performance"
    | "section-content"
    // Analysis sections
    | "section-strategy"
    | "section-content-structure"
    | "section-funnel"
    | "section-audience"
    | "section-personas"
    | "section-seo"
    | "section-growth"
    // Evaluation sections
    | "section-overall"
    | "section-insights"
    | "section-video-ideas"
    | "section-action-plan";

interface ReportDisplayProps {
    report: MarketingReport;
    onReset?: () => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, onReset }) => {
    const { lang, langCode } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>("data");

    const { report_part_1, report_part_2, report_part_3 } = report;
    const posts = report_part_1?.posts || [];
    const channelInfo = report_part_1?.channel_info;

    const scrollToSection = useCallback((sectionId: SectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            });

            // Add highlight effect using double rAF to avoid forced reflow
            element.classList.remove("section-highlight");
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    element.classList.add("section-highlight");
                });
            });

            // Remove class after animation completes
            setTimeout(() => {
                element.classList.remove("section-highlight");
            }, 1500);
        }
    }, []);

    const getSectionsForTab = (tab: TabType) => {
        switch (tab) {
            case "data":
                return [
                    { id: "section-channel" as SectionId, label: lang.sidebar.sections.data.channel },
                    { id: "section-performance" as SectionId, label: lang.sidebar.sections.data.performance },
                    { id: "section-content" as SectionId, label: lang.sidebar.sections.data.content },
                ];
            case "analysis":
                return [
                    { id: "section-strategy" as SectionId, label: lang.sidebar.sections.analysis.strategy },
                    { id: "section-content-structure" as SectionId, label: lang.sidebar.sections.analysis.contentStructure },
                    { id: "section-funnel" as SectionId, label: lang.sidebar.sections.analysis.funnel },
                    { id: "section-audience" as SectionId, label: lang.sidebar.sections.analysis.audience },
                    { id: "section-personas" as SectionId, label: lang.sidebar.sections.analysis.personas },
                    { id: "section-seo" as SectionId, label: lang.sidebar.sections.analysis.seo },
                    { id: "section-growth" as SectionId, label: lang.sidebar.sections.analysis.growth },
                ];
            case "evaluation":
                return [
                    { id: "section-overall" as SectionId, label: lang.sidebar.sections.evaluation.overall },
                    { id: "section-insights" as SectionId, label: lang.sidebar.sections.evaluation.insights },
                    { id: "section-video-ideas" as SectionId, label: lang.sidebar.sections.evaluation.videoIdeas },
                    { id: "section-action-plan" as SectionId, label: lang.sidebar.sections.evaluation.actionPlan },
                ];
        }
    };

    const currentSections = getSectionsForTab(activeTab);

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
                            {formatString(lang.sidebar.title, {
                                channelName: report.brand_name,
                            })}
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

                    {/* Section Navigation */}
                    <div className={styles.sectionNav}>
                        <p className={styles.sectionNavLabel}>
                            {lang.sidebar.sections.label}
                        </p>
                        <nav className={styles.sectionNavList}>
                            {currentSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={styles.sectionNavItem}
                                >
                                    {section.label}
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
                                const locale = langCode === "vi" ? "vi-VN" : "en-US";
                                const dateStr = date.toLocaleDateString(locale);
                                const timeStr = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
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
