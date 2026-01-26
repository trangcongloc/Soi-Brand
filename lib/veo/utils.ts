/**
 * VEO Pipeline - Utility functions
 */

import { TimeRange } from "./types";

/**
 * Extract video ID from YouTube URL
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/
 */
export function extractVideoId(url: string): string {
  const match = url.match(/(?:v=|\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "unknown";
}

/**
 * Validate YouTube URL format
 */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
  ];
  return patterns.some((p) => p.test(url));
}

/**
 * Sanitize string for use in folder/file names
 */
export function sanitizeForFolder(str: string, maxLength = 50): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, maxLength);
}

/**
 * Parse duration string (MM:SS or HH:MM:SS) to seconds
 */
export function parseDuration(durationStr: string | undefined): number {
  if (!durationStr) return 0;

  // Handle HH:MM:SS format
  const matchHMS = durationStr.match(/(\d+):(\d+):(\d+)/);
  if (matchHMS) {
    return (
      parseInt(matchHMS[1], 10) * 3600 +
      parseInt(matchHMS[2], 10) * 60 +
      parseInt(matchHMS[3], 10)
    );
  }

  // Handle MM:SS format
  const matchMS = durationStr.match(/(\d+):(\d+)/);
  if (matchMS) {
    return parseInt(matchMS[1], 10) * 60 + parseInt(matchMS[2], 10);
  }

  return 0;
}

/**
 * Format seconds to MM:SS string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Format seconds to HH:MM:SS string (for longer durations)
 */
export function formatTimeLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Generate time ranges for batched processing
 * @param totalSeconds - Total duration in seconds
 * @param chunkSeconds - Chunk size in seconds
 * @param secondsPerScene - Seconds per scene (default: 8 for VEO)
 */
export function generateTimeRanges(
  totalSeconds: number,
  chunkSeconds: number,
  secondsPerScene = 8
): TimeRange[] {
  const ranges: TimeRange[] = [];

  for (let start = 0; start < totalSeconds; start += chunkSeconds) {
    const end = Math.min(start + chunkSeconds, totalSeconds);
    ranges.push({
      start,
      end,
      range: `${formatTime(start)}-${formatTime(end)}`,
      sceneCount: Math.ceil((end - start) / secondsPerScene),
    });
  }

  return ranges;
}

/**
 * Validate positive integer
 */
export function validatePositiveInt(
  value: unknown,
  defaultVal: number,
  name: string
): number {
  const num = parseInt(String(value), 10);
  if (isNaN(num) || num <= 0) {
    if (value !== undefined && value !== null && value !== "") {
      console.warn(`Invalid ${name}: "${value}", using default: ${defaultVal}`);
    }
    return defaultVal;
  }
  return num;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `veo_${timestamp}_${random}`;
}

/**
 * Get voice label for display
 */
export function getVoiceLabel(voice: string): string {
  if (voice === "no-voice") return "Silent (no voice)";
  return voice.charAt(0).toUpperCase() + voice.slice(1);
}

/**
 * Calculate estimated processing time based on scene count and mode
 * Returns time in seconds
 */
export function estimateProcessingTime(
  sceneCount: number,
  mode: "direct" | "hybrid",
  batchSize = 10
): number {
  if (mode === "direct") {
    // Direct mode: ~30-60 seconds for any size
    return Math.max(30, Math.min(sceneCount * 1.5, 120));
  }

  // Hybrid mode: ~30s per batch + 2s delay between batches
  const batches = Math.ceil(sceneCount / batchSize);
  return batches * 35 + (batches - 1) * 2;
}

/**
 * Format processing time for display
 */
export function formatProcessingTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Extract thumbnail URL from YouTube video ID
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: "default" | "medium" | "high" | "maxres" = "medium"
): string {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    maxres: "maxresdefault",
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
