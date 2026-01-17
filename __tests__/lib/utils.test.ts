import {
    extractChannelId,
    extractUsername,
    isValidYouTubeUrl,
    formatNumber,
    formatDuration,
    parseDuration,
    calculateEngagementRate,
    generateUUID,
} from "@/lib/utils";

describe("extractChannelId", () => {
    it("should extract channel ID from /channel/ URL", () => {
        expect(
            extractChannelId("https://youtube.com/channel/UC1234567890")
        ).toBe("UC1234567890");
    });

    it("should return null for @username URLs (needs API resolution)", () => {
        expect(extractChannelId("https://youtube.com/@username")).toBeNull();
    });

    it("should return null for /c/ URLs (needs API resolution)", () => {
        expect(extractChannelId("https://youtube.com/c/channelname")).toBeNull();
    });

    it("should return null for /user/ URLs (needs API resolution)", () => {
        expect(extractChannelId("https://youtube.com/user/username")).toBeNull();
    });

    it("should return null for invalid URLs", () => {
        expect(extractChannelId("not-a-url")).toBeNull();
    });

    it("should return null for non-YouTube URLs", () => {
        expect(extractChannelId("https://google.com/channel/test")).toBeNull();
    });
});

describe("extractUsername", () => {
    it("should extract username from @username URL", () => {
        expect(extractUsername("https://youtube.com/@testchannel")).toBe(
            "testchannel"
        );
    });

    it("should extract username from /c/ URL", () => {
        expect(extractUsername("https://youtube.com/c/testchannel")).toBe(
            "testchannel"
        );
    });

    it("should extract username from /user/ URL", () => {
        expect(extractUsername("https://youtube.com/user/testchannel")).toBe(
            "testchannel"
        );
    });

    it("should return null for /channel/ URLs", () => {
        expect(extractUsername("https://youtube.com/channel/UC123")).toBeNull();
    });

    it("should return null for invalid URLs", () => {
        expect(extractUsername("not-a-url")).toBeNull();
    });
});

describe("isValidYouTubeUrl", () => {
    it("should return true for valid channel URLs", () => {
        expect(isValidYouTubeUrl("https://youtube.com/channel/UC123")).toBe(
            true
        );
        expect(isValidYouTubeUrl("https://youtube.com/@username")).toBe(true);
        expect(isValidYouTubeUrl("https://youtube.com/c/channelname")).toBe(
            true
        );
        expect(isValidYouTubeUrl("https://youtube.com/user/username")).toBe(
            true
        );
    });

    it("should return true for www.youtube.com URLs", () => {
        expect(isValidYouTubeUrl("https://www.youtube.com/@username")).toBe(
            true
        );
    });

    it("should return true for m.youtube.com URLs", () => {
        expect(isValidYouTubeUrl("https://m.youtube.com/@username")).toBe(true);
    });

    it("should return false for video URLs", () => {
        expect(
            isValidYouTubeUrl("https://youtube.com/watch?v=dQw4w9WgXcQ")
        ).toBe(false);
    });

    it("should return false for non-YouTube URLs", () => {
        expect(isValidYouTubeUrl("https://google.com")).toBe(false);
    });

    it("should return false for invalid URLs", () => {
        expect(isValidYouTubeUrl("not-a-url")).toBe(false);
    });
});

describe("formatNumber", () => {
    it("should format numbers less than 1000", () => {
        expect(formatNumber(500)).toBe("500");
        expect(formatNumber(0)).toBe("0");
    });

    it("should format thousands with K suffix", () => {
        expect(formatNumber(1000)).toBe("1.0K");
        expect(formatNumber(1500)).toBe("1.5K");
        expect(formatNumber(999999)).toBe("1000.0K");
    });

    it("should format millions with M suffix", () => {
        expect(formatNumber(1000000)).toBe("1.0M");
        expect(formatNumber(2500000)).toBe("2.5M");
    });

    it("should format billions with B suffix", () => {
        expect(formatNumber(1000000000)).toBe("1.0B");
        expect(formatNumber(1500000000)).toBe("1.5B");
    });
});

describe("parseDuration", () => {
    it("should parse ISO 8601 duration with hours, minutes, seconds", () => {
        expect(parseDuration("PT1H30M45S")).toBe(5445);
    });

    it("should parse duration with only minutes and seconds", () => {
        expect(parseDuration("PT10M30S")).toBe(630);
    });

    it("should parse duration with only seconds", () => {
        expect(parseDuration("PT45S")).toBe(45);
    });

    it("should return 0 for invalid duration", () => {
        expect(parseDuration("invalid")).toBe(0);
    });
});

describe("formatDuration", () => {
    it("should format seconds less than an hour", () => {
        expect(formatDuration(65)).toBe("1:05");
        expect(formatDuration(0)).toBe("0:00");
    });

    it("should format seconds with hours", () => {
        expect(formatDuration(3665)).toBe("1:01:05");
    });

    it("should pad minutes and seconds with zeros", () => {
        expect(formatDuration(61)).toBe("1:01");
        expect(formatDuration(3601)).toBe("1:00:01");
    });
});

describe("calculateEngagementRate", () => {
    it("should calculate engagement rate correctly", () => {
        expect(calculateEngagementRate(100, 50, 1000)).toBe("15.00%");
    });

    it("should return 0% for zero views", () => {
        expect(calculateEngagementRate(100, 50, 0)).toBe("0%");
    });

    it("should handle small engagement rates", () => {
        expect(calculateEngagementRate(1, 0, 10000)).toBe("0.01%");
    });
});

describe("generateUUID", () => {
    it("should generate a valid UUID v4 format", () => {
        const uuid = generateUUID();
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
        expect(uuid).toMatch(uuidRegex);
    });

    it("should generate unique UUIDs", () => {
        const uuids = new Set();
        for (let i = 0; i < 100; i++) {
            uuids.add(generateUUID());
        }
        expect(uuids.size).toBe(100);
    });
});
