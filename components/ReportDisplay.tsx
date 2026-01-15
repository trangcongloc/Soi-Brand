import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MarketingReport, Post } from "@/lib/types";
import styles from "./ReportDisplay.module.css";
import { downloadJSON } from "@/lib/utils";
import { useLang, formatString } from "@/lib/lang";

// Dynamically import chart to avoid SSR issues
const VideoPerformanceChart = dynamic(
    () => import("./VideoPerformanceChart"),
    { ssr: false, loading: () => <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Loading chart...</div> }
);

interface ReportDisplayProps {
    report: MarketingReport;
    onReset?: () => void;
}

const formatFullNumber = (num: number | string): string => {
    const n = typeof num === "string" ? parseInt(num) : num;
    if (isNaN(n)) return "0";
    return n.toLocaleString("vi-VN");
};

const formatDuration = (isoDuration: string): string => {
    // Handle missing or invalid duration
    if (!isoDuration) return "0:00";

    // Parse ISO 8601 duration format (e.g., PT1H2M10S, PT5M30S, PT45S)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");

    const paddedSeconds = seconds.toString().padStart(2, "0");

    // If video is 60 minutes or longer, show HH:MM:SS
    if (hours > 0 || minutes >= 60) {
        const totalHours = hours + Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        const paddedMinutes = remainingMinutes.toString().padStart(2, "0");
        return `${totalHours}:${paddedMinutes}:${paddedSeconds}`;
    }

    // Otherwise show MM:SS
    return `${minutes}:${paddedSeconds}`;
};

const truncateText = (text: string, limit: number): string => {
    if (text.length <= limit) return text;
    const truncated = text.substring(0, limit);
    const lastSpaceIndex = truncated.lastIndexOf(" ");
    return (
        (lastSpaceIndex > 0
            ? truncated.substring(0, lastSpaceIndex)
            : truncated) + " . . ."
    );
};

const getVideoTypeBadge = (videoType: string) => {
    const badgeClass =
        {
            Short: styles.videoTypeShort,
            Live: styles.videoTypeLive,
            Upcoming: styles.videoTypeUpcoming,
            Premiere: styles.videoTypePremiere,
            Video: "", // No special badge for regular videos
        }[videoType] || "";

    if (!badgeClass && videoType === "Video") return null;

    return (
        <span className={`${styles.videoTypeBadge} ${badgeClass}`}>
            {videoType}
        </span>
    );
};

const UploadHeatmap: React.FC<{ posts: Post[] }> = ({ posts }) => {
    const lang = useLang();
    // Generate last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
            date: d,
            dateStr: d.toLocaleDateString("vi-VN"), // dd/mm/yyyy
            isoStr: d.toISOString().split("T")[0], // yyyy-mm-dd for matching
            count: 0,
        };
    });

    // Count posts per day
    posts.forEach((post) => {
        if (!post.published_at) return;
        const postDate = new Date(post.published_at)
            .toISOString()
            .split("T")[0];
        const day = days.find((d) => d.isoStr === postDate);
        if (day) {
            day.count++;
        }
    });

    const max = Math.max(...days.map((d) => d.count), 1);

    const getLevel = (count: number) => {
        if (count === 0) return 0;
        if (max === 1) return 1;
        const level = Math.ceil((count / max) * 5);
        return Math.min(level, 5);
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                }}
            >
                <h4 className={styles.cardTitle} style={{ marginBottom: 0 }}>
                    {lang.heatmap.title}
                </h4>
            </div>

            <div className={styles.heatmapContainer} style={{ marginTop: 0 }}>
                {/* Render as a 7-column grid naturally */}
                <div className={styles.dailyHeatmapGrid}>
                    {days.map((day, idx) => (
                        <div
                            key={idx}
                            className={styles.dailyCell}
                            data-level={getLevel(day.count)}
                            title={`${day.dateStr}: ${formatString(
                                lang.heatmap.videoCount,
                                { count: day.count.toString() }
                            )}`}
                        >
                            {/* Show day number if needed, or just boolean */}
                            <span className={styles.dayNumber}>
                                {day.date.getDate()}
                            </span>
                        </div>
                    ))}
                </div>

                <div className={styles.heatmapLegend}>
                    <span>0</span>
                    <div className={styles.legendScale}>
                        <div
                            className={styles.legendBox}
                            style={{
                                background: "#ffe4e4",
                                // border: "1px solid #e5e7eb",
                            }}
                        ></div>
                        <div
                            className={styles.legendBox}
                            style={{ background: "#ffd9d9" }}
                        ></div>
                        <div
                            className={styles.legendBox}
                            style={{ background: "#ffc8c8" }}
                        ></div>
                        <div
                            className={styles.legendBox}
                            style={{ background: "#ffa8a8" }}
                        ></div>
                        <div
                            className={styles.legendBox}
                            style={{ background: "#fa9191" }}
                        ></div>
                    </div>
                    <span>5</span>
                </div>
            </div>
        </div>
    );
};

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, onReset }) => {
    const lang = useLang();
    const [activeTab, setActiveTab] = useState<
        "data" | "analysis" | "evaluation"
    >("data");
    const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [isChannelHovered, setIsChannelHovered] = useState(false);
    const [isDescExpanded, setIsDescExpanded] = useState(false);

    const handleCopyTags = (tags: string[]) => {
        const text = tags.join(", ");
        navigator.clipboard.writeText(text);
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const toggleAccordion = (index: number) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    const { report_part_1, report_part_2, report_part_3 } = report;
    const posts = report_part_1?.posts || [];
    const channelInfo = report_part_1?.channel_info;

    const handleChannelClick = () => {
        if (channelInfo?.channelId) {
            const channelUrl = `https://www.youtube.com/channel/${channelInfo.channelId}`;
            window.open(channelUrl, "_blank");
        }
    };

    // Time-based Ranking Algorithm (no longer uses likes/comments)
    const calculateHackerNewsScore = (
        likes: number,
        comments: number,
        publishedAt: string
    ) => {
        const points = 1; // Constant base score, no longer using likes + comments
        const now = new Date();
        const published = new Date(publishedAt);
        const hours = Math.max(
            0,
            (now.getTime() - published.getTime()) / (1000 * 60 * 60)
        );
        const gravity = 1.8;
        const score = (points - 1) / Math.pow(hours + 2, gravity);
        return score.toFixed(2);
    };

    // Calculate top 3 posts by rating score
    const postsWithScores = posts.map((post, index) => ({
        index,
        score: parseFloat(
            calculateHackerNewsScore(
                post.statistics.digg_count,
                post.statistics.comment_count,
                post.published_at
            )
        ),
    }));

    const sortedByScore = [...postsWithScores].sort(
        (a, b) => b.score - a.score
    );
    const topIndices = new Set(
        sortedByScore.slice(0, 5).map((item) => item.index)
    );

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
                                { id: "data", label: lang.sidebar.tabs.data },
                                { id: "analysis", label: lang.sidebar.tabs.analysis },
                                { id: "evaluation", label: lang.sidebar.tabs.evaluation },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`${styles.tabButton} ${
                                        activeTab === tab.id
                                            ? styles.activeTab
                                            : ""
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
                                onClick={() =>
                                    downloadJSON(report, report.brand_name)
                                }
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
                        })}
                    </p>
                </div>

                {/* Content based on Active Tab */}
                <div className="fade-in">
                    {activeTab === "data" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2rem",
                            }}
                        >
                            {/* Data Section Grid: Stats (Left) + Heatmap (Right) */}
                            <section>
                                <h3 className={styles.sectionTitle}>
                                    {lang.channel.sectionTitle}
                                </h3>
                                <div className={styles.grid2}>
                                    {channelInfo && (
                                        <div className={styles.channelCard}>
                                            <div
                                                className={
                                                    styles.channelInfoTop
                                                }
                                            >
                                                {channelInfo.avatar && (
                                                    <img
                                                        src={channelInfo.avatar}
                                                        alt={
                                                            channelInfo.nickname
                                                        }
                                                        className={
                                                            styles.channelAvatar
                                                        }
                                                    />
                                                )}
                                                <div
                                                    className={
                                                        styles.channelTitles
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.channelNickname
                                                        }
                                                        onMouseEnter={() =>
                                                            setIsChannelHovered(
                                                                true
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setIsChannelHovered(
                                                                false
                                                            )
                                                        }
                                                        onClick={
                                                            handleChannelClick
                                                        }
                                                    >
                                                        {isChannelHovered &&
                                                        channelInfo.uniqueId
                                                            ? channelInfo.uniqueId
                                                            : channelInfo.nickname}
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.channelSubscribers
                                                        }
                                                    >
                                                        {
                                                            lang.channel
                                                                .createdDate
                                                        }{" "}
                                                        {channelInfo.joinedAt
                                                            ? new Date(
                                                                  channelInfo.joinedAt
                                                              ).toLocaleDateString(
                                                                  "vi-VN"
                                                              )
                                                            : lang.channel
                                                                  .notUpdated}
                                                    </span>
                                                </div>
                                            </div>

                                            <div
                                                className={
                                                    styles.channelStatsGrid
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.channelStatCard
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.channelStatValue
                                                        }
                                                    >
                                                        {formatFullNumber(
                                                            channelInfo.stats
                                                                .videoCount
                                                        )}
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.channelStatLabel
                                                        }
                                                    >
                                                        {
                                                            lang.channel.stats
                                                                .videos
                                                        }
                                                    </span>
                                                </div>
                                                <div
                                                    className={
                                                        styles.channelStatCard
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.channelStatValue
                                                        }
                                                    >
                                                        {formatFullNumber(
                                                            channelInfo.stats
                                                                .viewCount
                                                        )}
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.channelStatLabel
                                                        }
                                                    >
                                                        {
                                                            lang.channel.stats
                                                                .views
                                                        }
                                                    </span>
                                                </div>
                                                <div
                                                    className={
                                                        styles.channelStatCard
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.channelStatValue
                                                        }
                                                    >
                                                        {formatFullNumber(
                                                            channelInfo.stats
                                                                .followerCount
                                                        )}
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.channelStatLabel
                                                        }
                                                    >
                                                        {
                                                            lang.channel.stats
                                                                .subs
                                                        }
                                                    </span>
                                                </div>
                                                <div
                                                    className={
                                                        styles.channelStatCard
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.channelStatValue
                                                        }
                                                    >
                                                        {formatFullNumber(
                                                            channelInfo.stats
                                                                .heartCount
                                                        )}
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.channelStatLabel
                                                        }
                                                    >
                                                        {
                                                            lang.channel.stats
                                                                .likes
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Channel Description */}
                                            {channelInfo.signature && (
                                                <div
                                                    className={
                                                        styles.channelDescription
                                                    }
                                                >
                                                    <p
                                                        className={
                                                            styles.channelDescText
                                                        }
                                                    >
                                                        {truncateText(
                                                            channelInfo.signature,
                                                            150
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className={styles.card}
                                        style={{ height: "100%" }}
                                    >
                                        <UploadHeatmap posts={posts} />
                                    </div>
                                </div>
                            </section>

                            {/* Posts Accordion */}
                            <section>
                                <h3 className={styles.sectionTitle}>
                                    {lang.posts.sectionTitle}
                                </h3>
                                <div className={styles.postList}>
                                    {posts.map((post, index) => (
                                        <div
                                            key={index}
                                            className={styles.postCard}
                                        >
                                            <div
                                                className={`${
                                                    styles.accordionHeader
                                                } ${
                                                    activeAccordion === index
                                                        ? styles.accordionHeaderActive
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    toggleAccordion(index)
                                                }
                                            >
                                                <div
                                                    className={styles.postMeta}
                                                >
                                                    <div
                                                        className={
                                                            styles.ratingBox
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.postIndex
                                                            }
                                                        >
                                                            #{index + 1}
                                                        </span>
                                                        <span
                                                            className={
                                                                styles.ratingScore
                                                            }
                                                        >
                                                            {calculateHackerNewsScore(
                                                                post.statistics
                                                                    .digg_count,
                                                                post.statistics
                                                                    .comment_count,
                                                                post.published_at
                                                            )}
                                                            {topIndices.has(
                                                                index
                                                            ) && " 🔥"}
                                                        </span>
                                                    </div>
                                                    {post.thumbnail && (
                                                        <img
                                                            src={post.thumbnail}
                                                            alt={post.title}
                                                            className={
                                                                styles.postThumbnail
                                                            }
                                                        />
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <p
                                                            className={
                                                                styles.postTitle
                                                            }
                                                        >
                                                            {post.title ||
                                                                `Bài đăng ${
                                                                    index + 1
                                                                }`}
                                                        </p>
                                                        {/* {post.url && (
                                                            <a
                                                                href={post.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <svg
                                                                    width="10"
                                                                    height="10"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                                    <line
                                                                        x1="10"
                                                                        y1="14"
                                                                        x2="21"
                                                                        y2="3"
                                                                    ></line>
                                                                </svg>
                                                                Xem trên YouTube
                                                            </a>
                                                        )} */}
                                                    </div>
                                                </div>
                                                <span
                                                    className={
                                                        styles.videoBadge
                                                    }
                                                >
                                                    {formatDuration(
                                                        post.duration
                                                    )}
                                                </span>
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className={`${
                                                        styles.accordionIcon
                                                    } ${
                                                        activeAccordion ===
                                                        index
                                                            ? styles.rotate180
                                                            : ""
                                                    }`}
                                                >
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </div>

                                            {activeAccordion === index && (
                                                <div
                                                    className={
                                                        styles.accordionBody
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.postStats
                                                        }
                                                    >
                                                        <div>
                                                            <span
                                                                className={
                                                                    styles.mutedText
                                                                }
                                                            >
                                                                {
                                                                    lang.posts
                                                                        .viewCount
                                                                }{" "}
                                                            </span>
                                                            <span className="font-bold">
                                                                {formatFullNumber(
                                                                    post
                                                                        .statistics
                                                                        .play_count
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span
                                                                className={
                                                                    styles.mutedText
                                                                }
                                                            >
                                                                {
                                                                    lang.posts
                                                                        .likeCount
                                                                }{" "}
                                                            </span>
                                                            <span className="font-bold">
                                                                {formatFullNumber(
                                                                    post
                                                                        .statistics
                                                                        .digg_count
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span
                                                                className={
                                                                    styles.mutedText
                                                                }
                                                            >
                                                                {
                                                                    lang.posts
                                                                        .publishDate
                                                                }{" "}
                                                            </span>
                                                            <span className="font-semibold">
                                                                {new Date(
                                                                    post.created_at
                                                                ).toLocaleDateString(
                                                                    "vi-VN"
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* SEO Tags Box */}
                                                    {post.tags &&
                                                        post.tags.length >
                                                            0 && (
                                                            <div
                                                                className={
                                                                    styles.seoBox
                                                                }
                                                                style={{
                                                                    marginBottom:
                                                                        "1rem",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        marginBottom:
                                                                            "0.5rem",
                                                                    }}
                                                                >
                                                                    <p
                                                                        className={
                                                                            styles.seoTitle
                                                                        }
                                                                        style={{
                                                                            margin: 0,
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            width="10"
                                                                            height="10"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="3"
                                                                        >
                                                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                                                            <line
                                                                                x1="7"
                                                                                y1="7"
                                                                                x2="7.01"
                                                                                y2="7"
                                                                            ></line>
                                                                        </svg>
                                                                        {
                                                                            lang
                                                                                .posts
                                                                                .seoTags
                                                                        }
                                                                    </p>
                                                                    <button
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            handleCopyTags(
                                                                                post.tags
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            fontSize:
                                                                                "10px",
                                                                            padding:
                                                                                "2px 8px",
                                                                            borderRadius:
                                                                                "4px",
                                                                            background:
                                                                                "#dbeafe",
                                                                            color: "#1e40af",
                                                                            border: "none",
                                                                            cursor: "pointer",
                                                                            fontWeight:
                                                                                "600",
                                                                        }}
                                                                    >
                                                                        {copyStatus ===
                                                                        "Copied!"
                                                                            ? lang
                                                                                  .posts
                                                                                  .copied
                                                                            : lang
                                                                                  .posts
                                                                                  .copyTags}
                                                                    </button>
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.tagsWrapper
                                                                    }
                                                                >
                                                                    {post.tags.map(
                                                                        (
                                                                            tag,
                                                                            tidx
                                                                        ) => {
                                                                            const cleanTag =
                                                                                tag
                                                                                    .replace(
                                                                                        /['"\[]]/g,
                                                                                        ""
                                                                                    )
                                                                                    .trim();
                                                                            if (
                                                                                !cleanTag
                                                                            )
                                                                                return null;
                                                                            return (
                                                                                <span
                                                                                    key={
                                                                                        tidx
                                                                                    }
                                                                                    className={
                                                                                        styles.tag
                                                                                    }
                                                                                >
                                                                                    #
                                                                                    {cleanTag.replace(
                                                                                        /^#/,
                                                                                        ""
                                                                                    )}
                                                                                </span>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    {/* Description */}
                                                    <div>
                                                        <p
                                                            className={
                                                                styles.descLabel
                                                            }
                                                        >
                                                            {
                                                                lang.posts
                                                                    .description
                                                            }
                                                        </p>
                                                        <p
                                                            className={
                                                                styles.descText
                                                            }
                                                        >
                                                            {post.desc ||
                                                                lang.posts
                                                                    .noDescription}
                                                        </p>
                                                    </div>

                                                    {/* Video URL */}
                                                    <div
                                                        style={{
                                                            marginTop: "1rem",
                                                        }}
                                                    >
                                                        <p
                                                            className={
                                                                styles.descLabel
                                                            }
                                                        >
                                                            {
                                                                lang.posts
                                                                    .videoUrl
                                                            }
                                                        </p>
                                                        <div
                                                            className={
                                                                styles.descText
                                                            }
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "space-between",
                                                                gap: "0.75rem",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    overflow:
                                                                        "hidden",
                                                                    textOverflow:
                                                                        "ellipsis",
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                    flex: 1,
                                                                    opacity: 0.8,
                                                                }}
                                                            >
                                                                {post.url}
                                                            </span>
                                                            <a
                                                                href={post.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-blue-500 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm"
                                                                title="Mở link"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    width="14"
                                                                    height="14"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                                    <line
                                                                        x1="10"
                                                                        y1="14"
                                                                        x2="21"
                                                                        y2="3"
                                                                    ></line>
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === "analysis" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2rem",
                            }}
                        >
                            <section>
                                <h3 className={styles.sectionTitle}>
                                    {lang.analysis.strategyTitle}
                                </h3>
                                <div className={styles.grid2}>
                                    <div className={styles.card}>
                                        <h4 className={styles.cardTitle}>
                                            {lang.analysis.brandIdentity.title}
                                        </h4>
                                        <div className={styles.analysisText}>
                                            <p>
                                                <span className="font-semibold">
                                                    {
                                                        lang.analysis
                                                            .brandIdentity.style
                                                    }
                                                </span>{" "}
                                                {
                                                    report_part_2
                                                        .strategy_analysis
                                                        .brand_identity
                                                        .visual_style
                                                }
                                            </p>
                                            <p>
                                                <span className="font-semibold">
                                                    {
                                                        lang.analysis
                                                            .brandIdentity.tone
                                                    }
                                                </span>{" "}
                                                {
                                                    report_part_2
                                                        .strategy_analysis
                                                        .brand_identity
                                                        .tone_of_voice
                                                }
                                            </p>
                                            <p>
                                                <span className="font-semibold">
                                                    {
                                                        lang.analysis
                                                            .brandIdentity
                                                            .positioning
                                                    }
                                                </span>{" "}
                                                {
                                                    report_part_2
                                                        .strategy_analysis
                                                        .brand_identity
                                                        .brand_positioning
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className={styles.card}>
                                        <h4 className={styles.cardTitle}>
                                            {lang.analysis.contentFocus.title}
                                        </h4>
                                        <p
                                            className={`${styles.analysisText} ${styles.mutedText}`}
                                        >
                                            {report_part_2.strategy_analysis
                                                .content_focus?.overview ||
                                                lang.analysis.contentFocus
                                                    .noData}
                                        </p>
                                        <div className={styles.adAngles}>
                                            {report_part_2.strategy_analysis.content_focus?.topics?.map(
                                                (topic, i) => (
                                                    <span
                                                        key={i}
                                                        className={
                                                            styles.angleTag
                                                        }
                                                    >
                                                        {topic}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                                                    <span
                                                        key={i}
                                                        className={
                                                            styles.angleTag
                                                        }
                                                    >
                                                        {angle}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Funnel Analysis */}
                            <section>
                                <h3 className={styles.sectionTitle}>
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
                                                            padding:
                                                                "0.25rem 0.5rem",
                                                            background:
                                                                "#3b82f6",
                                                            color: "white",
                                                            borderRadius:
                                                                "0.25rem",
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
                                                        {
                                                            lang.analysis
                                                                .funnelAnalysis
                                                                .tofu
                                                        }
                                                    </span>
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: "12px",
                                                        lineHeight: "1.6",
                                                        color: "#444",
                                                    }}
                                                >
                                                    {
                                                        report_part_2
                                                            .funnel_analysis
                                                            .tofu
                                                    }
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
                                                            padding:
                                                                "0.25rem 0.5rem",
                                                            background:
                                                                "#f59e0b",
                                                            color: "white",
                                                            borderRadius:
                                                                "0.25rem",
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
                                                        {
                                                            lang.analysis
                                                                .funnelAnalysis
                                                                .mofu
                                                        }
                                                    </span>
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: "12px",
                                                        lineHeight: "1.6",
                                                        color: "#444",
                                                    }}
                                                >
                                                    {
                                                        report_part_2
                                                            .funnel_analysis
                                                            .mofu
                                                    }
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
                                                            padding:
                                                                "0.25rem 0.5rem",
                                                            background:
                                                                "#10b981",
                                                            color: "white",
                                                            borderRadius:
                                                                "0.25rem",
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
                                                        {
                                                            lang.analysis
                                                                .funnelAnalysis
                                                                .bofu
                                                        }
                                                    </span>
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: "12px",
                                                        lineHeight: "1.6",
                                                        color: "#444",
                                                    }}
                                                >
                                                    {
                                                        report_part_2
                                                            .funnel_analysis
                                                            .bofu
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Quantitative Synthesis */}
                            <section>
                                <h3 className={styles.sectionTitle}>
                                    {lang.analysis.quantitativeSynthesis.title}
                                </h3>
                                <div style={{ marginTop: "1rem" }}>
                                    <div className={styles.grid2}>
                                        {/* Summary Stats */}
                                        <div className={styles.card}>
                                            <h5
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                {
                                                    lang.analysis
                                                        .quantitativeSynthesis
                                                        .summaryStats.title
                                                }
                                            </h5>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>
                                                        {
                                                            lang.analysis
                                                                .quantitativeSynthesis
                                                                .summaryStats
                                                                .totalViews
                                                        }
                                                    </strong>{" "}
                                                    {report_part_2.quantitative_synthesis.summary_stats.total_views.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>
                                                        {
                                                            lang.analysis
                                                                .quantitativeSynthesis
                                                                .summaryStats
                                                                .totalLikes
                                                        }
                                                    </strong>{" "}
                                                    {report_part_2.quantitative_synthesis.summary_stats.total_likes.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>
                                                        {
                                                            lang.analysis
                                                                .quantitativeSynthesis
                                                                .summaryStats
                                                                .totalVideos
                                                        }
                                                    </strong>{" "}
                                                    {report_part_2.quantitative_synthesis.summary_stats.total_videos.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Channel Health */}
                                        <div className={styles.card}>
                                            <h5
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                {
                                                    lang.analysis
                                                        .quantitativeSynthesis
                                                        .channelHealth.title
                                                }
                                            </h5>
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    lineHeight: "1.6",
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        marginBottom: "0.5rem",
                                                    }}
                                                >
                                                    <strong>
                                                        {
                                                            lang.analysis
                                                                .quantitativeSynthesis
                                                                .channelHealth
                                                                .followerCount
                                                        }
                                                    </strong>{" "}
                                                    {
                                                        report_part_2
                                                            .quantitative_synthesis
                                                            .channel_health
                                                            .follower_count
                                                    }
                                                </p>
                                                <p
                                                    style={{
                                                        marginBottom: "0.5rem",
                                                    }}
                                                >
                                                    <strong>
                                                        Tần suất đăng:
                                                    </strong>{" "}
                                                    {
                                                        report_part_2
                                                            .quantitative_synthesis
                                                            .channel_health
                                                            .posting_frequency
                                                    }
                                                </p>
                                                <p style={{ marginBottom: 0 }}>
                                                    <strong>
                                                        Tỷ lệ tương tác (ER):
                                                        <span
                                                            className={
                                                                styles.infoIcon
                                                            }
                                                        >
                                                            ℹ
                                                            <span
                                                                className={
                                                                    styles.tooltip
                                                                }
                                                            >
                                                                (Tổng Like +
                                                                Tổng Bình luận)
                                                                / Tổng Lượt xem
                                                                × 100%
                                                            </span>
                                                        </span>
                                                    </strong>{" "}
                                                    {
                                                        report_part_2
                                                            .quantitative_synthesis
                                                            .channel_health
                                                            .er_rate
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Channel Metrics */}
                                        <div className={styles.card}>
                                            <h5
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                Chỉ Số Kênh
                                            </h5>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>Số video:</strong>{" "}
                                                    {report_part_2.quantitative_synthesis.channel_metrics.video_count.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>
                                                        Người theo dõi:
                                                    </strong>{" "}
                                                    {report_part_2.quantitative_synthesis.channel_metrics.follower_count.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>
                                                        Đang theo dõi:
                                                    </strong>{" "}
                                                    {report_part_2.quantitative_synthesis.channel_metrics.following_count.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>Lượt thích:</strong>{" "}
                                                    {report_part_2.quantitative_synthesis.channel_metrics.heart_count.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Performance */}
                                        <div className={styles.card}>
                                            <h5
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                Hiệu Suất Nội Dung
                                            </h5>
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    lineHeight: "1.6",
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        marginBottom: "0.5rem",
                                                    }}
                                                >
                                                    <strong>
                                                        Lượt xem TB:
                                                        <span
                                                            className={
                                                                styles.infoIcon
                                                            }
                                                        >
                                                            ℹ
                                                            <span
                                                                className={
                                                                    styles.tooltip
                                                                }
                                                            >
                                                                Tổng lượt xem /
                                                                Số lượng video
                                                            </span>
                                                        </span>
                                                    </strong>{" "}
                                                    {
                                                        report_part_2
                                                            .quantitative_synthesis
                                                            .content_performance
                                                            .avg_view
                                                    }
                                                </p>
                                                <p
                                                    style={{
                                                        marginBottom: "0.5rem",
                                                    }}
                                                >
                                                    <strong>Điểm Viral:</strong>{" "}
                                                    {
                                                        report_part_2
                                                            .quantitative_synthesis
                                                            .content_performance
                                                            .viral_score
                                                    }
                                                </p>
                                                <p
                                                    style={{
                                                        marginBottom: "0.5rem",
                                                    }}
                                                >
                                                    <strong>
                                                        Điểm Giá Trị:
                                                    </strong>{" "}
                                                    {
                                                        report_part_2
                                                            .quantitative_synthesis
                                                            .content_performance
                                                            .value_score
                                                    }
                                                </p>
                                                <p style={{ marginBottom: 0 }}>
                                                    <strong>
                                                        Tỷ lệ Quảng Cáo:
                                                    </strong>{" "}
                                                    {
                                                        report_part_2
                                                            .quantitative_synthesis
                                                            .content_performance
                                                            .ad_ratio
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Video Performance Chart */}
                                    {posts.length > 0 && (
                                        <div className={styles.card} style={{ marginTop: '1rem' }}>
                                            <h5 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '0.75rem' }}>
                                                Top Video Performance
                                            </h5>
                                            <VideoPerformanceChart posts={posts} maxItems={8} />
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <h3 className={styles.sectionTitle}>
                                    {lang.analysis.contentPillars.title}
                                </h3>
                                <div
                                    style={{ display: "grid", gap: "0.75rem" }}
                                >
                                    {report_part_2.strategy_analysis.content_pillars.map(
                                        (pillar, idx) => (
                                            <div
                                                key={idx}
                                                className={styles.pillarCard}
                                            >
                                                <div
                                                    className={
                                                        styles.pillarHeader
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.pillarIndex
                                                        }
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                    <h4
                                                        className={
                                                            styles.pillarTitle
                                                        }
                                                    >
                                                        {pillar.pillar}
                                                    </h4>
                                                </div>
                                                <p
                                                    className={
                                                        styles.pillarDesc
                                                    }
                                                >
                                                    {pillar.description}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>

                            {/* Audience Personas - New Section */}
                            {report_part_2.audience_personas && report_part_2.audience_personas.length > 0 && (
                                <section>
                                    <h3 className={styles.sectionTitle}>
                                        {lang.analysis.audiencePersonas.title}
                                    </h3>
                                    <div className={styles.grid2}>
                                        {report_part_2.audience_personas.map((persona, idx) => (
                                            <div key={idx} className={styles.card}>
                                                <h4 className={styles.cardTitle} style={{ color: '#6366f1' }}>
                                                    {persona.name}
                                                </h4>
                                                <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                                                    <p style={{ marginBottom: '0.5rem' }}>
                                                        <strong>{lang.analysis.audiencePersonas.demographics}</strong>{' '}
                                                        {persona.demographics}
                                                    </p>
                                                    <p style={{ marginBottom: '0.5rem' }}>
                                                        <strong>{lang.analysis.audiencePersonas.interests}</strong>{' '}
                                                        {persona.interests.join(', ')}
                                                    </p>
                                                    <p style={{ marginBottom: '0.5rem' }}>
                                                        <strong>{lang.analysis.audiencePersonas.painPoints}</strong>{' '}
                                                        {persona.pain_points.join(', ')}
                                                    </p>
                                                    <p style={{ marginBottom: 0 }}>
                                                        <strong>{lang.analysis.audiencePersonas.contentPreferences}</strong>{' '}
                                                        {persona.content_preferences}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Content Calendar - New Section */}
                            {report_part_2.content_calendar && (
                                <section>
                                    <h3 className={styles.sectionTitle}>
                                        {lang.analysis.contentCalendar.title}
                                    </h3>
                                    <div className={styles.card}>
                                        <div className={styles.grid2} style={{ gap: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '11px', marginBottom: '0.5rem' }}>
                                                    <strong>{lang.analysis.contentCalendar.bestDays}</strong>{' '}
                                                    {report_part_2.content_calendar.best_posting_days.join(', ')}
                                                </p>
                                                <p style={{ fontSize: '11px', marginBottom: '0.5rem' }}>
                                                    <strong>{lang.analysis.contentCalendar.bestTimes}</strong>{' '}
                                                    {report_part_2.content_calendar.best_posting_times.join(', ')}
                                                </p>
                                                <p style={{ fontSize: '11px', marginBottom: 0 }}>
                                                    <strong>{lang.analysis.contentCalendar.recommendedFrequency}</strong>{' '}
                                                    {report_part_2.content_calendar.recommended_frequency}
                                                </p>
                                            </div>
                                            {report_part_2.content_calendar.content_mix && (
                                                <div>
                                                    <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                        Content Mix:
                                                    </p>
                                                    {report_part_2.content_calendar.content_mix.map((mix, idx) => (
                                                        <div key={idx} style={{ marginBottom: '0.25rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                                                <span>{mix.pillar}</span>
                                                                <span style={{ fontWeight: '600' }}>{mix.percentage}%</span>
                                                            </div>
                                                            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${mix.percentage}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Growth Opportunities - New Section */}
                            {report_part_2.growth_opportunities && report_part_2.growth_opportunities.length > 0 && (
                                <section>
                                    <h3 className={styles.sectionTitle}>
                                        {lang.analysis.growthOpportunities.title}
                                    </h3>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {report_part_2.growth_opportunities.map((opp, idx) => (
                                            <div key={idx} className={styles.card} style={{ borderLeft: `3px solid ${opp.priority === 'high' ? '#ef4444' : opp.priority === 'medium' ? '#f59e0b' : '#10b981'}` }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <span style={{
                                                        fontSize: '9px',
                                                        fontWeight: '700',
                                                        padding: '0.125rem 0.375rem',
                                                        borderRadius: '0.25rem',
                                                        textTransform: 'uppercase',
                                                        background: opp.priority === 'high' ? '#fef2f2' : opp.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
                                                        color: opp.priority === 'high' ? '#ef4444' : opp.priority === 'medium' ? '#f59e0b' : '#10b981',
                                                    }}>
                                                        {opp.priority}
                                                    </span>
                                                    <h4 style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>
                                                        {opp.opportunity}
                                                    </h4>
                                                </div>
                                                <p style={{ fontSize: '11px', color: '#666', marginBottom: '0.5rem' }}>
                                                    {opp.description}
                                                </p>
                                                <p style={{ fontSize: '10px', color: '#10b981', fontWeight: '500' }}>
                                                    {opp.expected_impact}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {activeTab === "evaluation" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2rem",
                            }}
                        >
                            <section>
                                <h3 className={styles.sectionTitle}>
                                    {lang.evaluation.overallTitle}
                                </h3>
                                <div
                                    className={`${styles.card} ${styles.summaryCard}`}
                                >
                                    <h4
                                        className={`${styles.cardTitle} ${styles.textBlue}`}
                                    >
                                        {lang.evaluation.executiveSummary}
                                    </h4>
                                    <p
                                        className={`${styles.analysisText}`}
                                        style={{ color: "#333" }}
                                    >
                                        {report_part_3.executive_summary}
                                    </p>
                                </div>

                                <div className={styles.grid2}>
                                    <div
                                        className={`${styles.card} ${styles.bgGreen}`}
                                    >
                                        <h4
                                            className={`${styles.cardTitle} ${styles.textGreen}`}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: "50%",
                                                    background: "#22c55e",
                                                }}
                                            ></span>
                                            {lang.evaluation.strengths.title}
                                        </h4>
                                        <ul className={styles.list}>
                                            {report_part_3.strengths.map(
                                                (s, i) => (
                                                    <li
                                                        key={i}
                                                        className={`${styles.listItem} ${styles.listGreen}`}
                                                    >
                                                        {s}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                    <div
                                        className={`${styles.card} ${styles.bgOrange}`}
                                    >
                                        <h4
                                            className={`${styles.cardTitle} ${styles.textOrange}`}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: "50%",
                                                    background: "#f97316",
                                                }}
                                            ></span>
                                            {lang.evaluation.weaknesses.title}
                                        </h4>
                                        <ul className={styles.list}>
                                            {report_part_3.weaknesses_opportunities.map(
                                                (w, i) => (
                                                    <li
                                                        key={i}
                                                        className={`${styles.listItem} ${styles.listOrange}`}
                                                    >
                                                        {w}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className={styles.sectionTitle}>
                                    {lang.evaluation.insights.title}
                                </h3>
                                <div
                                    style={{ display: "grid", gap: "0.75rem" }}
                                >
                                    {report_part_3.actionable_insights.video_ideas.map(
                                        (idea, idx) => (
                                            <div
                                                key={idx}
                                                className={styles.ideaCard}
                                            >
                                                <div
                                                    className={styles.ideaIcon}
                                                >
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="#2563eb"
                                                        strokeWidth="2"
                                                    >
                                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                                    </svg>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4
                                                        className={
                                                            styles.ideaTitle
                                                        }
                                                    >
                                                        {idea.title}
                                                    </h4>
                                                    <p
                                                        className={
                                                            styles.ideaDesc
                                                        }
                                                    >
                                                        {idea.concept}
                                                    </p>
                                                    {(idea.estimated_views || idea.content_type) && (
                                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '10px' }}>
                                                            {idea.content_type && (
                                                                <span style={{ color: '#6366f1', fontWeight: '500' }}>
                                                                    {idea.content_type}
                                                                </span>
                                                            )}
                                                            {idea.estimated_views && (
                                                                <span style={{ color: '#10b981', fontWeight: '500' }}>
                                                                    {lang.evaluation.videoIdeas.estimatedPerformance} {idea.estimated_views}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportDisplay;
