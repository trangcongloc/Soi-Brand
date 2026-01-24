/**
 * Simple in-memory rate limiter for API endpoints
 * For production with multiple instances, use Redis-backed rate limiting
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

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
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (IP address, API key, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { limit: 10, windowMs: 60000 }
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
        };
    }

    // Check if limit exceeded
    if (entry.count >= config.limit) {
        return {
            success: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    // Increment count
    entry.count++;
    return {
        success: true,
        remaining: config.limit - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header for proxied requests, falls back to IP
 */
export function getClientIdentifier(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        // Get the first IP in the chain (original client)
        return forwarded.split(",")[0].trim();
    }

    // Fallback - in Next.js, this won't work directly, but serves as a default
    return "unknown";
}
