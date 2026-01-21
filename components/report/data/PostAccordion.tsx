"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "@/components/ReportDisplay.module.css";
import { useLang, useLanguage } from "@/lib/lang";
import {
    formatFullNumber,
    formatDuration,
    formatRelativeTime,
} from "../report-utils";
import { layoutTransition } from "@/lib/animations";
import { PostWithScore } from "./usePostsSorting";

interface PostAccordionProps {
    sortedPosts: PostWithScore[];
    topIndices: Set<number>;
}

export default function PostAccordion({
    sortedPosts,
    topIndices,
}: PostAccordionProps) {
    const lang = useLang();
    const { langCode } = useLanguage();
    const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    const handleCopyTags = (tags: string[]) => {
        const text = tags.join(", ");
        navigator.clipboard.writeText(text);
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const toggleAccordion = (index: number) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    return (
        <div className={styles.postList}>
            {sortedPosts.map(({ post, originalIndex, score }, displayIndex) => (
                <motion.div
                    key={originalIndex}
                    className={styles.postCard}
                    layout="position"
                    transition={layoutTransition}
                >
                    <div
                        className={`${styles.accordionHeader} ${
                            activeAccordion === displayIndex
                                ? styles.accordionHeaderActive
                                : ""
                        }`}
                        onClick={() => toggleAccordion(displayIndex)}
                    >
                        <div className={styles.postMeta}>
                            <span className={styles.postIndex}>
                                #{originalIndex + 1}
                            </span>
                            {post.thumbnail && (
                                <Image
                                    src={post.thumbnail}
                                    alt={post.title}
                                    width={64}
                                    height={36}
                                    className={styles.postThumbnail}
                                    unoptimized
                                />
                            )}
                            <span className={styles.videoBadge}>
                                {formatDuration(post.duration)}
                            </span>
                            <div style={{ flex: 1 }}>
                                <p className={styles.postTitle}>
                                    {post.title ||
                                        lang.dataTab.postFallback.replace(
                                            "{n}",
                                            String(displayIndex + 1)
                                        )}
                                </p>
                            </div>
                        </div>
                        <div className={styles.ratingBox}>
                            <span className={styles.ratingScore}>
                                {score.toFixed(1)}
                                {topIndices.has(originalIndex) && " 🔥"}
                            </span>
                            <span className={styles.relativeTime}>
                                {formatRelativeTime(post.published_at, langCode)}
                            </span>
                        </div>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`${styles.accordionIcon} ${
                                activeAccordion === displayIndex
                                    ? styles.rotate180
                                    : ""
                            }`}
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>

                    {activeAccordion === displayIndex && (
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
                                                    {cleanTag.replace(/^#/, "")}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className={styles.descLabel}>
                                    {lang.posts.description}
                                </p>
                                <p className={styles.descText}>
                                    {post.desc || lang.posts.noDescription}
                                </p>
                            </div>

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
                                        onClick={(e) => e.stopPropagation()}
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
                </motion.div>
            ))}
        </div>
    );
}
