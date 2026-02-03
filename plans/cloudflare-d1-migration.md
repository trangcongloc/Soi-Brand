# Plan: Migrate VEO Job Cache to Cloudflare D1

## Summary

Replace localStorage-based job cache with Cloudflare D1 (SQLite) for cross-device access. Phase cache and form settings stay in localStorage. localStorage serves as fallback when D1 is unreachable. BroadcastChannel for cross-tab sync.

---

## What Moves vs. What Stays

| Data | Location | Reason |
|------|----------|--------|
| `veo_job_*` (jobs) | **D1** (primary) + localStorage (fallback) | Cross-device access |
| `veo_phase_*` (resume) | localStorage | Device-specific, active session only |
| `veo_form_settings` | localStorage | Small, device-specific prefs |

---

## Phase 1: Cloudflare D1 Setup

**Manual steps (outside code):**
1. Create Cloudflare account (free) at dash.cloudflare.com
2. Create D1 database: `Dashboard > Workers & Pages > D1 > Create`
3. Run schema SQL in D1 console
4. Create API token: `Dashboard > My Profile > API Tokens > Create Token` with D1 read/write
5. Add env vars to `.env.local` and Vercel project settings

**Schema (run in D1 console):**
```sql
CREATE TABLE veo_jobs (
  job_id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  scene_count INTEGER NOT NULL DEFAULT 0,
  characters_found INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'hybrid',
  voice TEXT NOT NULL DEFAULT 'no-voice',
  status TEXT NOT NULL DEFAULT 'completed',
  has_script INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  error_json TEXT,
  expires_at INTEGER NOT NULL
);

CREATE TABLE veo_job_data (
  job_id TEXT PRIMARY KEY REFERENCES veo_jobs(job_id) ON DELETE CASCADE,
  data_compressed TEXT NOT NULL
);

CREATE INDEX idx_veo_jobs_updated ON veo_jobs(updated_at DESC);
CREATE INDEX idx_veo_jobs_video ON veo_jobs(video_id);
CREATE INDEX idx_veo_jobs_expires ON veo_jobs(expires_at);
```

**Env vars:**
```
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_D1_DATABASE_ID=xxx
CLOUDFLARE_D1_API_TOKEN=xxx
```

---

## Phase 2: D1 Client + API Routes

### Create `lib/veo/d1-client.ts` (server-side only)
- `queryD1(sql, params)` — calls D1 REST API
- `listJobs()` — SELECT from veo_jobs WHERE expires_at > now, ORDER BY updated_at DESC
- `getJob(jobId)` — SELECT + decompress from veo_job_data
- `upsertJob(jobId, data)` — INSERT OR REPLACE into both tables, compress data_json with `zlib.gzipSync` → base64
- `deleteJob(jobId)` — DELETE from veo_jobs (cascades to job_data)
- `deleteAllJobs()` — DELETE all rows
- `cleanupExpired()` — DELETE WHERE expires_at < now (run on each write)

Compression uses Node.js built-in `zlib` (no new dependency). A 3-7MB job compresses to ~300KB-1MB.

### Create API routes

**`app/api/veo/jobs/route.ts`**
- `GET` — returns `{ jobs: CachedVeoJobInfo[] }` via `listJobs()`
- `DELETE` — clears all jobs via `deleteAllJobs()`

**`app/api/veo/jobs/[jobId]/route.ts`**
- `GET` — returns `{ job: CachedVeoJob | null }` via `getJob(jobId)`
- `PUT` — upserts job via `upsertJob(jobId, body)`, runs `cleanupExpired()`
- `DELETE` — deletes job via `deleteJob(jobId)`

---

## Phase 3: Cache Abstraction Layer

### Rename `lib/veo/cache.ts` → `lib/veo/cache-local.ts`
- Keep all existing localStorage logic unchanged
- This becomes the fallback module

### Create `lib/veo/cache-remote.ts`
- Async functions that call `/api/veo/jobs` endpoints via `fetch()`
- 5-second timeout on all requests via `AbortController`
- Each function: try D1, catch → fall back to `cache-local.ts`

```
getCachedJobList() → GET /api/veo/jobs → fallback: getCachedJobListLocal()
getCachedJob(id) → GET /api/veo/jobs/{id} → fallback: getCachedJobLocal(id)
setCachedJob(id, data) → PUT /api/veo/jobs/{id} → fallback: setCachedJobLocal(id, data)
deleteCachedJob(id) → DELETE /api/veo/jobs/{id} → fallback: deleteCachedJobLocal(id)
clearAllJobs() → DELETE /api/veo/jobs → fallback: clearAllJobsLocal()
```

### Rewrite `lib/veo/cache.ts` as async facade
- Same function names, now async
- Delegates to `cache-remote.ts`
- Dispatches `veo-job-updated` event after writes
- Dispatches `BroadcastChannel` message after writes

### Update `lib/veo/storage-utils.ts`
- Add BroadcastChannel to `dispatchJobUpdateEvent()`
- Keep existing CustomEvent for same-tab

---

## Phase 4: Call Site Migration (sync → async)

### `app/veo/page.tsx` (8 call sites)

| Line | Current | Change |
|------|---------|--------|
| 136 | `useState(() => getCachedJobList().length > 0)` | Init `false`, `useEffect` calls async `getCachedJobList()` |
| 254 | `setCachedJob(...)` in handleError | Fire-and-forget: `setCachedJob(...).catch(console.error)` |
| 517 | `setCachedJob(...)` in SSE complete | Fire-and-forget |
| 596 | `setCachedJob(...)` in handleCancel | Fire-and-forget |
| 697 | `getCachedJob(id)` in handleViewJob | `await` + loading state |
| 717 | `getCachedJob(id)` in handleRegenerateJob | `await` |
| 728 | `getCachedJob(id)` in handleRetryJob | `await` (already async) |
| 892 | `getCachedJobList().length > 0` | Async callback |

### `components/veo/VeoHistoryPanel.tsx` (5 call sites)

| Line | Current | Change |
|------|---------|--------|
| 23 | `useState(() => getCachedJobList())` | Init `[]`, `useEffect` fetches async |
| 31 | `getCachedJobList()` in refreshJobs | `await getCachedJobList()` |
| 42-53 | StorageEvent listener | Replace with BroadcastChannel listener |
| 62 | `deleteCachedJob(id)` | `await` + loading state |
| 68 | `clearAllJobs()` | `await` + loading state |

Add a `loading` state to VeoHistoryPanel for initial fetch and actions.

---

## Phase 5: Testing & Verification

1. **Manual test:** Create a job → check D1 console for rows → view from another device
2. **Fallback test:** Set invalid D1 credentials → verify localStorage fallback works
3. **Cross-tab test:** Generate job in tab A → verify tab B history updates via BroadcastChannel
4. **Large job test:** Generate 200+ scene job → verify compression keeps D1 row under 1MB
5. **TTL test:** Insert job with past `expires_at` → verify cleanup removes it
6. **Run existing tests:** `npm run validate` — update `__tests__/lib/veo/cache.test.ts` for async signatures

---

## Files Summary

| File | Action |
|------|--------|
| `lib/veo/d1-client.ts` | CREATE — D1 REST API client |
| `app/api/veo/jobs/route.ts` | CREATE — list + clear all |
| `app/api/veo/jobs/[jobId]/route.ts` | CREATE — get + upsert + delete |
| `lib/veo/cache-remote.ts` | CREATE — async fetch-based cache |
| `lib/veo/cache.ts` → `cache-local.ts` | RENAME — existing localStorage code |
| `lib/veo/cache.ts` | CREATE — new async facade |
| `lib/veo/storage-utils.ts` | MODIFY — add BroadcastChannel |
| `lib/veo/index.ts` | MODIFY — update exports |
| `app/veo/page.tsx` | MODIFY — async cache calls |
| `components/veo/VeoHistoryPanel.tsx` | MODIFY — async + loading + BroadcastChannel |
| `__tests__/lib/veo/cache.test.ts` | MODIFY — update for async |

---

## D1 Free Tier Budget

| Resource | Free Limit | Expected Usage | Headroom |
|----------|-----------|----------------|----------|
| Storage | 5 GB | ~20 jobs x 1MB = 20MB | 250x |
| Reads | 5M/day | ~100 page loads x 2 = 200 | 25000x |
| Writes | 100K/day | ~10 jobs x 5 writes = 50 | 2000x |
