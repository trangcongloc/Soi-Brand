export interface HistoryItem {
    channelId: string;
    brandName: string;
    timestamp: number;
    createdAt: string;
    channelAvatar?: string;
}

export const PAGE_SIZE = 5;

export const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 40 : -40,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -40 : 40,
        opacity: 0,
    }),
};

export const formatDate = (createdAt: string, timestamp: number): string => {
    const date = new Date(createdAt || timestamp);
    const dateStr = date.toLocaleDateString("vi-VN");
    const timeStr = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
};

export const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
};

export const getAvatarColor = (name: string): string => {
    const avatarColors = [
        "#e53935",
        "#f59e0b",
        "#10b981",
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
    ];
    const index = name.length % avatarColors.length;
    return avatarColors[index];
};
