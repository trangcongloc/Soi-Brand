"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Post } from "@/lib/types";
import { useLang } from "@/lib/lang";

interface VideoPerformanceChartProps {
    posts: Post[];
    maxItems?: number;
}

export default function VideoPerformanceChart({
    posts,
    maxItems = 10,
}: VideoPerformanceChartProps) {
    const lang = useLang();

    // Sort by views and take top items
    const chartData = [...posts]
        .sort((a, b) => b.statistics.play_count - a.statistics.play_count)
        .slice(0, maxItems)
        .map((post, index) => ({
            name: `V${index + 1}`,
            fullTitle: post.title.length > 40 ? post.title.substring(0, 40) + "..." : post.title,
            views: post.statistics.play_count,
            likes: post.statistics.digg_count,
        }));

    const maxViews = Math.max(...chartData.map((d) => d.views));

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(0) + "K";
        return num.toString();
    };

    const getBarColor = (views: number) => {
        const ratio = views / maxViews;
        if (ratio > 0.8) return "#22c55e"; // green for top performers
        if (ratio > 0.5) return "#3b82f6"; // blue for good
        if (ratio > 0.3) return "#f59e0b"; // amber for average
        return "#94a3b8"; // gray for low
    };

    return (
        <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 10 }}
                        width={25}
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
                                            borderRadius: "6px",
                                            padding: "8px 12px",
                                            fontSize: "11px",
                                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                        }}
                                    >
                                        <p style={{ fontWeight: 600, marginBottom: "4px" }}>
                                            {data.fullTitle}
                                        </p>
                                        <p style={{ color: "#666" }}>
                                            {lang.posts.viewCount} {data.views.toLocaleString()}
                                        </p>
                                        <p style={{ color: "#666" }}>
                                            {lang.posts.likeCount} {data.likes.toLocaleString()}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.views)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
