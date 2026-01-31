/**
 * VEO Form Settings Persistence
 * Save/load/defaults for VEO form preferences across sessions.
 */

import { VeoFormSettings } from "./types";
import { getStorageItem, setStorageItem } from "./storage-utils";
import { VEO_FORM_SETTINGS_KEY } from "./constants";
import { getDefaultNegativePrompt } from "./prompts";

export function getDefaultVeoFormSettings(): VeoFormSettings {
  return {
    mode: "hybrid",
    autoSceneCount: true,
    sceneCount: 40,
    batchSize: 30,
    voice: "no-voice",
    useVideoChapters: true,
    extractColorProfile: true,
    mediaType: "video",
    negativePrompt: getDefaultNegativePrompt("standard"),
    enableAudio: true,
    enableDialogue: true,
    enableCameraPositioning: true,
    enableExpressionControl: true,
    enableAdvancedComposition: true,
    colorPalette: "auto",
    lightingSetup: "auto",
    selfieMode: false,
  };
}

export function loadVeoFormSettings(): VeoFormSettings {
  const defaults = getDefaultVeoFormSettings();
  const saved = getStorageItem<Partial<VeoFormSettings>>(VEO_FORM_SETTINGS_KEY, {});
  return { ...defaults, ...saved };
}

export function saveVeoFormSettings(settings: VeoFormSettings): void {
  setStorageItem(VEO_FORM_SETTINGS_KEY, settings);
}
