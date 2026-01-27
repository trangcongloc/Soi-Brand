# Gemini API Rate Limits Reference

Last updated: 2026-01-26

## Summary

This directory contains the current Gemini API rate limits as documented by Google AI Studio.

- `freeLimit.txt` - Free tier rate limits (extracted from AI Studio dashboard)
- `paidTier1Limit.txt` - Paid tier rate limits (extracted from AI Studio dashboard)

## Current Configuration

### Models Used in Soi'Brand

| Model | Tier | RPM (Free) | TPM (Free) | RPD (Free) | RPM (Paid) | TPM (Paid) | RPD (Paid) |
|-------|------|------------|------------|------------|------------|------------|------------|
| gemini-2.5-flash-lite | Free/Paid | 10 | 250K | 20 | 4,000 | 4M | Unlimited |
| gemini-2.5-flash | Free/Paid | 5 | 250K | 20 | 1,000 | 1M | 10,000 |
| gemini-3-flash | Free/Paid | 5 | 250K | 20 | 1,000 | 1M | 10,000 |
| gemini-2.5-pro | Paid only | - | - | - | 150 | 2M | 10,000 |
| gemini-3-pro | Paid only | - | - | - | 25 | 1M | 250 |

**Legend:**
- RPM: Requests Per Minute
- TPM: Tokens Per Minute
- RPD: Requests Per Day
- `-`: Not available on this tier

## Application-Level Rate Limits

To prevent abuse and protect the backend, the application implements its own rate limiting:

### API Endpoints

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/veo` | 15 RPM | 60s | VEO video scene generation |
| `/api/analyze` | 20 RPM | 60s | YouTube channel analysis |

### Implementation

- Uses in-memory rate limiter (`lib/rateLimit.ts`)
- Per-IP tracking via `X-Forwarded-For` header
- Returns 429 with `Retry-After` header when exceeded

**Note:** Application limits are designed to be generous enough for paid tier users while preventing abuse. For production with multiple instances, consider Redis-backed rate limiting.

## Rate Limit Strategy

### Free Tier Users
- Default model: `gemini-2.5-flash-lite` (10 RPM, 250K TPM, 20 RPD)
- Fallback: `gemini-2.5-flash` (5 RPM, 250K TPM, 20 RPD)
- **Bottleneck**: Gemini API (5-10 RPM) - not application limits
- **TPM Warning**: Video analysis prompts can use 50K-100K tokens each
  - At 100K tokens/prompt: ~2-3 prompts per minute max (TPM-limited)
  - Recommendation: Use larger batch sizes (30-60 scenes/batch) to minimize API calls

### Paid Tier Users
- Recommended: `gemini-2.5-flash` (1,000 RPM, 1M TPM, 10K RPD)
- For high quality: `gemini-2.5-pro` (150 RPM, 2M TPM, 10K RPD)
- For fastest: `gemini-2.5-flash-lite` (4,000 RPM, 4M TPM, Unlimited RPD)
- **Bottleneck**: Current application limit (15 RPM) blocks paid tier throughput
  - **Action Required**: Increase app limit to 100+ RPM for paid users
- **TPM Consideration**:
  - At 100K tokens/prompt: ~10 prompts per minute (gemini-2.5-flash)
  - At 100K tokens/prompt: ~20 prompts per minute (gemini-2.5-pro)
  - At 100K tokens/prompt: ~40 prompts per minute (gemini-2.5-flash-lite)

## Updating Rate Limits

When Google updates their rate limits:

1. **Update raw data files**
   - Copy new limits from AI Studio to `freeLimit.txt` and `paidTier1Limit.txt`

2. **Update model configurations**
   - Edit `lib/geminiModels.ts` with new RPM/RPD values

3. **Review application limits**
   - Check if `app/api/veo/route.ts` and `app/api/analyze/route.ts` need adjustment
   - Consider paid tier users when setting limits

4. **Update documentation**
   - Update `docs/RUNBOOK.md` with new limits
   - Update this README

## Testing Rate Limits

Use `scripts/test-veo.ts` to test VEO API with rate limit handling:

```bash
npx ts-node scripts/test-veo.ts
```

The test script includes automatic retry logic for rate limit errors (429).

## Monitoring

Watch for these error types in production:
- `GEMINI_RATE_LIMIT` - Gemini API rate limit exceeded
- `RATE_LIMIT` - Application-level rate limit exceeded

Metrics to track:
- 429 response rate per endpoint
- Average requests per minute per IP
- Gemini API quota usage (RPM/RPD)

## Resources

- [Google AI Studio Rate Limits](https://ai.google.dev/pricing)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- Project configuration: `lib/geminiModels.ts`
- Application rate limiter: `lib/rateLimit.ts`
