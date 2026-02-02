"use client";

import { useState, useCallback, useEffect, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import {
  isValidYouTubeUrl,
  VeoMode,
  AudioSettings,
  VeoWorkflow,
  MediaType,
} from "@/lib/veo";
import { loadVeoFormSettings, saveVeoFormSettings } from "@/lib/veo/settings";
import { VeoWorkflowSelector } from "./VeoWorkflowSelector";
import { VeoUrlInput } from "./VeoUrlInput";
import { VeoScriptInput } from "./VeoScriptInput";
import { VeoSettingsPanel } from "./VeoSettingsPanel";
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
    audio: AudioSettings;
    useVideoTitle: boolean;
    useVideoDescription: boolean;
    useVideoChapters: boolean;
    useVideoCaptions: boolean;
    negativePrompt?: string;
    extractColorProfile: boolean;
    mediaType: MediaType;
    selfieMode: boolean;
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

  // Load persisted settings (runs once on mount)
  const savedSettings = useMemo(() => loadVeoFormSettings(), []);

  // Settings — initialized from persisted values
  const [mode, setMode] = useState<VeoMode>(savedSettings.mode);
  const [autoSceneCount, setAutoSceneCount] = useState(savedSettings.autoSceneCount);
  const [sceneCount, setSceneCount] = useState(savedSettings.sceneCount);
  const [batchSize, setBatchSize] = useState(savedSettings.batchSize);
  const [audio, setAudio] = useState<AudioSettings>(savedSettings.audio);
  const [useVideoTitle, setUseVideoTitle] = useState(savedSettings.useVideoTitle);
  const [useVideoDescription, setUseVideoDescription] = useState(savedSettings.useVideoDescription);
  const [useVideoChapters, setUseVideoChapters] = useState(savedSettings.useVideoChapters);
  const [useVideoCaptions, setUseVideoCaptions] = useState(savedSettings.useVideoCaptions);
  const [negativePrompt, setNegativePrompt] = useState(savedSettings.negativePrompt);
  const [extractColorProfile, setExtractColorProfile] = useState(savedSettings.extractColorProfile);
  const [mediaType, setMediaType] = useState<MediaType>(savedSettings.mediaType);
  const [showSettings, setShowSettings] = useState(false);

  // Selfie mode — genuine shot-type toggle (VEO 3 techniques are integrated by default)
  const [selfieMode, setSelfieMode] = useState(savedSettings.selfieMode);

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    saveVeoFormSettings({
      mode, autoSceneCount, sceneCount, batchSize, audio,
      useVideoTitle, useVideoDescription, useVideoChapters, useVideoCaptions,
      extractColorProfile, mediaType,
      negativePrompt, selfieMode,
    });
  }, [
    mode, autoSceneCount, sceneCount, batchSize, audio,
    useVideoTitle, useVideoDescription, useVideoChapters, useVideoCaptions,
    extractColorProfile, mediaType,
    negativePrompt, selfieMode,
  ]);

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
          audio,
          useVideoTitle,
          useVideoDescription,
          useVideoChapters,
          useVideoCaptions,
          negativePrompt: trimmedNegativePrompt || undefined,
          extractColorProfile: workflow === "url-to-scenes" ? extractColorProfile : false,
          mediaType,
          selfieMode,
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
          audio,
          useVideoTitle,
          useVideoDescription,
          useVideoChapters,
          useVideoCaptions,
          negativePrompt: trimmedNegativePrompt || undefined,
          extractColorProfile: false, // No video to extract from
          mediaType,
          selfieMode,
        });
      }
    },
    [workflow, url, durationMode, startTime, endTime, scriptText, mode, autoSceneCount, sceneCount, batchSize, audio, useVideoTitle, useVideoDescription, useVideoChapters, useVideoCaptions, negativePrompt, extractColorProfile, mediaType, selfieMode, onError, onSubmit, lang]
  );

  const hasInput = workflow === "script-to-scenes" ? scriptText.trim().length > 0 : url.trim().length > 0;
  const showUrlInput = workflow === "url-to-script" || workflow === "url-to-scenes";
  const showSceneSettings = workflow === "script-to-scenes" || workflow === "url-to-scenes";

  // Settings state object
  const settingsState = {
    mode,
    autoSceneCount,
    sceneCount,
    batchSize,
    audio,
    useVideoTitle,
    useVideoDescription,
    useVideoChapters,
    useVideoCaptions,
    negativePrompt,
    extractColorProfile,
    mediaType,
    selfieMode,
  };

  // Settings change handler
  const handleSettingsChange = useCallback((updates: Partial<typeof settingsState>) => {
    if (updates.mode !== undefined) setMode(updates.mode);
    if (updates.autoSceneCount !== undefined) setAutoSceneCount(updates.autoSceneCount);
    if (updates.sceneCount !== undefined) setSceneCount(updates.sceneCount);
    if (updates.batchSize !== undefined) setBatchSize(updates.batchSize);
    if (updates.audio !== undefined) setAudio(updates.audio);
    if (updates.useVideoTitle !== undefined) setUseVideoTitle(updates.useVideoTitle);
    if (updates.useVideoDescription !== undefined) setUseVideoDescription(updates.useVideoDescription);
    if (updates.useVideoChapters !== undefined) setUseVideoChapters(updates.useVideoChapters);
    if (updates.useVideoCaptions !== undefined) setUseVideoCaptions(updates.useVideoCaptions);
    if (updates.negativePrompt !== undefined) setNegativePrompt(updates.negativePrompt);
    if (updates.extractColorProfile !== undefined) setExtractColorProfile(updates.extractColorProfile);
    if (updates.mediaType !== undefined) setMediaType(updates.mediaType);
    if (updates.selfieMode !== undefined) setSelfieMode(updates.selfieMode);
  }, []);

  return (
    <div className={styles.container}>
      {/* Workflow Selector */}
      <VeoWorkflowSelector
        workflow={workflow}
        onChange={setWorkflow}
        isLoading={isLoading}
      />

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
            <VeoUrlInput
              url={url}
              onChange={setUrl}
              durationMode={durationMode}
              onDurationModeChange={setDurationMode}
              startTime={startTime}
              onStartTimeChange={setStartTime}
              endTime={endTime}
              onEndTimeChange={setEndTime}
              isLoading={isLoading}
              workflow={workflow}
            />
          )}

          {/* Step 2: Script Input */}
          {workflow === "script-to-scenes" && (
            <VeoScriptInput
              scriptText={scriptText}
              onChange={setScriptText}
              onFileUpload={handleFileUpload}
              scriptFileName={scriptFileName}
              isLoading={isLoading}
              fileInputRef={fileInputRef}
            />
          )}
        </AnimatePresence>

        {/* Settings for scene generation (script-to-scenes and url-to-scenes) */}
        <VeoSettingsPanel
          settings={settingsState}
          onSettingsChange={handleSettingsChange}
          isLoading={isLoading}
          workflow={workflow}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />

        {/* Submit button */}
        {showSceneSettings && (
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
        )}
      </form>
    </div>
  );
}

export default memo(VeoForm);
