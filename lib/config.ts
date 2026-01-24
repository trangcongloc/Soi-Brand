// Environment configuration and validation

export interface EnvConfig {
    YOUTUBE_API_KEY: string;
    GEMINI_API_KEY: string;
    NODE_ENV: string;
    ALLOWED_ORIGINS: string[];
}

/**
 * Validate required environment variables
 * Call this on app startup to fail fast if configuration is missing
 */
export function validateEnv(): EnvConfig {
    const errors: string[] = [];

    if (!process.env.YOUTUBE_API_KEY) {
        errors.push("YOUTUBE_API_KEY is required");
    }

    if (!process.env.GEMINI_API_KEY) {
        errors.push("GEMINI_API_KEY is required");
    }

    if (errors.length > 0) {
        throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
    }

    return {
        YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY!,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
        NODE_ENV: process.env.NODE_ENV || "development",
        ALLOWED_ORIGINS: getAllowedOrigins(),
    };
}

/**
 * Get allowed CORS origins based on environment
 */
export function getAllowedOrigins(): string[] {
    const origins: string[] = [];

    // Always allow localhost in development
    if (process.env.NODE_ENV !== "production") {
        origins.push(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001"
        );
    }

    // Add production origins
    if (process.env.ALLOWED_ORIGINS) {
        const customOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) =>
            o.trim()
        );
        origins.push(...customOrigins);
    }

    // Add Vercel preview URLs
    if (process.env.VERCEL_URL) {
        origins.push(`https://${process.env.VERCEL_URL}`);
    }

    return origins;
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
    if (!origin) return false;

    const allowedOrigins = getAllowedOrigins();

    // In development, allow all origins
    if (process.env.NODE_ENV !== "production") {
        return true;
    }

    // Check exact match
    if (allowedOrigins.includes(origin)) {
        return true;
    }

    // Check Vercel preview deployments - restrict to soi-brand project only
    // Pattern: https://soi-brand-*.vercel.app or https://soi-brand.vercel.app
    if (/^https:\/\/soi-brand(-[a-z0-9]+)?\.vercel\.app$/.test(origin)) {
        return true;
    }

    return false;
}

