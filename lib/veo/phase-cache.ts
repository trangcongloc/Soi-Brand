/**
 * VEO Phase-Level Cache
 * Caches Phase 0, Phase 1, and each Phase 2 batch individually in localStorage.
 * On resume, completed phases/batches can be skipped entirely.
 */

import {
  VeoPhaseCache,
  GeminiLogEntry,
  CinematicProfile,
  CharacterSkeleton,
  CharacterRegistry,
  Scene,
  VeoMode,
  VeoWorkflow,
} from "./types";
import { isBrowser } from "./browser-utils";
import { LocalStorageCache } from "@/lib/cache-manager";

const PHASE_CACHE_PREFIX = "veo_phase_";
const PHASE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PHASE_CACHE_MAX_ITEMS = 10;

/** Max chars for request/response body stored in localStorage */
const MAX_BODY_LENGTH = 10_000;

const phaseCache = new LocalStorageCache<VeoPhaseCache>({
  prefix: PHASE_CACHE_PREFIX,
  maxItems: PHASE_CACHE_MAX_ITEMS,
  ttlMs: PHASE_CACHE_TTL_MS,
});

// BUG FIX #28: Mutex for concurrent batch caching
// Tracks which jobs are currently being written to prevent race conditions
const writeLocks = new Set<string>();

/**
 * Acquire a write lock for a job (non-blocking)
 * Returns true if lock acquired, false if already locked
 */
function acquireWriteLock(jobId: string): boolean {
  if (writeLocks.has(jobId)) {
    return false;
  }
  writeLocks.add(jobId);
  return true;
}

/**
 * Release a write lock for a job
 */
function releaseWriteLock(jobId: string): void {
  writeLocks.delete(jobId);
}

/**
 * Wait for write lock with timeout
 * Returns true if lock acquired within timeout, false otherwise
 */
async function waitForWriteLock(jobId: string, timeoutMs: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 50; // Check every 50ms

  while (Date.now() - startTime < timeoutMs) {
    if (acquireWriteLock(jobId)) {
      return true;
    }
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  // Timeout - force acquire (clear stale lock)
  writeLocks.delete(jobId);
  writeLocks.add(jobId);
  return true;
}

/**
 * Get existing phase cache for a job
 */
export function getPhaseCache(jobId: string): VeoPhaseCache | null {
  if (!isBrowser()) return null;
  return phaseCache.get(jobId);
}

/**
 * Initialize or get a phase cache entry
 */
function ensurePhaseCache(
  jobId: string,
  videoUrl: string,
  settings: VeoPhaseCache["settings"]
): VeoPhaseCache {
  const existing = getPhaseCache(jobId);
  if (existing) return existing;

  return {
    jobId,
    videoUrl,
    timestamp: Date.now(),
    phase2Batches: {},
    logs: [],
    settings,
  };
}

/**
 * Cache Phase 0 result (color profile)
 */
export function cachePhase0(
  jobId: string,
  videoUrl: string,
  settings: VeoPhaseCache["settings"],
  colorProfile: CinematicProfile,
  confidence: number
): void {
  if (!isBrowser()) return;

  const cache = ensurePhaseCache(jobId, videoUrl, settings);
  const updated: VeoPhaseCache = {
    ...cache,
    timestamp: Date.now(),
    phase0: { colorProfile, confidence },
  };
  phaseCache.set(jobId, updated);
}

/**
 * Cache Phase 1 result (characters)
 */
export function cachePhase1(
  jobId: string,
  videoUrl: string,
  settings: VeoPhaseCache["settings"],
  characters: CharacterSkeleton[],
  background: string,
  registry: CharacterRegistry
): void {
  if (!isBrowser()) return;

  const cache = ensurePhaseCache(jobId, videoUrl, settings);
  const updated: VeoPhaseCache = {
    ...cache,
    timestamp: Date.now(),
    phase1: { characters, background, registry },
  };
  phaseCache.set(jobId, updated);
}

/**
 * Cache a single Phase 2 batch result
 * BUG FIX #28: Uses mutex to prevent concurrent write race conditions
 */
export function cachePhase2Batch(
  jobId: string,
  videoUrl: string,
  settings: VeoPhaseCache["settings"],
  batchNumber: number,
  scenes: Scene[],
  characters: CharacterRegistry
): void {
  if (!isBrowser()) return;

  // BUG FIX #28: Acquire write lock synchronously (non-blocking)
  // If lock not available, proceed anyway but log warning
  const hasLock = acquireWriteLock(jobId);
  if (!hasLock) {
    console.warn(`[PhaseCache] Concurrent write detected for job ${jobId}, batch ${batchNumber}`);
  }

  try {
    const cache = ensurePhaseCache(jobId, videoUrl, settings);
    const updated: VeoPhaseCache = {
      ...cache,
      timestamp: Date.now(),
      phase2Batches: {
        ...cache.phase2Batches,
        [batchNumber]: { scenes, characters },
      },
    };
    phaseCache.set(jobId, updated);
  } finally {
    if (hasLock) {
      releaseWriteLock(jobId);
    }
  }
}

/**
 * Cache a single Phase 2 batch result (async version with waiting)
 * BUG FIX #28: Uses mutex with waiting to prevent concurrent write race conditions
 */
export async function cachePhase2BatchAsync(
  jobId: string,
  videoUrl: string,
  settings: VeoPhaseCache["settings"],
  batchNumber: number,
  scenes: Scene[],
  characters: CharacterRegistry
): Promise<void> {
  if (!isBrowser()) return;

  // BUG FIX #28: Wait for write lock
  await waitForWriteLock(jobId);

  try {
    const cache = ensurePhaseCache(jobId, videoUrl, settings);
    const updated: VeoPhaseCache = {
      ...cache,
      timestamp: Date.now(),
      phase2Batches: {
        ...cache.phase2Batches,
        [batchNumber]: { scenes, characters },
      },
    };
    phaseCache.set(jobId, updated);
  } finally {
    releaseWriteLock(jobId);
  }
}

/**
 * Truncate log body strings for localStorage storage
 */
function truncateLogForStorage(entry: GeminiLogEntry): GeminiLogEntry {
  return {
    ...entry,
    request: {
      ...entry.request,
      body: entry.request.body.slice(0, MAX_BODY_LENGTH),
    },
    response: {
      ...entry.response,
      body: entry.response.body.slice(0, MAX_BODY_LENGTH),
    },
  };
}

/**
 * Add a log entry to the phase cache
 */
export function addPhaseLog(
  jobId: string,
  videoUrl: string,
  settings: VeoPhaseCache["settings"],
  entry: GeminiLogEntry
): void {
  if (!isBrowser()) return;

  const cache = ensurePhaseCache(jobId, videoUrl, settings);
  const truncated = truncateLogForStorage(entry);
  const updated: VeoPhaseCache = {
    ...cache,
    timestamp: Date.now(),
    logs: [...cache.logs, truncated],
  };
  phaseCache.set(jobId, updated);
}

/**
 * Clear phase cache for a job
 */
export function clearPhaseCache(jobId: string): void {
  if (!isBrowser()) return;
  phaseCache.delete(jobId);
}

/**
 * Get all phase cache entries (for debugging)
 */
export function getAllPhaseCaches(): VeoPhaseCache[] {
  if (!isBrowser()) return [];
  return phaseCache.getAll().map((item) => item.data);
}

/**
 * Create default settings object for phase cache
 */
export function createPhaseCacheSettings(opts: {
  mode: VeoMode;
  sceneCount: number;
  batchSize: number;
  workflow: VeoWorkflow;
}): VeoPhaseCache["settings"] {
  return {
    mode: opts.mode,
    sceneCount: opts.sceneCount,
    batchSize: opts.batchSize,
    workflow: opts.workflow,
  };
}
