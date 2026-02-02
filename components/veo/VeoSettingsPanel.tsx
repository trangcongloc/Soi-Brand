"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VeoMode, VoiceLanguage, AudioSettings, VeoWorkflow, MediaType, SceneCountMode } from "@/lib/veo";
import { useLang } from "@/lib/lang";
import styles from "./VeoForm.module.css";

interface SettingsState {
  mode: VeoMode;
  sceneCountMode: SceneCountMode;
  sceneCount: number;
  batchSize: number;
  audio: AudioSettings;
  useVideoTitle: boolean;
  useVideoDescription: boolean;
  useVideoChapters: boolean;
  useVideoCaptions: boolean;
  negativePrompt: string;
  extractColorProfile: boolean;
  mediaType: MediaType;
  selfieMode: boolean;
}

interface VeoSettingsPanelProps {
  settings: SettingsState;
  onSettingsChange: (updates: Partial<SettingsState>) => void;
  isLoading: boolean;
  workflow: VeoWorkflow;
  showSettings: boolean;
  onToggleSettings: () => void;
}

const voiceOptions: VoiceLanguage[] = [
  "no-voice", "english", "vietnamese", "spanish",
  "french", "german", "japanese", "korean", "chinese",
];

interface ChipProps {
  icon: string;
  label: string;
  active: boolean;
  tooltip: string;
  disabled: boolean;
  onClick: () => void;
}

function Chip({ icon, label, active, tooltip, disabled, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.settingChip} ${styles.tooltip} ${active ? styles.active : ""}`}
      data-tooltip={tooltip}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={styles.chipIcon}>{icon}</span>
      {label}
    </button>
  );
}

export function VeoSettingsPanel({
  settings,
  onSettingsChange,
  isLoading,
  workflow,
  showSettings,
  onToggleSettings,
}: VeoSettingsPanelProps) {
  const lang = useLang();
  const [showNegativePrompt, setShowNegativePrompt] = useState(
    settings.negativePrompt.length > 0
  );

  const showSceneSettings = workflow === "script-to-scenes" || workflow === "url-to-scenes";
  const isUrlWorkflow = workflow === "url-to-scenes";

  if (!showSceneSettings) {
    return null;
  }

  return (
    <>
      {/* Mode Selector */}
      <div className={styles.modeSelector}>
        <span className={styles.modeLabel}>{lang.veo.modes.title}:</span>
        <div className={styles.modeButtons}>
          <button
            type="button"
            className={`${styles.modeButton} ${settings.mode === "direct" ? styles.active : ""}`}
            onClick={() => onSettingsChange({ mode: "direct" })}
            disabled={isLoading}
          >
            <span className={styles.modeName}>{lang.veo.modes.direct}</span>
            <span className={styles.modeDesc}>{lang.veo.modes.directDesc}</span>
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${settings.mode === "hybrid" ? styles.active : ""}`}
            onClick={() => onSettingsChange({ mode: "hybrid" })}
            disabled={isLoading}
          >
            <span className={styles.modeName}>{lang.veo.modes.hybrid}</span>
            <span className={styles.modeDesc}>{lang.veo.modes.hybridDesc}</span>
          </button>
        </div>
      </div>

      {/* Settings Toggle */}
      <button
        type="button"
        className={styles.settingsToggle}
        onClick={onToggleSettings}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {lang.veo.settings.title}
        <svg
          className={`${styles.chevron} ${showSettings ? styles.open : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Compact Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className={styles.settingsRows}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Generation Group */}
            <div className={styles.settingsGroup}>
              <div className={styles.settingsGroupHeader}>{lang.veo.settings.generationTitle}</div>
              <div className={styles.settingsGroupContent}>
                <span className={styles.rowLabel}>{lang.veo.settings.sceneCount}</span>

                {isUrlWorkflow && (
                  <div className={styles.autoToggle}>
                    <button
                      type="button"
                      className={`${styles.autoToggleBtn} ${styles.tooltip} ${settings.sceneCountMode === "gemini" ? styles.active : ""}`}
                      onClick={() => onSettingsChange({ sceneCountMode: "gemini" })}
                      disabled={isLoading}
                      data-tooltip={lang.veo.settings.geminiDesc}
                    >
                      {lang.veo.settings.gemini}
                    </button>
                    <button
                      type="button"
                      className={`${styles.autoToggleBtn} ${styles.tooltip} ${settings.sceneCountMode === "auto" ? styles.active : ""}`}
                      onClick={() => onSettingsChange({ sceneCountMode: "auto" })}
                      disabled={isLoading}
                      data-tooltip={lang.veo.settings.sceneCountAutoDesc}
                    >
                      {lang.veo.settings.auto}
                    </button>
                    <button
                      type="button"
                      className={`${styles.autoToggleBtn} ${styles.tooltip} ${settings.sceneCountMode === "manual" ? styles.active : ""}`}
                      onClick={() => onSettingsChange({ sceneCountMode: "manual" })}
                      disabled={isLoading}
                      data-tooltip={lang.veo.settings.sceneCountDesc}
                    >
                      {lang.veo.settings.manual}
                    </button>
                  </div>
                )}

                {(!isUrlWorkflow || settings.sceneCountMode === "manual") && (
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={settings.sceneCount}
                    onChange={(e) => onSettingsChange({ sceneCount: parseInt(e.target.value) || 40 })}
                    disabled={isLoading}
                    className={`${styles.compactInput} ${styles.tooltip}`}
                    data-tooltip={lang.veo.settings.sceneCountDesc}
                  />
                )}

              </div>
              {settings.mode === "hybrid" && (
                <div className={styles.settingsGroupContent} style={{ marginTop: "0.4rem" }}>
                  <span className={styles.rowLabel}>{lang.veo.settings.batchSize}</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.batchSize}
                    onChange={(e) => onSettingsChange({ batchSize: parseInt(e.target.value) || 30 })}
                    disabled={isLoading}
                    className={`${styles.compactInput} ${styles.tooltip}`}
                    data-tooltip={lang.veo.settings.batchSizeDesc}
                  />
                </div>
              )}
            </div>

            {/* Output Group */}
            <div className={styles.settingsGroup}>
              <div className={styles.settingsGroupHeader}>{lang.veo.settings.outputTitle}</div>
              <div className={styles.settingsGroupContent}>
                <Chip
                  icon="🖼"
                  label={lang.veo.settings.imageMode}
                  active={settings.mediaType === "image"}
                  tooltip={lang.veo.settings.imageModeHint}
                  disabled={isLoading}
                  onClick={() => onSettingsChange({ mediaType: "image" })}
                />
                <Chip
                  icon="🎬"
                  label={lang.veo.settings.videoMode}
                  active={settings.mediaType === "video"}
                  tooltip={lang.veo.settings.videoModeHint}
                  disabled={isLoading}
                  onClick={() => onSettingsChange({ mediaType: "video" })}
                />
              </div>
            </div>

            {/* Audio Group */}
            <div className={styles.settingsGroup}>
              <div className={styles.settingsGroupHeader}>{lang.veo.settings.audioTitle}</div>
              <div className={styles.settingsGroupContent}>
                <select
                  value={settings.audio.voiceLanguage}
                  onChange={(e) => onSettingsChange({ audio: { ...settings.audio, voiceLanguage: e.target.value as VoiceLanguage } })}
                  disabled={isLoading}
                  className={`${styles.compactSelect} ${styles.tooltip}`}
                  data-tooltip={lang.veo.settings.dialogueLanguageDesc}
                >
                  {voiceOptions.map((v) => (
                    <option key={v} value={v}>
                      {lang.veo.settings.voiceOptions[v]}
                    </option>
                  ))}
                </select>
                <Chip
                  icon="M"
                  label={lang.veo.settings.audioMusic}
                  active={settings.audio.music}
                  tooltip={lang.veo.settings.audioMusicDesc}
                  disabled={isLoading}
                  onClick={() => onSettingsChange({ audio: { ...settings.audio, music: !settings.audio.music } })}
                />
                <Chip
                  icon="S"
                  label={lang.veo.settings.audioSFX}
                  active={settings.audio.soundEffects}
                  tooltip={lang.veo.settings.audioSFXDesc}
                  disabled={isLoading}
                  onClick={() => onSettingsChange({ audio: { ...settings.audio, soundEffects: !settings.audio.soundEffects } })}
                />
                <Chip
                  icon="A"
                  label={lang.veo.settings.audioAmbient}
                  active={settings.audio.environmentalAudio}
                  tooltip={lang.veo.settings.audioAmbientDesc}
                  disabled={isLoading}
                  onClick={() => onSettingsChange({ audio: { ...settings.audio, environmentalAudio: !settings.audio.environmentalAudio } })}
                />
              </div>
            </div>

            {/* Analysis Group (url-to-scenes only) */}
            {isUrlWorkflow && (
              <div className={styles.settingsGroup}>
                <div className={styles.settingsGroupHeader}>{lang.veo.settings.analysisTitle}</div>
                <div className={styles.settingsGroupContent}>
                  <Chip
                    icon="🎨"
                    label={lang.veo.settings.extractColorProfile}
                    active={settings.extractColorProfile}
                    tooltip={lang.veo.settings.extractColorProfileDesc}
                    disabled={isLoading}
                    onClick={() => onSettingsChange({ extractColorProfile: !settings.extractColorProfile })}
                  />
                  <Chip
                    icon="📌"
                    label={lang.veo.settings.useVideoTitle}
                    active={settings.useVideoTitle}
                    tooltip={lang.veo.settings.useVideoTitleDesc}
                    disabled={isLoading}
                    onClick={() => onSettingsChange({ useVideoTitle: !settings.useVideoTitle })}
                  />
                  <Chip
                    icon="📝"
                    label={lang.veo.settings.useVideoDescription}
                    active={settings.useVideoDescription}
                    tooltip={lang.veo.settings.useVideoDescriptionDesc}
                    disabled={isLoading}
                    onClick={() => onSettingsChange({ useVideoDescription: !settings.useVideoDescription })}
                  />
                  <Chip
                    icon="📑"
                    label={lang.veo.settings.useVideoChapters}
                    active={settings.useVideoChapters}
                    tooltip={lang.veo.settings.useVideoChaptersDesc}
                    disabled={isLoading}
                    onClick={() => onSettingsChange({ useVideoChapters: !settings.useVideoChapters })}
                  />
                  <Chip
                    icon="💬"
                    label={lang.veo.settings.useVideoCaptions}
                    active={settings.useVideoCaptions}
                    tooltip={lang.veo.settings.useVideoCaptionsDesc}
                    disabled={isLoading}
                    onClick={() => onSettingsChange({ useVideoCaptions: !settings.useVideoCaptions })}
                  />
                </div>
              </div>
            )}

            {/* Shot Type Group */}
            <div className={styles.settingsGroup}>
              <div className={styles.settingsGroupHeader}>{lang.veo.settings.shotTypeTitle}</div>
              <div className={styles.settingsGroupContent}>
                <Chip
                  icon="🤳"
                  label={lang.veo.settings.veo3Selfie || "Selfie"}
                  active={settings.selfieMode}
                  tooltip={lang.veo.settings.veo3SelfieDesc || "Authentic selfie-style footage"}
                  disabled={isLoading}
                  onClick={() => onSettingsChange({ selfieMode: !settings.selfieMode })}
                />
              </div>
            </div>

            {/* Negative Prompt (collapsible) */}
            <div>
              <button
                type="button"
                className={styles.negativePromptToggle}
                onClick={() => setShowNegativePrompt((prev) => !prev)}
              >
                <span>{showNegativePrompt ? "⊖" : "⊕"}</span>
                {lang.veo.settings.negativePrompt}
                <svg
                  className={`${styles.chevron} ${showNegativePrompt ? styles.open : ""}`}
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <AnimatePresence>
                {showNegativePrompt && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ overflow: "hidden" }}
                  >
                    <textarea
                      value={settings.negativePrompt}
                      onChange={(e) => onSettingsChange({ negativePrompt: e.target.value })}
                      placeholder={lang.veo.settings.negativePromptPlaceholder}
                      disabled={isLoading}
                      rows={3}
                      maxLength={500}
                      className={`${styles.negativePromptTextarea} ${styles.tooltip}`}
                      data-tooltip={lang.veo.settings.negativePromptDesc}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
