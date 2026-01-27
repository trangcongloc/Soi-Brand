# Tier-Based Rate Limiting

This application implements dynamic rate limiting based on the Gemini API key tier (free vs paid).

## Overview

The rate limiting system automatically detects whether a request is using a free or paid Gemini API key and applies appropriate rate limits. This ensures:
- Free tier users don't exceed Gemini's API limits
- Paid tier users can leverage their higher quotas
- Fair usage across all users

## Rate Limits by Tier

### Free Tier
| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/api/veo` | 5 RPM | 60s | Conservative for free tier (Gemini: 5-10 RPM) |
| `/api/analyze` | 10 RPM | 60s | Allows moderate usage |

### Paid Tier
| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/api/veo` | 50 RPM | 60s | Accounts for TPM constraints (~10-20 effective RPM) |
| `/api/analyze` | 100 RPM | 60s | Leverages paid tier capacity |

**Note:** Even with high RPM limits, the **TPM (Tokens Per Minute)** constraint is often the bottleneck for video analysis:
- Video analysis prompts: ~50K-150K tokens each
- At 1M TPM: ~10-20 requests/minute effective limit
- At 2M TPM (gemini-2.5-pro): ~20-40 requests/minute effective limit

## How It Works

### 1. Tier Detection

The system detects API key tier in three ways:

**a) Explicit Specification (Recommended)**
```typescript
// Client-side request
const response = await fetch('/api/veo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoUrl: 'https://youtube.com/watch?v=...',
    workflow: 'url-to-scenes',
    apiKeyTier: 'paid', // ← Explicitly specify tier
    geminiApiKey: 'your-api-key',
    // ... other params
  })
});
```

**b) Cached Detection**
Once a tier is specified or detected for an API key, it's cached in memory for 7 days. Subsequent requests with the same API key automatically use the cached tier.

**c) Default (Conservative)**
If no explicit tier is provided and the key isn't cached, defaults to "free" tier limits.

### 2. Rate Limit Application

Rate limits are applied **per IP address** (or client identifier) using the `X-Forwarded-For` header.

### 3. Response Headers

All API responses include rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 1706284800000
X-RateLimit-Tier: paid
```

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706284800000
X-RateLimit-Tier: paid

{
  "event": "error",
  "data": {
    "type": "RATE_LIMIT",
    "message": "Rate limit exceeded for paid tier (50 requests per minute)",
    "retryable": true,
    "tier": "paid",
    "limit": 50
  }
}
```

## API Usage

### VEO Endpoint (`/api/veo`)

```typescript
interface VeoRequest {
  workflow: 'url-to-script' | 'script-to-scenes' | 'url-to-scenes';
  videoUrl?: string;
  scriptText?: string;
  sceneCount?: number;
  batchSize?: number;
  voice?: string;
  mode?: 'direct' | 'hybrid';
  geminiApiKey?: string;
  geminiModel?: string;
  apiKeyTier?: 'free' | 'paid'; // ← Optional tier specification
}
```

**Example:**

```javascript
const response = await fetch('/api/veo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflow: 'url-to-scenes',
    videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    mode: 'hybrid',
    sceneCount: 60,
    batchSize: 30,
    voice: 'no-voice',
    apiKeyTier: 'paid', // ← Specify tier
    geminiApiKey: process.env.GEMINI_API_KEY
  })
});
```

### Analyze Endpoint (`/api/analyze`)

```typescript
interface AnalyzeRequest {
  channelUrl: string;
  youtubeApiKey?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  apiKeyTier?: 'free' | 'paid'; // ← Optional tier specification
  language?: 'vi' | 'en';
}
```

**Example:**

```javascript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channelUrl: 'https://youtube.com/@channel',
    language: 'en',
    apiKeyTier: 'paid', // ← Specify tier
    geminiApiKey: process.env.GEMINI_API_KEY
  })
});
```

## Configuration

Rate limit configurations are defined in `lib/rateLimit.ts`:

```typescript
export const TIER_RATE_LIMITS = {
  free: {
    veo: { limit: 5, windowMs: 60000 },
    analyze: { limit: 10, windowMs: 60000 },
  },
  paid: {
    veo: { limit: 50, windowMs: 60000 },
    analyze: { limit: 100, windowMs: 60000 },
  },
} as const;
```

To adjust limits, modify these values and redeploy.

## Programmatic Tier Management

For admin interfaces or custom integrations:

```typescript
import { setApiKeyTier, detectApiKeyTier } from '@/lib/rateLimit';

// Manually set a tier for an API key
setApiKeyTier('your-api-key-hash', 'paid');

// Detect current tier (checks cache, defaults to free)
const tier = detectApiKeyTier('your-api-key-hash');
console.log(tier); // 'free' or 'paid'
```

## Monitoring

Watch for these metrics in production:

1. **429 Rate Limit Errors**
   - High rate across users → Consider increasing limits
   - Specific users → Investigate abuse or legitimate high usage

2. **Tier Distribution**
   - Track % of requests from free vs paid tiers
   - Adjust limits based on usage patterns

3. **Response Headers**
   - Monitor `X-RateLimit-Remaining` values
   - Alert when consistently hitting limits

## Future Enhancements

Potential improvements:

1. **Automatic Tier Detection**
   - Make test API call to Gemini
   - Parse response headers for quota information
   - Cache result

2. **Redis-Backed Rate Limiting**
   - Required for multi-instance deployments
   - Shared rate limit state across servers
   - Persistent tier cache

3. **Dynamic Limit Adjustment**
   - Adjust limits based on time of day
   - Burst allowances for paid tiers
   - Per-user custom limits (database-backed)

4. **Usage Analytics**
   - Track API usage per tier
   - Generate usage reports
   - Cost attribution

## Troubleshooting

### "Rate limit exceeded" but I have a paid tier key

**Solution:** Explicitly specify `apiKeyTier: 'paid'` in your request. The system defaults to "free" tier if not specified.

### My paid tier key is being rate limited at 5 RPM

**Cause:** The API key isn't cached and no explicit tier was provided.

**Solution:**
1. Include `apiKeyTier: 'paid'` in your first request
2. Subsequent requests will use the cached tier
3. Or always include `apiKeyTier: 'paid'` in every request

### Rate limits seem too low for my use case

**Solution:** Adjust the limits in `lib/rateLimit.ts` based on your actual Gemini API quotas and TPM constraints.

### Getting 429 errors even with low request count

**Possible causes:**
1. Shared IP address (multiple users)
2. TPM limit reached (not RPM)
3. Gemini API returning 429 (upstream rate limit)

**Debug steps:**
1. Check response headers: `X-RateLimit-Tier`, `X-RateLimit-Limit`
2. Review server logs for tier detection
3. Monitor Gemini API quota in AI Studio dashboard

## Security Considerations

1. **API Key Hashing**: API keys are hashed before caching to prevent exposure
2. **No Persistent Storage**: Tier cache is in-memory only (clears on restart)
3. **Conservative Defaults**: Unknown keys default to free tier (fail-safe)
4. **Per-IP Limiting**: Prevents abuse from single source

## References

- Rate limit implementation: `lib/rateLimit.ts`
- VEO endpoint: `app/api/veo/route.ts`
- Analyze endpoint: `app/api/analyze/route.ts`
- Gemini rate limits: `rateLimit/README.md`
