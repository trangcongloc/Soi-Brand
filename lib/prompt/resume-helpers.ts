/**
 * Resume Config Helpers
 * Build and read ResumeConfig for partial/failed job recovery.
 * Eliminates 3x copy-pasted resumeData construction in page.tsx.
 */

import type {
  CachedPromptJob,
  ResumeConfig,
  PromptWorkflow,
  PromptMode,
  VoiceLanguage,
  MediaType,
  SceneCountMode,
} from "./types";

interface FormDataForResume {
  workflow: PromptWorkflow;
  mode: PromptMode;
  batchSize: number;
  sceneCount: number;
  audio: { voiceLanguage: VoiceLanguage };
  useVideoTitle: boolean;
  useVideoDescription: boolean;
  useVideoChapters: boolean;
  useVideoCaptions: boolean;
  negativePrompt?: string;
  extractColorProfile: boolean;
  mediaType: MediaType;
  sceneCountMode: SceneCountMode;
  startTime?: string;
  endTime?: string;
  selfieMode?: boolean;
}

/**
 * Build a ResumeConfig from form data and completed batch count.
 * Used when saving in_progress, partial, or failed jobs.
 */
export function buildResumeConfig(
  formData: FormDataForResume,
  completedBatches: number,
  lastInteractionId?: string,
): ResumeConfig {
  return {
    completedBatches,
    workflow: formData.workflow,
    mode: formData.mode,
    batchSize: formData.batchSize,
    sceneCount: formData.sceneCount,
    voice: formData.audio.voiceLanguage,
    useVideoTitle: formData.useVideoTitle,
    useVideoDescription: formData.useVideoDescription,
    useVideoChapters: formData.useVideoChapters,
    useVideoCaptions: formData.useVideoCaptions,
    negativePrompt: formData.negativePrompt,
    extractColorProfile: formData.extractColorProfile,
    mediaType: formData.mediaType,
    sceneCountMode: formData.sceneCountMode,
    startTime: formData.startTime,
    endTime: formData.endTime,
    selfieMode: formData.selfieMode,
    lastInteractionId,
  };
}

/**
 * Read resume config from a cached job, handling both new (resumeConfig)
 * and old (resumeData) formats. Returns null if no resume data exists.
 *
 * Old-format jobs auto-migrate on next save (7-day TTL handles natural expiry).
 */
export function getResumeConfig(job: CachedPromptJob): ResumeConfig | null {
  // Prefer new format
  if (job.resumeConfig) {
    return job.resumeConfig;
  }

  // Fall back to old format (backward compat)
  if (job.resumeData) {
    const rd = job.resumeData;
    return {
      completedBatches: rd.completedBatches,
      workflow: rd.workflow,
      mode: rd.mode,
      batchSize: rd.batchSize,
      sceneCount: rd.sceneCount,
      voice: rd.voice,
      useVideoTitle: rd.useVideoTitle ?? true,
      useVideoDescription: rd.useVideoDescription ?? true,
      useVideoChapters: rd.useVideoChapters ?? true,
      useVideoCaptions: rd.useVideoCaptions ?? true,
      negativePrompt: rd.negativePrompt,
      extractColorProfile: rd.extractColorProfile ?? true,
      mediaType: rd.mediaType ?? "video",
      sceneCountMode: rd.sceneCountMode ?? "auto",
      startTime: rd.startTime,
      endTime: rd.endTime,
      selfieMode: rd.selfieMode,
      lastInteractionId: rd.lastInteractionId,
    };
  }

  return null;
}
