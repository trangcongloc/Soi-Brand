import React, { useState } from "react";
import { Post, ReportPart2 } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang, useLanguage } from "@/lib/lang";
import { calculateHackerNewsScore } from "./report-utils";

interface AnalysisTabProps {
    report_part_2: ReportPart2;
    posts: Post[];
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ report_part_2, posts }) => {
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
    const getTopSeoTags = () => {
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

    // Calculate current posting stats from posts data
    const calculateCurrentPostingStats = () => {
        if (posts.length < 2) return null;

        // Sort posts by date
        const sortedPosts = [...posts].sort(
            (a, b) =>
                new Date(a.published_at).getTime() -
                new Date(b.published_at).getTime()
        );

        // Calculate frequency
        const firstDate = new Date(sortedPosts[0].published_at);
        const lastDate = new Date(
            sortedPosts[sortedPosts.length - 1].published_at
        );
        const daysDiff = Math.max(
            1,
            Math.ceil(
                (lastDate.getTime() - firstDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            )
        );
        const videosPerDay = posts.length / daysDiff;

        // Calculate all frequency formats
        const perWeek = videosPerDay * 7;
        const perMonth = videosPerDay * 30;

        let frequency: string;
        if (videosPerDay >= 1) {
            frequency =
                langCode === "vi"
                    ? `${videosPerDay.toFixed(1)} video/ngày`
                    : `${videosPerDay.toFixed(1)} videos/day`;
        } else if (videosPerDay >= 1 / 7) {
            frequency =
                langCode === "vi"
                    ? `${perWeek.toFixed(1)} video/tuần (${videosPerDay.toFixed(
                          2
                      )}/ngày)`
                    : `${perWeek.toFixed(
                          1
                      )} videos/week (${videosPerDay.toFixed(2)}/day)`;
        } else {
            frequency =
                langCode === "vi"
                    ? `${perMonth.toFixed(1)} video/tháng (${perWeek.toFixed(
                          2
                      )}/tuần)`
                    : `${perMonth.toFixed(1)} videos/month (${perWeek.toFixed(
                          2
                      )}/week)`;
        }

        // Calculate best posting days from actual data
        const dayCounts: { [key: string]: number } = {};
        const dayNames =
            langCode === "vi"
                ? [
                      "Chủ nhật",
                      "Thứ 2",
                      "Thứ 3",
                      "Thứ 4",
                      "Thứ 5",
                      "Thứ 6",
                      "Thứ 7",
                  ]
                : [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                  ];

        posts.forEach((post) => {
            const day = new Date(post.published_at).getDay();
            const dayName = dayNames[day];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });

        const sortedDays = Object.entries(dayCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency (descending)
            .slice(0, 3) // Get top 3
            .sort((a, b) => {
                // Sort top 3 chronologically
                const indexA = dayNames.indexOf(a[0]);
                const indexB = dayNames.indexOf(b[0]);

                if (langCode === "vi") {
                    // Vietnamese: Monday (1) to Sunday (0), so Sunday should be last
                    const orderA = indexA === 0 ? 7 : indexA; // Sunday becomes 7
                    const orderB = indexB === 0 ? 7 : indexB; // Sunday becomes 7
                    return orderA - orderB;
                } else {
                    // English: Sunday (0) to Saturday (6)
                    return indexA - indexB;
                }
            })
            .map(([day]) => day);

        // Calculate best posting times from actual data
        const hourCounts: { [key: number]: number } = {};
        posts.forEach((post) => {
            const hour = new Date(post.published_at).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const sortedHours = Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency (descending)
            .slice(0, 3) // Get top 3
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0])) // Sort top 3 chronologically (0:00 to 23:00)
            .map(([hour]) => {
                const h = parseInt(hour);
                return `${h.toString().padStart(2, "0")}:00`;
            });

        return {
            frequency,
            bestDays: sortedDays,
            bestTimes: sortedHours,
            totalPosts: posts.length,
            analyzedPeriod: daysDiff,
        };
    };

    const currentStats = calculateCurrentPostingStats();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* ========== BRAND & POSITIONING ========== */}
            {/* Strategy Analysis Section */}
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

            {/* ========== CONTENT ANALYSIS ========== */}
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
                            ? "Lịch đăng nội dung"
                            : "Content Calendar Insights"}
                    </h3>

                    <div className={styles.grid2} style={{ gap: "1rem" }}>
                        {/* Current Posting Stats */}
                        {currentStats && (
                            <div className={styles.card}>
                                <h4
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        color: "#e53935",
                                        marginBottom: "1rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        borderBottom: "2px solid #fecaca",
                                        paddingBottom: "0.5rem",
                                    }}
                                >
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
                                        ? "Hiện trạng kênh"
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
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                marginBottom: "0.25rem",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {langCode === "vi"
                                                ? "TẦN SUẤT ĐĂNG"
                                                : "POSTING FREQUENCY"}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                color: "#e53935",
                                                margin: 0,
                                            }}
                                        >
                                            {currentStats.frequency}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                marginBottom: "0.25rem",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {langCode === "vi"
                                                ? "NGÀY HAY ĐĂNG NHẤT"
                                                : "MOST ACTIVE DAYS"}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#1f2937",
                                                margin: 0,
                                            }}
                                        >
                                            {currentStats.bestDays.join(", ") ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                marginBottom: "0.25rem",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {langCode === "vi"
                                                ? "GIỜ HAY ĐĂNG NHẤT"
                                                : "MOST ACTIVE TIMES"}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#1f2937",
                                                margin: 0,
                                            }}
                                        >
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
                                                ? `${currentStats.totalPosts} video trong ${currentStats.analyzedPeriod} ngày`
                                                : `${currentStats.totalPosts} videos over ${currentStats.analyzedPeriod} days`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recommended Posting Schedule */}
                        {report_part_2.content_calendar && (
                            <div className={styles.card}>
                                <h4
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        color: "#10b981",
                                        marginBottom: "1rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        borderBottom: "2px solid #bbf7d0",
                                        paddingBottom: "0.5rem",
                                    }}
                                >
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
                                        ? "Lịch đề xuất"
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
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                marginBottom: "0.25rem",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {langCode === "vi"
                                                ? "TẦN SUẤT TỐI ƯU"
                                                : "OPTIMAL FREQUENCY"}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                color: "#10b981",
                                                margin: 0,
                                            }}
                                        >
                                            {
                                                report_part_2.content_calendar
                                                    .recommended_frequency
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                marginBottom: "0.25rem",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {langCode === "vi"
                                                ? "NGÀY TỐT NHẤT"
                                                : "BEST DAYS TO POST"}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#1f2937",
                                                margin: 0,
                                            }}
                                        >
                                            {report_part_2.content_calendar.best_posting_days.join(
                                                ", "
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: "10px",
                                                color: "#6b7280",
                                                marginBottom: "0.25rem",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {langCode === "vi"
                                                ? "KHUNG GIỜ VÀNG"
                                                : "BEST TIMES TO POST"}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#1f2937",
                                                margin: 0,
                                            }}
                                        >
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
                            ? "Tổng quan hiệu suất nội dung"
                            : "Content Performance Overview"}
                    </h3>
                    <div className={styles.grid2}>
                        {report_part_2.content_calendar.best_performing_overview && (
                            <div className={`${styles.card} ${styles.bgGreen}`}>
                                <h4 className={`${styles.cardTitle} ${styles.textGreen}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    {langCode === "vi" ? "Video hiệu suất tốt nhất" : "Best Performing Videos"}
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
                                    {langCode === "vi" ? "Video hiệu suất thấp" : "Underperforming Videos"}
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
                                ? "Phối hợp nội dung"
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
                                                        (mix as any).pillar}
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
                                                        {langCode === "vi" ? "Mục đích chiến lược:" : "Strategic Purpose:"}
                                                    </span>
                                                    <p style={{ fontSize: "11px", color: "#555", marginTop: "0.25rem", marginBottom: 0 }}>
                                                        {mix.pillar_purpose}
                                                    </p>
                                                </div>
                                            )}
                                            {mix.performance_insight && (
                                                <div style={{ marginBottom: "0.75rem" }}>
                                                    <span style={{ fontSize: "10px", color: "#666", fontWeight: "600" }}>
                                                        {langCode === "vi" ? "Phân tích hiệu suất:" : "Performance Insight:"}
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


            {/* ========== MARKETING FUNNEL ========== */}
            {/* Funnel Analysis */}
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

            {/* ========== AUDIENCE INTELLIGENCE ========== */}
            {/* Audience Analysis */}
            {report_part_2.audience_analysis && (
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
            )}

            {/* Audience Personas */}
            {report_part_2.audience_personas &&
                report_part_2.audience_personas.length > 0 && (
                    <section id="section-personas">
                        <h3 className={styles.sectionTitle}>
                            <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            {lang.analysis.audiencePersonas.title}
                        </h3>
                        <div className={styles.grid2}>
                            {report_part_2.audience_personas.map(
                                (persona, idx) => (
                                    <div key={idx} className={styles.card}>
                                        <h4
                                            className={styles.cardTitle}
                                            style={{ color: "#6366f1" }}
                                        >
                                            {persona.name}
                                        </h4>
                                        {persona.avatar_description && (
                                            <p
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#666",
                                                    marginBottom: "0.75rem",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {persona.avatar_description}
                                            </p>
                                        )}
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                lineHeight: "1.6",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "1fr 1fr",
                                                    gap: "0.25rem 1rem",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                {persona.age_range && (
                                                    <p>
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .audiencePersonas
                                                                    .ageRange
                                                            }
                                                        </strong>{" "}
                                                        {persona.age_range}
                                                    </p>
                                                )}
                                                {persona.gender && (
                                                    <p>
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .audiencePersonas
                                                                    .gender
                                                            }
                                                        </strong>{" "}
                                                        {persona.gender}
                                                    </p>
                                                )}
                                                {persona.location && (
                                                    <p>
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .audiencePersonas
                                                                    .location
                                                            }
                                                        </strong>{" "}
                                                        {persona.location}
                                                    </p>
                                                )}
                                                {persona.occupation && (
                                                    <p>
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .audiencePersonas
                                                                    .occupation
                                                            }
                                                        </strong>{" "}
                                                        {persona.occupation}
                                                    </p>
                                                )}
                                                {persona.viewing_frequency && (
                                                    <p>
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .audiencePersonas
                                                                    .viewingFrequency
                                                            }
                                                        </strong>{" "}
                                                        {
                                                            persona.viewing_frequency
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <p
                                                style={{
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                <strong>
                                                    {
                                                        lang.analysis
                                                            .audiencePersonas
                                                            .interests
                                                    }
                                                </strong>{" "}
                                                {persona.interests?.join(", ")}
                                            </p>
                                            <p
                                                style={{
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                <strong>
                                                    {
                                                        lang.analysis
                                                            .audiencePersonas
                                                            .painPoints
                                                    }
                                                </strong>{" "}
                                                {persona.pain_points?.join(
                                                    ", "
                                                )}
                                            </p>
                                            {persona.goals &&
                                                persona.goals.length > 0 && (
                                                    <p
                                                        style={{
                                                            marginBottom:
                                                                "0.5rem",
                                                        }}
                                                    >
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .audiencePersonas
                                                                    .goals
                                                            }
                                                        </strong>{" "}
                                                        {persona.goals.join(
                                                            ", "
                                                        )}
                                                    </p>
                                                )}
                                            <p
                                                style={{
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                <strong>
                                                    {
                                                        lang.analysis
                                                            .audiencePersonas
                                                            .contentPreferences
                                                    }
                                                </strong>{" "}
                                                {persona.content_preferences}
                                            </p>
                                            {persona.preferred_video_length && (
                                                <p
                                                    style={{
                                                        marginBottom: "0.5rem",
                                                    }}
                                                >
                                                    <strong>
                                                        {
                                                            lang.analysis
                                                                .audiencePersonas
                                                                .preferredVideoLength
                                                        }
                                                    </strong>{" "}
                                                    {
                                                        persona.preferred_video_length
                                                    }
                                                </p>
                                            )}
                                            {persona.social_platforms &&
                                                persona.social_platforms
                                                    .length > 0 && (
                                                    <p
                                                        style={{
                                                            marginBottom:
                                                                "0.5rem",
                                                        }}
                                                    >
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .audiencePersonas
                                                                    .socialPlatforms
                                                            }
                                                        </strong>{" "}
                                                        {persona.social_platforms.join(
                                                            ", "
                                                        )}
                                                    </p>
                                                )}
                                            {persona.buying_triggers &&
                                                persona.buying_triggers.length >
                                                    0 && (
                                                    <p
                                                        style={{
                                                            marginBottom: 0,
                                                        }}
                                                    >
                                                        <strong>
                                                            {
                                                                lang.analysis
                                                                    .audiencePersonas
                                                                    .buyingTriggers
                                                            }
                                                        </strong>{" "}
                                                        {persona.buying_triggers.join(
                                                            ", "
                                                        )}
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </section>
                )}

            {/* ========== OPTIMIZATION & GROWTH ========== */}
            {/* SEO Analysis */}
            {report_part_2.seo_analysis && (
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
                                                ? `Từ ${Math.min(10, posts.length)} video hiệu suất cao`
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
                                                title={`${langCode === "vi" ? "Xuất hiện trong" : "Appears in"} ${tagData.count} video(s): ${tagData.videos.slice(0, 3).join(", ")}${tagData.videos.length > 3 ? "..." : ""}`}
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
                                                    ? (langCode === "vi" ? "Thu gọn" : "Collapse")
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
                                                {langCode === "vi" ? "nhóm" : "categories"}
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
                                                    const isHighEffective = effectivenessLower.includes("cao") || effectivenessLower.includes("high") || effectivenessLower.includes("tốt") || effectivenessLower.includes("good");
                                                    const isMediumEffective = effectivenessLower.includes("trung bình") || effectivenessLower.includes("medium") || effectivenessLower.includes("average");

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
                                                                        {langCode === "vi" ? "Mục đích:" : "Purpose:"}
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
                                                                            ? (langCode === "vi" ? "Thu gọn" : "Collapse")
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
            )}

            {/* Growth Opportunities */}
            {report_part_2.growth_opportunities &&
                report_part_2.growth_opportunities.length > 0 && (
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
                )}
        </div>
    );
};

export default AnalysisTab;
