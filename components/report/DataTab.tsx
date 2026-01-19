import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Post, ChannelInfo } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang, useLanguage } from "@/lib/lang";
import UploadHeatmap from "./UploadHeatmap";
import {
    formatFullNumber,
    formatDuration,
    truncateText,
    calculateHackerNewsScore,
} from "./report-utils";

const VideoPerformanceChart = dynamic(
    () => import("@/components/VideoPerformanceChart"),
    {
        ssr: false,
        loading: () => (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                Loading chart...
            </div>
        ),
    }
);

interface DataTabProps {
    posts: Post[];
    channelInfo?: ChannelInfo;
}

const DataTab: React.FC<DataTabProps> = ({ posts, channelInfo }) => {
    const lang = useLang();
    const { langCode } = useLanguage();
    const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);
    const [isChannelHovered, setIsChannelHovered] = useState(false);

    const handleCopyTags = (tags: string[]) => {
        const text = tags.join(", ");
        navigator.clipboard.writeText(text);
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const toggleAccordion = (index: number) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    const handleChannelClick = () => {
        if (channelInfo?.channelId) {
            const channelUrl = `https://www.youtube.com/channel/${channelInfo.channelId}`;
            window.open(channelUrl, "_blank");
        }
    };

    // Calculate top 5 posts by rating score
    const postsWithScores = posts.map((post, index) => ({
        index,
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
    const topIndices = new Set(
        sortedByScore.slice(0, 5).map((item) => item.index)
    );

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "2rem",
            }}
        >
            {/* Channel Info + Heatmap */}
            <section>
                <h3 className={styles.sectionTitle}>
                    {lang.channel.sectionTitle}
                </h3>
                <div className={styles.grid2}>
                    {channelInfo && (
                        <div className={styles.channelCard}>
                            <div className={styles.channelInfoTop}>
                                {channelInfo.avatar && (
                                    <img
                                        src={channelInfo.avatar}
                                        alt={channelInfo.nickname}
                                        className={styles.channelAvatar}
                                    />
                                )}
                                <div className={styles.channelTitles}>
                                    <span
                                        className={styles.channelNickname}
                                        onMouseEnter={() =>
                                            setIsChannelHovered(true)
                                        }
                                        onMouseLeave={() =>
                                            setIsChannelHovered(false)
                                        }
                                        onClick={handleChannelClick}
                                    >
                                        {isChannelHovered &&
                                        channelInfo.uniqueId
                                            ? channelInfo.uniqueId
                                            : channelInfo.nickname}
                                    </span>
                                    <span className={styles.channelSubscribers}>
                                        {lang.channel.createdDate}{" "}
                                        {channelInfo.joinedAt
                                            ? new Date(
                                                  channelInfo.joinedAt
                                              ).toLocaleDateString("vi-VN")
                                            : lang.channel.notUpdated}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.channelStatsGrid}>
                                <div className={styles.channelStatCard}>
                                    <span className={styles.channelStatValue}>
                                        {formatFullNumber(
                                            channelInfo.stats.videoCount
                                        )}
                                    </span>
                                    <span className={styles.channelStatLabel}>
                                        {lang.channel.stats.videos}
                                    </span>
                                </div>
                                <div className={styles.channelStatCard}>
                                    <span className={styles.channelStatValue}>
                                        {formatFullNumber(
                                            channelInfo.stats.viewCount
                                        )}
                                    </span>
                                    <span className={styles.channelStatLabel}>
                                        {lang.channel.stats.views}
                                    </span>
                                </div>
                                <div className={styles.channelStatCard}>
                                    <span className={styles.channelStatValue}>
                                        {formatFullNumber(
                                            channelInfo.stats.followerCount
                                        )}
                                    </span>
                                    <span className={styles.channelStatLabel}>
                                        {lang.channel.stats.subs}
                                    </span>
                                </div>
                                <div className={styles.channelStatCard}>
                                    <span className={styles.channelStatValue}>
                                        {formatFullNumber(
                                            channelInfo.stats.heartCount
                                        )}
                                    </span>
                                    <span className={styles.channelStatLabel}>
                                        {lang.channel.stats.likes}
                                    </span>
                                </div>
                            </div>

                            {/* Channel Description */}
                            {channelInfo.signature && (
                                <div className={styles.channelDescription}>
                                    <p className={styles.channelDescText}>
                                        {truncateText(channelInfo.signature, 150)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.card} style={{ height: "100%" }}>
                        <UploadHeatmap posts={posts} />
                    </div>
                </div>
            </section>

            {/* Video Performance Chart */}
            {posts.length > 0 && (
                <section>
                    <h3 className={styles.sectionTitle}>
                        {langCode === "vi" ? "Hiệu suất Video" : "Video Performance"}
                    </h3>
                    <div className={styles.card}>
                        <VideoPerformanceChart posts={posts} maxItems={50} />
                    </div>
                </section>
            )}

            {/* Posts Accordion */}
            <section>
                <h3 className={styles.sectionTitle}>{lang.posts.sectionTitle}</h3>
                <div className={styles.postList}>
                    {posts.map((post, index) => (
                        <div key={index} className={styles.postCard}>
                            <div
                                className={`${styles.accordionHeader} ${
                                    activeAccordion === index
                                        ? styles.accordionHeaderActive
                                        : ""
                                }`}
                                onClick={() => toggleAccordion(index)}
                            >
                                <div className={styles.postMeta}>
                                    <div className={styles.ratingBox}>
                                        <span className={styles.postIndex}>
                                            #{index + 1}
                                        </span>
                                        <span className={styles.ratingScore}>
                                            {calculateHackerNewsScore(
                                                post.statistics.play_count,
                                                post.published_at
                                            )}
                                            {topIndices.has(index) && " 🔥"}
                                        </span>
                                    </div>
                                    {post.thumbnail && (
                                        <img
                                            src={post.thumbnail}
                                            alt={post.title}
                                            className={styles.postThumbnail}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <p className={styles.postTitle}>
                                            {post.title ||
                                                `Bài đăng ${index + 1}`}
                                        </p>
                                    </div>
                                </div>
                                <span className={styles.videoBadge}>
                                    {formatDuration(post.duration)}
                                </span>
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={`${styles.accordionIcon} ${
                                        activeAccordion === index
                                            ? styles.rotate180
                                            : ""
                                    }`}
                                >
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>

                            {activeAccordion === index && (
                                <div className={styles.accordionBody}>
                                    <div className={styles.postStats}>
                                        <div>
                                            <span className={styles.mutedText}>
                                                {lang.posts.viewCount}{" "}
                                            </span>
                                            <span className="font-bold">
                                                {formatFullNumber(
                                                    post.statistics.play_count
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className={styles.mutedText}>
                                                {lang.posts.likeCount}{" "}
                                            </span>
                                            <span className="font-bold">
                                                {formatFullNumber(
                                                    post.statistics.digg_count
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className={styles.mutedText}>
                                                {lang.posts.publishDate}{" "}
                                            </span>
                                            <span className="font-semibold">
                                                {new Date(
                                                    post.created_at
                                                ).toLocaleDateString("vi-VN")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* SEO Tags Box */}
                                    {post.tags && post.tags.length > 0 && (
                                        <div
                                            className={styles.seoBox}
                                            style={{ marginBottom: "1rem" }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                <p
                                                    className={styles.seoTitle}
                                                    style={{ margin: 0 }}
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
                                                    {lang.posts.seoTags}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyTags(post.tags);
                                                    }}
                                                    style={{
                                                        fontSize: "10px",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        background: "#dbeafe",
                                                        color: "#1e40af",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    {copyStatus === "Copied!"
                                                        ? lang.posts.copied
                                                        : lang.posts.copyTags}
                                                </button>
                                            </div>
                                            <div className={styles.tagsWrapper}>
                                                {post.tags.map((tag, tidx) => {
                                                    const cleanTag = tag
                                                        .replace(/['"\[]]/g, "")
                                                        .trim();
                                                    if (!cleanTag) return null;
                                                    return (
                                                        <span
                                                            key={tidx}
                                                            className={styles.tag}
                                                        >
                                                            #
                                                            {cleanTag.replace(
                                                                /^#/,
                                                                ""
                                                            )}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div>
                                        <p className={styles.descLabel}>
                                            {lang.posts.description}
                                        </p>
                                        <p className={styles.descText}>
                                            {post.desc || lang.posts.noDescription}
                                        </p>
                                    </div>

                                    {/* Video URL */}
                                    <div style={{ marginTop: "1rem" }}>
                                        <p className={styles.descLabel}>
                                            {lang.posts.videoUrl}
                                        </p>
                                        <div
                                            className={styles.descText}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "0.75rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
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
    );
};

export default DataTab;
