/**
 * API Quota Tracking
 * Tracks YouTube Data API and Gemini API usage with auto-reset logic
 */

import { GeminiModel, ApiQuotaUsage } from "./types";
import { getModelInfo } from "./geminiModels";

const STORAGE_KEY = 'soibrand_api_quota';
const YOUTUBE_DAILY_QUOTA = 10000;
const DEFAULT_GEMINI_RPM = 2; // Default to most restrictive free tier
const YOUTUBE_COST_PER_ANALYSIS = 103; // Channel search (100) + info (1) + playlist (1) + video (1)

/**
 * Initialize quota structure with defaults
 */
export function initializeQuotaUsage(model?: GeminiModel, tier?: "free" | "paid"): ApiQuotaUsage {
  const now = new Date().toISOString();

  // Get model-specific RPM and RPD limits
  let rpmLimit = DEFAULT_GEMINI_RPM;
  let rpdLimit = 0;
  if (model) {
    const modelInfo = getModelInfo(model);
    if (modelInfo) {
      const rpm = tier === 'paid' ? modelInfo.rpmPaid : modelInfo.rpmFree;
      const rpd = tier === 'paid' ? modelInfo.rpdPaid : modelInfo.rpdFree;
      if (rpm !== undefined) {
        rpmLimit = rpm;
      }
      if (rpd !== undefined) {
        rpdLimit = rpd;
      }
    }
  }

  return {
    youtube: {
      used: 0,
      total: YOUTUBE_DAILY_QUOTA,
      lastReset: now,
    },
    gemini: {
      requestsUsed: 0,
      requestsTotal: rpmLimit,
      requestsUsedDaily: 0,
      requestsTotalDaily: rpdLimit,
      lastReset: now,
      lastResetDaily: now,
      model,
      tier,
    },
    lastUpdated: now,
  };
}

/**
 * Get quota usage from localStorage
 */
export function getQuotaUsage(): ApiQuotaUsage {
  if (typeof window === 'undefined') {
    return initializeQuotaUsage();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initial = initializeQuotaUsage();
      saveQuotaUsage(initial);
      return initial;
    }

    const parsed = JSON.parse(stored) as ApiQuotaUsage;

    // Initialize missing fields for backward compatibility
    if (parsed.gemini.requestsUsedDaily === undefined) {
      parsed.gemini.requestsUsedDaily = 0;
    }
    if (parsed.gemini.requestsTotalDaily === undefined) {
      parsed.gemini.requestsTotalDaily = 0;
    }
    if (parsed.gemini.lastResetDaily === undefined) {
      parsed.gemini.lastResetDaily = new Date().toISOString();
    }

    // Check if YouTube quota should reset (midnight PT)
    if (shouldResetYouTubeQuota(parsed.youtube.lastReset)) {
      parsed.youtube.used = 0;
      parsed.youtube.lastReset = new Date().toISOString();
    }

    // Check if Gemini quota should reset (every minute)
    if (shouldResetGeminiQuota(parsed.gemini.lastReset)) {
      parsed.gemini.requestsUsed = 0;
      parsed.gemini.lastReset = new Date().toISOString();
    }

    // Check if Gemini daily quota should reset (every 24 hours)
    if (shouldResetGeminiDailyQuota(parsed.gemini.lastResetDaily)) {
      parsed.gemini.requestsUsedDaily = 0;
      parsed.gemini.lastResetDaily = new Date().toISOString();
    }

    parsed.lastUpdated = new Date().toISOString();
    saveQuotaUsage(parsed);

    return parsed;
  } catch (error) {
    console.error('Failed to parse quota usage:', error);
    const initial = initializeQuotaUsage();
    saveQuotaUsage(initial);
    return initial;
  }
}

/**
 * Save quota usage to localStorage
 */
export function saveQuotaUsage(usage: ApiQuotaUsage): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.error('Failed to save quota usage:', error);
  }
}

/**
 * Check if YouTube quota should reset (midnight PT)
 */
export function shouldResetYouTubeQuota(lastResetISO: string): boolean {
  const lastReset = new Date(lastResetISO);
  const now = new Date();

  // Convert to Pacific Time
  const ptOffset = -8 * 60; // PT is UTC-8 (standard time)
  const lastResetPT = new Date(lastReset.getTime() + (lastReset.getTimezoneOffset() + ptOffset) * 60000);
  const nowPT = new Date(now.getTime() + (now.getTimezoneOffset() + ptOffset) * 60000);

  // Check if we've crossed midnight PT
  return (
    lastResetPT.getDate() !== nowPT.getDate() ||
    lastResetPT.getMonth() !== nowPT.getMonth() ||
    lastResetPT.getFullYear() !== nowPT.getFullYear()
  );
}

/**
 * Check if Gemini quota should reset (every minute)
 */
export function shouldResetGeminiQuota(lastResetISO: string): boolean {
  const lastReset = new Date(lastResetISO);
  const now = new Date();

  // Reset if more than 60 seconds have passed
  return now.getTime() - lastReset.getTime() >= 60000;
}

/**
 * Check if Gemini daily quota should reset (every 24 hours)
 */
export function shouldResetGeminiDailyQuota(lastResetISO: string): boolean {
  const lastReset = new Date(lastResetISO);
  const now = new Date();

  // Reset if more than 24 hours have passed
  return now.getTime() - lastReset.getTime() >= 86400000; // 24 hours in milliseconds
}

/**
 * Update YouTube quota usage
 */
export function updateYouTubeQuota(cost: number = YOUTUBE_COST_PER_ANALYSIS): ApiQuotaUsage {
  const usage = getQuotaUsage();
  usage.youtube.used += cost;
  usage.lastUpdated = new Date().toISOString();
  saveQuotaUsage(usage);
  return usage;
}

/**
 * Update Gemini quota usage (both RPM and RPD)
 */
export function updateGeminiQuota(): ApiQuotaUsage {
  const usage = getQuotaUsage();
  usage.gemini.requestsUsed += 1;
  usage.gemini.requestsUsedDaily = (usage.gemini.requestsUsedDaily || 0) + 1;
  usage.lastUpdated = new Date().toISOString();
  saveQuotaUsage(usage);
  return usage;
}

/**
 * Get quota percentage for a provider
 */
export function getQuotaPercentage(provider: 'youtube' | 'gemini'): number {
  const usage = getQuotaUsage();

  if (provider === 'youtube') {
    return Math.round((usage.youtube.used / usage.youtube.total) * 100);
  } else {
    return Math.round((usage.gemini.requestsUsed / usage.gemini.requestsTotal) * 100);
  }
}

/**
 * Get color based on quota percentage
 */
export function getQuotaColor(percentage: number): string {
  if (percentage >= 90) return '#ef4444'; // Red
  if (percentage >= 70) return '#f59e0b'; // Yellow
  return '#22c55e'; // Green
}

/**
 * Update Gemini quota limits based on model and tier
 */
export function updateGeminiQuotaLimits(model: GeminiModel, tier: "free" | "paid"): ApiQuotaUsage {
  const usage = getQuotaUsage();

  // Get model-specific RPM and RPD limits
  const modelInfo = getModelInfo(model);
  let rpmLimit = DEFAULT_GEMINI_RPM;
  let rpdLimit = 0;

  if (modelInfo) {
    const rpm = tier === 'paid' ? modelInfo.rpmPaid : modelInfo.rpmFree;
    const rpd = tier === 'paid' ? modelInfo.rpdPaid : modelInfo.rpdFree;
    if (rpm !== undefined) {
      rpmLimit = rpm;
    }
    if (rpd !== undefined) {
      rpdLimit = rpd;
    }
  }

  // Update Gemini quota limits
  usage.gemini.requestsTotal = rpmLimit;
  usage.gemini.requestsTotalDaily = rpdLimit;
  usage.gemini.model = model;
  usage.gemini.tier = tier;
  usage.lastUpdated = new Date().toISOString();

  saveQuotaUsage(usage);
  return usage;
}

/**
 * Reset all quota (for testing/admin purposes)
 */
export function resetAllQuota(): void {
  const initial = initializeQuotaUsage();
  saveQuotaUsage(initial);
}
