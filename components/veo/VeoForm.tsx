"use client";

import { useState, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { isValidYouTubeUrl, VeoMode, VoiceLanguage, VeoWorkflow, getDefaultNegativePrompt, MediaType } from "@/lib/veo";
import styles from "./VeoForm.module.css";

interface VeoFormProps {
  onSubmit: (options: {
    workflow: VeoWorkflow;
    videoUrl?: string;
    startTime?: string;
    endTime?: string;
    scriptText?: string;
    mode: VeoMode;
    autoSceneCount: boolean;
    sceneCount: number;
    batchSize: number;
    voice: VoiceLanguage;
    useVideoChapters: boolean;
    deduplicationThreshold: number;
    negativePrompt?: string;
    extractColorProfile: boolean;
    mediaType: MediaType;
  }) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  hasApiKey?: boolean;
  geminiModel?: string;
}

function VeoForm({ onSubmit, onError, isLoading, hasApiKey = true, geminiModel }: VeoFormProps) {
  const lang = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow selection - default to combined workflow
  const [workflow, setWorkflow] = useState<VeoWorkflow>("url-to-scenes");

  // URL input (for step 1)
  const [url, setUrl] = useState("");
  const [durationMode, setDurationMode] = useState<"auto" | "custom">("auto");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Script input (for step 2)
  const [scriptText, setScriptText] = useState("");
  const [scriptFileName, setScriptFileName] = useState("");

  // Settings
  const [mode, setMode] = useState<VeoMode>("hybrid");
  const [autoSceneCount, setAutoSceneCount] = useState(true);
  const [sceneCount, setSceneCount] = useState(40);
  const [batchSize, setBatchSize] = useState(30);
  const [voice, setVoice] = useState<VoiceLanguage>("no-voice");
  const [useVideoChapters, setUseVideoChapters] = useState(true);
  const [deduplicationThreshold, setDeduplicationThreshold] = useState(0.75);
  const [negativePrompt, setNegativePrompt] = useState(getDefaultNegativePrompt("standard"));
  const [extractColorProfile, setExtractColorProfile] = useState(true);
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [showSettings, setShowSettings] = useState(false);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith(".txt") && !file.name.endsWith(".json")) {
        onError(lang.veo.form.errors.invalidFileType);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (file.name.endsWith(".json")) {
          try {
            const parsed = JSON.parse(content);
            // If it's a JSON with rawText field, use that
            if (parsed.rawText) {
              setScriptText(parsed.rawText);
            } else if (Array.isArray(parsed)) {
              // If it's an array of segments
              setScriptText(parsed.map((s: { content?: string }) => s.content || "").join("\n\n"));
            } else {
              setScriptText(content);
            }
          } catch {
            setScriptText(content);
          }
        } else {
          setScriptText(content);
        }
        setScriptFileName(file.name);
      };
      reader.onerror = () => {
        onError(lang.veo.form.errors.cannotReadFile);
      };
      reader.readAsText(file);
    },
    [onError, lang]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedNegativePrompt = negativePrompt.trim();

      if (workflow === "url-to-script" || workflow === "url-to-scenes") {
        if (!url.trim()) {
          onError(lang.veo.form.errors.emptyUrl);
          return;
        }
        if (!isValidYouTubeUrl(url)) {
          onError(lang.veo.form.errors.invalidUrl);
          return;
        }
        onSubmit({
          workflow,
          videoUrl: url,
          // Only send time range in custom mode
          startTime: durationMode === "custom" && startTime.trim() ? startTime.trim() : undefined,
          endTime: durationMode === "custom" && endTime.trim() ? endTime.trim() : undefined,
          mode,
          autoSceneCount: workflow === "url-to-scenes" ? autoSceneCount : false,
          sceneCount,
          batchSize,
          voice,
          useVideoChapters,
          deduplicationThreshold,
          negativePrompt: trimmedNegativePrompt || undefined,
          extractColorProfile: workflow === "url-to-scenes" ? extractColorProfile : false,
          mediaType,
        });
      } else {
        if (!scriptText.trim()) {
          onError(lang.veo.form.errors.emptyScript);
          return;
        }
        onSubmit({
          workflow: "script-to-scenes",
          scriptText,
          mode,
          autoSceneCount: false,
          sceneCount,
          batchSize,
          voice,
          useVideoChapters,
          deduplicationThreshold,
          negativePrompt: trimmedNegativePrompt || undefined,
          extractColorProfile: false, // No video to extract from
          mediaType,
        });
      }
    },
    [workflow, url, durationMode, startTime, endTime, scriptText, mode, autoSceneCount, sceneCount, batchSize, voice, useVideoChapters, deduplicationThreshold, negativePrompt, extractColorProfile, mediaType, onError, onSubmit, lang]
  );

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

  const hasInput = workflow === "script-to-scenes" ? scriptText.trim().length > 0 : url.trim().length > 0;
  const showUrlInput = workflow === "url-to-script" || workflow === "url-to-scenes";
  const showSceneSettings = workflow === "script-to-scenes" || workflow === "url-to-scenes";

  return (
    <div className={styles.container}>
      {/* Workflow Selector */}
      <div className={styles.workflowSelector}>
        <button
          type="button"
          className={`${styles.workflowTab} ${workflow === "url-to-scenes" ? styles.active : ""}`}
          onClick={() => setWorkflow("url-to-scenes")}
          disabled={isLoading}
          title={lang.veo.workflow.urlToScenesDesc}
        >
          <span className={styles.workflowNumber}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <span className={styles.workflowName}>{lang.veo.workflow.urlToScenes}</span>
        </button>
        <button
          type="button"
          className={`${styles.workflowTab} ${workflow === "url-to-script" ? styles.active : ""}`}
          onClick={() => setWorkflow("url-to-script")}
          disabled={isLoading}
          title={lang.veo.workflow.urlToScriptDesc}
        >
          <span className={styles.workflowNumber}>1</span>
          <span className={styles.workflowName}>{lang.veo.workflow.urlToScript}</span>
        </button>
        <button
          type="button"
          className={`${styles.workflowTab} ${workflow === "script-to-scenes" ? styles.active : ""}`}
          onClick={() => setWorkflow("script-to-scenes")}
          disabled={isLoading}
          title={lang.veo.workflow.scriptToScenesDesc}
        >
          <span className={styles.workflowNumber}>2</span>
          <span className={styles.workflowName}>{lang.veo.workflow.scriptToScenes}</span>
        </button>
      </div>

      {/* API Key Status Notice */}
      {!hasApiKey && (
        <div className={styles.apiKeyNotice}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{lang.veo.form.noApiKey}</span>
        </div>
      )}

      {/* Model indicator when API key is set */}
      {hasApiKey && geminiModel && (
        <div className={styles.modelIndicator}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span>{lang.veo.form.usingModel}: {geminiModel}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <AnimatePresence mode="wait">
          {/* URL Input (for url-to-script and url-to-scenes) */}
          {showUrlInput && (
            <motion.div
              key="url-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={styles.inputGroup}
            >
              <label htmlFor="video-url" className="sr-only">
                YouTube Video URL
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="video-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={lang.veo.form.placeholder}
                  className="input"
                  disabled={isLoading}
                />
              </div>

              {/* Duration Mode Toggle */}
              <div className={styles.durationSection}>
                <div className={styles.durationHeader}>
                  <span className={styles.durationLabel}>{lang.veo.form.duration}</span>
                  <div className={styles.durationToggle}>
                    <button
                      type="button"
                      className={`${styles.durationToggleBtn} ${durationMode === "auto" ? styles.active : ""}`}
                      onClick={() => setDurationMode("auto")}
                      disabled={isLoading}
                    >
                      {lang.veo.form.durationAuto}
                    </button>
                    <button
                      type="button"
                      className={`${styles.durationToggleBtn} ${durationMode === "custom" ? styles.active : ""}`}
                      onClick={() => setDurationMode("custom")}
                      disabled={isLoading}
                    >
                      {lang.veo.form.durationCustom}
                    </button>
                  </div>
                </div>

                {/* Time Range Input - only show in custom mode */}
                <AnimatePresence>
                  {durationMode === "custom" && (
                    <motion.div
                      className={styles.timeRangeRow}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={styles.timeInputs}>
                        <span className={styles.timeLabel}>{lang.veo.form.from}</span>
                        <input
                          id="start-time"
                          type="text"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          placeholder="00:00"
                          className={styles.timeInput}
                          disabled={isLoading}
                        />
                        <span className={styles.timeLabel}>{lang.veo.form.to}</span>
                        <input
                          id="end-time"
                          type="text"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          placeholder="05:30"
                          className={styles.timeInput}
                          disabled={isLoading}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className={styles.durationHint}>
                  {durationMode === "auto"
                    ? lang.veo.form.durationAutoHint
                    : lang.veo.form.durationCustomHint}
                </p>
              </div>

              <p className={styles.inputHint}>
                {workflow === "url-to-scenes" ? lang.veo.workflow.urlToScenesHint : lang.veo.workflow.urlHint}
              </p>

              {/* Submit Button for url-to-script only */}
              {workflow === "url-to-script" && (
                <AnimatePresence>
                  {url.trim().length > 0 && (
                    <motion.button
                      type="submit"
                      className={styles.submitButtonLarge}
                      disabled={isLoading}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      {isLoading ? lang.veo.form.processing : lang.veo.form.extractScript}
                    </motion.button>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {/* Step 2: Script Input */}
          {workflow === "script-to-scenes" && (
            <motion.div
              key="script-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={styles.inputGroup}
            >
              <div className={styles.scriptInputArea}>
                <textarea
                  id="script-text"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder={lang.veo.form.scriptPlaceholder}
                  className={styles.scriptTextarea}
                  disabled={isLoading}
                  rows={6}
                />
                <div className={styles.scriptActions}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.json"
                    onChange={handleFileUpload}
                    className={styles.fileInput}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    {lang.veo.form.uploadScript}
                  </button>
                  {scriptFileName && (
                    <span className={styles.fileName}>{scriptFileName}</span>
                  )}
                </div>
              </div>
              <p className={styles.inputHint}>{lang.veo.workflow.scriptHint}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings for scene generation (script-to-scenes and url-to-scenes) */}
        {showSceneSettings && (
          <>
            {/* Mode Selector */}
            <div className={styles.modeSelector}>
              <span className={styles.modeLabel}>{lang.veo.modes.title}:</span>
              <div className={styles.modeButtons}>
                <button
                  type="button"
                  className={`${styles.modeButton} ${mode === "direct" ? styles.active : ""}`}
                  onClick={() => setMode("direct")}
                  disabled={isLoading}
                >
                  <span className={styles.modeName}>{lang.veo.modes.direct}</span>
                  <span className={styles.modeDesc}>{lang.veo.modes.directDesc}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.modeButton} ${mode === "hybrid" ? styles.active : ""}`}
                  onClick={() => setMode("hybrid")}
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
              onClick={() => setShowSettings(!showSettings)}
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
                                className={`${styles.autoToggleBtn} ${autoSceneCount ? styles.active : ""}`}
                                onClick={() => setAutoSceneCount(true)}
                                disabled={isLoading}
                              >
                                {lang.veo.settings.auto}
                              </button>
                              <button
                                type="button"
                                className={`${styles.autoToggleBtn} ${!autoSceneCount ? styles.active : ""}`}
                                onClick={() => setAutoSceneCount(false)}
                                disabled={isLoading}
                              >
                                {lang.veo.settings.manual}
                              </button>
                            </div>
                          )}
                        </div>
                        {(workflow !== "url-to-scenes" || !autoSceneCount) && (
                          <input
                            id="scene-count"
                            type="number"
                            min={1}
                            max={200}
                            value={sceneCount}
                            onChange={(e) => setSceneCount(parseInt(e.target.value) || 40)}
                            disabled={isLoading}
                          />
                        )}
                        <span className={styles.settingDesc}>
                          {workflow === "url-to-scenes" && autoSceneCount
                            ? lang.veo.settings.sceneCountAutoDesc
                            : lang.veo.settings.sceneCountDesc}
                        </span>
                      </div>

                      {/* Batch Size (only for hybrid mode) */}
                      {mode === "hybrid" && (
                        <div className={styles.settingItem}>
                          <label htmlFor="batch-size">{lang.veo.settings.batchSize}</label>
                          <input
                            id="batch-size"
                            type="number"
                            min={1}
                            max={50}
                            value={batchSize}
                            onChange={(e) => setBatchSize(parseInt(e.target.value) || 30)}
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
                            className={`${styles.mediaTypeBtn} ${mediaType === "image" ? styles.active : ""}`}
                            onClick={() => setMediaType("image")}
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
                            className={`${styles.mediaTypeBtn} ${mediaType === "video" ? styles.active : ""}`}
                            onClick={() => setMediaType("video")}
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
                          {mediaType === "image"
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
                                checked={extractColorProfile}
                                onChange={(e) => setExtractColorProfile(e.target.checked)}
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
                                checked={useVideoChapters}
                                onChange={(e) => setUseVideoChapters(e.target.checked)}
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
                          value={voice}
                          onChange={(e) => setVoice(e.target.value as VoiceLanguage)}
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
                            {deduplicationThreshold.toFixed(2)}
                          </span>
                        </div>
                        <input
                          id="dedup-threshold"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={deduplicationThreshold}
                          onChange={(e) => setDeduplicationThreshold(parseFloat(e.target.value))}
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
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <AnimatePresence>
              {hasInput && (
                <motion.button
                  type="submit"
                  className={styles.submitButtonLarge}
                  disabled={isLoading}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  {isLoading
                    ? lang.veo.form.processing
                    : workflow === "url-to-scenes"
                    ? lang.veo.form.generateFromUrl
                    : lang.veo.form.generateScenes}
                </motion.button>
              )}
            </AnimatePresence>
          </>
        )}
      </form>
    </div>
  );
}

export default memo(VeoForm);
