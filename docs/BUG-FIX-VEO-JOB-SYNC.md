# VEO Job Sync Issue - Bug Fix

## Issue Description

When clicking on jobs from the history tab, jobs would lose their sync status and display a "Sync" button even though they were previously marked as "Synced". This created confusion and suggested that the job data was out of sync between local and cloud storage.

## Root Cause

The issue was in `/lib/veo/cache-remote.ts` in the `getCachedJob()` function.

### The Problem

1. **Two different behaviors**:
   - `getCachedJobList()` - Used by history panel to display all jobs
     - Has smart conflict resolution logic
     - Merges local and cloud jobs
     - Prefers the most complete version (completed > partial > failed > in_progress)

   - `getCachedJob()` - Used when viewing a specific job
     - **NO conflict resolution**
     - Simply returned the cloud version if available
     - Only used localStorage as fallback on error

2. **The mismatch**:
   - History panel shows "Synced" because `getCachedJobList()` picked the cloud version
   - When user clicks job, `getCachedJob()` loads cloud version (which might be stale)
   - If local version was actually better, the UI would show "local" status (needs sync)
   - This created the appearance that "the job lost sync"

## The Fix

Added conflict resolution logic to `getCachedJob()` that mirrors `getCachedJobList()`:

```typescript
// Before: Just returned cloud job
const cloudJob = data.job || null;
return cloudJob;

// After: Conflict resolution
const localJob = localCache.getCachedJobLocal(jobId);
const cloudJob = data.job || null;

// Compare using priority rules:
// 1) Status: completed > partial > failed > in_progress
// 2) Scene count: more scenes = more complete
// 3) Timestamp: more recent = better

const bestJob = /* conflict resolution logic */;
return bestJob;
```

### Priority Rules

The conflict resolution uses the same priority logic as `getCachedJobList()`:

1. **Status priority**:
   - completed (4) > partial (3) > failed (2) > in_progress (1)

2. **Scene count** (if same status):
   - More scenes = more complete job

3. **Timestamp** (if same status and scene count):
   - More recent = better

## Files Changed

- `/lib/veo/cache-remote.ts`
  - Modified `getCachedJob()` function (lines 289-340)
  - Added conflict resolution between local and cloud versions
  - Ensures consistent behavior with `getCachedJobList()`

## Testing

To verify the fix:

1. Create a job and let it complete
2. Ensure it syncs to cloud (shows "Synced" badge)
3. Click on the job to view it
4. Verify the job still shows "Synced" status
5. Verify no "Sync" button appears unexpectedly

## Impact

- **Before**: Jobs would appear to lose sync status after being clicked
- **After**: Jobs maintain consistent sync status across list and detail views
- **Side effect**: Better conflict resolution when local and cloud versions differ

## Related Issues

This fix also improves robustness when:
- Network is unreliable (cloud fetch fails)
- Local job is more recent than cloud (e.g., completed locally but cloud not updated yet)
- Jobs are modified while viewing them

## Technical Notes

The fix doesn't immediately sync the better version back to cloud to avoid blocking the UI. The sync will happen naturally on the next `setCachedJob()` call.

This approach:
- ✅ Doesn't block user interaction
- ✅ Doesn't create infinite sync loops
- ✅ Eventually consistent
- ✅ Preserves local changes until next write

---

**Date**: 2026-02-05
**Author**: Claude Code
**Severity**: Medium (UX confusion, no data loss)
**Status**: Fixed
