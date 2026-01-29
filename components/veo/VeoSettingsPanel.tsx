"use client";

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
  deduplicationThreshold: number;
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

export function VeoSettingsPanel({
  settings,
  onSettingsChange,
  isLoading,
  workflow,
  showSettings,
  onToggleSettings,
}: VeoSettingsPanelProps) {
  const lang = useLang();

  const voiceOptions: VoiceLanguage[] = [
    "no-voice",
    "english",
    "vietnamese",
    "spanish",
    "french",
    "german",
    "japanese",
    "korean",
    "chinese",
  ];

  const showSceneSettings = workflow === "script-to-scenes" || workflow === "url-to-scenes";

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

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className={styles.settings}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Section 1: Generation Settings */}
            <div className={styles.settingsSection}>
              <h4 className={styles.sectionTitle}>{lang.veo.settings.generationTitle}</h4>
              <div className={styles.sectionContent}>
                {/* Scene Count - with auto toggle for url-to-scenes */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="scene-count">{lang.veo.settings.sceneCount}</label>
                    {workflow === "url-to-scenes" && (
                      <div className={styles.autoToggle}>
                        <button
                          type="button"
                          className={`${styles.autoToggleBtn} ${settings.autoSceneCount ? styles.active : ""}`}
                          onClick={() => onSettingsChange({ autoSceneCount: true })}
                          disabled={isLoading}
                        >
                          {lang.veo.settings.auto}
                        </button>
                        <button
                          type="button"
                          className={`${styles.autoToggleBtn} ${!settings.autoSceneCount ? styles.active : ""}`}
                          onClick={() => onSettingsChange({ autoSceneCount: false })}
                          disabled={isLoading}
                        >
                          {lang.veo.settings.manual}
                        </button>
                      </div>
                    )}
                  </div>
                  {(workflow !== "url-to-scenes" || !settings.autoSceneCount) && (
                    <input
                      id="scene-count"
                      type="number"
                      min={1}
                      max={200}
                      value={settings.sceneCount}
                      onChange={(e) => onSettingsChange({ sceneCount: parseInt(e.target.value) || 40 })}
                      disabled={isLoading}
                    />
                  )}
                  <span className={styles.settingDesc}>
                    {workflow === "url-to-scenes" && settings.autoSceneCount
                      ? lang.veo.settings.sceneCountAutoDesc
                      : lang.veo.settings.sceneCountDesc}
                  </span>
                </div>

                {/* Batch Size (only for hybrid mode) */}
                {settings.mode === "hybrid" && (
                  <div className={styles.settingItem}>
                    <label htmlFor="batch-size">{lang.veo.settings.batchSize}</label>
                    <input
                      id="batch-size"
                      type="number"
                      min={1}
                      max={50}
                      value={settings.batchSize}
                      onChange={(e) => onSettingsChange({ batchSize: parseInt(e.target.value) || 30 })}
                      disabled={isLoading}
                    />
                    <span className={styles.settingDesc}>
                      {lang.veo.settings.batchSizeDesc}
                    </span>
                  </div>
                )}

                {/* Media Type Toggle (Image vs Video) */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label>{lang.veo.settings.mediaType}</label>
                  </div>
                  <div className={styles.mediaTypeToggle}>
                    <button
                      type="button"
                      className={`${styles.mediaTypeBtn} ${settings.mediaType === "image" ? styles.active : ""}`}
                      onClick={() => onSettingsChange({ mediaType: "image" })}
                      disabled={isLoading}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      {lang.veo.settings.imageMode}
                    </button>
                    <button
                      type="button"
                      className={`${styles.mediaTypeBtn} ${settings.mediaType === "video" ? styles.active : ""}`}
                      onClick={() => onSettingsChange({ mediaType: "video" })}
                      disabled={isLoading}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      {lang.veo.settings.videoMode}
                    </button>
                  </div>
                  <span className={styles.settingDesc}>
                    {settings.mediaType === "image"
                      ? lang.veo.settings.imageModeHint
                      : lang.veo.settings.videoModeHint}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Content Analysis */}
            <div className={styles.settingsSection}>
              <h4 className={styles.sectionTitle}>{lang.veo.settings.contentTitle}</h4>
              <div className={styles.sectionContent}>
                {/* Extract Color Profile Toggle (only for url-to-scenes workflow) */}
                {workflow === "url-to-scenes" && (
                  <div className={styles.settingItem}>
                    <div className={styles.settingHeader}>
                      <label htmlFor="extract-color-profile">{lang.veo.settings.extractColorProfile}</label>
                      <label className={styles.toggleSwitch}>
                        <input
                          id="extract-color-profile"
                          type="checkbox"
                          checked={settings.extractColorProfile}
                          onChange={(e) => onSettingsChange({ extractColorProfile: e.target.checked })}
                          disabled={isLoading}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>
                    <span className={styles.settingDesc}>
                      {lang.veo.settings.extractColorProfileDesc}
                    </span>
                  </div>
                )}

                {/* Include Video Chapters Toggle (only for url-to-scenes workflow) */}
                {workflow === "url-to-scenes" && (
                  <div className={styles.settingItem}>
                    <div className={styles.settingHeader}>
                      <label htmlFor="use-chapters">{lang.veo.settings.useVideoChapters}</label>
                      <label className={styles.toggleSwitch}>
                        <input
                          id="use-chapters"
                          type="checkbox"
                          checked={settings.useVideoChapters}
                          onChange={(e) => onSettingsChange({ useVideoChapters: e.target.checked })}
                          disabled={isLoading}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>
                    <span className={styles.settingDesc}>
                      {lang.veo.settings.useVideoChaptersDesc}
                    </span>
                  </div>
                )}

                {/* Voice Selection */}
                <div className={styles.settingItem}>
                  <label htmlFor="voice">{lang.veo.settings.voice}</label>
                  <select
                    id="voice"
                    value={settings.voice}
                    onChange={(e) => onSettingsChange({ voice: e.target.value as VoiceLanguage })}
                    disabled={isLoading}
                  >
                    {voiceOptions.map((v) => (
                      <option key={v} value={v}>
                        {lang.veo.settings.voiceOptions[v]}
                      </option>
                    ))}
                  </select>
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.voiceDesc}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Quality & Filtering */}
            <div className={styles.settingsSection}>
              <h4 className={styles.sectionTitle}>{lang.veo.settings.qualityTitle}</h4>
              <div className={styles.sectionContent}>
                {/* Deduplication Threshold Slider */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="dedup-threshold">
                      {lang.veo.settings.deduplicationThreshold}
                    </label>
                    <span className={styles.thresholdValue}>
                      {settings.deduplicationThreshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    id="dedup-threshold"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.deduplicationThreshold}
                    onChange={(e) => onSettingsChange({ deduplicationThreshold: parseFloat(e.target.value) })}
                    disabled={isLoading}
                    className={styles.rangeSlider}
                  />
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.deduplicationThresholdDesc}
                  </span>
                </div>

                {/* Negative Prompt */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="negative-prompt">{lang.veo.settings.negativePrompt}</label>
                  </div>
                  <textarea
                    id="negative-prompt"
                    value={settings.negativePrompt}
                    onChange={(e) => onSettingsChange({ negativePrompt: e.target.value })}
                    placeholder={lang.veo.settings.negativePromptPlaceholder}
                    disabled={isLoading}
                    rows={4}
                    maxLength={500}
                    className={styles.scriptTextarea}
                    style={{ minHeight: '100px', fontSize: 'var(--fs-xs)' }}
                  />
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.negativePromptDesc}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: VEO 3 Advanced Features */}
            <div className={styles.settingsSection}>
              <h4 className={styles.sectionTitle}>
                {lang.veo.settings.veo3Title || "VEO 3 Advanced Features"}
              </h4>
              <div className={styles.sectionContent}>
                {/* Audio System Toggle */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="enable-audio">
                      {lang.veo.settings.veo3Audio || "Audio System"}
                    </label>
                    <label className={styles.toggleSwitch}>
                      <input
                        id="enable-audio"
                        type="checkbox"
                        checked={settings.enableAudio}
                        onChange={(e) => onSettingsChange({ enableAudio: e.target.checked })}
                        disabled={isLoading}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.veo3AudioDesc || "Generate environmental audio, music, and sound effects"}
                  </span>
                </div>

                {/* Dialogue System Toggle */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="enable-dialogue">
                      {lang.veo.settings.veo3Dialogue || "Dialogue System"}
                    </label>
                    <label className={styles.toggleSwitch}>
                      <input
                        id="enable-dialogue"
                        type="checkbox"
                        checked={settings.enableDialogue}
                        onChange={(e) => onSettingsChange({ enableDialogue: e.target.checked })}
                        disabled={isLoading}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.veo3DialogueDesc || "Use colon format for dialogue (prevents subtitles)"}
                  </span>
                </div>

                {/* Camera Positioning Toggle */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="enable-camera">
                      {lang.veo.settings.veo3Camera || "Camera Positioning"}
                    </label>
                    <label className={styles.toggleSwitch}>
                      <input
                        id="enable-camera"
                        type="checkbox"
                        checked={settings.enableCameraPositioning}
                        onChange={(e) => onSettingsChange({ enableCameraPositioning: e.target.checked })}
                        disabled={isLoading}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.veo3CameraDesc || "Use '(thats where the camera is)' syntax for precise positioning"}
                  </span>
                </div>

                {/* Expression Control Toggle */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="enable-expression">
                      {lang.veo.settings.veo3Expression || "Expression Control"}
                    </label>
                    <label className={styles.toggleSwitch}>
                      <input
                        id="enable-expression"
                        type="checkbox"
                        checked={settings.enableExpressionControl}
                        onChange={(e) => onSettingsChange({ enableExpressionControl: e.target.checked })}
                        disabled={isLoading}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.veo3ExpressionDesc || "Anti-model-face technique with micro-expressions and emotional arcs"}
                  </span>
                </div>

                {/* Selfie Mode Toggle */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="enable-selfie">
                      {lang.veo.settings.veo3Selfie || "Selfie/POV Mode"}
                    </label>
                    <label className={styles.toggleSwitch}>
                      <input
                        id="enable-selfie"
                        type="checkbox"
                        checked={settings.selfieMode}
                        onChange={(e) => onSettingsChange({ selfieMode: e.target.checked })}
                        disabled={isLoading}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.veo3SelfieDesc || "Generate authentic selfie-style footage with visible arm"}
                  </span>
                </div>

                {/* Advanced Composition Toggle */}
                <div className={styles.settingItem}>
                  <div className={styles.settingHeader}>
                    <label htmlFor="enable-composition">
                      {lang.veo.settings.veo3Composition || "Advanced Composition"}
                    </label>
                    <label className={styles.toggleSwitch}>
                      <input
                        id="enable-composition"
                        type="checkbox"
                        checked={settings.enableAdvancedComposition}
                        onChange={(e) => onSettingsChange({ enableAdvancedComposition: e.target.checked })}
                        disabled={isLoading}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <span className={styles.settingDesc}>
                    {lang.veo.settings.veo3CompositionDesc || "Lens effects, color grading, and professional lighting"}
                  </span>
                </div>

                {/* Color Palette Selector (only when advanced composition is enabled) */}
                {settings.enableAdvancedComposition && (
                  <div className={styles.settingItem}>
                    <label htmlFor="color-palette">
                      {lang.veo.settings.veo3ColorPalette || "Color Palette"}
                    </label>
                    <select
                      id="color-palette"
                      value={settings.colorPalette}
                      onChange={(e) => onSettingsChange({ colorPalette: e.target.value as ColorPaletteType })}
                      disabled={isLoading}
                    >
                      <option value="auto">{lang.veo.settings.veo3ColorAuto || "Auto (from video)"}</option>
                      <option value="teal-orange">Teal-Orange (Hollywood blockbuster - epic, cinematic, dynamic)</option>
                      <option value="warm-orange">Warm Orange (intimate, nostalgic, comforting)</option>
                      <option value="cool-blue">Cool Blue (mysterious, professional, modern)</option>
                      <option value="desaturated">Desaturated (serious, dramatic, cinematic)</option>
                      <option value="vibrant">Vibrant (energetic, bold, colorful)</option>
                      <option value="pastel">Pastel (soft, dreamy, delicate)</option>
                      <option value="noir">Noir (classic, dramatic, stark contrast)</option>
                    </select>
                  </div>
                )}

                {/* Lighting Setup Selector (only when advanced composition is enabled) */}
                {settings.enableAdvancedComposition && (
                  <div className={styles.settingItem}>
                    <label htmlFor="lighting-setup">
                      {lang.veo.settings.veo3Lighting || "Lighting Setup"}
                    </label>
                    <select
                      id="lighting-setup"
                      value={settings.lightingSetup}
                      onChange={(e) => onSettingsChange({ lightingSetup: e.target.value as LightingSetup })}
                      disabled={isLoading}
                    >
                      <option value="auto">{lang.veo.settings.veo3LightingAuto || "Auto (from video)"}</option>
                      <option value="three-point">{lang.veo.settings.veo3LightingThreePoint || "Three-Point"}</option>
                      <option value="rembrandt">{lang.veo.settings.veo3LightingRembrandt || "Rembrandt"}</option>
                      <option value="golden-hour">{lang.veo.settings.veo3LightingGoldenHour || "Golden Hour"}</option>
                      <option value="blue-hour">{lang.veo.settings.veo3LightingBlueHour || "Blue Hour"}</option>
                      <option value="chiaroscuro">{lang.veo.settings.veo3LightingChiaroscuro || "Chiaroscuro"}</option>
                      <option value="neon">{lang.veo.settings.veo3LightingNeon || "Neon"}</option>
                      <option value="natural">{lang.veo.settings.veo3LightingNatural || "Natural"}</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
