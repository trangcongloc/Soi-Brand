"use client";

import { memo, useMemo, useCallback } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from "recharts";
import { Post } from "@/lib/types";
import { useLanguage, useLang } from "@/lib/lang";

interface VideoPerformanceChartProps {
    posts: Post[];
    maxItems?: number;
    selectedDate?: string | null;
    onDateClick?: (dateIso: string) => void;
}

interface ChartDataPoint {
    name: string;
    rank: number;
    fullTitle: string;
    views: number;
    likes: number;
    comments: number;
    thumbnail: string;
    publishedAt: string;
    dateIso: string;
    relativeTime: string;
}

interface ChartClickPayload {
    payload?: ChartDataPoint;
}

// Format date as yyyy-mm-dd using local timezone
const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface TimeAgoStrings {
    yearsAgo: string;
    monthsAgo: string;
    daysAgo: string;
    hoursAgo: string;
    minutesAgo: string;
    secondsAgo: string;
}

// Format relative time (e.g., "1 day ago", "3 hours ago")
const formatRelativeTime = (publishedAt: string, timeAgo: TimeAgoStrings): string => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now.getTime() - published.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return timeAgo.yearsAgo.replace('{n}', String(diffYears));
    if (diffMonths > 0) return timeAgo.monthsAgo.replace('{n}', String(diffMonths));
    if (diffDays > 0) return timeAgo.daysAgo.replace('{n}', String(diffDays));
    if (diffHours > 0) return timeAgo.hoursAgo.replace('{n}', String(diffHours));
    if (diffMinutes > 0) return timeAgo.minutesAgo.replace('{n}', String(diffMinutes));
    return timeAgo.secondsAgo.replace('{n}', String(diffSeconds));
};

function VideoPerformanceChart({
    posts,
    maxItems = 10,
    selectedDate,
    onDateClick,
}: VideoPerformanceChartProps) {
    useLanguage(); // Keep provider connected
    const lang = useLang();

    // Sort by date: oldest on left, latest on right, preserve original index
    const chartData = useMemo(() =>
        posts
            .map((post, originalIndex) => ({ post, originalIndex }))
            .sort(
                (a, b) =>
                    new Date(a.post.published_at).getTime() -
                    new Date(b.post.published_at).getTime()
            )
            .slice(-maxItems)
            .map(({ post, originalIndex }) => ({
                name: `#${originalIndex + 1}`,
                rank: originalIndex + 1,
                fullTitle: post.title,
                views: post.statistics.play_count,
                likes: post.statistics.digg_count,
                comments: post.statistics.comment_count,
                thumbnail: post.thumbnail,
                publishedAt: post.published_at,
                dateIso: getLocalDateStr(new Date(post.published_at)),
                relativeTime: formatRelativeTime(post.published_at, lang.timeAgo),
            })),
        [posts, maxItems, lang.timeAgo]
    );

    // Find x-axis names for selected date
    const selectedNames = useMemo(() =>
        selectedDate
            ? chartData.filter(d => d.dateIso === selectedDate).map(d => d.name)
            : [],
        [selectedDate, chartData]
    );

    const formatNumber = useCallback((num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(0) + "K";
        return num.toString();
    }, []);

    const handleDotClick = useCallback((_props: unknown, payload: ChartClickPayload) => {
        if (onDateClick && payload?.payload?.dateIso) {
            onDateClick(payload.payload.dateIso);
        }
    }, [onDateClick]);

    return (
        <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={formatNumber}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div
                                        style={{
                                            background: "white",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                            padding: "0",
                                            fontSize: "12px",
                                            boxShadow:
                                                "0 4px 12px rgba(0,0,0,0.15)",
                                            maxWidth: "380px",
                                            display: "flex",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {/* Thumbnail on the left - matches full height */}
                                        <img
                                            src={data.thumbnail}
                                            alt={data.fullTitle}
                                            style={{
                                                width: "120px",
                                                objectFit: "cover",
                                                flexShrink: 0,
                                            }}
                                        />

                                        {/* Content on the right */}
                                        <div
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                padding: "12px",
                                            }}
                                        >
                                            <p
                                                style={{
                                                    fontWeight: 600,
                                                    marginBottom: "8px",
                                                    lineHeight: "1.4",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                }}
                                            >
                                                {data.fullTitle}
                                            </p>
                                            <p
                                                style={{
                                                    marginBottom: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        width: "8px",
                                                        height: "8px",
                                                        borderRadius: "50%",
                                                        background: "#fa9191",
                                                    }}
                                                ></span>
                                                {lang.posts.viewCount}{" "}
                                                {data.views.toLocaleString()}
                                            </p>
                                            <p
                                                style={{
                                                    marginBottom: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        width: "8px",
                                                        height: "8px",
                                                        borderRadius: "50%",
                                                        background: "#3b82f6",
                                                    }}
                                                ></span>
                                                {lang.posts.likeCount}{" "}
                                                {data.likes.toLocaleString()}
                                            </p>
                                            <p
                                                style={{
                                                    marginBottom: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        width: "8px",
                                                        height: "8px",
                                                        borderRadius: "50%",
                                                        background: "#f59e0b",
                                                    }}
                                                ></span>
                                                {lang.posts.commentCount}{" "}
                                                {data.comments.toLocaleString()}
                                            </p>
                                            <p
                                                style={{
                                                    color: "#999",
                                                    fontSize: "11px",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {data.relativeTime}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                        formatter={(value) => {
                            if (value === "views")
                                return lang.posts.viewCount
                                    .replace(":", "")
                                    .trim();
                            if (value === "likes")
                                return lang.posts.likeCount
                                    .replace(":", "")
                                    .trim();
                            if (value === "comments")
                                return lang.posts.commentCount
                                    .replace(":", "")
                                    .trim();
                            return value;
                        }}
                    />
                    {selectedNames.map(name => (
                        <ReferenceLine
                            key={name}
                            x={name}
                            stroke="#9ca3af"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                        />
                    ))}
                    <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#fa9191"
                        strokeWidth={2}
                        dot={{ fill: "#fa9191", r: 3, cursor: "pointer" }}
                        activeDot={{
                            r: 6,
                            cursor: "pointer",
                            onClick: handleDotClick
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="likes"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 3, cursor: "pointer" }}
                        activeDot={{
                            r: 6,
                            cursor: "pointer",
                            onClick: handleDotClick
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="comments"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b", r: 3, cursor: "pointer" }}
                        activeDot={{
                            r: 6,
                            cursor: "pointer",
                            onClick: handleDotClick
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default memo(VideoPerformanceChart);
