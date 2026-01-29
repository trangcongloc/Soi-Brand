"use client";

import { useState, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import {
  isValidYouTubeUrl,
  VeoMode,
  VoiceLanguage,
  VeoWorkflow,
  getDefaultNegativePrompt,
  MediaType,
  ColorPaletteType,
  LightingSetup,
  Veo3Options,
} from "@/lib/veo";
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
    voice: VoiceLanguage;
    useVideoChapters: boolean;
    deduplicationThreshold: number;
    negativePrompt?: string;
    extractColorProfile: boolean;
    mediaType: MediaType;
    // VEO 3 Options
    veo3Options?: Veo3Options;
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

  // VEO 3 Prompting Guide Options
  const [enableAudio, setEnableAudio] = useState(true);
  const [enableDialogue, setEnableDialogue] = useState(true);
  const [enableCameraPositioning, setEnableCameraPositioning] = useState(true);
  const [enableExpressionControl, setEnableExpressionControl] = useState(true);
  const [enableAdvancedComposition, setEnableAdvancedComposition] = useState(true);
  const [colorPalette, setColorPalette] = useState<ColorPaletteType>("auto");
  const [lightingSetup, setLightingSetup] = useState<LightingSetup>("auto");
  const [selfieMode, setSelfieMode] = useState(false);

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

  // Build VEO 3 options object
  const buildVeo3Options = useCallback((): Veo3Options => ({
    enableAudio,
    enableDialogue,
    colonFormat: enableDialogue, // Use colon format when dialogue is enabled
    eightSecondRule: enableDialogue,
    enableCameraPositioning,
    cameraPositionSyntax: enableCameraPositioning,
    enableExpressionControl,
    antiModelFace: enableExpressionControl,
    emotionalArc: enableExpressionControl,
    enableAdvancedComposition,
    colorPalette,
    lightingSetup,
    selfieMode,
  }), [enableAudio, enableDialogue, enableCameraPositioning, enableExpressionControl, enableAdvancedComposition, colorPalette, lightingSetup, selfieMode]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedNegativePrompt = negativePrompt.trim();
      const veo3Options = buildVeo3Options();

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
          veo3Options,
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
          veo3Options,
        });
      }
    },
    [workflow, url, durationMode, startTime, endTime, scriptText, mode, autoSceneCount, sceneCount, batchSize, voice, useVideoChapters, deduplicationThreshold, negativePrompt, extractColorProfile, mediaType, buildVeo3Options, onError, onSubmit, lang]
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
    voice,
    useVideoChapters,
    deduplicationThreshold,
    negativePrompt,
    extractColorProfile,
    mediaType,
    enableAudio,
    enableDialogue,
    enableCameraPositioning,
    enableExpressionControl,
    enableAdvancedComposition,
    colorPalette,
    lightingSetup,
    selfieMode,
  };

  // Settings change handler
  const handleSettingsChange = useCallback((updates: Partial<typeof settingsState>) => {
    if (updates.mode !== undefined) setMode(updates.mode);
    if (updates.autoSceneCount !== undefined) setAutoSceneCount(updates.autoSceneCount);
    if (updates.sceneCount !== undefined) setSceneCount(updates.sceneCount);
    if (updates.batchSize !== undefined) setBatchSize(updates.batchSize);
    if (updates.voice !== undefined) setVoice(updates.voice);
    if (updates.useVideoChapters !== undefined) setUseVideoChapters(updates.useVideoChapters);
    if (updates.deduplicationThreshold !== undefined) setDeduplicationThreshold(updates.deduplicationThreshold);
    if (updates.negativePrompt !== undefined) setNegativePrompt(updates.negativePrompt);
    if (updates.extractColorProfile !== undefined) setExtractColorProfile(updates.extractColorProfile);
    if (updates.mediaType !== undefined) setMediaType(updates.mediaType);
    if (updates.enableAudio !== undefined) setEnableAudio(updates.enableAudio);
    if (updates.enableDialogue !== undefined) setEnableDialogue(updates.enableDialogue);
    if (updates.enableCameraPositioning !== undefined) setEnableCameraPositioning(updates.enableCameraPositioning);
    if (updates.enableExpressionControl !== undefined) setEnableExpressionControl(updates.enableExpressionControl);
    if (updates.enableAdvancedComposition !== undefined) setEnableAdvancedComposition(updates.enableAdvancedComposition);
    if (updates.colorPalette !== undefined) setColorPalette(updates.colorPalette);
    if (updates.lightingSetup !== undefined) setLightingSetup(updates.lightingSetup);
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
