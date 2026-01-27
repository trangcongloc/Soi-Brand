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

const PROGRESS_KEY = "veo_progress_current";

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Load progress from storage
 */
export function loadProgress(): VeoProgress | null {
  if (!isBrowser()) return null;

  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (!data) return null;
    return JSON.parse(data) as VeoProgress;
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
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    logger.error("Error saving VEO progress", error);
  }
}

/**
 * Clear progress from storage
 */
export function clearProgress(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(PROGRESS_KEY);
}

/**
 * Check if progress exists
 */
export function hasProgress(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(PROGRESS_KEY) !== null;
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
 * This is used during SSE streaming to track progress
 */
const serverProgressMap = new Map<string, VeoProgress>();

export const serverProgress = {
  get: (jobId: string): VeoProgress | undefined => serverProgressMap.get(jobId),
  set: (jobId: string, progress: VeoProgress): void => {
    serverProgressMap.set(jobId, progress);
  },
  delete: (jobId: string): void => {
    serverProgressMap.delete(jobId);
  },
  has: (jobId: string): boolean => serverProgressMap.has(jobId),
  getAll: (): Map<string, VeoProgress> => serverProgressMap,
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
 */
export function getResumeData(progress: VeoProgress): VeoResumeData | null {
  if (
    progress.status === "completed" ||
    !progress.scriptText ||
    progress.completedBatches === 0
  ) {
    return null;
  }

  return {
    jobId: progress.jobId,
    videoUrl: progress.youtubeUrl,
    scriptText: progress.scriptText,
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
 */
export function canResumeProgress(progress: VeoProgress | null): boolean {
  if (!progress) return false;
  return (
    progress.status === "in_progress" &&
    progress.completedBatches > 0 &&
    progress.completedBatches < progress.totalBatches &&
    !!progress.scriptText
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
