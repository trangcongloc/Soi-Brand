import {
    validateEnv,
    getAllowedOrigins,
    isOriginAllowed,
    getMaskedApiKey,
} from "@/lib/config";

describe("validateEnv", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("should throw error when YOUTUBE_API_KEY is missing", () => {
        delete process.env.YOUTUBE_API_KEY;
        process.env.GEMINI_API_KEY = "test-gemini-key";

        expect(() => validateEnv()).toThrow("YOUTUBE_API_KEY is required");
    });

    it("should throw error when GEMINI_API_KEY is missing", () => {
        process.env.YOUTUBE_API_KEY = "test-youtube-key";
        delete process.env.GEMINI_API_KEY;

        expect(() => validateEnv()).toThrow("GEMINI_API_KEY is required");
    });

    it("should throw error when both keys are missing", () => {
        delete process.env.YOUTUBE_API_KEY;
        delete process.env.GEMINI_API_KEY;

        expect(() => validateEnv()).toThrow();
    });

    it("should return config when all required keys are present", () => {
        process.env.YOUTUBE_API_KEY = "test-youtube-key";
        process.env.GEMINI_API_KEY = "test-gemini-key";

        const config = validateEnv();

        expect(config.YOUTUBE_API_KEY).toBe("test-youtube-key");
        expect(config.GEMINI_API_KEY).toBe("test-gemini-key");
    });
});

describe("getAllowedOrigins", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("should include localhost in development", () => {
        Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });
        const origins = getAllowedOrigins();

        expect(origins).toContain("http://localhost:3000");
    });

    it("should add Vercel URL if present", () => {
        Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });
        process.env.VERCEL_URL = "my-app.vercel.app";

        const origins = getAllowedOrigins();

        expect(origins).toContain("https://my-app.vercel.app");
    });

    it("should parse custom ALLOWED_ORIGINS", () => {
        Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });
        process.env.ALLOWED_ORIGINS = "https://example.com, https://app.example.com";

        const origins = getAllowedOrigins();

        expect(origins).toContain("https://example.com");
        expect(origins).toContain("https://app.example.com");
    });
});

describe("isOriginAllowed", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("should return false for null origin", () => {
        expect(isOriginAllowed(null)).toBe(false);
    });

    it("should allow all origins in development", () => {
        Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });

        expect(isOriginAllowed("http://localhost:3000")).toBe(true);
        expect(isOriginAllowed("https://anything.com")).toBe(true);
    });

    it("should allow Vercel preview deployments in production", () => {
        Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });

        expect(isOriginAllowed("https://preview-123.vercel.app")).toBe(true);
    });
});

describe("getMaskedApiKey", () => {
    it("should return [NOT SET] for undefined", () => {
        expect(getMaskedApiKey(undefined)).toBe("[NOT SET]");
    });

    it("should return **** for short keys", () => {
        expect(getMaskedApiKey("short")).toBe("****");
    });

    it("should mask long keys", () => {
        expect(getMaskedApiKey("AIzaSyDxxxxxxxxxxxxxxxxx")).toBe(
            "AIza...xxxx"
        );
    });
});
