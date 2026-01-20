import {
    extractChannelId,
    extractUsername,
    isValidYouTubeUrl,
    generateUUID,
    isBrowser,
} from "@/lib/utils";

describe("utils", () => {
    describe("extractChannelId", () => {
        it("extracts channel ID from /channel/ URL", () => {
            expect(
                extractChannelId("https://www.youtube.com/channel/UC1234567890")
            ).toBe("UC1234567890");
        });

        it("extracts channel ID from /channel/ URL with trailing path", () => {
            expect(
                extractChannelId("https://www.youtube.com/channel/UC1234567890/videos")
            ).toBe("UC1234567890");
        });

        it("returns null for /@username URL (needs API resolution)", () => {
            expect(
                extractChannelId("https://www.youtube.com/@username")
            ).toBeNull();
        });

        it("returns null for /c/ URL (needs API resolution)", () => {
            expect(
                extractChannelId("https://www.youtube.com/c/channelname")
            ).toBeNull();
        });

        it("returns null for /user/ URL (needs API resolution)", () => {
            expect(
                extractChannelId("https://www.youtube.com/user/username")
            ).toBeNull();
        });

        it("returns null for non-YouTube URLs", () => {
            expect(
                extractChannelId("https://vimeo.com/channel/123")
            ).toBeNull();
        });

        it("returns null for invalid URLs", () => {
            expect(extractChannelId("not-a-url")).toBeNull();
        });

        it("works with m.youtube.com", () => {
            expect(
                extractChannelId("https://m.youtube.com/channel/UC1234567890")
            ).toBe("UC1234567890");
        });
    });

    describe("extractUsername", () => {
        it("extracts username from /@username URL", () => {
            expect(
                extractUsername("https://www.youtube.com/@MrBeast")
            ).toBe("MrBeast");
        });

        it("extracts username from /@username URL with trailing path", () => {
            expect(
                extractUsername("https://www.youtube.com/@MrBeast/videos")
            ).toBe("MrBeast");
        });

        it("extracts username from /c/ URL", () => {
            expect(
                extractUsername("https://www.youtube.com/c/ChannelName")
            ).toBe("ChannelName");
        });

        it("extracts username from /user/ URL", () => {
            expect(
                extractUsername("https://www.youtube.com/user/username123")
            ).toBe("username123");
        });

        it("returns null for /channel/ URL", () => {
            expect(
                extractUsername("https://www.youtube.com/channel/UC123")
            ).toBeNull();
        });

        it("returns null for invalid URLs", () => {
            expect(extractUsername("not-a-url")).toBeNull();
        });
    });

    describe("isValidYouTubeUrl", () => {
        it("returns true for valid /channel/ URL", () => {
            expect(
                isValidYouTubeUrl("https://www.youtube.com/channel/UC123")
            ).toBe(true);
        });

        it("returns true for valid /@username URL", () => {
            expect(
                isValidYouTubeUrl("https://www.youtube.com/@MrBeast")
            ).toBe(true);
        });

        it("returns true for valid /c/ URL", () => {
            expect(
                isValidYouTubeUrl("https://www.youtube.com/c/ChannelName")
            ).toBe(true);
        });

        it("returns true for valid /user/ URL", () => {
            expect(
                isValidYouTubeUrl("https://www.youtube.com/user/username")
            ).toBe(true);
        });

        it("returns false for YouTube video URL", () => {
            expect(
                isValidYouTubeUrl("https://www.youtube.com/watch?v=abc123")
            ).toBe(false);
        });

        it("returns false for YouTube homepage", () => {
            expect(
                isValidYouTubeUrl("https://www.youtube.com/")
            ).toBe(false);
        });

        it("returns false for non-YouTube URL", () => {
            expect(
                isValidYouTubeUrl("https://vimeo.com/@user")
            ).toBe(false);
        });

        it("returns false for invalid URL", () => {
            expect(isValidYouTubeUrl("not-a-url")).toBe(false);
        });

        it("works with m.youtube.com", () => {
            expect(
                isValidYouTubeUrl("https://m.youtube.com/@MrBeast")
            ).toBe(true);
        });
    });

    describe("generateUUID", () => {
        it("generates a valid UUID v4 format", () => {
            const uuid = generateUUID();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(uuid).toMatch(uuidRegex);
        });

        it("generates unique UUIDs", () => {
            const uuid1 = generateUUID();
            const uuid2 = generateUUID();
            expect(uuid1).not.toBe(uuid2);
        });
    });

    describe("isBrowser", () => {
        it("returns true in jsdom environment", () => {
            expect(isBrowser()).toBe(true);
        });
    });
});
