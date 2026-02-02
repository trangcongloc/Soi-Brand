# Plan: Three Features (Priority Order)

## Feature 1: Failed Job 48h TTL + Countdown Timer

### Goal
Failed/partial jobs expire after 48 hours (not 7 days like completed jobs). The UI shows a countdown timer displaying time remaining to retry/continue.

### Changes

#### 1. `lib/veo/constants.ts`
- Add: `FAILED_JOB_CACHE_TTL_MS = 48 * 60 * 60 * 1000` (48 hours)
- Existing `CACHE_TTL_MS` (7 days) stays for completed jobs

#### 2. `lib/veo/cache.ts`
- `setCachedJob()`: When status is `"failed"` or `"partial"`, store with a shorter TTL timestamp
  - Add `expiresAt` field to `CachedVeoJob` (computed as `Date.now() + FAILED_JOB_CACHE_TTL_MS` (48h) for failed, `Date.now() + CACHE_TTL_MS` for completed)
- `getCachedJob()` / `getCachedJobList()`: Check `expiresAt` if present, fall back to existing TTL check

#### 3. `lib/veo/types.ts`
- Add `expiresAt?: number` to `CachedVeoJob` interface (optional for backward compat with existing cached data)

#### 4. `lib/veo/cache.ts` — `getCachedJobList()`
- Include `expiresAt` in the returned `CachedVeoJobInfo` objects

#### 5. `lib/veo/types.ts`
- Add `expiresAt?: number` to `CachedVeoJobInfo` interface

#### 6. `components/veo/VeoHistoryPanel.tsx`
- For failed/partial jobs: show countdown text like "23h 15m left to retry"
- Compute from `expiresAt - Date.now()`
- Use a `useEffect` with 60-second interval to update the countdown
- When expired (<=0): show "Expired" and disable retry button

#### 7. `lib/lang/en.ts` + `lib/lang/vi.ts`
- Add `retryTimeLeft: "{time} left to retry"` / `retryExpired: "Expired"`

### Verification
- Create a failed job → see "47h 59m left to retry"
- Wait 1 min → countdown updates
- Existing completed jobs still use 7-day TTL

---

## Feature 2: Overlapping Batch Segments for Continuity

### Goal
Add a configurable overlap to batch boundaries so Gemini analyzes a few seconds from the previous segment for visual continuity. Instead of sharp cuts (0-60, 60-120), use overlapping windows (0-60, 50-120, 110-180).

### Current Behavior
```
Batch 0: 0s → 40s
Batch 1: 40s → 80s   ← hard cut, no overlap
Batch 2: 80s → 120s
```

### New Behavior (with 10s overlap)
```
Batch 0: 0s → 40s
Batch 1: 30s → 80s   ← 10s overlap for continuity context
Batch 2: 70s → 120s
```

The overlap section is sent to Gemini via `videoMetadata` so it can see the transition, but the prompt instructs it to only generate scenes for the non-overlapping portion.

### Changes

#### 1. `lib/veo/constants.ts`
- Add: `BATCH_OVERLAP_SECONDS = 10` (configurable, default 10s)

#### 2. `lib/veo/types.ts` — `DirectBatchInfo`
- Add: `analysisStartSeconds: number` (includes overlap, used for videoMetadata)
- Existing `startSeconds` stays as the "generate from" boundary

#### 3. `app/api/veo/route.ts` — `runUrlToScenesDirect()`
- Compute `analysisStartSeconds = Math.max(0, batchStartSeconds - BATCH_OVERLAP_SECONDS)`
- Pass to `DirectBatchInfo`

#### 4. `lib/veo/prompts.ts` — `buildScenePrompt()`
- Use `analysisStartSeconds` for `videoMetadata.startOffset` (so Gemini sees the overlap)
- Keep `startSeconds` in the prompt text as the "generate scenes FROM" boundary
- Add instruction: "Video starts at {analysisStartTime} for context but generate scenes only from {startTime} onwards"

### Verification
- Direct mode with 5-min video → batch boundaries overlap by 10s
- Scene timestamps don't duplicate across batches
- Continuity between batches improves (characters maintain state)

---

## Feature 3: Cloudflare D1 Migration

### Goal
Move VEO job cache from localStorage to Cloudflare D1 for cross-device access. localStorage remains as fallback. Already fully planned in `plans/cloudflare-d1-migration.md`.

### Summary of Phases
1. **D1 Setup**: Create database + schema + API tokens (manual)
2. **D1 Client + API Routes**: `lib/veo/d1-client.ts` + `/api/veo/jobs/` routes
3. **Cache Abstraction**: Rename `cache.ts` → `cache-local.ts`, create async `cache-remote.ts` facade
4. **Call Site Migration**: Convert 13 sync cache calls to async across `page.tsx` and `VeoHistoryPanel.tsx`
5. **Testing**: Manual + fallback + cross-tab + large job + TTL tests

### Files (from migration plan)
| File | Action |
|------|--------|
| `lib/veo/d1-client.ts` | CREATE |
| `app/api/veo/jobs/route.ts` | CREATE |
| `app/api/veo/jobs/[jobId]/route.ts` | CREATE |
| `lib/veo/cache-remote.ts` | CREATE |
| `lib/veo/cache.ts` → `cache-local.ts` | RENAME |
| `lib/veo/cache.ts` | CREATE (async facade) |
| `lib/veo/storage-utils.ts` | MODIFY (BroadcastChannel) |
| `lib/veo/index.ts` | MODIFY |
| `app/veo/page.tsx` | MODIFY (8 call sites → async) |
| `components/veo/VeoHistoryPanel.tsx` | MODIFY (5 call sites → async) |

### Integration with Feature 1
- D1 schema already has `expires_at` column — maps directly to the `expiresAt` field from Feature 1
- Failed jobs: `expires_at = now + 48h`
- Completed jobs: `expires_at = now + 7d`

---

## Implementation Order

1. **Feature 1** (Failed Job 48h TTL) — ~6 files, self-contained
2. **Feature 2** (Batch Overlap) — ~4 files, self-contained
3. **Feature 3** (D1 Migration) — ~10 files, builds on Features 1+2
