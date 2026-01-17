// Report display utility functions

import styles from "@/components/ReportDisplay.module.css";

export const formatFullNumber = (num: number | string): string => {
    const n = typeof num === "string" ? parseInt(num) : num;
    if (isNaN(n)) return "0";
    return n.toLocaleString("vi-VN");
};

export const formatDuration = (isoDuration: string): string => {
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

export const truncateText = (text: string, limit: number): string => {
    if (text.length <= limit) return text;
    const truncated = text.substring(0, limit);
    const lastSpaceIndex = truncated.lastIndexOf(" ");
    return (
        (lastSpaceIndex > 0
            ? truncated.substring(0, lastSpaceIndex)
            : truncated) + " . . ."
    );
};

export const getVideoTypeBadge = (videoType: string) => {
    const badgeClass =
        {
            Short: styles.videoTypeShort,
            Live: styles.videoTypeLive,
            Upcoming: styles.videoTypeUpcoming,
            Premiere: styles.videoTypePremiere,
            Video: "", // No special badge for regular videos
        }[videoType] || "";

    if (!badgeClass && videoType === "Video") return null;

    return { className: `${styles.videoTypeBadge} ${badgeClass}`, label: videoType };
};

// Time-based Ranking Algorithm (Hacker News style)
// Only uses views and published time - likes/comments excluded due to market manipulation
export const calculateHackerNewsScore = (views: number, publishedAt: string) => {
    const points = views + 1; // Views as points
    const now = new Date();
    const published = new Date(publishedAt);
    const hours = Math.max(
        1,
        (now.getTime() - published.getTime()) / (1000 * 60 * 60)
    );
    const gravity = 1.8;
    const score = points / Math.pow(hours + 2, gravity);
    return score.toFixed(2);
};

export type TabType = "data" | "analysis" | "evaluation";
export type ActionPlanPhase = "30" | "60" | "90";
