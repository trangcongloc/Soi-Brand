/**
 * Tests for rate limiting functionality
 * @module __tests__/lib/rateLimit.test.ts
 */

import {
  checkRateLimit,
  getClientIdentifier,
  detectApiKeyTier,
  setApiKeyTier,
  getTierRateLimit,
  TIER_RATE_LIMITS,
  type RateLimitConfig,
} from "@/lib/rateLimit";

describe("Rate Limit", () => {
  // ============================================================================
  // TIER_RATE_LIMITS configuration
  // ============================================================================
  describe("TIER_RATE_LIMITS", () => {
    it("has free tier configuration", () => {
      expect(TIER_RATE_LIMITS.free).toBeDefined();
      expect(TIER_RATE_LIMITS.free.prompt).toBeDefined();
      expect(TIER_RATE_LIMITS.free.analyze).toBeDefined();
    });

    it("has paid tier configuration", () => {
      expect(TIER_RATE_LIMITS.paid).toBeDefined();
      expect(TIER_RATE_LIMITS.paid.prompt).toBeDefined();
      expect(TIER_RATE_LIMITS.paid.analyze).toBeDefined();
    });

    it("free tier has lower limits than paid tier", () => {
      expect(TIER_RATE_LIMITS.free.prompt.limit).toBeLessThan(
        TIER_RATE_LIMITS.paid.prompt.limit
      );
      expect(TIER_RATE_LIMITS.free.analyze.limit).toBeLessThan(
        TIER_RATE_LIMITS.paid.analyze.limit
      );
    });

    it("all rate limits have windowMs set to 60000 (1 minute)", () => {
      expect(TIER_RATE_LIMITS.free.prompt.windowMs).toBe(60000);
      expect(TIER_RATE_LIMITS.free.analyze.windowMs).toBe(60000);
      expect(TIER_RATE_LIMITS.paid.prompt.windowMs).toBe(60000);
      expect(TIER_RATE_LIMITS.paid.analyze.windowMs).toBe(60000);
    });

    it("free tier prompt limit is 5 RPM", () => {
      expect(TIER_RATE_LIMITS.free.prompt.limit).toBe(5);
    });

    it("paid tier prompt limit is 50 RPM", () => {
      expect(TIER_RATE_LIMITS.paid.prompt.limit).toBe(50);
    });
  });

  // ============================================================================
  // getTierRateLimit
  // ============================================================================
  describe("getTierRateLimit", () => {
    it("returns free tier prompt config", () => {
      const config = getTierRateLimit("prompt", "free");
      expect(config).toEqual(TIER_RATE_LIMITS.free.prompt);
    });

    it("returns paid tier prompt config", () => {
      const config = getTierRateLimit("prompt", "paid");
      expect(config).toEqual(TIER_RATE_LIMITS.paid.prompt);
    });

    it("returns free tier analyze config", () => {
      const config = getTierRateLimit("analyze", "free");
      expect(config).toEqual(TIER_RATE_LIMITS.free.analyze);
    });

    it("returns paid tier analyze config", () => {
      const config = getTierRateLimit("analyze", "paid");
      expect(config).toEqual(TIER_RATE_LIMITS.paid.analyze);
    });
  });

  // ============================================================================
  // detectApiKeyTier
  // ============================================================================
  describe("detectApiKeyTier", () => {
    it("returns explicit tier when provided", () => {
      expect(detectApiKeyTier("test-key", "paid")).toBe("paid");
      expect(detectApiKeyTier("test-key-2", "free")).toBe("free");
    });

    it("defaults to free tier without explicit tier", () => {
      // Use a unique key that hasn't been cached
      const uniqueKey = `test-key-${Date.now()}-${Math.random()}`;
      expect(detectApiKeyTier(uniqueKey)).toBe("free");
    });

    it("caches explicit tier for future lookups", () => {
      const testKey = `cache-test-${Date.now()}`;

      // First call with explicit tier
      detectApiKeyTier(testKey, "paid");

      // Second call without explicit tier should return cached value
      expect(detectApiKeyTier(testKey)).toBe("paid");
    });
  });

  // ============================================================================
  // setApiKeyTier
  // ============================================================================
  describe("setApiKeyTier", () => {
    it("sets tier for API key", () => {
      const testKey = `set-test-${Date.now()}`;

      setApiKeyTier(testKey, "paid");
      expect(detectApiKeyTier(testKey)).toBe("paid");
    });

    it("can override existing tier", () => {
      const testKey = `override-test-${Date.now()}`;

      setApiKeyTier(testKey, "free");
      expect(detectApiKeyTier(testKey)).toBe("free");

      setApiKeyTier(testKey, "paid");
      expect(detectApiKeyTier(testKey)).toBe("paid");
    });
  });

  // ============================================================================
  // checkRateLimit
  // ============================================================================
  describe("checkRateLimit", () => {
    const defaultConfig: RateLimitConfig = {
      limit: 3,
      windowMs: 60000,
    };

    it("allows first request for new identifier", () => {
      const identifier = `test-${Date.now()}-first`;
      const result = checkRateLimit(identifier, defaultConfig);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2); // limit - 1
    });

    it("decrements remaining count on subsequent requests", () => {
      const identifier = `test-${Date.now()}-decrement`;

      const result1 = checkRateLimit(identifier, defaultConfig);
      expect(result1.remaining).toBe(2);

      const result2 = checkRateLimit(identifier, defaultConfig);
      expect(result2.remaining).toBe(1);

      const result3 = checkRateLimit(identifier, defaultConfig);
      expect(result3.remaining).toBe(0);
    });

    it("blocks requests when limit exceeded", () => {
      const identifier = `test-${Date.now()}-block`;

      // Use up all requests
      checkRateLimit(identifier, defaultConfig);
      checkRateLimit(identifier, defaultConfig);
      checkRateLimit(identifier, defaultConfig);

      // This should be blocked
      const result = checkRateLimit(identifier, defaultConfig);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("returns resetTime in the future", () => {
      const identifier = `test-${Date.now()}-reset`;
      const now = Date.now();

      const result = checkRateLimit(identifier, defaultConfig);

      expect(result.resetTime).toBeGreaterThan(now);
      expect(result.resetTime).toBeLessThanOrEqual(now + defaultConfig.windowMs);
    });

    it("uses default config when not provided", () => {
      const identifier = `test-${Date.now()}-default`;
      const result = checkRateLimit(identifier);

      // Default config is { limit: 10, windowMs: 60000 }
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 1
    });

    it("includes tier in result when provided", () => {
      const identifier = `test-${Date.now()}-tier`;
      const result = checkRateLimit(identifier, defaultConfig, "paid");

      expect(result.tier).toBe("paid");
    });

    it("allows requests after window expires", async () => {
      const shortConfig: RateLimitConfig = {
        limit: 1,
        windowMs: 50, // 50ms window
      };
      const identifier = `test-${Date.now()}-expire`;

      // Use up the limit
      checkRateLimit(identifier, shortConfig);

      // Should be blocked
      const blockedResult = checkRateLimit(identifier, shortConfig);
      expect(blockedResult.success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be allowed again
      const allowedResult = checkRateLimit(identifier, shortConfig);
      expect(allowedResult.success).toBe(true);
    });

    it("separate identifiers have independent rate limits", () => {
      const config: RateLimitConfig = { limit: 1, windowMs: 60000 };
      const identifier1 = `test-${Date.now()}-sep1`;
      const identifier2 = `test-${Date.now()}-sep2`;

      // Use up limit for identifier1
      checkRateLimit(identifier1, config);
      const blocked = checkRateLimit(identifier1, config);
      expect(blocked.success).toBe(false);

      // identifier2 should still work
      const allowed = checkRateLimit(identifier2, config);
      expect(allowed.success).toBe(true);
    });
  });

  // ============================================================================
  // getClientIdentifier
  // ============================================================================
  describe("getClientIdentifier", () => {
    // Helper to create a mock Request with proper headers
    // Uses a Map-like object that satisfies the headers.get() interface
    function createMockRequest(headers: Record<string, string>): Request {
      const headersMap = new Map(Object.entries(headers));
      return {
        headers: {
          get: (name: string) => headersMap.get(name) || null,
        },
      } as unknown as Request;
    }

    it("extracts IP from X-Forwarded-For header", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1",
      });

      expect(getClientIdentifier(request)).toBe("192.168.1.1");
    });

    it("extracts first IP from X-Forwarded-For chain", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1",
      });

      expect(getClientIdentifier(request)).toBe("192.168.1.1");
    });

    it("trims whitespace from X-Forwarded-For IP", () => {
      const request = createMockRequest({
        "x-forwarded-for": "  192.168.1.1  ",
      });

      expect(getClientIdentifier(request)).toBe("192.168.1.1");
    });

    it("falls back to user-agent hash when no X-Forwarded-For", () => {
      const request = createMockRequest({
        "user-agent": "Mozilla/5.0 Test Browser",
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toMatch(/^ua-[a-z0-9]+$/);
    });

    it("generates consistent hash for same user-agent", () => {
      const userAgent = "Mozilla/5.0 Test Browser Consistent";

      const request1 = createMockRequest({ "user-agent": userAgent });
      const request2 = createMockRequest({ "user-agent": userAgent });

      expect(getClientIdentifier(request1)).toBe(getClientIdentifier(request2));
    });

    it("generates different hash for different user-agents", () => {
      const request1 = createMockRequest({
        "user-agent": "Mozilla/5.0 Browser A",
      });

      const request2 = createMockRequest({
        "user-agent": "Mozilla/5.0 Browser B",
      });

      expect(getClientIdentifier(request1)).not.toBe(
        getClientIdentifier(request2)
      );
    });

    it("returns 'unknown' when no identifying headers", () => {
      const request = createMockRequest({});
      expect(getClientIdentifier(request)).toBe("unknown");
    });

    it("prefers X-Forwarded-For over User-Agent", () => {
      const request = createMockRequest({
        "x-forwarded-for": "192.168.1.100",
        "user-agent": "Mozilla/5.0",
      });

      expect(getClientIdentifier(request)).toBe("192.168.1.100");
    });
  });

  // ============================================================================
  // Integration tests
  // ============================================================================
  describe("Integration", () => {
    it("complete flow: detect tier, get config, check rate limit", () => {
      const apiKey = `integration-test-${Date.now()}`;
      const clientId = `client-${Date.now()}`;

      // Step 1: Detect tier (explicit)
      const tier = detectApiKeyTier(apiKey, "free");
      expect(tier).toBe("free");

      // Step 2: Get tier-appropriate config
      const config = getTierRateLimit("prompt", tier);
      expect(config.limit).toBe(5); // Free tier VEO limit

      // Step 3: Check rate limit
      const result = checkRateLimit(clientId, config, tier);
      expect(result.success).toBe(true);
      expect(result.tier).toBe("free");
    });

    it("paid tier allows more requests than free tier", () => {
      const freeClientId = `free-client-${Date.now()}`;
      const paidClientId = `paid-client-${Date.now()}`;

      const freeConfig = getTierRateLimit("prompt", "free");
      const paidConfig = getTierRateLimit("prompt", "paid");

      // Exhaust free tier limit
      for (let i = 0; i < freeConfig.limit; i++) {
        checkRateLimit(freeClientId, freeConfig);
      }

      // Free tier should be blocked
      const freeResult = checkRateLimit(freeClientId, freeConfig);
      expect(freeResult.success).toBe(false);

      // Paid tier should still have capacity
      for (let i = 0; i < freeConfig.limit; i++) {
        checkRateLimit(paidClientId, paidConfig);
      }

      const paidResult = checkRateLimit(paidClientId, paidConfig);
      expect(paidResult.success).toBe(true); // Still has remaining capacity
    });
  });
});
