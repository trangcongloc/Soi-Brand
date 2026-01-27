# Soi'Brand Operations Runbook

Deployment, monitoring, troubleshooting, and rollback procedures.

> **Last updated**: 2026-01-25

## Deployment

### Prerequisites
- Node.js 18+
- npm 9+
- Valid API keys (YouTube Data API v3, Google Gemini)

### Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   In Vercel dashboard, add:
   - `YOUTUBE_API_KEY` (required)
   - `GEMINI_API_KEY` (required)
   - `ALLOWED_ORIGINS` (production domains)
   - `NODE_ENV=production`

3. **Production Deployment**
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build**
   ```bash
   npm run validate  # Run all checks first
   npm run build     # Create production build
   ```

2. **Start**
   ```bash
   npm start  # Starts on port 3000
   ```

## Monitoring

### Health Checks

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/` | GET | 200 OK |
| `/api/analyze` | OPTIONS | 200 OK (CORS preflight) |

### Key Metrics to Watch

1. **API Quota Usage**
   - YouTube: 10,000 units/day (resets midnight PT)
   - Gemini Free Tier:
     - gemini-2.5-flash: 5 RPM, 20 RPD
     - gemini-2.5-flash-lite: 10 RPM, 20 RPD
   - Gemini Paid Tier:
     - gemini-2.5-flash: 1,000 RPM, 10,000 RPD
     - gemini-2.5-flash-lite: 4,000 RPM
     - gemini-2.5-pro: 150 RPM, 10,000 RPD
     - gemini-3-flash: 1,000 RPM, 10,000 RPD
     - gemini-3-pro: 25 RPM, 250 RPD

2. **Response Times**
   - Target: < 30s for full analysis
   - YouTube API: < 5s
   - Gemini AI: < 25s

3. **Error Rates**
   - Target: < 1% error rate
   - Monitor 429 (rate limit) responses

### Logging

Log levels configured via `LOG_LEVEL` env var:
- `silent` - No logs
- `error` - Errors only
- `info` - Normal operations (default dev)
- `verbose` - Debug output

Production default: `error`

## Common Issues and Fixes

### Issue: YouTube API Quota Exceeded

**Symptoms:**
- 429 response with `YOUTUBE_QUOTA` error type
- Error message about daily limit

**Fix:**
1. Wait until midnight PT for quota reset
2. Or use a different API key
3. Long-term: Request quota increase from Google

### Issue: Gemini Rate Limit

**Symptoms:**
- 429 response with `RATE_LIMIT` or `GEMINI_QUOTA`
- Frequent for free tier users

**Fix:**
1. Wait 60 seconds (RPM limit)
2. Or wait 24 hours (RPD limit)
3. Upgrade to paid tier for higher limits
4. Switch to lower-tier model (gemini-2.5-flash-lite)

### Issue: Model Overload

**Symptoms:**
- 503 response with `MODEL_OVERLOAD`
- `RESOURCE_EXHAUSTED` in logs

**Fix:**
1. Automatic retry with exponential backoff (3 attempts)
2. If persistent, switch to different model
3. Wait and retry during off-peak hours

### Issue: Channel Not Found

**Symptoms:**
- 404 response with `CHANNEL_NOT_FOUND`

**Fix:**
1. Verify URL format is correct
2. Check channel exists and is public
3. Supported formats:
   - `youtube.com/channel/UC...`
   - `youtube.com/@username`
   - `youtube.com/c/CustomName`
   - `youtube.com/user/Username`

### Issue: Invalid API Key

**Symptoms:**
- 500 response with `API_CONFIG` error
- `INVALID_ARGUMENT` in logs

**Fix:**
1. Verify API key is correct in environment
2. Check API is enabled in Google Cloud Console
3. Ensure no extra whitespace in key

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Requests blocked from frontend

**Fix:**
1. Add domain to `ALLOWED_ORIGINS` env var
2. For Vercel previews: automatically handled for `soi-brand-*.vercel.app`
3. Development: all origins allowed

## Rollback Procedures

### Vercel Rollback

1. **Via Dashboard**
   - Go to Vercel project > Deployments
   - Find last working deployment
   - Click "..." > "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback
   ```

### Manual Rollback

1. **Identify last working commit**
   ```bash
   git log --oneline -10
   ```

2. **Revert to commit**
   ```bash
   git checkout <commit-hash>
   npm install
   npm run build
   npm start
   ```

### Emergency: API Key Rotation

If API keys are compromised:

1. **Rotate YouTube API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create new key
   - Update in Vercel/environment
   - Delete old key

2. **Rotate Gemini API Key**
   - Go to [AI Studio](https://aistudio.google.com/app/apikey)
   - Create new key
   - Update in Vercel/environment
   - Delete old key

## Rate Limiting

The API implements **tier-based rate limiting** that automatically adjusts limits based on your Gemini API key tier.

### Rate Limits by Tier

**Free Tier:**
- **VEO API (`/api/veo`)**: 5 requests per minute per IP
- **Analyze API (`/api/analyze`)**: 10 requests per minute per IP

**Paid Tier:**
- **VEO API (`/api/veo`)**: 50 requests per minute per IP
- **Analyze API (`/api/analyze`)**: 100 requests per minute per IP

### Usage

To leverage paid tier limits, include `apiKeyTier: 'paid'` in your API request:

```javascript
fetch('/api/veo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoUrl: 'https://youtube.com/watch?v=...',
    workflow: 'url-to-scenes',
    apiKeyTier: 'paid', // ← Specify your tier
    geminiApiKey: 'your-key'
  })
})
```

### Response Headers

All responses include rate limit metadata:

- **Status 200/201**:
  - `X-RateLimit-Limit` - Maximum requests per minute for your tier
  - `X-RateLimit-Remaining` - Requests remaining in current window
  - `X-RateLimit-Reset` - Timestamp when limit resets
  - `X-RateLimit-Tier` - Your current tier (`free` or `paid`)

- **Status 429 (Rate Limited)**:
  - `Retry-After` - Seconds to wait before retrying
  - All headers above

### Notes
- Tier is **cached per API key** after first request
- If no tier specified, defaults to "free" (conservative)
- Application limits account for Gemini API **TPM constraints** (video analysis uses 50K-150K tokens/request)
- See [TIER_RATE_LIMITING.md](./TIER_RATE_LIMITING.md) for detailed documentation

## Security Checklist

- [ ] API keys stored as environment variables only
- [ ] CORS restricted to allowed origins in production
- [ ] Rate limiting enabled
- [ ] Request validation with Zod schemas
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't include API keys

## Contact

For critical issues, check:
- GitHub Issues: [Project Issues](https://github.com/your-repo/issues)
- CLAUDE.md for development context
