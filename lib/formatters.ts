/**
 * Formatting utilities for the OurTube application
 */

/**
 * Format a number with locale-specific separators
 */
export const formatFullNumber = (num: number | string): string => {
    const n = typeof num === "string" ? parseInt(num) : num;
    if (isNaN(n)) return "0";
    return n.toLocaleString("vi-VN");
};

/**
 * Format ISO 8601 duration (e.g., PT1H2M10S) to human readable format
 */
export const formatDuration = (isoDuration: string): string => {
    if (!isoDuration) return "0:00";

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");

    const paddedSeconds = seconds.toString().padStart(2, "0");

    if (hours > 0 || minutes >= 60) {
        const totalHours = hours + Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        const paddedMinutes = remainingMinutes.toString().padStart(2, "0");
        return `${totalHours}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${minutes}:${paddedSeconds}`;
};

/**
 * Truncate text to a specified limit with ellipsis
 */
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

/**
 * Format a date string to locale format
 */
export const formatDate = (
    dateString: string,
    locale: string = "vi-VN"
): string => {
    if (!dateString) return "";
    try {
        return new Date(dateString).toLocaleDateString(locale);
    } catch {
        return dateString;
    }
};

/**
 * Format compact number (e.g., 1.2M, 500K)
 */
export const formatCompactNumber = (num: number | string): string => {
    const n = typeof num === "string" ? parseInt(num) : num;
    if (isNaN(n)) return "0";

    if (n >= 1_000_000_000) {
        return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (n >= 1_000_000) {
        return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (n >= 1_000) {
        return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return n.toString();
};

/**
 * Get priority color class based on priority level
 */
export const getPriorityColor = (
    priority: "high" | "medium" | "low"
): string => {
    switch (priority) {
        case "high":
            return "#ef4444"; // red
        case "medium":
            return "#f59e0b"; // amber
        case "low":
            return "#10b981"; // green
        default:
            return "#6b7280"; // gray
    }
};
