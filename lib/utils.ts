// Utility functions

/**
 * Check if code is running in browser environment
 */
export function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Extract YouTube channel ID from various URL formats
 */
export function extractChannelId(url: string): string | null {
    try {
        const urlObj = new URL(url);

        // Check if it's a YouTube domain
        const validDomains = [
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
        ];
        if (!validDomains.includes(urlObj.hostname)) {
            return null;
        }

        // Format: youtube.com/channel/CHANNEL_ID
        if (urlObj.pathname.startsWith("/channel/")) {
            return urlObj.pathname.split("/channel/")[1].split("/")[0];
        }

        // Format: youtube.com/@username or youtube.com/c/username
        if (
            urlObj.pathname.startsWith("/@") ||
            urlObj.pathname.startsWith("/c/")
        ) {
            return null; // Will need to resolve via API
        }

        // Format: youtube.com/user/username
        if (urlObj.pathname.startsWith("/user/")) {
            return null; // Will need to resolve via API
        }

        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Extract username from YouTube URL
 */
export function extractUsername(url: string): string | null {
    try {
        const urlObj = new URL(url);

        // Format: youtube.com/@username
        if (urlObj.pathname.startsWith("/@")) {
            return urlObj.pathname.split("/@")[1].split("/")[0];
        }

        // Format: youtube.com/c/username
        if (urlObj.pathname.startsWith("/c/")) {
            return urlObj.pathname.split("/c/")[1].split("/")[0];
        }

        // Format: youtube.com/user/username
        if (urlObj.pathname.startsWith("/user/")) {
            return urlObj.pathname.split("/user/")[1].split("/")[0];
        }

        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        const validDomains = [
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
        ];

        if (!validDomains.includes(urlObj.hostname)) {
            return false;
        }

        // Check if it's a channel URL
        const isChannelUrl =
            urlObj.pathname.startsWith("/channel/") ||
            urlObj.pathname.startsWith("/@") ||
            urlObj.pathname.startsWith("/c/") ||
            urlObj.pathname.startsWith("/user/");

        return isChannelUrl;
    } catch (error) {
        return false;
    }
}


/**
 * Generate UUID v4
 */
export function generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}


/**
 * Download JSON file
 */
export function downloadJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
