/**
 * Simple in-memory rate limiter for API endpoints with tier-based limits
 * For production with multiple instances, use Redis-backed rate limiting
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface ApiKeyTierEntry {
    tier: "free" | "paid";
    detectedAt: number;
    lastChecked: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const apiKeyTierCache = new Map<string, ApiKeyTierEntry>();

// Clean up expired entries every minute
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        const keysToDelete: string[] = [];
        rateLimitStore.forEach((entry, key) => {
            if (now > entry.resetTime) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach((key) => rateLimitStore.delete(key));

        // Clean up old tier cache entries (older than 7 days)
        const tierCacheKeysToDelete: string[] = [];
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        apiKeyTierCache.forEach((entry, key) => {
            if (entry.lastChecked < sevenDaysAgo) {
                tierCacheKeysToDelete.push(key);
            }
        });
        tierCacheKeysToDelete.forEach((key) => apiKeyTierCache.delete(key));
    }, 60000);
}

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    limit: number;
    /** Time window in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;
    tier?: "free" | "paid";
}

export type ApiKeyTier = "free" | "paid";

/**
 * Tier-based rate limit configurations
 * Aligned with Gemini API limits and TPM constraints
 */
export const TIER_RATE_LIMITS = {
    free: {
        veo: { limit: 5, windowMs: 60000 }, // 5 RPM (conservative for free tier)
        analyze: { limit: 10, windowMs: 60000 }, // 10 RPM
    },
    paid: {
        veo: { limit: 50, windowMs: 60000 }, // 50 RPM (accounts for ~10-20 TPM-limited requests)
        analyze: { limit: 100, windowMs: 60000 }, // 100 RPM
    },
} as const;

/**
 * Simple hash function for string to create differentiated identifiers
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Detect API key tier (free or paid)
 * Returns cached tier if available, otherwise defaults to free (conservative)
 *
 * @param apiKey - Gemini API key (can be hashed for privacy)
 * @param explicitTier - Optional explicit tier specification from user
 * @returns API key tier
 */
export function detectApiKeyTier(
    apiKey: string,
    explicitTier?: ApiKeyTier
): ApiKeyTier {
    // If user explicitly specifies tier, trust it and cache it
    if (explicitTier) {
        const keyHash = simpleHash(apiKey);
        apiKeyTierCache.set(keyHash, {
            tier: explicitTier,
            detectedAt: Date.now(),
            lastChecked: Date.now(),
        });
        return explicitTier;
    }

    // Check cache
    const keyHash = simpleHash(apiKey);
    const cached = apiKeyTierCache.get(keyHash);
    if (cached) {
        // Update last checked timestamp
        cached.lastChecked = Date.now();
        return cached.tier;
    }

    // Default to free tier (conservative approach)
    // TODO: Implement automatic tier detection via test API call
    return "free";
}

/**
 * Manually set API key tier (useful for admin interfaces or configuration)
 *
 * @param apiKey - Gemini API key
 * @param tier - Tier to set
 */
export function setApiKeyTier(apiKey: string, tier: ApiKeyTier): void {
    const keyHash = simpleHash(apiKey);
    apiKeyTierCache.set(keyHash, {
        tier,
        detectedAt: Date.now(),
        lastChecked: Date.now(),
    });
}

/**
 * Get tier-appropriate rate limit configuration
 *
 * @param endpoint - Endpoint name ('veo' or 'analyze')
 * @param tier - API key tier
 * @returns Rate limit configuration for the tier
 */
export function getTierRateLimit(
    endpoint: "veo" | "analyze",
    tier: ApiKeyTier
): RateLimitConfig {
    return TIER_RATE_LIMITS[tier][endpoint];
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (IP address, API key, etc.)
 * @param config - Rate limit configuration
 * @param tier - Optional tier information for response metadata
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { limit: 10, windowMs: 60000 },
    tier?: ApiKeyTier
): RateLimitResult {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // If no entry or expired, create new one
    if (!entry || now > entry.resetTime) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitStore.set(identifier, newEntry);
        return {
            success: true,
            remaining: config.limit - 1,
            resetTime: newEntry.resetTime,
            tier,
        };
    }

    // Check if limit exceeded
    if (entry.count >= config.limit) {
        return {
            success: false,
            remaining: 0,
            resetTime: entry.resetTime,
            tier,
        };
    }

    // Increment count
    entry.count++;
    return {
        success: true,
        remaining: config.limit - entry.count,
        resetTime: entry.resetTime,
        tier,
    };
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header for proxied requests, falls back to user-agent hash
 */
export function getClientIdentifier(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        // Get the first IP in the chain (original client)
        return forwarded.split(",")[0].trim();
    }

    // Fallback: use user-agent hash for some differentiation
    // This prevents all unidentified requests from sharing the same rate limit bucket
    const userAgent = request.headers.get("user-agent") || "";
    if (userAgent) {
        return `ua-${simpleHash(userAgent)}`;
    }

    // Last resort fallback
    return "unknown";
}
