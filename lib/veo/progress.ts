/**
 * VEO Pipeline - Progress tracking for resumable jobs
 */

import {
  VeoProgress,
  VeoResumeData,
  Scene,
  CharacterRegistry,
  VeoMode,
  VoiceLanguage,
} from "./types";
import { logger } from "@/lib/logger";
import { isBrowser } from "./browser-utils";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "./storage-utils";

const PROGRESS_KEY = "veo_progress_current";

/**
 * Load progress from storage
 */
export function loadProgress(): VeoProgress | null {
  if (!isBrowser()) return null;

  try {
    return getStorageItem<VeoProgress | null>(PROGRESS_KEY, null);
  } catch {
    return null;
  }
}

/**
 * Save progress to storage
 */
export function saveProgress(progress: VeoProgress): void {
  if (!isBrowser()) return;

  try {
    setStorageItem(PROGRESS_KEY, progress);
  } catch (error) {
    logger.error("Error saving VEO progress", error);
  }
}

/**
 * Clear progress from storage
 */
export function clearProgress(): void {
  if (!isBrowser()) return;
  removeStorageItem(PROGRESS_KEY);
}

/**
 * Check if progress exists
 */
export function hasProgress(): boolean {
  if (!isBrowser()) return false;
  return getStorageItem<VeoProgress | null>(PROGRESS_KEY, null) !== null;
}

/**
 * Create initial progress object
 */
export function createProgress(options: {
  jobId: string;
  mode: VeoMode;
  youtubeUrl: string;
  videoId: string;
  sceneCount: number;
  batchSize: number;
  voiceLang: VoiceLanguage;
  totalBatches: number;
  scriptText?: string;
}): VeoProgress {
  return {
    ...options,
    completedBatches: 0,
    characterRegistry: {},
    scenes: [],
    lastUpdated: new Date().toISOString(),
    status: "pending",
    scriptText: options.scriptText,
  };
}

/**
 * Update progress after batch completion
 */
export function updateProgressAfterBatch(
  progress: VeoProgress,
  batchScenes: Scene[],
  newCharacters: CharacterRegistry
): VeoProgress {
  return {
    ...progress,
    completedBatches: progress.completedBatches + 1,
    scenes: [...progress.scenes, ...batchScenes],
    characterRegistry: { ...progress.characterRegistry, ...newCharacters },
    lastUpdated: new Date().toISOString(),
    status: "in_progress",
  };
}

/**
 * Mark progress as failed
 */
export function markProgressFailed(
  progress: VeoProgress,
  error: string
): VeoProgress {
  return {
    ...progress,
    lastError: error,
    lastUpdated: new Date().toISOString(),
    status: "failed",
  };
}

/**
 * Mark progress as completed
 */
export function markProgressCompleted(progress: VeoProgress): VeoProgress {
  return {
    ...progress,
    lastUpdated: new Date().toISOString(),
    status: "completed",
  };
}

/**
 * Create a progress tracker with auto-save
 */
export function createProgressTracker() {
  return {
    load: loadProgress,
    save: saveProgress,
    clear: clearProgress,
    exists: hasProgress,
    create: createProgress,
    updateAfterBatch: updateProgressAfterBatch,
    markFailed: markProgressFailed,
    markCompleted: markProgressCompleted,
  };
}

/**
 * Server-side progress storage (in-memory for API routes)
 * This is used during SSE streaming to track progress.
 *
 * Includes TTL-based eviction (30 min) and max size cap (100 entries)
 * to prevent unbounded memory growth under load.
 */
const SERVER_PROGRESS_TTL_MS = 30 * 60 * 1000; // 30 minutes
const SERVER_PROGRESS_MAX_SIZE = 100;

const serverProgressMap = new Map<string, { progress: VeoProgress; createdAt: number }>();

function evictExpiredEntries(): void {
  const now = Date.now();
  serverProgressMap.forEach((entry, key) => {
    if (now - entry.createdAt > SERVER_PROGRESS_TTL_MS) {
      serverProgressMap.delete(key);
    }
  });
}

function evictOldestIfFull(): void {
  if (serverProgressMap.size < SERVER_PROGRESS_MAX_SIZE) return;

  // Find and remove the oldest entry
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  serverProgressMap.forEach((entry, key) => {
    if (entry.createdAt < oldestTime) {
      oldestTime = entry.createdAt;
      oldestKey = key;
    }
  });
  if (oldestKey) {
    serverProgressMap.delete(oldestKey);
  }
}

export const serverProgress = {
  get: (jobId: string): VeoProgress | undefined => {
    const entry = serverProgressMap.get(jobId);
    if (!entry) return undefined;
    // Check TTL on read
    if (Date.now() - entry.createdAt > SERVER_PROGRESS_TTL_MS) {
      serverProgressMap.delete(jobId);
      return undefined;
    }
    return entry.progress;
  },
  set: (jobId: string, progress: VeoProgress): void => {
    const existing = serverProgressMap.get(jobId);
    if (existing) {
      // Update in place — preserve original createdAt
      serverProgressMap.set(jobId, { progress, createdAt: existing.createdAt });
    } else {
      evictExpiredEntries();
      evictOldestIfFull();
      serverProgressMap.set(jobId, { progress, createdAt: Date.now() });
    }
  },
  delete: (jobId: string): void => {
    serverProgressMap.delete(jobId);
  },
  has: (jobId: string): boolean => {
    const entry = serverProgressMap.get(jobId);
    if (!entry) return false;
    if (Date.now() - entry.createdAt > SERVER_PROGRESS_TTL_MS) {
      serverProgressMap.delete(jobId);
      return false;
    }
    return true;
  },
  getAll: (): Map<string, VeoProgress> => {
    evictExpiredEntries();
    const result = new Map<string, VeoProgress>();
    serverProgressMap.forEach((entry, key) => {
      result.set(key, entry.progress);
    });
    return result;
  },
  clear: (): void => serverProgressMap.clear(),
};

/**
 * Update progress with script text
 */
export function updateProgressWithScript(
  progress: VeoProgress,
  scriptText: string
): VeoProgress {
  return {
    ...progress,
    scriptText,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get resume data from progress
 * Direct mode jobs don't have scriptText, so it's optional
 */
export function getResumeData(progress: VeoProgress): VeoResumeData | null {
  // Can resume if job is incomplete and has some progress
  if (
    progress.status === "completed" ||
    progress.completedBatches === 0 ||
    progress.completedBatches >= progress.totalBatches
  ) {
    return null;
  }

  return {
    jobId: progress.jobId,
    videoUrl: progress.youtubeUrl,
    scriptText: progress.scriptText, // Optional for Direct mode
    mode: progress.mode,
    sceneCount: progress.sceneCount,
    batchSize: progress.batchSize,
    voice: progress.voiceLang,
    completedBatches: progress.completedBatches,
    totalBatches: progress.totalBatches,
    existingScenes: progress.scenes,
    existingCharacters: progress.characterRegistry,
  };
}

/**
 * Check if progress can be resumed
 * Direct mode jobs don't have scriptText, so we don't require it
 */
export function canResumeProgress(progress: VeoProgress | null): boolean {
  if (!progress) return false;
  return (
    progress.status === "in_progress" &&
    progress.completedBatches > 0 &&
    progress.completedBatches < progress.totalBatches
    // scriptText is optional for Direct mode (url-to-scenes workflow)
  );
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercent(progress: VeoProgress): number {
  if (progress.totalBatches === 0) return 0;
  return Math.round((progress.completedBatches / progress.totalBatches) * 100);
}

/**
 * Get progress status message
 */
export function getProgressMessage(
  progress: VeoProgress,
  lang: "vi" | "en" = "en"
): string {
  const percent = calculateProgressPercent(progress);

  const messages = {
    vi: {
      pending: "Đang chờ xử lý...",
      in_progress: `Đang xử lý: ${progress.completedBatches}/${progress.totalBatches} batches (${percent}%)`,
      completed: `Hoàn thành: ${progress.scenes.length} scenes`,
      failed: `Lỗi tại batch ${progress.completedBatches + 1}: ${progress.lastError}`,
    },
    en: {
      pending: "Waiting to start...",
      in_progress: `Processing: ${progress.completedBatches}/${progress.totalBatches} batches (${percent}%)`,
      completed: `Completed: ${progress.scenes.length} scenes`,
      failed: `Failed at batch ${progress.completedBatches + 1}: ${progress.lastError}`,
    },
  };

  return messages[lang][progress.status];
}
