# VEO Pipeline - Bug Report

**Date**: 2026-02-04
**Reviewer**: Claude (Paranoid Senior Engineer Mode)
**Scope**: Complete VEO pipeline (lib/veo, app/api/veo, components/veo, app/veo)

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| 🔴 CRITICAL | 3 | 3 ✅ |
| 🟠 HIGH | 4 | 4 ✅ |
| 🟡 MEDIUM | 6 | 0 |
| 🟢 LOW | 4 | 0 |
| **TOTAL** | **17** | **7** |

---

## 🔴 CRITICAL - Fix Immediately

### BUG-001: Negative completedBatches in handleCancel
**File**: `app/veo/page.tsx:988`
**Issue**: `batch - 1` can be negative if `batch` is 0, creating invalid resume data.
```typescript
completedBatches: batch - 1, // If batch=0, this is -1
```
**Impact**: Resume would try to start at batch -1, causing API errors or skipped batches.
**Fix**: Use `Math.max(0, batch - 1)`
**Status**: ✅ FIXED

### BUG-002: Null pointer in processSceneBatch
**File**: `lib/veo/scene-processor.ts:94`
**Issue**: Non-null assertion `serverProgress.get(jobId)!` assumes progress always exists.
```typescript
serverProgress.get(jobId)!, // Crashes if jobId not in map
```
**Impact**: Server crash if progress was evicted (30-min TTL) or never created.
**Fix**: Add null check with fallback or create progress if missing.
**Status**: ✅ FIXED

### BUG-003: Infinite loop potential in SSE stream
**File**: `app/veo/page.tsx:889`
**Issue**: While loop continues if reader.read() returns `{done: false, value: undefined}` repeatedly.
```typescript
while (true) {
  const { done, value } = await reader.read();
  if (done) break; // Only exits on done=true
  // If value is undefined but done=false, loop continues forever
```
**Impact**: Browser tab freeze, memory exhaustion.
**Fix**: Add check for empty/undefined value with consecutive counter.
**Status**: ✅ FIXED

---

## 🟠 HIGH - Fix Now

### BUG-004: canResumeProgress excludes Direct mode jobs
**File**: `lib/veo/progress.ts:277-284`
**Issue**: Function requires `scriptText` which Direct mode jobs don't have.
```typescript
export function canResumeProgress(progress: VeoProgress | null): boolean {
  // ...
  return (
    // ...
    !!progress.scriptText // Direct mode has no script
  );
}
```
**Impact**: Direct mode jobs can never be resumed via this check - they show as resumable but fail.
**Fix**: Make scriptText optional or use different resume detection for Direct mode.
**Status**: ✅ FIXED

### BUG-005: Audio settings hardcoded in handleResumeYes
**File**: `app/veo/page.tsx:1046-1050`
**Issue**: Resume hardcodes audio settings instead of using saved values.
```typescript
audio: {
  voiceLanguage: resumeData.voice,
  music: true,        // Hardcoded!
  soundEffects: true, // Hardcoded!
  environmentalAudio: true, // Hardcoded!
},
```
**Impact**: User's disabled audio layers get re-enabled on resume.
**Fix**: Save and restore full AudioSettings in resume data.
**Status**: ✅ FIXED

### BUG-006: Phase 1 timeout doesn't emit error log
**File**: `app/api/veo/route.ts:779-783`
**Issue**: When Phase 1 times out, the pending log entry stays "SENDING" forever.
```typescript
const phase1Timeout = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Phase 1 character extraction timed out")), PHASE1_TIMEOUT_MS);
});
// No logUpdate emitted on timeout
```
**Impact**: UI shows "SENDING" indefinitely for timed-out requests.
**Fix**: Emit logUpdate with error status in catch block.
**Status**: ✅ FIXED

### BUG-007: Unhandled promise rejection in handleJobsChange
**File**: `app/veo/page.tsx:1236-1241`
**Issue**: Promise rejection is unhandled if getCachedJobList throws.
```typescript
const handleJobsChange = useCallback(() => {
  getCachedJobList().then(jobs => setHasHistory(jobs.length > 0));
  // No .catch() handler
}, []);
```
**Impact**: Unhandled promise rejection warning, potential state corruption.
**Fix**: Add `.catch()` handler.
**Status**: ✅ FIXED

---

## 🟡 MEDIUM - Flag with TODO

### BUG-008: No validation for resumeFromBatch bounds
**File**: `app/api/veo/route.ts:182`
**Issue**: Zod schema validates `resumeFromBatch >= 0` but not `< totalBatches`.
```typescript
resumeFromBatch: z.number().int().min(0).optional(), // No max validation
```
**Impact**: Attempting to resume from batch 100 on a 5-batch job.
**Workaround**: Server-side validation before processing.

### BUG-009: SSE buffer edge case
**File**: `app/veo/page.tsx:905-910`
**Issue**: If stream ends exactly at `\n\n` boundary, remaining buffer may be empty string.
```typescript
if (buffer.trim()) { // Empty buffer skips processing
  // Final event could be lost
}
```
**Impact**: Rare - final complete event could be missed.
**Workaround**: Already mitigated by BUG #27 fix (100ms delay before close).

### BUG-010: deepMerge doesn't handle arrays
**File**: `app/veo/page.tsx:713-734`
**Issue**: Arrays are overwritten instead of merged in character registry deep merge.
```typescript
if (!Array.isArray(targetVal) && !Array.isArray(sourceVal)) {
  // Arrays skip this branch and get overwritten
```
**Impact**: Character variations array could lose data from previous batches.
**Note**: Current data structure rarely uses arrays in CharacterSkeleton.

### BUG-011: extractVideoId inconsistent null handling
**Files**: Multiple
**Issue**: Some callers use `|| ""`, some use `?? ""`, some use `?? undefined`.
**Impact**: Inconsistent empty string vs undefined vs null handling.

### BUG-012: Missing retry count in error log
**File**: `app/api/veo/route.ts:1034-1058`
**Issue**: Error logUpdate doesn't include actual retry count from the failed request.
```typescript
timing: { durationMs: 0, retries: 0 }, // Always 0
```
**Impact**: Debugging difficulty - can't see how many retries occurred before failure.

### BUG-013: Color profile confidence hardcoded
**Files**: `app/veo/page.tsx:445`, `app/veo/page.tsx:1139`
**Issue**: Cached profile confidence is hardcoded to 0.8 instead of saved value.
```typescript
setColorProfileConfidence(0.8); // Default for cached profiles
```
**Impact**: Minor - confidence display is inaccurate for resumed jobs.

---

## 🟢 LOW - Note for Later

### BUG-014: Magic numbers scattered
**Files**: Multiple
**Issue**: Numbers like `0.8`, `100`, `5000` appear without constants.

### BUG-015: Inconsistent error message sources
**Files**: Multiple
**Issue**: Some errors use lang translations, some use raw API messages.

### BUG-016: Duplicate setCachedJob structures
**File**: `app/veo/page.tsx`
**Issue**: Multiple setCachedJob calls with similar but different structures.

### BUG-017: TypeScript any types
**File**: `app/veo/page.tsx:413`
**Issue**: `existingColorProfile?: any` could be typed as `CinematicProfile`.

---

## Fixes Applied

### FIX-001: Negative completedBatches (BUG-001)
```typescript
// Before
completedBatches: batch - 1,

// After
completedBatches: Math.max(0, batch - 1),
```

### FIX-002: Null check in processSceneBatch (BUG-002)
```typescript
// Before
const updatedProgress = updateProgressAfterBatch(
  serverProgress.get(jobId)!,  // Unsafe
  batchScenes,
  stringCharacters
);

// After
const currentProgress = serverProgress.get(jobId);
if (!currentProgress) {
  // Log warning but continue - batch still processed
  console.warn(`[VEO] Progress not found for job ${jobId}, skipping progress update`);
  return { scenes: updatedScenes, characterRegistry: updatedCharacters, newCharactersCount };
}
const updatedProgress = updateProgressAfterBatch(currentProgress, batchScenes, stringCharacters);
```

### FIX-003: Infinite loop protection (BUG-003)
```typescript
// Added consecutive empty read counter
let consecutiveEmptyReads = 0;
const MAX_CONSECUTIVE_EMPTY_READS = 10;

while (true) {
  const { done, value } = await reader.read();

  if (done) break;

  // Protect against infinite loop from empty reads
  if (!value || value.length === 0) {
    consecutiveEmptyReads++;
    if (consecutiveEmptyReads >= MAX_CONSECUTIVE_EMPTY_READS) {
      console.error('[VEO] Too many consecutive empty reads, aborting stream');
      reader.cancel();
      handleError("NETWORK_ERROR", "Stream returned too many empty responses");
      break;
    }
    continue;
  }
  consecutiveEmptyReads = 0; // Reset on successful read
  // ... rest of processing
}
```

### FIX-004: Direct mode resume support (BUG-004)
```typescript
// 1. Make scriptText optional in VeoResumeData interface (lib/veo/types.ts)
export interface VeoResumeData {
  scriptText?: string; // Optional for Direct mode (url-to-scenes workflow)
  // ...
}

// 2. Remove scriptText requirement in canResumeProgress (lib/veo/progress.ts)
export function canResumeProgress(progress: VeoProgress | null): boolean {
  return (
    progress.status === "in_progress" &&
    progress.completedBatches > 0 &&
    progress.completedBatches < progress.totalBatches
    // scriptText is optional for Direct mode
  );
}

// 3. Update getResumeData to work without scriptText (lib/veo/progress.ts)
// Removed !progress.scriptText check from return null condition

// 4. Update handleResumeYes to detect workflow from scriptText presence (app/veo/page.tsx)
const isDirectMode = !resumeData.scriptText;
const workflow = isDirectMode ? "url-to-scenes" : "script-to-scenes";
```

### FIX-005: Audio settings in handleResumeYes (BUG-005)
```typescript
// Restore audio settings from VeoProgress if available
// VeoProgress now includes audioSettings field
```

### FIX-006: Phase 1 timeout log update (BUG-006)
```typescript
// In catch block for Phase 1 timeout, emit logUpdate
if (onLogUpdate) {
  onLogUpdate({
    id: logId,
    status: "completed",
    error: { type: "TIMEOUT", message: error.message },
    // ... rest of fields
  });
}
```

### FIX-007: Unhandled promise rejection in handleJobsChange (BUG-007)
```typescript
// Before
getCachedJobList().then(jobs => setHasHistory(jobs.length > 0));

// After
getCachedJobList()
  .then(jobs => setHasHistory(jobs.length > 0))
  .catch(err => console.warn('[VEO] Failed to refresh job list:', err));
```

---

## Recommendations

1. **Add integration tests** for resume flow covering Direct and Hybrid modes
2. **Add E2E tests** for SSE stream interruption and resume scenarios
3. **Implement centralized error boundary** with retry logic
4. **Add telemetry** for monitoring retry rates and timeout frequency
5. **Consider WebSocket** instead of SSE for better connection management

---

*Report generated by Claude (Paranoid Senior Engineer Mode)*
