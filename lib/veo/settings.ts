/**
 * VEO Form Settings Persistence
 * Save/load/defaults for VEO form preferences across sessions.
 */

import { AudioSettings, VeoFormSettings, VoiceLanguage } from "./types";
import { getStorageItem, setStorageItem } from "./storage-utils";
import { VEO_FORM_SETTINGS_KEY } from "./constants";
import { getDefaultNegativePrompt } from "./prompts";

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  voiceLanguage: "no-voice",
  music: true,
  soundEffects: true,
  environmentalAudio: true,
};

export function getDefaultVeoFormSettings(): VeoFormSettings {
  return {
    mode: "hybrid",
    autoSceneCount: true,
    sceneCount: 40,
    batchSize: 30,
    audio: { ...DEFAULT_AUDIO_SETTINGS },
    useVideoChapters: true,
    extractColorProfile: true,
    mediaType: "video",
    negativePrompt: getDefaultNegativePrompt("standard"),
    selfieMode: false,
  };
}

export function loadVeoFormSettings(): VeoFormSettings {
  const defaults = getDefaultVeoFormSettings();
  const saved = getStorageItem<Record<string, unknown>>(VEO_FORM_SETTINGS_KEY, {});

  // Migration: convert old `voice` field to new `audio` object
  if ("voice" in saved && !("audio" in saved)) {
    saved.audio = {
      voiceLanguage: saved.voice as VoiceLanguage,
      music: true,
      soundEffects: true,
      environmentalAudio: true,
    };
    delete saved.voice;
    // Persist the migrated data
    setStorageItem(VEO_FORM_SETTINGS_KEY, saved);
  }

  return { ...defaults, ...saved } as VeoFormSettings;
}

export function saveVeoFormSettings(settings: VeoFormSettings): void {
  setStorageItem(VEO_FORM_SETTINGS_KEY, settings);
}
