"use client";

import { useState } from "react";
import { Post, ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang, useLanguage } from "@/lib/lang";
import { calculateHackerNewsScore } from "../report-utils";

interface TopSeoTag {
    tag: string;
    count: number;
    videos: string[];
}

interface SeoSectionProps {
    report_part_2: ReportPart2;
    posts: Post[];
}

const SeoSection: React.FC<SeoSectionProps> = ({ report_part_2, posts }) => {
    const lang = useLang();
    const { langCode } = useLanguage();

    // State for expanded tag categories
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
    // State for expanded top SEO tags
    const [expandedTopSeoTags, setExpandedTopSeoTags] = useState(false);

    const toggleCategory = (index: number) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Calculate top 10 performing videos and extract their SEO tags
    const getTopSeoTags = (): { tags: TopSeoTag[]; topVideos: { index: number; post: Post; score: number }[] } => {
        if (posts.length === 0) return { tags: [], topVideos: [] };

        const postsWithScores = posts.map((post, index) => ({
            index,
            post,
            score: parseFloat(
                calculateHackerNewsScore(
                    post.statistics.play_count,
                    post.published_at
                )
            ),
        }));

        const sortedByScore = [...postsWithScores].sort(
            (a, b) => b.score - a.score
        );

        // Get top 10 videos
        const topVideos = sortedByScore.slice(0, 10);

        // Extract unique tags from top videos with frequency count
        const tagFrequency: { [tag: string]: { count: number; videos: string[] } } = {};

        topVideos.forEach(({ post }) => {
            if (post.tags && post.tags.length > 0) {
                post.tags.forEach((tag) => {
                    const cleanTag = tag.replace(/['"\[\]]/g, "").trim();
                    if (cleanTag) {
                        if (!tagFrequency[cleanTag]) {
                            tagFrequency[cleanTag] = { count: 0, videos: [] };
                        }
                        tagFrequency[cleanTag].count++;
                        if (!tagFrequency[cleanTag].videos.includes(post.title)) {
                            tagFrequency[cleanTag].videos.push(post.title);
                        }
                    }
                });
            }
        });

        // Sort tags by frequency
        const sortedTags = Object.entries(tagFrequency)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([tag, data]) => ({
                tag,
                count: data.count,
                videos: data.videos,
            }));

        return { tags: sortedTags, topVideos };
    };

    const { tags: topSeoTags } = getTopSeoTags();

    if (!report_part_2.seo_analysis) {
        return null;
    }

    return (
        <section id="section-seo">
            <h3 className={styles.sectionTitle}>
                <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                {lang.analysis.seoAnalysis.title}
            </h3>

            {/* Keyword Strategy */}
            <div
                className={styles.card}
                style={{ marginBottom: "1rem" }}
            >
                <h4
                    className={styles.cardTitle}
                    style={{
                        color: "#6366f1",
                        marginBottom: "0.75rem",
                    }}
                >
                    {lang.analysis.seoAnalysis.keywordStrategy}
                </h4>
                <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                    <p style={{ marginBottom: "0.5rem" }}>
                        <strong>
                            {lang.analysis.seoAnalysis.topKeywords}
                        </strong>{" "}
                        {report_part_2.seo_analysis.keyword_strategy.top_keywords.join(
                            ", "
                        )}
                    </p>
                    <p style={{ marginBottom: "0.5rem" }}>
                        <strong>
                            {lang.analysis.seoAnalysis.keywordDensity}
                        </strong>{" "}
                        {
                            report_part_2.seo_analysis.keyword_strategy
                                .keyword_density
                        }
                    </p>
                    {report_part_2.seo_analysis.keyword_strategy
                        .missing_keywords.length > 0 && (
                        <p style={{ marginBottom: 0 }}>
                            <strong>
                                {
                                    lang.analysis.seoAnalysis
                                        .missingKeywords
                                }
                            </strong>{" "}
                            {report_part_2.seo_analysis.keyword_strategy.missing_keywords.join(
                                ", "
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* Tag Analysis */}
            <div
                className={styles.card}
                style={{ marginBottom: "1rem" }}
            >
                <h4
                    className={styles.cardTitle}
                    style={{
                        color: "#10b981",
                        marginBottom: "0.75rem",
                    }}
                >
                    {lang.analysis.seoAnalysis.tagAnalysis}
                </h4>
                <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                    <p style={{ marginBottom: "0.5rem" }}>
                        <strong>
                            {lang.analysis.seoAnalysis.tagCoverage}
                        </strong>{" "}
                        {
                            report_part_2.seo_analysis.tag_analysis
                                .tag_coverage
                        }
                    </p>
                    <p style={{ marginBottom: "0.5rem" }}>
                        <strong>
                            {lang.analysis.seoAnalysis.tagConsistency}
                        </strong>{" "}
                        {
                            report_part_2.seo_analysis.tag_analysis
                                .tag_consistency
                        }
                    </p>
                    {report_part_2.seo_analysis.tag_analysis
                        .tag_optimization_score && (
                        <p style={{ marginBottom: "0.75rem" }}>
                            <strong>
                                {
                                    lang.analysis.seoAnalysis
                                        .tagOptimizationScore
                                }
                            </strong>{" "}
                            <span
                                style={{
                                    color: "#10b981",
                                    fontWeight: "600",
                                }}
                            >
                                {
                                    report_part_2.seo_analysis
                                        .tag_analysis
                                        .tag_optimization_score
                                }
                            </span>
                        </p>
                    )}

                    {/* Top SEO Tags from Best Performing Videos */}
                    {topSeoTags.length > 0 && (
                        <div
                            style={{
                                marginBottom: "1rem",
                                padding: "0.75rem",
                                background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                                borderRadius: "8px",
                                border: "1px solid #bbf7d0",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <strong
                                    style={{
                                        color: "#166534",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    }}
                                >
                                    {lang.analysis.seoAnalysis.topSeoTags}
                                </strong>
                                <span
                                    style={{
                                        fontSize: "9px",
                                        color: "#059669",
                                        background: "#d1fae5",
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                    }}
                                >
                                    {langCode === "vi"
                                        ? `Tu ${Math.min(10, posts.length)} video hieu suat cao`
                                        : `From top ${Math.min(10, posts.length)} performing videos`}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                }}
                            >
                                {(expandedTopSeoTags ? topSeoTags : topSeoTags.slice(0, 20)).map((tagData, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "10px",
                                            padding: "4px 10px",
                                            background: i < 5 ? "#dcfce7" : i < 15 ? "#f0fdf4" : "#ffffff",
                                            color: "#166534",
                                            borderRadius: "12px",
                                            border: `1px solid ${i < 5 ? "#86efac" : "#bbf7d0"}`,
                                            fontWeight: i < 5 ? "600" : "400",
                                        }}
                                        title={`${langCode === "vi" ? "Xuat hien trong" : "Appears in"} ${tagData.count} video(s): ${tagData.videos.slice(0, 3).join(", ")}${tagData.videos.length > 3 ? "..." : ""}`}
                                    >
                                        <span>{tagData.tag}</span>
                                        {tagData.count > 1 && (
                                            <span
                                                style={{
                                                    fontSize: "8px",
                                                    background: "#059669",
                                                    color: "#fff",
                                                    padding: "1px 4px",
                                                    borderRadius: "6px",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {tagData.count}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {topSeoTags.length > 20 && (
                                    <button
                                        onClick={() => setExpandedTopSeoTags(!expandedTopSeoTags)}
                                        style={{
                                            fontSize: "10px",
                                            padding: "4px 12px",
                                            background: expandedTopSeoTags ? "#6b7280" : "#059669",
                                            color: "#fff",
                                            borderRadius: "12px",
                                            border: "none",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        {expandedTopSeoTags
                                            ? (langCode === "vi" ? "Thu gon" : "Collapse")
                                            : `+${topSeoTags.length - 20}`}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Most Used Tags - Reorganized */}
                    {report_part_2.seo_analysis.tag_analysis
                        .most_used_tags &&
                        report_part_2.seo_analysis.tag_analysis
                            .most_used_tags.length > 0 && (
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    padding: "0.875rem",
                                    background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
                                    borderRadius: "8px",
                                    border: "1px solid #bfdbfe",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "0.75rem",
                                    }}
                                >
                                    <strong style={{ fontSize: "12px", color: "#1e40af" }}>
                                        {lang.analysis.seoAnalysis.mostUsedTags}
                                    </strong>
                                    <span
                                        style={{
                                            fontSize: "9px",
                                            color: "#3b82f6",
                                            background: "#dbeafe",
                                            padding: "2px 8px",
                                            borderRadius: "10px",
                                        }}
                                    >
                                        {report_part_2.seo_analysis.tag_analysis.most_used_tags.length} tags
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                        gap: "0.5rem",
                                    }}
                                >
                                    {(() => {
                                        const mostUsedTags = report_part_2.seo_analysis!.tag_analysis.most_used_tags;
                                        const maxFreq = Math.max(...mostUsedTags.map(t => t.frequency));
                                        return mostUsedTags.map((tag, i) => {
                                            const percentage = (tag.frequency / maxFreq) * 100;

                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        padding: "0.5rem 0.625rem",
                                                        background: "#fff",
                                                        borderRadius: "6px",
                                                        border: "1px solid #e5e7eb",
                                                        position: "relative",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {/* Progress bar background */}
                                                    <div
                                                        style={{
                                                            position: "absolute",
                                                            left: 0,
                                                            top: 0,
                                                            height: "100%",
                                                            width: `${percentage}%`,
                                                            background: i === 0 ? "rgba(37, 99, 235, 0.1)" : "rgba(59, 130, 246, 0.05)",
                                                            transition: "width 0.3s ease",
                                                        }}
                                                    />
                                                    <div style={{ position: "relative", zIndex: 1 }}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                marginBottom: "0.25rem",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: "10px",
                                                                    fontWeight: "600",
                                                                    color: "#1e40af",
                                                                }}
                                                            >
                                                                {tag.tag}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: "9px",
                                                                    fontWeight: "700",
                                                                    color: "#2563eb",
                                                                    background: "#dbeafe",
                                                                    padding: "1px 6px",
                                                                    borderRadius: "8px",
                                                                }}
                                                            >
                                                                {tag.frequency}x
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "9px",
                                                                color: "#059669",
                                                                lineHeight: "1.3",
                                                            }}
                                                        >
                                                            {tag.performance_impact}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}

                    {/* Tag Categories - Enhanced Deep Analysis */}
                    {report_part_2.seo_analysis.tag_analysis
                        .tag_categories &&
                        report_part_2.seo_analysis.tag_analysis
                            .tag_categories.length > 0 && (
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    padding: "1rem",
                                    background: "#fafafa",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    <strong
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            fontSize: "12px",
                                        }}
                                    >
                                        {lang.analysis.seoAnalysis.tagCategories}
                                    </strong>
                                    <span
                                        style={{
                                            fontSize: "9px",
                                            color: "#6b7280",
                                            background: "#f3f4f6",
                                            padding: "2px 8px",
                                            borderRadius: "10px",
                                        }}
                                    >
                                        {report_part_2.seo_analysis.tag_analysis.tag_categories.length}{" "}
                                        {langCode === "vi" ? "nhom" : "categories"}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                        gap: "0.75rem",
                                    }}
                                >
                                    {report_part_2.seo_analysis.tag_analysis.tag_categories.map(
                                        (cat, i) => {
                                            // Determine effectiveness color
                                            const effectivenessLower = (cat.effectiveness || "").toLowerCase();
                                            const isHighEffective = effectivenessLower.includes("cao") || effectivenessLower.includes("high") || effectivenessLower.includes("tot") || effectivenessLower.includes("good");
                                            const isMediumEffective = effectivenessLower.includes("trung binh") || effectivenessLower.includes("medium") || effectivenessLower.includes("average");

                                            const bgColors = [
                                                { bg: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)", border: "#fcd34d", accent: "#d97706" },
                                                { bg: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)", border: "#93c5fd", accent: "#2563eb" },
                                                { bg: "linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)", border: "#d8b4fe", accent: "#9333ea" },
                                                { bg: "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)", border: "#86efac", accent: "#16a34a" },
                                                { bg: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)", border: "#fca5a5", accent: "#dc2626" },
                                                { bg: "linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%)", border: "#a5b4fc", accent: "#4f46e5" },
                                            ];
                                            const colorScheme = bgColors[i % bgColors.length];

                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        padding: "0.875rem",
                                                        background: colorScheme.bg,
                                                        borderRadius: "8px",
                                                        border: `1px solid ${colorScheme.border}`,
                                                        position: "relative",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {/* Category Header */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "flex-start",
                                                            justifyContent: "space-between",
                                                            marginBottom: "0.5rem",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontWeight: "700",
                                                                fontSize: "11px",
                                                                color: "#111",
                                                                flex: 1,
                                                            }}
                                                        >
                                                            {cat.category}
                                                        </div>
                                                        {/* Effectiveness Badge */}
                                                        <span
                                                            style={{
                                                                fontSize: "8px",
                                                                padding: "2px 6px",
                                                                borderRadius: "8px",
                                                                fontWeight: "600",
                                                                background: isHighEffective
                                                                    ? "#dcfce7"
                                                                    : isMediumEffective
                                                                    ? "#fef3c7"
                                                                    : "#fee2e2",
                                                                color: isHighEffective
                                                                    ? "#166534"
                                                                    : isMediumEffective
                                                                    ? "#92400e"
                                                                    : "#991b1b",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {isHighEffective
                                                                ? "HIGH"
                                                                : isMediumEffective
                                                                ? "MEDIUM"
                                                                : "LOW"}
                                                        </span>
                                                    </div>

                                                    {/* Purpose */}
                                                    {cat.purpose && (
                                                        <div
                                                            style={{
                                                                fontSize: "10px",
                                                                color: "#4b5563",
                                                                marginBottom: "0.625rem",
                                                                padding: "0.375rem 0.5rem",
                                                                background: "rgba(255,255,255,0.6)",
                                                                borderRadius: "4px",
                                                                borderLeft: `3px solid ${colorScheme.accent}`,
                                                            }}
                                                        >
                                                            <strong style={{ color: colorScheme.accent }}>
                                                                {langCode === "vi" ? "Muc dich:" : "Purpose:"}
                                                            </strong>{" "}
                                                            {cat.purpose}
                                                        </div>
                                                    )}

                                                    {/* Tags - Collapsible */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: "0.3rem",
                                                            marginBottom: "0.5rem",
                                                        }}
                                                    >
                                                        {(expandedCategories.has(i) ? cat.tags : cat.tags.slice(0, 8)).map((t, j) => (
                                                            <span
                                                                key={j}
                                                                style={{
                                                                    fontSize: "9px",
                                                                    padding: "2px 8px",
                                                                    background: "rgba(255,255,255,0.85)",
                                                                    borderRadius: "10px",
                                                                    border: "1px solid rgba(0,0,0,0.08)",
                                                                    color: "#374151",
                                                                }}
                                                            >
                                                                {t}
                                                            </span>
                                                        ))}
                                                        {cat.tags.length > 8 && (
                                                            <button
                                                                onClick={() => toggleCategory(i)}
                                                                style={{
                                                                    fontSize: "9px",
                                                                    padding: "2px 8px",
                                                                    background: expandedCategories.has(i) ? "#6b7280" : colorScheme.accent,
                                                                    borderRadius: "10px",
                                                                    color: "#fff",
                                                                    fontWeight: "600",
                                                                    border: "none",
                                                                    cursor: "pointer",
                                                                    transition: "all 0.2s ease",
                                                                }}
                                                            >
                                                                {expandedCategories.has(i)
                                                                    ? (langCode === "vi" ? "Thu gon" : "Collapse")
                                                                    : `+${cat.tags.length - 8}`}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Effectiveness Detail */}
                                                    <div
                                                        style={{
                                                            fontSize: "9px",
                                                            color: "#6b7280",
                                                            display: "flex",
                                                            alignItems: "flex-start",
                                                            gap: "0.25rem",
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: "600", flexShrink: 0 }}>
                                                            {lang.analysis.seoAnalysis.categoryEffectiveness}
                                                        </span>
                                                        <span style={{ color: "#374151" }}>
                                                            {cat.effectiveness}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        )}

                    <p style={{ marginBottom: "0.5rem" }}>
                        <strong>
                            {lang.analysis.seoAnalysis.recommendedTags}
                        </strong>{" "}
                        {report_part_2.seo_analysis.tag_analysis.recommended_tags.join(
                            ", "
                        )}
                    </p>

                    {/* Competitor Tags */}
                    {report_part_2.seo_analysis.tag_analysis
                        .competitor_tags &&
                        report_part_2.seo_analysis.tag_analysis
                            .competitor_tags.length > 0 && (
                            <p style={{ marginBottom: "0.5rem" }}>
                                <strong>
                                    {
                                        lang.analysis.seoAnalysis
                                            .competitorTags
                                    }
                                </strong>{" "}
                                <span style={{ color: "#dc2626" }}>
                                    {report_part_2.seo_analysis.tag_analysis.competitor_tags.join(
                                        ", "
                                    )}
                                </span>
                            </p>
                        )}

                    {/* Long-tail Opportunities */}
                    {report_part_2.seo_analysis.tag_analysis
                        .long_tail_opportunities &&
                        report_part_2.seo_analysis.tag_analysis
                            .long_tail_opportunities.length > 0 && (
                            <p style={{ marginBottom: 0 }}>
                                <strong>
                                    {
                                        lang.analysis.seoAnalysis
                                            .longTailOpportunities
                                    }
                                </strong>{" "}
                                <span style={{ color: "#7c3aed" }}>
                                    {report_part_2.seo_analysis.tag_analysis.long_tail_opportunities.join(
                                        ", "
                                    )}
                                </span>
                            </p>
                        )}
                </div>
            </div>

            {/* Optimization Opportunities */}
            {report_part_2.seo_analysis.optimization_opportunities
                .length > 0 && (
                <div>
                    <h3 className={styles.sectionTitle}>
                        <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                        {
                            lang.analysis.seoAnalysis
                                .optimizationOpportunities
                        }
                    </h3>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                        {report_part_2.seo_analysis.optimization_opportunities.map(
                            (opp, idx) => (
                                <div
                                    key={idx}
                                    className={styles.card}
                                    style={{
                                        borderLeft: `3px solid ${
                                            opp.priority === "high"
                                                ? "#ef4444"
                                                : opp.priority ===
                                                  "medium"
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
                                                textTransform:
                                                    "uppercase",
                                                background:
                                                    opp.priority ===
                                                    "high"
                                                        ? "#fef2f2"
                                                        : opp.priority ===
                                                          "medium"
                                                        ? "#fffbeb"
                                                        : "#f0fdf4",
                                                color:
                                                    opp.priority ===
                                                    "high"
                                                        ? "#ef4444"
                                                        : opp.priority ===
                                                          "medium"
                                                        ? "#f59e0b"
                                                        : "#10b981",
                                            }}
                                        >
                                            {opp.priority}
                                        </span>
                                        <h5
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                margin: 0,
                                            }}
                                        >
                                            {opp.area}
                                        </h5>
                                    </div>
                                    <p
                                        style={{
                                            fontSize: "11px",
                                            color: "#666",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        <strong>Issue:</strong>{" "}
                                        {opp.issue}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "11px",
                                            color: "#10b981",
                                            fontWeight: "500",
                                            marginBottom: 0,
                                        }}
                                    >
                                        <strong>Recommendation:</strong>{" "}
                                        {opp.recommendation}
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default SeoSection;
