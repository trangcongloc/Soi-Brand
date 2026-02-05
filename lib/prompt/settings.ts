/**
 * Prompt Form Settings Persistence
 * Save/load/defaults for Prompt form preferences across sessions.
 */

import { AudioSettings, PromptFormSettings, VoiceLanguage } from "./types";
import { getStorageItem, setStorageItem } from "./storage-utils";
import { PROMPT_FORM_SETTINGS_KEY, DEFAULT_CONTENT_PACING } from "./constants";
import { getDefaultNegativePrompt } from "./prompts";

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  voiceLanguage: "no-voice",
  music: true,
  soundEffects: true,
  environmentalAudio: true,
};

export function getDefaultPromptFormSettings(): PromptFormSettings {
  return {
    mode: "hybrid",
    sceneCountMode: "auto",
    sceneCount: 40,
    batchSize: 30,
    contentPacing: DEFAULT_CONTENT_PACING,
    audio: { ...DEFAULT_AUDIO_SETTINGS },
    useVideoTitle: true,
    useVideoDescription: true,
    useVideoChapters: true,
    useVideoCaptions: true,
    extractColorProfile: true,
    mediaType: "video",
    negativePrompt: getDefaultNegativePrompt("standard"),
    selfieMode: false,
  };
}

export function loadPromptFormSettings(): PromptFormSettings {
  const defaults = getDefaultPromptFormSettings();
  const saved = getStorageItem<Record<string, unknown>>(PROMPT_FORM_SETTINGS_KEY, {});

  // Migration: convert old `voice` field to new `audio` object
  if ("voice" in saved && !("audio" in saved)) {
    saved.audio = {
      voiceLanguage: saved.voice as VoiceLanguage,
      music: true,
      soundEffects: true,
      environmentalAudio: true,
    };
    delete saved.voice;
    setStorageItem(PROMPT_FORM_SETTINGS_KEY, saved);
  }

  // Migration: convert old `autoSceneCount` boolean to `sceneCountMode`
  if ("autoSceneCount" in saved && !("sceneCountMode" in saved)) {
    saved.sceneCountMode = (saved.autoSceneCount as boolean) ? "auto" : "manual";
    delete saved.autoSceneCount;
    setStorageItem(PROMPT_FORM_SETTINGS_KEY, saved);
  }

  return { ...defaults, ...saved } as PromptFormSettings;
}

export function savePromptFormSettings(settings: PromptFormSettings): void {
  setStorageItem(PROMPT_FORM_SETTINGS_KEY, settings);
}
