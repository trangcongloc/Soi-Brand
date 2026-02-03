"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { getUserSettingsAsync, SETTINGS_CHANGE_EVENT, SettingsChangeEvent } from "@/lib/userSettings";
import { GeminiModel } from "@/lib/types";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  VeoMode,
  AudioSettings,
  VeoWorkflow,
  Scene,
  CharacterRegistry,
  VeoJobSummary,
  VeoSSEEvent,
  GeneratedScript,
  VeoErrorType,
  CinematicProfile,
  MediaType,
  SceneCountMode,
  GeminiLogEntry,
  setCachedJob,
  getCachedJob,
  hasProgress,
  loadProgress,
  clearProgress,
  getResumeData,
  canResumeProgress,
  VeoProgress,
  extractVideoId,
} from "@/lib/veo";
import {
  cachePhase0,
  cachePhase2Batch,
  addPhaseLog,
  clearPhaseCache,
  createPhaseCacheSettings,
} from "@/lib/veo/phase-cache";
import { VeoForm, VeoSceneDisplay, VeoHistoryPanel, VeoLogPanel } from "@/components/veo";
import { getCachedJobList } from "@/lib/veo";
import styles from "./page.module.css";

type PageState = "idle" | "loading" | "script-complete" | "complete" | "error";

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.01 },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.01 },
  },
};

export default function VeoPage() {
  const lang = useLang();
  const [state, setState] = useState<PageState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Settings from Soi-brand settings button
  const [geminiApiKey, setGeminiApiKey] = useState<string | undefined>(undefined);
  const [geminiModel, setGeminiModel] = useState<GeminiModel | undefined>(undefined);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Loading state
  const [batch, setBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [scenesGenerated, setScenesGenerated] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [characters, setCharacters] = useState<string[]>([]);

  // Script result state (for Step 1)
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);

  // Scene result state (for Step 2)
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characterRegistry, setCharacterRegistry] = useState<CharacterRegistry>({});
  const [summary, setSummary] = useState<VeoJobSummary | null>(null);
  const [jobId, setJobId] = useState<string>("");

  // Color profile state (Phase 0)
  const [colorProfile, setColorProfile] = useState<CinematicProfile | null>(null);
  const [colorProfileConfidence, setColorProfileConfidence] = useState<number>(0);

  // Logging state
  const [logEntries, setLogEntries] = useState<GeminiLogEntry[]>([]);

  // Current form data (for retry/resume)
  const [currentFormData, setCurrentFormData] = useState<{
    workflow: VeoWorkflow;
    videoUrl?: string;
    videoId?: string;
    mode: VeoMode;
    sceneCount: number;
    batchSize: number;
    audio: AudioSettings;
    scriptText?: string;
    useVideoTitle: boolean;
    useVideoDescription: boolean;
    useVideoChapters: boolean;
    useVideoCaptions: boolean;
    negativePrompt?: string;
    extractColorProfile: boolean;
    mediaType: MediaType;
    sceneCountMode: SceneCountMode;
    startTime?: string;
    endTime?: string;
    selfieMode?: boolean;
  } | null>(null);

  // Resume dialog state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeProgressData, setResumeProgressData] = useState<VeoProgress | null>(null);

  // History state - check if there are cached jobs
  const [hasHistory, setHasHistory] = useState(false);

  // Check for history on mount
  useEffect(() => {
    getCachedJobList().then(jobs => setHasHistory(jobs.length > 0));
  }, []);

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ref to track current jobId for use in callbacks (avoids stale closure)
  const jobIdRef = useRef<string>("");

  // Ref to track current form data for use in callbacks (avoids stale closure)
  const formDataRef = useRef<typeof currentFormData>(null);

  // Load settings from Soi-brand settings on mount
  useEffect(() => {
    async function loadSettings() {
      const settings = await getUserSettingsAsync();
      setGeminiApiKey(settings.geminiApiKey);
      setGeminiModel(settings.geminiModel);
      setSettingsLoaded(true);
    }
    loadSettings();
  }, []);

  // Listen for settings changes (when user updates settings while on VEO page)
  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as SettingsChangeEvent;
      const newSettings = customEvent.detail;

      // Update state with new settings
      if (newSettings.geminiApiKey !== undefined) {
        setGeminiApiKey(newSettings.geminiApiKey);
      }
      if (newSettings.geminiModel !== undefined) {
        setGeminiModel(newSettings.geminiModel);
      }
    };

    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
  }, []);

  // Check for resumable progress on mount
  useEffect(() => {
    if (hasProgress()) {
      const progress = loadProgress();
      if (progress && canResumeProgress(progress)) {
        setResumeProgressData(progress);
        setShowResumeDialog(true);
      }
    }
  }, []);


  // Auto dismiss error after 5 seconds (only for toast notifications, not error state)
  useEffect(() => {
    if (error && state !== "loading" && state !== "error") {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, state]);

  const handleError = useCallback(
    (errorType: string, message?: string, failedBatch?: number, totalBatches?: number, scenesCompleted?: number, debug?: Record<string, unknown>, retryable = false) => {
      // Use the detailed message from API if available, fallback to translated error
      const errorKey = errorType as keyof typeof lang.veo.errors;
      const translatedError = lang.veo.errors[errorKey];

      // Prefer detailed message over generic translation for debugging
      let errorMessage: string;
      if (message && message !== "An unexpected error occurred") {
        errorMessage = message;
      } else {
        errorMessage = translatedError || lang.veo.errors.UNKNOWN_ERROR;
      }

      // Log debug info to console in development
      if (debug) {
        console.error("[VEO Error Debug]", { errorType, message, failedBatch, totalBatches, scenesCompleted, debug });
      }

      setError(errorMessage);
      setState("error");

      // Save failed job to cache if we have enough context
      // Use refs to get the current values (avoids stale closure)
      const currentJobId = jobIdRef.current;
      const currentForm = formDataRef.current;
      if (currentJobId && currentForm) {
        const totalBatchesCalc = totalBatches
          || (summary && typeof summary.batches === 'number' ? summary.batches : undefined)
          || Math.ceil(currentForm.sceneCount / currentForm.batchSize);

        // Determine status: partial if some scenes were generated, failed if none
        const status = scenes.length > 0 ? "partial" : "failed";

        // Create minimal summary if not available
        const effectiveSummary: VeoJobSummary = summary || {
          mode: currentForm.mode,
          videoId: currentForm.videoId || "",
          youtubeUrl: currentForm.videoUrl || "",
          targetScenes: currentForm.sceneCount,
          actualScenes: scenes.length,
          batches: totalBatchesCalc,
          batchSize: currentForm.batchSize,
          voice: currentForm.audio.voiceLanguage === "no-voice" ? lang.veo.settings.voiceOptions["no-voice"] : currentForm.audio.voiceLanguage,
          charactersFound: Object.keys(characterRegistry).length,
          characters: Object.keys(characterRegistry),
          processingTime: lang.common.notAvailable || "N/A",
          createdAt: new Date().toISOString(),
        };

        setCachedJob(currentJobId, {
          videoId: currentForm.videoId || "",
          videoUrl: currentForm.videoUrl || "",
          summary: {
            ...effectiveSummary,
            actualScenes: scenes.length,
          },
          scenes,
          characterRegistry,
          script: generatedScript || undefined,
          logs: logEntries,
          status,
          error: {
            message: errorMessage,
            type: errorType as VeoErrorType,
            failedBatch,
            totalBatches: totalBatchesCalc,
            retryable,
          },
          resumeData: retryable ? {
            completedBatches: failedBatch ? failedBatch - 1 : 0,
            existingScenes: scenes,
            existingCharacters: characterRegistry,
            workflow: currentForm.workflow,
            mode: currentForm.mode,
            batchSize: currentForm.batchSize,
            sceneCount: currentForm.sceneCount,
            voice: currentForm.audio.voiceLanguage,
            useVideoTitle: currentForm.useVideoTitle,
            useVideoDescription: currentForm.useVideoDescription,
            useVideoChapters: currentForm.useVideoChapters,
            useVideoCaptions: currentForm.useVideoCaptions,
                negativePrompt: currentForm.negativePrompt,
            extractColorProfile: currentForm.extractColorProfile,
            mediaType: currentForm.mediaType,
            sceneCountMode: currentForm.sceneCountMode,
            startTime: currentForm.startTime,
            endTime: currentForm.endTime,
            selfieMode: currentForm.selfieMode,
          } : undefined,
        });

        // Update history state
        setHasHistory(true);
      }
    },
    [lang, summary, scenes, characterRegistry, generatedScript]
  );

  const handleSubmit = useCallback(
    async (options: {
      workflow: VeoWorkflow;
      videoUrl?: string;
      startTime?: string;
      endTime?: string;
      scriptText?: string;
      mode: VeoMode;
      sceneCountMode: SceneCountMode;
      sceneCount: number;
      batchSize: number;
      audio: AudioSettings;
      useVideoTitle: boolean;
      useVideoDescription: boolean;
      useVideoChapters: boolean;
      useVideoCaptions: boolean;
        negativePrompt?: string;
      extractColorProfile: boolean;
      existingColorProfile?: any; // CinematicProfile for resume
      mediaType: "image" | "video";
      selfieMode: boolean;
      // Resume parameters
      resumeFromBatch?: number;
      existingScenes?: Scene[];
      existingCharacters?: CharacterRegistry;
      retryJobId?: string; // Reuse existing job ID when retrying
    }) => {
      // Use existing job ID if retrying, otherwise generate new one
      const newJobId = options.retryJobId || `veo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      jobIdRef.current = newJobId; // Update ref immediately for callbacks
      setJobId(newJobId);

      // Reset state
      setState("loading");
      setError(null);
      setBatch(0);
      setTotalBatches(
        options.workflow === "script-to-scenes" && options.mode === "hybrid"
          ? Math.ceil(options.sceneCount / options.batchSize)
          : 1
      );
      setScenesGenerated(0);
      setLoadingMessage(lang.veo.loading.steps.initializing);
      setCharacters([]);
      setGeneratedScript(null);
      setScenes(options.existingScenes || []);
      setCharacterRegistry(options.existingCharacters || {});
      // Set or reset color profile based on existingColorProfile
      if (options.existingColorProfile) {
        setColorProfile(options.existingColorProfile);
        setColorProfileConfidence(0.8); // Default for cached profiles
      } else {
        setColorProfile(null);
        setColorProfileConfidence(0);
      }
      setLogEntries([]);

      // Save current form data for retry/error handling
      const formData = {
        workflow: options.workflow,
        videoUrl: options.videoUrl,
        videoId: options.videoUrl ? extractVideoId(options.videoUrl) : undefined,
        mode: options.mode,
        sceneCount: options.sceneCount,
        batchSize: options.batchSize,
        audio: options.audio,
        scriptText: options.scriptText,
        useVideoTitle: options.useVideoTitle,
        useVideoDescription: options.useVideoDescription,
        useVideoChapters: options.useVideoChapters,
        useVideoCaptions: options.useVideoCaptions,
            negativePrompt: options.negativePrompt,
        extractColorProfile: options.extractColorProfile,
        mediaType: options.mediaType,
        sceneCountMode: options.sceneCountMode,
        startTime: options.startTime,
        endTime: options.endTime,
        selfieMode: options.selfieMode,
      };
      formDataRef.current = formData; // Update ref immediately for callbacks
      setCurrentFormData(formData);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Include Gemini settings from Soi-brand settings
        // Also send `voice` for API backward compat (derived from audio.voiceLanguage)
        const requestBody = {
          ...options,
          voice: options.audio.voiceLanguage,
          ...(geminiApiKey && { geminiApiKey }),
          ...(geminiModel && { geminiModel }),
        };

        const response = await fetch("/api/veo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          handleError(
            errorData.data?.type || "UNKNOWN_ERROR",
            errorData.data?.message
          );
          return;
        }

        // Handle SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          handleError("NETWORK_ERROR");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: VeoSSEEvent = JSON.parse(line.slice(6));

                switch (event.event) {
                  case "progress":
                    setBatch(event.data.batch);
                    setTotalBatches(event.data.total);
                    setScenesGenerated(event.data.scenes);
                    if (event.data.message) {
                      setLoadingMessage(event.data.message);
                    }
                    break;

                  case "character":
                    setCharacters((prev) => [...prev, event.data.name]);
                    break;

                  case "script":
                    setGeneratedScript(event.data.script);
                    break;

                  case "colorProfile":
                    setColorProfile(event.data.profile);
                    setColorProfileConfidence(event.data.confidence);
                    // Cache Phase 0 result
                    if (jobIdRef.current && formDataRef.current) {
                      const fd = formDataRef.current;
                      cachePhase0(
                        jobIdRef.current,
                        fd.videoUrl || "",
                        createPhaseCacheSettings({ mode: fd.mode, sceneCount: fd.sceneCount, batchSize: fd.batchSize, workflow: fd.workflow }),
                        event.data.profile,
                        event.data.confidence
                      );
                    }
                    break;

                  case "log":
                    setLogEntries((prev) => [...prev, event.data]);
                    // Persist log to phase cache
                    if (jobIdRef.current && formDataRef.current) {
                      const fd = formDataRef.current;
                      addPhaseLog(
                        jobIdRef.current,
                        fd.videoUrl || "",
                        createPhaseCacheSettings({ mode: fd.mode, sceneCount: fd.sceneCount, batchSize: fd.batchSize, workflow: fd.workflow }),
                        event.data
                      );
                    }
                    break;

                  case "logUpdate":
                    setLogEntries((prev) =>
                      prev.map((e) => (e.id === event.data.id ? event.data : e))
                    );
                    break;

                  case "batchComplete":
                    // Cache individual Phase 2 batch
                    if (jobIdRef.current && formDataRef.current) {
                      const fd = formDataRef.current;
                      cachePhase2Batch(
                        jobIdRef.current,
                        fd.videoUrl || "",
                        createPhaseCacheSettings({ mode: fd.mode, sceneCount: fd.sceneCount, batchSize: fd.batchSize, workflow: fd.workflow }),
                        event.data.batchNumber,
                        event.data.scenes,
                        event.data.characters
                      );
                    }
                    break;

                  case "complete":
                    if (options.workflow === "url-to-script") {
                      // Step 1 complete - show script
                      setState("script-complete");
                    } else {
                      // Step 2 or combined complete - show scenes
                      setScenes(event.data.scenes);
                      setCharacterRegistry(event.data.characterRegistry);
                      setSummary(event.data.summary);
                      setJobId(event.data.jobId);
                      // Update color profile from complete event if not already set
                      if (event.data.colorProfile && !colorProfile) {
                        setColorProfile(event.data.colorProfile);
                      }
                      setState("complete");

                      // Cache the result with script and color profile for regeneration
                      if (event.data.scenes.length > 0) {
                        setCachedJob(event.data.jobId, {
                          videoId: event.data.summary.videoId,
                          videoUrl: event.data.summary.youtubeUrl,
                          summary: event.data.summary,
                          scenes: event.data.scenes,
                          characterRegistry: event.data.characterRegistry,
                          script: event.data.script, // Cache script for regeneration
                          colorProfile: event.data.colorProfile, // Cache color profile
                          logs: logEntries, // Cache log entries for scene request/response
                          status: "completed",
                        });
                        // Update history state to reflect new job
                        setHasHistory(true);
                      }
                    }

                    // Clear phase cache on successful completion
                    if (event.data.jobId) {
                      clearPhaseCache(event.data.jobId);
                    }

                    // Clear any in-progress state
                    clearProgress();
                    break;

                  case "error":
                    handleError(
                      event.data.type,
                      event.data.message,
                      event.data.failedBatch,
                      event.data.totalBatches,
                      event.data.scenesCompleted,
                      event.data.debug,
                      event.data.retryable
                    );
                    break;
                }
              } catch {
                // Skip invalid JSON (e.g., keep-alive comments)
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setState("idle");
          return;
        }
        handleError("NETWORK_ERROR");
      }
    },
    [handleError, lang, geminiApiKey, geminiModel, colorProfile]
  );

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();

    // Save cancelled job to history using refs to avoid stale closure
    const currentJobId = jobIdRef.current;
    const currentForm = formDataRef.current;
    if (currentJobId && currentForm) {
      const cancelledSummary: VeoJobSummary = summary || {
        mode: currentForm.mode,
        youtubeUrl: currentForm.videoUrl || "",
        videoId: currentForm.videoId || "",
        targetScenes: currentForm.sceneCount,
        actualScenes: scenes.length,
        batches: Math.ceil(currentForm.sceneCount / currentForm.batchSize),
        batchSize: currentForm.batchSize,
        voice: currentForm.audio.voiceLanguage === "no-voice" ? lang.veo.settings.voiceOptions["no-voice"] : currentForm.audio.voiceLanguage,
        charactersFound: Object.keys(characterRegistry).length,
        characters: Object.keys(characterRegistry),
        processingTime: lang.veo.history.cancelled,
        createdAt: new Date().toISOString(),
      };

      // Determine status: partial if some scenes were generated, failed if none
      const status = scenes.length > 0 ? "partial" : "failed";

      setCachedJob(currentJobId, {
        videoId: currentForm.videoId || "",
        videoUrl: currentForm.videoUrl || "",
        summary: cancelledSummary,
        scenes,
        characterRegistry,
        script: generatedScript || undefined,
        logs: logEntries,
        status,
        error: {
          message: lang.veo.history.jobCancelled,
          type: "UNKNOWN_ERROR",
          failedBatch: batch,
          totalBatches: totalBatches,
          retryable: true,
        },
        resumeData: {
          completedBatches: batch - 1,
          existingScenes: scenes,
          existingCharacters: characterRegistry,
          workflow: currentForm.workflow,
          mode: currentForm.mode,
          batchSize: currentForm.batchSize,
          sceneCount: currentForm.sceneCount,
          voice: currentForm.audio.voiceLanguage,
          useVideoTitle: currentForm.useVideoTitle,
          useVideoDescription: currentForm.useVideoDescription,
          useVideoChapters: currentForm.useVideoChapters,
          useVideoCaptions: currentForm.useVideoCaptions,
            negativePrompt: currentForm.negativePrompt,
          extractColorProfile: currentForm.extractColorProfile,
          mediaType: currentForm.mediaType,
          sceneCountMode: currentForm.sceneCountMode,
          startTime: currentForm.startTime,
          endTime: currentForm.endTime,
          selfieMode: currentForm.selfieMode,
        },
      });

      setHasHistory(true);
    }

    setState("idle");
  }, [lang, scenes, characterRegistry, summary, generatedScript, batch, totalBatches]);

  const handleResumeYes = useCallback(async () => {
    if (!resumeProgressData) {
      setShowResumeDialog(false);
      return;
    }

    const resumeData = getResumeData(resumeProgressData);
    if (!resumeData) {
      setShowResumeDialog(false);
      clearProgress();
      return;
    }

    setShowResumeDialog(false);

    // Pre-populate state with existing data
    setScenes(resumeData.existingScenes);
    setCharacterRegistry(resumeData.existingCharacters);
    setCharacters(Object.keys(resumeData.existingCharacters));

    // Submit with resume parameters — convert legacy voice to AudioSettings
    handleSubmit({
      workflow: "script-to-scenes",
      scriptText: resumeData.scriptText,
      mode: resumeData.mode,
      sceneCountMode: "manual",
      sceneCount: resumeData.sceneCount,
      batchSize: resumeData.batchSize,
      audio: {
        voiceLanguage: resumeData.voice,
        music: true,
        soundEffects: true,
        environmentalAudio: true,
      },
      videoUrl: resumeData.videoUrl,
      useVideoTitle: true, // Default for resume
      useVideoDescription: true, // Default for resume
      useVideoChapters: true, // Default for resume
      useVideoCaptions: true, // Default for resume
      extractColorProfile: false, // No video in script-to-scenes
      mediaType: "video", // Default for resume
      selfieMode: false, // Default for resume
      resumeFromBatch: resumeData.completedBatches,
      existingScenes: resumeData.existingScenes,
      existingCharacters: resumeData.existingCharacters,
    });
  }, [resumeProgressData, handleSubmit]);

  const handleResumeNo = useCallback(() => {
    setShowResumeDialog(false);
    setResumeProgressData(null);
    clearProgress();
  }, []);

  // Handle viewing a job from history
  const handleViewJob = useCallback(async (viewJobId: string) => {
    const cached = await getCachedJob(viewJobId);
    if (cached) {
      setScenes(cached.scenes);
      setCharacterRegistry(cached.characterRegistry);
      // Merge status and error into summary for display
      setSummary({
        ...cached.summary,
        status: cached.status,
        error: cached.error,
      });
      setJobId(viewJobId);
      setGeneratedScript(cached.script ?? null);
      setColorProfile(cached.colorProfile ?? null);
      setLogEntries(cached.logs ?? []);
      setState("complete");
    }
  }, []);

  // Handle regenerating scenes from cached script
  const handleRegenerateJob = useCallback(async (viewJobId: string) => {
    const cached = await getCachedJob(viewJobId);
    if (cached?.script) {
      // Pre-populate the script for regeneration
      setGeneratedScript(cached.script);
      setState("idle");
      // The VeoForm will use the script for script-to-scenes workflow
    }
  }, []);

  // Handle retrying a failed job from the last successful batch
  const handleRetryJob = useCallback(async (retryJobId: string) => {
    const cached = await getCachedJob(retryJobId);
    if (!cached || !cached.resumeData) {
      console.error("Cannot retry job: missing cache or resume data");
      return;
    }

    // Check if expired
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      alert(lang.veo.jobExpiredCannotRetry);
      return;
    }

    const rd = cached.resumeData;

    // Pre-populate state with existing data
    setScenes(rd.existingScenes);
    setCharacterRegistry(rd.existingCharacters);
    setCharacters(Object.keys(rd.existingCharacters));
    if (cached.script) {
      setGeneratedScript(cached.script);
    }
    // Restore color profile if it exists
    if (cached.colorProfile) {
      setColorProfile(cached.colorProfile);
      setColorProfileConfidence(0.8); // Default confidence for cached profiles
    }

    // Retry from the failed batch — restore all original settings
    // Convert legacy voice to AudioSettings for backward compat
    await handleSubmit({
      workflow: rd.workflow,
      videoUrl: cached.videoUrl,
      scriptText: rd.workflow === "script-to-scenes" || rd.workflow === "url-to-scenes"
        ? cached.script?.rawText
        : undefined,
      mode: rd.mode,
      sceneCountMode: rd.sceneCountMode ?? "auto",
      sceneCount: rd.sceneCount,
      batchSize: rd.batchSize,
      audio: {
        voiceLanguage: rd.voice,
        music: true,
        soundEffects: true,
        environmentalAudio: true,
      },
      useVideoTitle: rd.useVideoTitle ?? true,
      useVideoDescription: rd.useVideoDescription ?? true,
      useVideoChapters: rd.useVideoChapters ?? true,
      useVideoCaptions: rd.useVideoCaptions ?? true,
      negativePrompt: rd.negativePrompt,
      extractColorProfile: cached.colorProfile ? false : true, // Explicitly skip Phase 0 if we have it
      existingColorProfile: cached.colorProfile ?? undefined, // Pass existing color profile
      mediaType: rd.mediaType ?? "video",
      startTime: rd.startTime,
      endTime: rd.endTime,
      selfieMode: rd.selfieMode ?? false,
      // Resume parameters
      resumeFromBatch: rd.completedBatches,
      existingScenes: rd.existingScenes,
      existingCharacters: rd.existingCharacters,
      retryJobId: retryJobId, // Reuse the same job ID
    });
  }, [handleSubmit]);

  const handleNewAnalysis = useCallback(() => {
    setState("idle");
    setScenes([]);
    setCharacterRegistry({});
    setSummary(null);
    jobIdRef.current = "";
    formDataRef.current = null;
    setJobId("");
    setCurrentFormData(null);
    setGeneratedScript(null);
    setColorProfile(null);
    setColorProfileConfidence(0);
    setLogEntries([]);
  }, []);

  const handleDownloadScript = useCallback(() => {
    if (!generatedScript) return;

    const blob = new Blob([JSON.stringify(generatedScript, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${generatedScript.title?.replace(/[^a-z0-9]/gi, "-") || "video"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedScript]);

  const handleCopyScript = useCallback(() => {
    if (!generatedScript) return;
    navigator.clipboard.writeText(generatedScript.rawText);
  }, [generatedScript]);

  return (
    <ErrorBoundary>
      <main id="main-content" className={styles.main}>
        <div className={styles.centerScreen} role="main">
          <AnimatePresence mode="wait">
          {/* Idle State - Show Form */}
          {state === "idle" && (
            <motion.div
              key="home"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={staggerContainer}
              transition={{ duration: 0.12 }}
            >
              <div className={hasHistory ? styles.containerWithHistory : styles.container}>
                {/* Main content area */}
                <div className={styles.mainContent}>
                  {/* Header */}
                  <motion.h1 className={styles.title} variants={fadeInUp}>
                    {lang.veo.title}
                  </motion.h1>

                  {/* Form */}
                  <motion.div className={styles.formWrapper} variants={fadeInUp}>
                    {/* Resume Dialog */}
                    <AnimatePresence>
                      {showResumeDialog && resumeProgressData && (
                        <motion.div
                          className={styles.resumeDialog}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <h3>{lang.veo.resume.title}</h3>
                          <p>
                            {lang.veo.resume.message
                              .replace("{batch}", String(resumeProgressData.completedBatches))
                              .replace("{total}", String(resumeProgressData.totalBatches))}
                          </p>
                          <p className={styles.resumeDetails}>
                            {resumeProgressData.scenes.length} scenes, {Object.keys(resumeProgressData.characterRegistry).length} characters
                          </p>
                          <div className={styles.resumeButtons}>
                            <button
                              className={styles.primaryButton}
                              onClick={handleResumeYes}
                            >
                              {lang.veo.resume.continueButton}
                            </button>
                            <button
                              className={styles.secondaryButton}
                              onClick={handleResumeNo}
                            >
                              {lang.veo.resume.startNew}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <VeoForm
                      onSubmit={handleSubmit}
                      onError={setError}
                      isLoading={false}
                      hasApiKey={settingsLoaded ? !!geminiApiKey : true}
                      geminiModel={geminiModel}
                    />
                  </motion.div>
                </div>

                {/* History sidebar - only show if there are cached jobs */}
                {hasHistory && (
                  <motion.div className={styles.historySidebar} variants={fadeInUp}>
                    <VeoHistoryPanel
                      onViewJob={handleViewJob}
                      onRegenerateJob={handleRegenerateJob}
                      onRetryJob={handleRetryJob}
                      onJobsChange={() => getCachedJobList().then(jobs => setHasHistory(jobs.length > 0))}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {state === "loading" && (
            <motion.div
              key="loading"
              className={styles.containerWide}
              aria-live="polite"
              aria-busy="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <VeoLogPanel
                entries={logEntries}
                batch={batch}
                totalBatches={totalBatches}
                scenesGenerated={scenesGenerated}
                message={loadingMessage}
                characters={characters}
                onCancel={handleCancel}
              />
            </motion.div>
          )}

          {/* Script Complete State - Show generated script */}
          {state === "script-complete" && generatedScript && (
            <motion.div
              key="script-complete"
              className={styles.containerWide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.resultHeader}>
                <h2>{lang.veo.script.title}</h2>
                <button
                  className={styles.newAnalysisButton}
                  onClick={handleNewAnalysis}
                >
                  {lang.veo.script.newScript}
                </button>
              </div>

              <div className={styles.scriptResult}>
                {/* Script metadata */}
                <div className={styles.scriptMeta}>
                  <div className={styles.scriptMetaItem}>
                    <span className={styles.scriptMetaLabel}>{lang.veo.script.videoTitle}</span>
                    <span className={styles.scriptMetaValue}>{generatedScript.title}</span>
                  </div>
                  <div className={styles.scriptMetaItem}>
                    <span className={styles.scriptMetaLabel}>{lang.veo.script.duration}</span>
                    <span className={styles.scriptMetaValue}>{generatedScript.duration}</span>
                  </div>
                  <div className={styles.scriptMetaItem}>
                    <span className={styles.scriptMetaLabel}>{lang.veo.script.language}</span>
                    <span className={styles.scriptMetaValue}>{generatedScript.language}</span>
                  </div>
                  <div className={styles.scriptMetaItem}>
                    <span className={styles.scriptMetaLabel}>{lang.veo.script.characters}</span>
                    <span className={styles.scriptMetaValue}>
                      {generatedScript.characters.length > 0
                        ? generatedScript.characters.join(", ")
                        : lang.veo.script.noCharacters}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className={styles.scriptSection}>
                  <h3>{lang.veo.script.summary}</h3>
                  <p className={styles.scriptSummary}>{generatedScript.summary}</p>
                </div>

                {/* Raw transcript */}
                <div className={styles.scriptSection}>
                  <div className={styles.scriptSectionHeader}>
                    <h3>{lang.veo.script.transcript}</h3>
                    <div className={styles.scriptActions}>
                      <button
                        className={styles.scriptActionButton}
                        onClick={handleCopyScript}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                        {lang.veo.script.copy}
                      </button>
                      <button
                        className={styles.scriptActionButton}
                        onClick={handleDownloadScript}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        {lang.veo.script.download}
                      </button>
                    </div>
                  </div>
                  <pre className={styles.scriptContent}>{generatedScript.rawText}</pre>
                </div>

                {/* Next step hint */}
                <div className={styles.nextStepHint}>
                  <p>{lang.veo.script.nextStepHint}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {state === "error" && (
            <motion.div
              key="error"
              className={styles.container}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.errorState}>
                <div className={styles.errorIcon}>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className={styles.errorMessage}>{error}</p>
                <button
                  className={styles.primaryButton}
                  onClick={handleNewAnalysis}
                >
                  {lang.loadingState.retryNow}
                </button>
              </div>
            </motion.div>
          )}

          {/* Complete State - Show Results */}
          {state === "complete" && summary && (
            <motion.div
              key="complete"
              className={styles.containerWide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.resultHeader}>
                <h2>{lang.veo.result.title}</h2>
                <button
                  className={styles.newAnalysisButton}
                  onClick={handleNewAnalysis}
                >
                  {lang.common.analyze}
                </button>
              </div>

              <VeoSceneDisplay
                scenes={scenes}
                characterRegistry={characterRegistry}
                summary={summary}
                jobId={jobId}
                script={generatedScript ?? undefined}
                colorProfile={colorProfile ?? undefined}
                colorProfileConfidence={colorProfileConfidence}
                logEntries={logEntries}
                onViewJob={handleViewJob}
                onRegenerateJob={handleRegenerateJob}
                onRetryJob={handleRetryJob}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast notifications */}
      <AnimatePresence>
        {error && state !== "loading" && state !== "error" && (
          <div className={styles.toastContainer}>
            <motion.div
              className={`${styles.toast} ${styles.toastError}`}
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{
                  marginLeft: "0.25rem",
                  opacity: 0.5,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  color: "inherit",
                }}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
        </AnimatePresence>
      </main>
    </ErrorBoundary>
  );
}
