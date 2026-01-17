import {
    extractChannelId,
    extractUsername,
    isValidYouTubeUrl,
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
