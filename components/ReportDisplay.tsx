import React, { useState } from "react";
import { MarketingReport, Post } from "@/lib/types";
import styles from "./ReportDisplay.module.css";
import { downloadJSON } from "@/lib/utils";

interface ReportDisplayProps {
    report: MarketingReport;
    onReset?: () => void;
}

const formatFullNumber = (num: number | string): string => {
    const n = typeof num === "string" ? parseInt(num) : num;
    if (isNaN(n)) return "0";
    return n.toLocaleString("vi-VN");
};

const UploadHeatmap: React.FC<{ posts: Post[] }> = ({ posts }) => {
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
                    Tần suất đăng (30 ngày qua)
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
                            title={`${day.dateStr}: ${day.count} video`}
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

    // Hacker News Ranking Algorithm
    const calculateHackerNewsScore = (
        likes: number,
        comments: number,
        publishedAt: string
    ) => {
        const points = likes + comments;
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
                            ← Phân tích kênh khác
                        </button>
                    )}
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarTitle}>Báo cáo</h2>
                        <nav className={styles.nav}>
                            {[
                                { id: "data", label: "Dữ liệu" },
                                { id: "analysis", label: "Phân tích" },
                                { id: "evaluation", label: "Đánh giá" },
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
                                Báo cáo này được phân tích bằng mô hình AI siêu
                                cấp víp pờ rồ.
                            </p>
                            <button
                                onClick={() =>
                                    downloadJSON(report, report.brand_name)
                                }
                                className={styles.downloadBtn}
                            >
                                Tải báo cáo
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
                            ? "Dữ liệu"
                            : activeTab === "analysis"
                            ? "Phân tích"
                            : "Đánh giá"}
                    </h1>
                    <p className={styles.description}>
                        Dữ liệu thô từ YouTube của kênh {report.brand_name} với
                        các bài đăng gần nhất.
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
                                <h3 className={styles.sectionTitle}>Kênh</h3>
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
                                                        Ngày tạo kênh:{" "}
                                                        {channelInfo.joinedAt
                                                            ? new Date(
                                                                  channelInfo.joinedAt
                                                              ).toLocaleDateString(
                                                                  "vi-VN"
                                                              )
                                                            : "Chưa cập nhật"}
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
                                                        Videos
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
                                                        Views
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
                                                        Subs
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
                                                        Likes
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
                                                        {channelInfo.signature}
                                                        ...
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
                                    Nội dung trên kênh
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
                                                    <span
                                                        className={
                                                            styles.videoBadge
                                                        }
                                                    >
                                                        Video
                                                    </span>
                                                </div>
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
                                                                Lượt xem:{" "}
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
                                                                Lượt thích:{" "}
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
                                                                Ngày đăng:{" "}
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
                                                                        SEO Tags
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
                                                                            ? "Copied!"
                                                                            : "Copy Tags"}
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
                                                            Mô tả video
                                                        </p>
                                                        <p
                                                            className={
                                                                styles.descText
                                                            }
                                                        >
                                                            {post.desc ||
                                                                "Không có mô tả"}
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
                                                            Video URL
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
                                    Phân tích Chiến lược
                                </h3>
                                <div className={styles.grid2}>
                                    <div className={styles.card}>
                                        <h4 className={styles.cardTitle}>
                                            Tính cách thương hiệu
                                        </h4>
                                        <div className={styles.analysisText}>
                                            <p>
                                                <span className="font-semibold">
                                                    Style:
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
                                                    Tone:
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
                                                    Định vị:
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
                                            Nội dung đăng trên kênh
                                        </h4>
                                        <p
                                            className={`${styles.analysisText} ${styles.mutedText}`}
                                        >
                                            {report_part_2.strategy_analysis
                                                .content_focus?.overview ||
                                                "Chưa có dữ liệu"}
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
                                            Chiến lược Quảng cáo
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
                                    Phân tích Phễu Marketing
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
                                                        Top of Funnel - Thu hút
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
                                                        Middle of Funnel - Nuôi
                                                        dưỡng
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
                                                        Bottom of Funnel -
                                                        Chuyển đổi
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
                                    Tổng Hợp Định Lượng
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
                                                Tổng Quan Số Liệu
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
                                                        Tổng số bài:
                                                    </strong>{" "}
                                                    {report_part_2.quantitative_synthesis.summary_stats.total_posts.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>
                                                        Tổng lượt xem:
                                                    </strong>{" "}
                                                    {report_part_2.quantitative_synthesis.summary_stats.total_views.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>
                                                        Tổng lượt thích:
                                                    </strong>{" "}
                                                    {report_part_2.quantitative_synthesis.summary_stats.total_likes.toLocaleString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                                <div
                                                    style={{ fontSize: "11px" }}
                                                >
                                                    <strong>Tổng video:</strong>{" "}
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
                                                Tương Tác Kênh
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
                                                        Người đăng ký:
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
                                </div>
                            </section>

                            <section>
                                <h3 className={styles.sectionTitle}>
                                    Trụ cột nội dung (Content Pillars)
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
                                    Đánh giá chung
                                </h3>
                                <div
                                    className={`${styles.card} ${styles.summaryCard}`}
                                >
                                    <h4
                                        className={`${styles.cardTitle} ${styles.textBlue}`}
                                    >
                                        Executive Summary
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
                                            Điểm mạnh
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
                                            Điểm yếu & Cơ hội
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
                                    Đề xuất hành động
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
                                                <div>
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
