"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Post, ChannelInfo } from "@/lib/types";
import styles from "@/components/ReportDisplay.module.css";
import { useLang } from "@/lib/lang";
import UploadHeatmap from "../UploadHeatmap";
import ChannelInfoCard from "./ChannelInfoCard";
import SortControls from "./SortControls";
import PostAccordion from "./PostAccordion";
import { usePostsSorting } from "./usePostsSorting";

const VideoPerformanceChart = dynamic(
    () => import("@/components/VideoPerformanceChart"),
    {
        ssr: false,
        loading: () => <ChartLoadingPlaceholder />,
    }
);

function ChartLoadingPlaceholder() {
    const lang = useLang();
    return (
        <div
            style={{
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
            }}
        >
            {lang.dataTab.loadingChart}
        </div>
    );
}

interface DataTabProps {
    posts: Post[];
    channelInfo?: ChannelInfo;
}

const DataTab: React.FC<DataTabProps> = ({ posts, channelInfo }) => {
    const lang = useLang();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectionSource, setSelectionSource] = useState<
        "chart" | "heatmap" | null
    >(null);

    const { sortOrder, setSortOrder, sortedPosts, topIndices } =
        usePostsSorting(posts, selectedDate);

    const handleDateClick = (
        dateIso: string,
        source: "chart" | "heatmap" = "heatmap"
    ) => {
        setSelectedDate(selectedDate === dateIso ? null : dateIso);
        setSelectionSource(source);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "2rem",
            }}
        >
            {/* Channel Info + Heatmap */}
            <section id="section-channel">
                <h3 className={styles.sectionTitle}>
                    <svg
                        className={styles.sectionIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                    {lang.channel.sectionTitle}
                </h3>
                <div className={styles.grid2}>
                    {channelInfo && <ChannelInfoCard channelInfo={channelInfo} />}

                    <div className={styles.card} style={{ height: "100%" }}>
                        <UploadHeatmap
                            posts={posts}
                            selectedDate={selectedDate}
                            onDateClick={(dateIso) =>
                                handleDateClick(dateIso, "heatmap")
                            }
                            isSelectedFromChart={selectionSource === "chart"}
                        />
                    </div>
                </div>
            </section>

            {/* Video Performance Chart */}
            {posts.length > 0 && (
                <section id="section-performance">
                    <h3 className={styles.sectionTitle}>
                        <svg
                            className={styles.sectionIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="12" y1="20" x2="12" y2="10"></line>
                            <line x1="18" y1="20" x2="18" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="16"></line>
                        </svg>
                        {lang.dataTab.videoPerformance}
                    </h3>
                    <div className={styles.card}>
                        <VideoPerformanceChart
                            posts={posts}
                            maxItems={50}
                            selectedDate={selectedDate}
                            onDateClick={(dateIso) =>
                                handleDateClick(dateIso, "chart")
                            }
                        />
                    </div>
                </section>
            )}

            {/* Posts Accordion */}
            <section id="section-content">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                    }}
                >
                    <h3
                        className={styles.sectionTitle}
                        style={{ marginBottom: 0 }}
                    >
                        <svg
                            className={styles.sectionIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        {lang.posts.sectionTitle}
                    </h3>
                    <SortControls
                        sortOrder={sortOrder}
                        onSortChange={setSortOrder}
                        lang={{
                            sortBy: lang.posts.sortBy,
                            sortLatest: lang.posts.sortLatest,
                            sortRating: lang.posts.sortRating,
                        }}
                    />
                </div>
                <PostAccordion
                    sortedPosts={sortedPosts}
                    topIndices={topIndices}
                />
            </section>
        </div>
    );
};

export default DataTab;
