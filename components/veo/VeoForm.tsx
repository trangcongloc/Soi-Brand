"use client";

import { useState, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { isValidYouTubeUrl, VeoMode, VoiceLanguage, VeoWorkflow } from "@/lib/veo";
import styles from "./VeoForm.module.css";

interface VeoFormProps {
  onSubmit: (options: {
    workflow: VeoWorkflow;
    videoUrl?: string;
    startTime?: string;
    endTime?: string;
    scriptText?: string;
    mode: VeoMode;
    sceneCount: number;
    batchSize: number;
    voice: VoiceLanguage;
  }) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
}

function VeoForm({ onSubmit, onError, isLoading }: VeoFormProps) {
  const lang = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow selection
  const [workflow, setWorkflow] = useState<VeoWorkflow>("url-to-script");

  // URL input (for step 1)
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Script input (for step 2)
  const [scriptText, setScriptText] = useState("");
  const [scriptFileName, setScriptFileName] = useState("");

  // Settings
  const [mode, setMode] = useState<VeoMode>("hybrid");
  const [sceneCount, setSceneCount] = useState(40);
  const [batchSize, setBatchSize] = useState(10);
  const [voice, setVoice] = useState<VoiceLanguage>("no-voice");
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

      if (workflow === "url-to-script") {
        if (!url.trim()) {
          onError(lang.veo.form.errors.emptyUrl);
          return;
        }
        if (!isValidYouTubeUrl(url)) {
          onError(lang.veo.form.errors.invalidUrl);
          return;
        }
        onSubmit({
          workflow: "url-to-script",
          videoUrl: url,
          startTime: startTime.trim() || undefined,
          endTime: endTime.trim() || undefined,
          mode,
          sceneCount,
          batchSize,
          voice,
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
          sceneCount,
          batchSize,
          voice,
        });
      }
    },
    [workflow, url, startTime, endTime, scriptText, mode, sceneCount, batchSize, voice, onError, onSubmit, lang]
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

  const hasInput = workflow === "url-to-script" ? url.trim().length > 0 : scriptText.trim().length > 0;

  return (
    <div className={styles.container}>
      {/* Workflow Selector */}
      <div className={styles.workflowSelector}>
        <button
          type="button"
          className={`${styles.workflowTab} ${workflow === "url-to-script" ? styles.active : ""}`}
          onClick={() => setWorkflow("url-to-script")}
          disabled={isLoading}
        >
          <span className={styles.workflowNumber}>1</span>
          <div className={styles.workflowInfo}>
            <span className={styles.workflowName}>{lang.veo.workflow.urlToScript}</span>
            <span className={styles.workflowDesc}>{lang.veo.workflow.urlToScriptDesc}</span>
          </div>
        </button>
        <button
          type="button"
          className={`${styles.workflowTab} ${workflow === "script-to-scenes" ? styles.active : ""}`}
          onClick={() => setWorkflow("script-to-scenes")}
          disabled={isLoading}
        >
          <span className={styles.workflowNumber}>2</span>
          <div className={styles.workflowInfo}>
            <span className={styles.workflowName}>{lang.veo.workflow.scriptToScenes}</span>
            <span className={styles.workflowDesc}>{lang.veo.workflow.scriptToScenesDesc}</span>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <AnimatePresence mode="wait">
          {/* Step 1: URL Input */}
          {workflow === "url-to-script" && (
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

              {/* Time Range Input */}
              <div className={styles.timeRangeRow}>
                <label className={styles.timeRangeLabel}>
                  {lang.veo.form.timeRange}
                </label>
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
              </div>

              <p className={styles.inputHint}>{lang.veo.workflow.urlHint}</p>

              {/* Submit Button */}
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

        {/* Settings only for script-to-scenes */}
        {workflow === "script-to-scenes" && (
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
                  <div className={styles.settingsGrid}>
                    {/* Scene Count */}
                    <div className={styles.settingItem}>
                      <label htmlFor="scene-count">{lang.veo.settings.sceneCount}</label>
                      <input
                        id="scene-count"
                        type="number"
                        min={1}
                        max={200}
                        value={sceneCount}
                        onChange={(e) => setSceneCount(parseInt(e.target.value) || 40)}
                        disabled={isLoading}
                      />
                      <span className={styles.settingDesc}>
                        {lang.veo.settings.sceneCountDesc}
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
                          onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                          disabled={isLoading}
                        />
                        <span className={styles.settingDesc}>
                          {lang.veo.settings.batchSizeDesc}
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button for script-to-scenes */}
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
                  {isLoading ? lang.veo.form.processing : lang.veo.form.generateScenes}
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
