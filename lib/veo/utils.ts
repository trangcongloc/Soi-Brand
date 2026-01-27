/**
 * VEO Pipeline - Utility functions
 */

import { TimeRange } from "./types";
import { logger } from "@/lib/logger";

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
 * Parse duration string to seconds
 * Supports formats: MM:SS, HH:MM:SS, "X minutes", "Xm Ys", "X min Y sec", plain seconds
 */
export function parseDuration(durationStr: string | undefined): number {
  if (!durationStr) return 0;

  const str = durationStr.trim().toLowerCase();

  // Handle HH:MM:SS format
  const matchHMS = str.match(/(\d+):(\d+):(\d+)/);
  if (matchHMS) {
    return (
      parseInt(matchHMS[1], 10) * 3600 +
      parseInt(matchHMS[2], 10) * 60 +
      parseInt(matchHMS[3], 10)
    );
  }

  // Handle MM:SS format
  const matchMS = str.match(/(\d+):(\d+)/);
  if (matchMS) {
    return parseInt(matchMS[1], 10) * 60 + parseInt(matchMS[2], 10);
  }

  // Handle text formats: "X hours Y minutes Z seconds" or variations
  let totalSeconds = 0;

  // Extract hours
  const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (hourMatch) {
    totalSeconds += parseFloat(hourMatch[1]) * 3600;
  }

  // Extract minutes
  const minMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/);
  if (minMatch) {
    totalSeconds += parseFloat(minMatch[1]) * 60;
  }

  // Extract seconds
  const secMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/);
  if (secMatch) {
    totalSeconds += parseFloat(secMatch[1]);
  }

  if (totalSeconds > 0) {
    return Math.round(totalSeconds);
  }

  // Handle plain number (assume seconds if small, minutes if larger)
  const plainNum = parseFloat(str);
  if (!isNaN(plainNum) && plainNum > 0) {
    // If number is > 300, assume it's seconds; otherwise assume minutes
    return plainNum > 300 ? Math.round(plainNum) : Math.round(plainNum * 60);
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
      logger.warn(`Invalid ${name}: "${value}", using default: ${defaultVal}`);
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

/**
 * Clean script text by removing caption timestamp artifacts
 * Gemini sometimes includes on-screen caption timestamps when analyzing videos
 * This removes patterns like: "00:00 00:01 00:05" or inline "10:24 text 10:32"
 */
export function cleanScriptText(text: string): string {
  if (!text) return "";

  // Remove sequences of standalone timestamps (e.g., "00:00 00:01 00:05 00:08")
  // These are caption timing markers that got extracted from video overlays
  let cleaned = text.replace(
    /(?:^|\s)(?:\d{1,2}:\d{2}(?:\s+|$)){2,}/gm,
    " "
  );

  // Remove inline timestamps that appear before/after content
  // Pattern: timestamp followed by text, then another timestamp
  // e.g., "10:24 Super! 10:32" -> "Super!"
  cleaned = cleaned.replace(
    /\b\d{1,2}:\d{2}\b\s*(?=[A-Za-z\u0080-\uFFFF])/g,
    ""
  );

  // Remove trailing timestamps at end of sentences/phrases
  cleaned = cleaned.replace(/\s+\d{1,2}:\d{2}\s*(?=\s|$)/g, " ");

  // Remove any remaining orphan timestamp sequences
  cleaned = cleaned.replace(/(?:^|\s)\d{1,2}:\d{2}(?:\s+\d{1,2}:\d{2})+/gm, " ");

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // If the result is mostly timestamps (very short after cleaning), log warning
  if (cleaned.length < text.length * 0.3 && text.length > 100) {
    logger.warn("Script text heavily contaminated with timestamps", {
      originalLength: text.length,
      cleanedLength: cleaned.length,
    });
  }

  return cleaned;
}
