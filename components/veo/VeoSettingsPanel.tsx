"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VeoMode, VoiceLanguage, VeoWorkflow, MediaType, ColorPaletteType, LightingSetup } from "@/lib/veo";
import { useLang } from "@/lib/lang";
import styles from "./VeoForm.module.css";

interface SettingsState {
  mode: VeoMode;
  autoSceneCount: boolean;
  sceneCount: number;
  batchSize: number;
  voice: VoiceLanguage;
  useVideoChapters: boolean;
  negativePrompt: string;
  extractColorProfile: boolean;
  mediaType: MediaType;
  enableAudio: boolean;
  enableDialogue: boolean;
  enableCameraPositioning: boolean;
  enableExpressionControl: boolean;
  enableAdvancedComposition: boolean;
  colorPalette: ColorPaletteType;
  lightingSetup: LightingSetup;
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
            {/* Row 1: Core Settings */}
            <div className={styles.inlineRow}>
              <span className={styles.rowLabel}>{lang.veo.settings.sceneCount}</span>

              {/* Auto/Manual toggle (url-to-scenes only) */}
              {isUrlWorkflow && (
                <div className={styles.autoToggle}>
                  <button
                    type="button"
                    className={`${styles.autoToggleBtn} ${styles.tooltip} ${settings.autoSceneCount ? styles.active : ""}`}
                    onClick={() => onSettingsChange({ autoSceneCount: true })}
                    disabled={isLoading}
                    data-tooltip={lang.veo.settings.sceneCountAutoDesc}
                  >
                    {lang.veo.settings.auto}
                  </button>
                  <button
                    type="button"
                    className={`${styles.autoToggleBtn} ${styles.tooltip} ${!settings.autoSceneCount ? styles.active : ""}`}
                    onClick={() => onSettingsChange({ autoSceneCount: false })}
                    disabled={isLoading}
                    data-tooltip={lang.veo.settings.sceneCountDesc}
                  >
                    {lang.veo.settings.manual}
                  </button>
                </div>
              )}

              {/* Scene count input (when not auto) */}
              {(!isUrlWorkflow || !settings.autoSceneCount) && (
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

              {/* Batch size (hybrid only) */}
              {settings.mode === "hybrid" && (
                <>
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
                </>
              )}

              {/* Media Type pills */}
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

              {/* Voice select */}
              <select
                value={settings.voice}
                onChange={(e) => onSettingsChange({ voice: e.target.value as VoiceLanguage })}
                disabled={isLoading}
                className={`${styles.compactSelect} ${styles.tooltip}`}
                data-tooltip={lang.veo.settings.voiceDesc}
              >
                {voiceOptions.map((v) => (
                  <option key={v} value={v}>
                    {lang.veo.settings.voiceOptions[v]}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Analysis Toggles (url-to-scenes only) */}
            {isUrlWorkflow && (
              <>
                <div className={styles.settingsRowDivider} />
                <div className={styles.chipGrid}>
                  <Chip
                    icon="🎨"
                    label={lang.veo.settings.extractColorProfile}
                    active={settings.extractColorProfile}
                    tooltip={lang.veo.settings.extractColorProfileDesc}
                    disabled={isLoading}
                    onClick={() => onSettingsChange({ extractColorProfile: !settings.extractColorProfile })}
                  />
                  <Chip
                    icon="📑"
                    label={lang.veo.settings.useVideoChapters}
                    active={settings.useVideoChapters}
                    tooltip={lang.veo.settings.useVideoChaptersDesc}
                    disabled={isLoading}
                    onClick={() => onSettingsChange({ useVideoChapters: !settings.useVideoChapters })}
                  />

                </div>
              </>
            )}

            {/* Row 3: VEO 3 Feature Chips */}
            <div className={styles.settingsRowDivider} />
            <div className={styles.chipGrid}>
              <Chip
                icon="🔊"
                label={lang.veo.settings.veo3Audio || "Audio"}
                active={settings.enableAudio}
                tooltip={lang.veo.settings.veo3AudioDesc || "Generate environmental audio, music, and sound effects"}
                disabled={isLoading}
                onClick={() => onSettingsChange({ enableAudio: !settings.enableAudio })}
              />
              <Chip
                icon="💬"
                label={lang.veo.settings.veo3Dialogue || "Dialogue"}
                active={settings.enableDialogue}
                tooltip={lang.veo.settings.veo3DialogueDesc || "Use colon format for dialogue (prevents subtitles)"}
                disabled={isLoading}
                onClick={() => onSettingsChange({ enableDialogue: !settings.enableDialogue })}
              />
              <Chip
                icon="🎥"
                label={lang.veo.settings.veo3Camera || "Camera"}
                active={settings.enableCameraPositioning}
                tooltip={lang.veo.settings.veo3CameraDesc || "Precise camera positioning syntax"}
                disabled={isLoading}
                onClick={() => onSettingsChange({ enableCameraPositioning: !settings.enableCameraPositioning })}
              />
              <Chip
                icon="😊"
                label={lang.veo.settings.veo3Expression || "Expression"}
                active={settings.enableExpressionControl}
                tooltip={lang.veo.settings.veo3ExpressionDesc || "Anti-model-face with micro-expressions"}
                disabled={isLoading}
                onClick={() => onSettingsChange({ enableExpressionControl: !settings.enableExpressionControl })}
              />
              <Chip
                icon="🤳"
                label={lang.veo.settings.veo3Selfie || "Selfie"}
                active={settings.selfieMode}
                tooltip={lang.veo.settings.veo3SelfieDesc || "Authentic selfie-style footage"}
                disabled={isLoading}
                onClick={() => onSettingsChange({ selfieMode: !settings.selfieMode })}
              />
              <Chip
                icon="✨"
                label={lang.veo.settings.veo3Composition || "Composition"}
                active={settings.enableAdvancedComposition}
                tooltip={lang.veo.settings.veo3CompositionDesc || "Lens effects, color grading, and lighting"}
                disabled={isLoading}
                onClick={() => onSettingsChange({ enableAdvancedComposition: !settings.enableAdvancedComposition })}
              />
            </div>

            {/* Row 4: Composition Sub-options (when Composition is active) */}
            {settings.enableAdvancedComposition && (
              <>
                <div className={styles.subOptions}>
                  <span className={styles.rowLabel}>{lang.veo.settings.veo3ColorPalette || "Palette"}</span>
                  <select
                    value={settings.colorPalette}
                    onChange={(e) => onSettingsChange({ colorPalette: e.target.value as ColorPaletteType })}
                    disabled={isLoading}
                    className={styles.compactSelect}
                  >
                    <option value="auto">{lang.veo.settings.veo3ColorAuto || "Auto"}</option>
                    <option value="teal-orange">{lang.veo.settings.veo3ColorTealOrange || "Teal-Orange"}</option>
                    <option value="warm-orange">{lang.veo.settings.veo3ColorWarm || "Warm Orange"}</option>
                    <option value="cool-blue">{lang.veo.settings.veo3ColorCool || "Cool Blue"}</option>
                    <option value="desaturated">{lang.veo.settings.veo3ColorDesaturated || "Desaturated"}</option>
                    <option value="vibrant">{lang.veo.settings.veo3ColorVibrant || "Vibrant"}</option>
                    <option value="pastel">{lang.veo.settings.veo3ColorPastel || "Pastel"}</option>
                    <option value="noir">{lang.veo.settings.veo3ColorNoir || "Noir"}</option>
                  </select>

                  <span className={styles.rowLabel}>{lang.veo.settings.veo3Lighting || "Lighting"}</span>
                  <select
                    value={settings.lightingSetup}
                    onChange={(e) => onSettingsChange({ lightingSetup: e.target.value as LightingSetup })}
                    disabled={isLoading}
                    className={styles.compactSelect}
                  >
                    <option value="auto">{lang.veo.settings.veo3LightingAuto || "Auto"}</option>
                    <option value="three-point">{lang.veo.settings.veo3LightingThreePoint || "Three-Point"}</option>
                    <option value="rembrandt">{lang.veo.settings.veo3LightingRembrandt || "Rembrandt"}</option>
                    <option value="golden-hour">{lang.veo.settings.veo3LightingGoldenHour || "Golden Hour"}</option>
                    <option value="blue-hour">{lang.veo.settings.veo3LightingBlueHour || "Blue Hour"}</option>
                    <option value="chiaroscuro">{lang.veo.settings.veo3LightingChiaroscuro || "Chiaroscuro"}</option>
                    <option value="neon">{lang.veo.settings.veo3LightingNeon || "Neon"}</option>
                    <option value="natural">{lang.veo.settings.veo3LightingNatural || "Natural"}</option>
                  </select>
                </div>
              </>
            )}

            {/* Row 5: Negative Prompt (collapsible) */}
            <div className={styles.settingsRowDivider} />
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
