"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { getUserSettingsAsync, SETTINGS_CHANGE_EVENT, SettingsChangeEvent } from "@/lib/userSettings";
import { GeminiModel } from "@/lib/types";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  PromptMode,
  AudioSettings,
  PromptWorkflow,
  Scene,
  CharacterRegistry,
  PromptJobSummary,
  PromptSSEEvent,
  GeneratedScript,
  PromptErrorType,
  CinematicProfile,
  MediaType,
  SceneCountMode,
  GeminiLogEntry,
  CachedPromptJob,
  setCachedJob,
  getCachedJob,
  getCachedJobList,
  hasProgress,
  loadProgress,
  clearProgress,
  getResumeData,
  canResumeProgress,
  PromptProgress,
  extractVideoId,
  fixOrphanedJobs,
  buildResumeConfig,
  getResumeConfig,
} from "@/lib/prompt";
import {
  AUTO_RETRY_MAX_ATTEMPTS,
  AUTO_RETRY_BASE_DELAY_MS,
  AUTO_RETRY_MAX_DELAY_MS,
  AUTO_RETRY_ERROR_TYPES,
} from "@/lib/prompt/constants";
// D1-only: Phase cache removed - logs are stored in CachedPromptJob.logs
import { dispatchJobUpdateEvent } from "@/lib/prompt/storage-utils";
import { PromptForm, PromptSceneDisplay, PromptHistoryPanel, PromptLogPanel } from "@/components/prompt";
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

export default function PromptPage() {
  const lang = useLang();
  const [state, setState] = useState<PageState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Settings from Soi-brand settings button
  const [geminiApiKey, setGeminiApiKey] = useState<string | undefined>(undefined);
  const [geminiModel, setGeminiModel] = useState<GeminiModel | undefined>(undefined);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"unverified" | "verifying" | "valid" | "invalid">("unverified");

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
  const [summary, setSummary] = useState<PromptJobSummary | null>(null);
  const [jobId, setJobId] = useState<string>("");

  // Color profile state (Phase 0)
  const [colorProfile, setColorProfile] = useState<CinematicProfile | null>(null);
  const [colorProfileConfidence, setColorProfileConfidence] = useState<number>(0);

  // Logging state
  const [logEntries, setLogEntries] = useState<GeminiLogEntry[]>([]);

  // Current form data (for retry/resume)
  const [currentFormData, setCurrentFormData] = useState<{
    workflow: PromptWorkflow;
    videoUrl?: string;
    videoId?: string;
    mode: PromptMode;
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
  const [resumeProgressData, setResumeProgressData] = useState<PromptProgress | null>(null);

  // History state - check if there are cached jobs
  const [hasHistory, setHasHistory] = useState(false);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-retry state
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [_isAutoRetrying, setIsAutoRetrying] = useState(false); // Prefix with _ to indicate future use
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for history on mount and when database key changes
  // BUG #8 FIX: Use mounted flag to prevent state updates after unmount
  useEffect(() => {
    let mounted = true;

    // Fix any orphaned jobs (in_progress but have scenes) on mount - D1-only
    const fixD1Jobs = async () => {
      const settings = await getUserSettingsAsync();
      if (settings.databaseKey) {
        try {
          // D1-only: Fix orphaned jobs via API
          const fixedCount = await fixOrphanedJobs();
          if (fixedCount > 0) {
            console.log(`[Prompt] Fixed ${fixedCount} orphaned job(s) in D1`);
          }
        } catch (error) {
          console.error('[Prompt] Failed to fix D1 orphaned jobs:', error);
        }
      }
    };

    fixD1Jobs();

    getCachedJobList().then(jobs => {
      if (mounted) setHasHistory(jobs.length > 0);
    });

    // Listen for database key changes (user enters key in settings)
    const handleDatabaseKeyChange = () => {
      getCachedJobList().then(jobs => {
        if (mounted) setHasHistory(jobs.length > 0);
      });
    };
    window.addEventListener('database-key-changed', handleDatabaseKeyChange);
    return () => {
      mounted = false;
      window.removeEventListener('database-key-changed', handleDatabaseKeyChange);
    };
  }, []);

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any pending SSE requests on component unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Ref to track current jobId for use in callbacks (avoids stale closure)
  const jobIdRef = useRef<string>("");

  // Ref to track current form data for use in callbacks (avoids stale closure)
  const formDataRef = useRef<typeof currentFormData>(null);

  // Refs to track current state values for use in SSE handlers (avoids stale closures)
  // BUG #2, #3, #4, #7: These refs ensure handlers always have access to the latest values
  const scenesRef = useRef<Scene[]>([]);
  const characterRegistryRef = useRef<CharacterRegistry>({});
  const generatedScriptRef = useRef<GeneratedScript | null>(null);
  const colorProfileRef = useRef<CinematicProfile | null>(null);
  const logEntriesRef = useRef<GeminiLogEntry[]>([]);
  const summaryRef = useRef<PromptJobSummary | null>(null);

  // Sync state values to refs for use in SSE handlers (avoids stale closures)
  // BUG #2: scenes and characterRegistry must be synced to refs
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { characterRegistryRef.current = characterRegistry; }, [characterRegistry]);
  // BUG #3: script and colorProfile must be synced to refs
  useEffect(() => { generatedScriptRef.current = generatedScript; }, [generatedScript]);
  useEffect(() => { colorProfileRef.current = colorProfile; }, [colorProfile]);
  // BUG #1: logEntries must be synced to refs for handleError
  useEffect(() => { logEntriesRef.current = logEntries; }, [logEntries]);
  // Sync summary to ref for handleError and handleCancel
  useEffect(() => { summaryRef.current = summary; }, [summary]);

  // Load settings from Soi-brand settings on mount
  useEffect(() => {
    async function loadSettings() {
      const settings = await getUserSettingsAsync();
      setGeminiApiKey(settings.geminiApiKey);
      setGeminiModel(settings.geminiModel);
      setSettingsLoaded(true);

      // If database key is available, refresh hasHistory (cloud jobs may exist)
      // This runs AFTER the initial mount check, so we need to re-check
      if (settings.databaseKey) {
        const jobs = await getCachedJobList();
        setHasHistory(jobs.length > 0);
        window.dispatchEvent(new CustomEvent('database-key-changed'));
      }

      // Verify API key if present
      if (settings.geminiApiKey) {
        setKeyStatus("verifying");
        try {
          const response = await fetch("/api/prompt/verify-key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: settings.geminiApiKey }),
          });
          const result = await response.json();
          if (result.valid) {
            setKeyStatus("valid");
          } else {
            setKeyStatus("invalid");
          }
        } catch {
          setKeyStatus("invalid");
        }
      }
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

  // ============================================================================
  // Consolidated job save helper - replaces 5 inline setCachedJob call sites
  // ============================================================================
  const saveJobState = useCallback(
    (
      status: "in_progress" | "completed" | "partial" | "failed",
      options?: {
        error?: CachedPromptJob["error"];
        completedBatches?: number;
        lastInteractionId?: string;
        /** Override scenes/characters (e.g. from complete event) */
        scenes?: Scene[];
        characterRegistry?: CharacterRegistry;
        summary?: PromptJobSummary;
        script?: GeneratedScript;
        colorProfile?: CinematicProfile;
      },
    ) => {
      const currentJobId = jobIdRef.current;
      const fd = formDataRef.current;
      if (!currentJobId || !fd) return;

      const currentScenes = options?.scenes ?? scenesRef.current;
      const currentCharacters = options?.characterRegistry ?? characterRegistryRef.current;
      const currentScript = options?.script ?? generatedScriptRef.current;
      const currentColorProfile = options?.colorProfile ?? colorProfileRef.current;

      // Sanitize logs: mark stale "pending" entries — show error for failed jobs, completed for success
      const isFailed = status === "failed" || status === "in_progress";
      const currentLogs = logEntriesRef.current.map(log =>
        log.status === "pending" ? {
          ...log,
          status: "completed" as const,
          ...(isFailed && {
            error: { type: "INCOMPLETE", message: "Request did not complete" },
            response: { ...log.response, success: false, parsedSummary: "(no response received)" },
          }),
        } : log
      );

      // Build summary: prefer provided > ref > default
      const effectiveSummary: PromptJobSummary = options?.summary ?? summaryRef.current ?? {
        mode: fd.mode,
        videoId: fd.videoId || "",
        youtubeUrl: fd.videoUrl || "",
        targetScenes: fd.sceneCount,
        actualScenes: currentScenes.length,
        batches: Math.ceil(fd.sceneCount / fd.batchSize),
        batchSize: fd.batchSize,
        voice: fd.audio.voiceLanguage === "no-voice"
          ? lang.prompt.settings.voiceOptions["no-voice"]
          : fd.audio.voiceLanguage,
        charactersFound: Object.keys(currentCharacters).length,
        characters: Object.keys(currentCharacters),
        processingTime: status === "completed" ? "" : lang.prompt.history.inProgress || "In progress...",
        createdAt: new Date().toISOString(),
      };

      // Build resumeConfig only for non-completed jobs
      const resumeConfig = status !== "completed"
        ? buildResumeConfig(fd, options?.completedBatches ?? 0, options?.lastInteractionId)
        : undefined;

      setCachedJob(currentJobId, {
        videoId: fd.videoId || "",
        videoUrl: fd.videoUrl || "",
        summary: { ...effectiveSummary, actualScenes: currentScenes.length },
        scenes: currentScenes,
        characterRegistry: currentCharacters,
        script: currentScript || undefined,
        colorProfile: currentColorProfile || undefined,
        logs: currentLogs,
        status,
        error: status === "completed" ? undefined : options?.error,
        lastInteractionId: options?.lastInteractionId,
        resumeConfig,
        // Clear old resumeData format on new writes
        resumeData: undefined,
      });

      dispatchJobUpdateEvent(currentJobId);
      setHasHistory(true);
    },
    [lang],
  );

  const handleError = useCallback(
    (errorType: string, message?: string, failedBatch?: number, totalBatches?: number, scenesCompleted?: number, debug?: Record<string, unknown>, retryable = false) => {
      // Use the detailed message from API if available, fallback to translated error
      const errorKey = errorType as keyof typeof lang.prompt.errors;
      const translatedError = lang.prompt.errors[errorKey];

      // Prefer detailed message over generic translation for debugging
      let errorMessage: string;
      if (message && message !== "An unexpected error occurred") {
        errorMessage = message;
      } else {
        errorMessage = translatedError || lang.prompt.errors.UNKNOWN_ERROR;
      }

      // Log debug info to console in development
      if (debug) {
        console.error("[Prompt Error Debug]", { errorType, message, failedBatch, totalBatches, scenesCompleted, debug });
      }

      setError(errorMessage);
      setState("error");

      // Save failed job to cache
      const status = scenesRef.current.length > 0 ? "partial" : "failed";
      saveJobState(status as "partial" | "failed", {
        error: retryable ? {
          message: errorMessage,
          type: errorType as PromptErrorType,
          failedBatch,
          totalBatches: totalBatches
            || (summaryRef.current && typeof summaryRef.current.batches === 'number' ? summaryRef.current.batches : undefined)
            || Math.ceil((formDataRef.current?.sceneCount ?? 0) / (formDataRef.current?.batchSize ?? 1)),
          retryable,
        } : {
          message: errorMessage,
          type: errorType as PromptErrorType,
          failedBatch,
          retryable: false,
        },
        completedBatches: failedBatch ? failedBatch - 1 : 0,
      });
    },
    // BUG #1 FIX: Removed state dependencies - using refs instead to avoid stale closures
    [lang, saveJobState]
  );

  // Auto-retry logic for retryable errors
  const attemptAutoRetry = useCallback(
    (errorType: string, failedBatch?: number): boolean => {
      // Check if error type is auto-retryable
      if (!AUTO_RETRY_ERROR_TYPES.includes(errorType as typeof AUTO_RETRY_ERROR_TYPES[number])) {
        console.log(`[Auto-retry] Error type ${errorType} not retryable`);
        setRetryAttempt(0);
        return false;
      }

      const currentForm = formDataRef.current;
      if (!currentForm) {
        console.log("[Auto-retry] No form data available");
        setRetryAttempt(0);
        return false;
      }

      // Check if we've exceeded max retry attempts
      const nextAttempt = retryAttempt + 1;
      if (nextAttempt > AUTO_RETRY_MAX_ATTEMPTS) {
        console.log(`[Auto-retry] Max attempts (${AUTO_RETRY_MAX_ATTEMPTS}) exceeded`);
        setRetryAttempt(0);
        return false;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        AUTO_RETRY_BASE_DELAY_MS * Math.pow(2, retryAttempt),
        AUTO_RETRY_MAX_DELAY_MS
      );

      console.log(`[Auto-retry] Scheduling retry ${nextAttempt}/${AUTO_RETRY_MAX_ATTEMPTS} in ${delay}ms`);
      setRetryAttempt(nextAttempt);
      setIsAutoRetrying(true);
      setLoadingMessage(`Auto-retry ${nextAttempt}/${AUTO_RETRY_MAX_ATTEMPTS} in ${Math.ceil(delay / 1000)}s...`);
      setState("loading"); // Keep in loading state

      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Schedule retry
      retryTimeoutRef.current = setTimeout(() => {
        setIsAutoRetrying(false);
        const currentScenes = scenesRef.current;
        const currentCharacters = characterRegistryRef.current;
        const currentColorProfile = colorProfileRef.current;

        // Calculate completed batches from failedBatch
        const completedBatches = failedBatch ? failedBatch - 1 : 0;

        console.log(`[Auto-retry] Executing retry ${nextAttempt} from batch ${completedBatches}`);

        // Retry the job by calling handleSubmit with resume parameters
        // We use a local reference to avoid dependency issues
        const retryOptions = {
          workflow: currentForm.workflow,
          videoUrl: currentForm.videoUrl,
          scriptText: currentForm.scriptText,
          mode: currentForm.mode,
          sceneCountMode: currentForm.sceneCountMode,
          sceneCount: currentForm.sceneCount,
          batchSize: currentForm.batchSize,
          audio: currentForm.audio,
          useVideoTitle: currentForm.useVideoTitle,
          useVideoDescription: currentForm.useVideoDescription,
          useVideoChapters: currentForm.useVideoChapters,
          useVideoCaptions: currentForm.useVideoCaptions,
          negativePrompt: currentForm.negativePrompt,
          // On retry: never re-run Phase 0 — pass existing color profile
          extractColorProfile: false,
          existingColorProfile: currentColorProfile || undefined,
          mediaType: currentForm.mediaType,
          selfieMode: currentForm.selfieMode || false,
          startTime: currentForm.startTime,
          endTime: currentForm.endTime,
          // Resume parameters — only retry from the failed batch
          resumeFromBatch: completedBatches,
          existingScenes: currentScenes,
          existingCharacters: currentCharacters,
          resumeJobId: jobIdRef.current, // Keep same job ID
        };

        // Dispatch custom event to trigger retry (handled in useEffect)
        window.dispatchEvent(new CustomEvent('prompt-auto-retry', { detail: retryOptions }));
      }, delay);

      return true;
    },
    [retryAttempt]
  );

  // Handle auto-retry event
  useEffect(() => {
    const handleAutoRetryEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const retryOptions = customEvent.detail;
      // Call handleSubmit through the ref pattern
      handleSubmitRef.current?.(retryOptions);
    };

    window.addEventListener('prompt-auto-retry', handleAutoRetryEvent);
    return () => window.removeEventListener('prompt-auto-retry', handleAutoRetryEvent);
  }, []);

  // Reference to handleSubmit for auto-retry
  const handleSubmitRef = useRef<typeof handleSubmit | null>(null);

  const handleSubmit = useCallback(
    async (options: {
      workflow: PromptWorkflow;
      videoUrl?: string;
      startTime?: string;
      endTime?: string;
      scriptText?: string;
      mode: PromptMode;
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
      resumeJobId?: string; // Reuse existing job ID when retrying (must match server schema)
      lastInteractionId?: string; // Gemini session continuity for retry
    }) => {
      // Use existing job ID if retrying, otherwise generate new one
      const newJobId = options.resumeJobId || `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      jobIdRef.current = newJobId; // Update ref immediately for callbacks
      setJobId(newJobId);

      // Reset state
      setState("loading");
      setError(null);
      setBatch(0);
      // Only reset retry attempts on fresh jobs, not retries
      if (!options.resumeJobId) {
        setRetryAttempt(0);
        setIsAutoRetrying(false);
      }
      setTotalBatches(
        options.workflow === "script-to-scenes" && options.mode === "hybrid"
          ? Math.ceil(options.sceneCount / options.batchSize)
          : 1
      );
      setScenesGenerated(0);
      setLoadingMessage(lang.prompt.loading.steps.initializing);
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
      // Preserve logs from previous batches on retry, clear on fresh jobs
      if (options.resumeFromBatch && options.resumeFromBatch > 0) {
        // Mark stale "pending" logs from failed attempt with error status
        const sanitized = logEntriesRef.current.map(log =>
          log.status === "pending" ? {
            ...log,
            status: "completed" as const,
            error: { type: "RETRY", message: "Failed — retrying" },
            response: {
              ...log.response,
              success: false,
              parsedSummary: "Failed — retrying from this batch",
            },
          } : log
        );
        setLogEntries(sanitized);
        logEntriesRef.current = sanitized;
      } else {
        setLogEntries([]);
        logEntriesRef.current = [];
      }

      // SYNC-001 FIX: Initialize refs synchronously BEFORE SSE processing starts
      // This ensures handleError and handleCancel have correct values even before
      // the async useEffect-based sync runs
      scenesRef.current = options.existingScenes || [];
      characterRegistryRef.current = options.existingCharacters || {};
      generatedScriptRef.current = null;
      colorProfileRef.current = options.existingColorProfile || null;
      summaryRef.current = null;

      // Save current form data for retry/error handling
      const formData = {
        workflow: options.workflow,
        videoUrl: options.videoUrl,
        videoId: options.videoUrl ? (extractVideoId(options.videoUrl) ?? undefined) : undefined,
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

      // Abort any existing job before starting new one (prevents race conditions)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Save job as "in_progress" immediately
      saveJobState("in_progress", {
        completedBatches: options.resumeFromBatch || 0,
      });

      // BUG FIX: Declare stream timeout ID outside try block for catch block access
      let streamTimeoutId: NodeJS.Timeout | null = null;

      try {
        // Include Gemini settings from Soi-brand settings
        // Also send `voice` for API backward compat (derived from audio.voiceLanguage)
        // BUG FIX #28: Always send resumeJobId to ensure client and server use the same job ID
        // Without this, the server generates a different ID and the complete event gets discarded
        const requestBody = {
          ...options,
          voice: options.audio.voiceLanguage,
          resumeJobId: jobIdRef.current, // Ensure server uses client's job ID
          ...(geminiApiKey && { geminiApiKey }),
          ...(geminiModel && { geminiModel }),
        };

        const response = await fetch("/api/prompt", {
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

        // BUG FIX: Add stream timeout detection (5 minutes for video analysis)
        const STREAM_INACTIVITY_TIMEOUT_MS = 300000; // 5 minutes
        let lastActivityTime = Date.now();

        const resetStreamTimeout = () => {
          lastActivityTime = Date.now();
          if (streamTimeoutId) clearTimeout(streamTimeoutId);
          streamTimeoutId = setTimeout(() => {
            const inactiveMs = Date.now() - lastActivityTime;
            if (inactiveMs >= STREAM_INACTIVITY_TIMEOUT_MS) {
              console.error('[Prompt] Stream timeout: No data received for 5 minutes');
              reader.cancel();
              handleError(
                "TIMEOUT",
                "Stream timed out after 5 minutes of inactivity. The server may still be processing - please check job history.",
                undefined,
                undefined,
                undefined,
                undefined,
                true // retryable
              );
            }
          }, STREAM_INACTIVITY_TIMEOUT_MS);
        };

        // Initialize timeout
        resetStreamTimeout();

        // Helper to process SSE lines from buffer
        // SSE messages may contain multiple lines (id, event, data, etc.)
        // We need to extract the data line from each message
        const processSSELines = (linesToProcess: string[]) => {
          for (const message of linesToProcess) {
            // Abort check inside event loop to stop processing buffered events
            if (abortControllerRef.current?.signal.aborted) break;

            // SSE messages can be multi-line (id:\ndata:\n)
            // Find the data line within the message
            const lines = message.split("\n");
            let dataLine: string | null = null;

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                dataLine = line;
                break;
              }
            }

            if (dataLine) {
              try {
                const event: PromptSSEEvent = JSON.parse(dataLine.slice(6));

                // CRITICAL: Discard events from stale jobs (prevents race condition
                // when user starts new job before previous one completes)
                const eventJobId = (event.data as { jobId?: string })?.jobId;
                if (eventJobId && eventJobId !== jobIdRef.current) {
                  console.warn(`[Prompt] Discarding stale event from job ${eventJobId}, current job is ${jobIdRef.current}`);
                  continue;
                }

                handleSSEEvent(event);
              } catch {
                // Skip invalid JSON (e.g., keep-alive comments)
              }
            }
          }
        };

        // Helper to handle individual SSE events
        const handleSSEEvent = (event: PromptSSEEvent) => {
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
              // D1-only: Color profile is saved via setCachedJob with full job data
              break;

            case "videoAnalysis":
              // Combined video analysis event (Phase 0 + Phase 1 merged)
              // Contains both color profile and pre-extracted characters
              setColorProfile(event.data.colorProfile);
              setColorProfileConfidence(event.data.confidence);
              // Characters will be sent separately via "character" events for UI
              // D1-only: All data saved via setCachedJob save point
              break;

            case "log":
              setLogEntries((prev) => [...prev, event.data]);
              // D1-only: Logs are saved via setCachedJob with full job data
              break;

            case "logUpdate":
              setLogEntries((prev) =>
                prev.map((e) => (e.id === event.data.id ? event.data : e))
              );
              break;

            case "batchComplete":
              // D1-only: Batch data saved via setCachedJob at batch end
              if (jobIdRef.current && formDataRef.current) {
                const fd = formDataRef.current;
                // BUG #2 FIX: Use refs for current state values to avoid stale closures
                // Without refs, scenes/characterRegistry are captured at handler creation time
                // causing batch data loss (e.g., batch 2 loses batch 1 data)
                const currentScenes = scenesRef.current;
                const currentCharacters = characterRegistryRef.current;

                // BUG #8 FIX: Deep merge characters instead of shallow spread
                // Shallow merge overwrites character details; deep merge combines them
                // CharacterRegistry values can be string | CharacterSkeleton
                const mergedCharacters: CharacterRegistry = { ...currentCharacters };
                for (const [name, details] of Object.entries(event.data.characters)) {
                  const existing = mergedCharacters[name];
                  if (existing && typeof existing === 'object' && typeof details === 'object') {
                    // Both are CharacterSkeleton objects - deep merge them
                    // This handles nested properties like outfit.accessory, features, etc.
                    const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
                      const result = { ...target };
                      for (const key of Object.keys(source)) {
                        const targetVal = target[key];
                        const sourceVal = source[key];
                        if (
                          targetVal && sourceVal &&
                          typeof targetVal === 'object' && !Array.isArray(targetVal) &&
                          typeof sourceVal === 'object' && !Array.isArray(sourceVal)
                        ) {
                          // Recursively merge nested objects
                          result[key] = deepMerge(
                            targetVal as Record<string, unknown>,
                            sourceVal as Record<string, unknown>
                          );
                        } else if (sourceVal !== undefined) {
                          // Use source value (arrays and primitives overwrite)
                          result[key] = sourceVal;
                        }
                      }
                      return result;
                    };
                    mergedCharacters[name] = deepMerge(
                      existing as unknown as Record<string, unknown>,
                      details as unknown as Record<string, unknown>
                    ) as unknown as typeof existing;
                  } else {
                    // Either is string or doesn't exist - use new value
                    mergedCharacters[name] = details;
                  }
                }

                // Update in_progress job with latest batch data
                const allScenes = [...currentScenes, ...event.data.scenes];
                const allCharacters = mergedCharacters;

                // CRITICAL FIX: Update refs synchronously BEFORE React state
                // useEffect-based ref sync is async and can cause race conditions
                // between rapid batch completions
                scenesRef.current = allScenes;
                characterRegistryRef.current = allCharacters;

                // Also update React state so UI reflects the new data
                setScenes(allScenes);
                setCharacterRegistry(allCharacters);

                // Check if this is the last batch - don't include resumeConfig since complete event follows
                const batchTotalBatches = Math.ceil(fd.sceneCount / fd.batchSize);
                const isLastBatch = event.data.batchNumber >= batchTotalBatches - 1;
                const nextBatchToProcess = event.data.batchNumber + 1;
                const lastInteractionId = event.data.lastInteractionId as string | undefined;

                // Save in_progress state (saveJobState reads refs for scenes/characters)
                saveJobState("in_progress", {
                  completedBatches: isLastBatch ? undefined : nextBatchToProcess,
                  lastInteractionId,
                  scenes: allScenes,
                  characterRegistry: allCharacters,
                });
              }
              break;

            case "complete":
              // BUG #6 FIX: Use formDataRef for workflow instead of captured options
              // options.workflow is captured at handler creation time and may be stale
              const currentWorkflow = formDataRef.current?.workflow;
              if (currentWorkflow === "url-to-script") {
                // Step 1 complete - show script
                setState("script-complete");
              } else {
                // Step 2 or combined complete - show scenes
                setScenes(event.data.scenes);
                setCharacterRegistry(event.data.characterRegistry);
                setSummary(event.data.summary);
                setJobId(event.data.jobId);
                // BUG #7 FIX: Use ref for colorProfile comparison
                // Update color profile from complete event if not already set
                if (event.data.colorProfile && !colorProfileRef.current) {
                  setColorProfile(event.data.colorProfile);
                }
                setState("complete");

                // Cache the completed result
                if (event.data.scenes.length > 0) {
                  saveJobState("completed", {
                    scenes: event.data.scenes,
                    characterRegistry: event.data.characterRegistry,
                    summary: event.data.summary,
                    script: event.data.script || undefined,
                    colorProfile: event.data.colorProfile || undefined,
                  });
                }
              }

              // D1-only: Phase cache removed - data stored in D1

              // Clear any in-progress state
              clearProgress();
              break;

            case "error":
              // Try auto-retry first for retryable errors
              const shouldAutoRetry = event.data.retryable && attemptAutoRetry(
                event.data.type,
                event.data.failedBatch
              );

              if (!shouldAutoRetry) {
                // No auto-retry - show error to user
                handleError(
                  event.data.type,
                  event.data.message,
                  event.data.failedBatch,
                  event.data.totalBatches,
                  event.data.scenesCompleted,
                  event.data.debug,
                  event.data.retryable
                );
              }
              break;
          }
        };

        // BUG-003 FIX: Track consecutive empty reads to prevent infinite loop
        let consecutiveEmptyReads = 0;
        const MAX_CONSECUTIVE_EMPTY_READS = 10;

        while (true) {
          // BUG #5 FIX: Check abort signal before reading to prevent cancelled jobs
          // from continuing to process events and causing state corruption
          if (abortControllerRef.current?.signal.aborted) {
            reader.cancel();
            break;
          }

          const { done, value } = await reader.read();

          // BUG-003 FIX: Protect against infinite loop from empty reads
          if (!done && (!value || value.length === 0)) {
            consecutiveEmptyReads++;
            if (consecutiveEmptyReads >= MAX_CONSECUTIVE_EMPTY_READS) {
              console.error('[Prompt] Too many consecutive empty reads, aborting stream');
              if (streamTimeoutId) clearTimeout(streamTimeoutId);
              reader.cancel();
              handleError("NETWORK_ERROR", "Stream returned too many empty responses", undefined, undefined, undefined, undefined, true);
              break;
            }
            continue;
          }
          consecutiveEmptyReads = 0; // Reset on successful read

          if (done) {
            // Clean up timeout
            if (streamTimeoutId) clearTimeout(streamTimeoutId);

            // BUG #9 FIX: Process any remaining data in buffer when stream ends
            // The complete event might be partially buffered and would be lost without this
            if (buffer.trim()) {
              // Flush the decoder and add any remaining bytes
              buffer += decoder.decode();
              const finalLines = buffer.split("\n\n").filter(line => line.trim());
              processSSELines(finalLines);
            }
            break;
          }

          // Reset timeout on data received
          resetStreamTimeout();

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          processSSELines(lines);
        }
      } catch (err) {
        // Clean up timeout
        if (streamTimeoutId) clearTimeout(streamTimeoutId);

        if (err instanceof Error && err.name === "AbortError") {
          setState("idle");
          return;
        }
        handleError("NETWORK_ERROR");
      }
    },
    // Removed colorProfile from deps - using colorProfileRef instead to avoid stale closures
    [handleError, lang, geminiApiKey, geminiModel, saveJobState]
  );

  // Keep ref updated for auto-retry
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Cleanup auto-retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();

    // Clear any pending auto-retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setRetryAttempt(0);
    setIsAutoRetrying(false);

    // Save cancelled job to history
    const cancelStatus = scenesRef.current.length > 0 ? "partial" : "failed";
    saveJobState(cancelStatus as "partial" | "failed", {
      error: {
        message: lang.prompt.history.jobCancelled,
        type: "UNKNOWN_ERROR",
        failedBatch: batch,
        totalBatches: totalBatches,
        retryable: true,
      },
      completedBatches: Math.max(0, batch - 1),
    });

    setState("idle");
  // Removed summary from deps - using summaryRef instead to avoid stale closures
  // batch and totalBatches are safe since they're only used for error metadata
  }, [lang, batch, totalBatches, saveJobState]);

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

    // D1-only: Resume data is the single source of truth
    const existingScenes = resumeData.existingScenes;
    const existingCharacters = resumeData.existingCharacters;
    const completedBatches = resumeData.completedBatches;

    // Pre-populate state with existing data
    setScenes(existingScenes);
    setCharacterRegistry(existingCharacters);
    setCharacters(Object.keys(existingCharacters));

    // Determine workflow based on whether we have scriptText
    // Direct mode (url-to-scenes) doesn't have scriptText
    const isDirectMode = !resumeData.scriptText;
    const workflow = isDirectMode ? "url-to-scenes" : "script-to-scenes";

    // Submit with resume parameters — convert legacy voice to AudioSettings
    handleSubmit({
      workflow,
      scriptText: resumeData.scriptText, // undefined for Direct mode
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
      extractColorProfile: true, // Always extract on resume (D1 stores in job)
      mediaType: "video", // Default for resume
      selfieMode: false, // Default for resume
      resumeFromBatch: completedBatches,
      existingScenes,
      existingCharacters,
      lastInteractionId: resumeData.lastInteractionId,
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
      // The PromptForm will use the script for script-to-scenes workflow
    }
  }, []);

  // Handle retrying a failed job from the last successful batch
  const handleRetryJob = useCallback(async (retryJobId: string) => {
    const cached = await getCachedJob(retryJobId);
    const config = cached ? getResumeConfig(cached) : null;

    // Check if we have resume config (handles both new and old format)
    if (!cached || !config) {
      console.error("Cannot retry job: missing cache or resume data");

      // If job has valid scenes, it's actually completed - just view it
      if (cached && cached.scenes && cached.scenes.length > 0) {
        console.log("Job has scenes but missing resume data - treating as completed");
        handleViewJob(retryJobId);
        return;
      }

      setError(lang.prompt.cacheExpired || "Job cache expired. Cannot resume.");
      return;
    }

    // Check if expired
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      alert(lang.prompt.jobExpiredCannotRetry);
      return;
    }

    // Scenes and characters always come from top-level (not resumeData)
    const existingScenes = cached.scenes;
    const existingCharacters = cached.characterRegistry;
    const completedBatches = config.completedBatches ?? 0;
    const cachedColorProfile = cached.colorProfile;

    // Pre-populate state with existing data
    setScenes(existingScenes);
    setCharacterRegistry(existingCharacters);
    setCharacters(Object.keys(existingCharacters));
    if (cached.script) {
      setGeneratedScript(cached.script);
    }
    if (cachedColorProfile) {
      setColorProfile(cachedColorProfile);
      setColorProfileConfidence(0.8);
    }

    // Retry from the failed batch — restore all original settings
    await handleSubmit({
      workflow: config.workflow ?? "url-to-scenes",
      videoUrl: cached.videoUrl,
      scriptText: (config.workflow === "script-to-scenes" || config.workflow === "url-to-scenes")
        ? cached.script?.rawText
        : undefined,
      mode: config.mode ?? "hybrid",
      sceneCountMode: config.sceneCountMode ?? "auto",
      sceneCount: config.sceneCount ?? 40,
      batchSize: config.batchSize ?? 30,
      audio: {
        voiceLanguage: config.voice ?? "no-voice",
        music: true,
        soundEffects: true,
        environmentalAudio: true,
      },
      useVideoTitle: config.useVideoTitle ?? true,
      useVideoDescription: config.useVideoDescription ?? true,
      useVideoChapters: config.useVideoChapters ?? true,
      useVideoCaptions: config.useVideoCaptions ?? true,
      negativePrompt: config.negativePrompt,
      extractColorProfile: !cachedColorProfile, // Skip Phase 0 if we have cached color profile
      existingColorProfile: cachedColorProfile,
      mediaType: config.mediaType ?? "video",
      startTime: config.startTime,
      endTime: config.endTime,
      selfieMode: config.selfieMode ?? false,
      // Resume parameters
      resumeFromBatch: completedBatches,
      existingScenes,
      existingCharacters,
      resumeJobId: retryJobId,
      lastInteractionId: config.lastInteractionId,
    });
  }, [handleSubmit, handleViewJob, lang.prompt.cacheExpired, lang.prompt.jobExpiredCannotRetry]);

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

  const handleJobsChange = useCallback(() => {
    // BUG-007 FIX: Add catch handler for promise rejection
    getCachedJobList()
      .then(jobs => setHasHistory(jobs.length > 0))
      .catch(err => console.warn('[Prompt] Failed to refresh job list:', err));
  }, []);

  return (
    <ErrorBoundary>
      <main id="main-content" className={styles.main}>
        <div className={`${styles.centerScreen} ${hasHistory && !sidebarCollapsed ? styles.withSidebar : ''}`} role="main">
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
              <div className={styles.container}>
                {/* Main content area */}
                <div className={styles.mainContent}>
                  {/* Header */}
                  <motion.h1 className={styles.title} variants={fadeInUp}>
                    {lang.prompt.title}
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
                          <h3>{lang.prompt.resume.title}</h3>
                          <p>
                            {lang.prompt.resume.message
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
                              {lang.prompt.resume.continueButton}
                            </button>
                            <button
                              className={styles.secondaryButton}
                              onClick={handleResumeNo}
                            >
                              {lang.prompt.resume.startNew}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <PromptForm
                      onSubmit={handleSubmit}
                      onError={setError}
                      isLoading={false}
                      hasApiKey={settingsLoaded ? !!geminiApiKey : true}
                      geminiModel={geminiModel}
                      keyStatus={keyStatus}
                    />
                  </motion.div>
                </div>
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
              <PromptLogPanel
                entries={logEntries}
                batch={batch}
                totalBatches={totalBatches}
                scenesGenerated={scenesGenerated}
                message={loadingMessage}
                characters={characters}
                onCancel={handleCancel}
                activeSettings={currentFormData}
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
                <h2>{lang.prompt.script.title}</h2>
                <button
                  className={styles.newAnalysisButton}
                  onClick={handleNewAnalysis}
                >
                  {lang.prompt.script.newScript}
                </button>
              </div>

              <div className={styles.scriptResult}>
                {/* Script metadata */}
                <div className={styles.scriptMeta}>
                  <div className={styles.scriptMetaItem}>
                    <span className={styles.scriptMetaLabel}>{lang.prompt.script.videoTitle}</span>
                    <span className={styles.scriptMetaValue}>{generatedScript.title}</span>
                  </div>
                  <div className={styles.scriptMetaItem}>
                    <span className={styles.scriptMetaLabel}>{lang.prompt.script.duration}</span>
                    <span className={styles.scriptMetaValue}>{generatedScript.duration}</span>
                  </div>
                  <div className={styles.scriptMetaItem}>
                    <span className={styles.scriptMetaLabel}>{lang.prompt.script.language}</span>
                    <span className={styles.scriptMetaValue}>{generatedScript.language}</span>
                  </div>
                  <div className={styles.scriptMetaItem}>
                    <span className={styles.scriptMetaLabel}>{lang.prompt.script.characters}</span>
                    <span className={styles.scriptMetaValue}>
                      {generatedScript.characters.length > 0
                        ? generatedScript.characters.join(", ")
                        : lang.prompt.script.noCharacters}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className={styles.scriptSection}>
                  <h3>{lang.prompt.script.summary}</h3>
                  <p className={styles.scriptSummary}>{generatedScript.summary}</p>
                </div>

                {/* Raw transcript */}
                <div className={styles.scriptSection}>
                  <div className={styles.scriptSectionHeader}>
                    <h3>{lang.prompt.script.transcript}</h3>
                    <div className={styles.scriptActions}>
                      <button
                        className={styles.scriptActionButton}
                        onClick={handleCopyScript}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                        {lang.prompt.script.copy}
                      </button>
                      <button
                        className={styles.scriptActionButton}
                        onClick={handleDownloadScript}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        {lang.prompt.script.download}
                      </button>
                    </div>
                  </div>
                  <pre className={styles.scriptContent}>{generatedScript.rawText}</pre>
                </div>

                {/* Next step hint */}
                <div className={styles.nextStepHint}>
                  <p>{lang.prompt.script.nextStepHint}</p>
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
                <h2>{lang.prompt.result.title}</h2>
                <button
                  className={styles.newAnalysisButton}
                  onClick={handleNewAnalysis}
                >
                  {lang.common.analyze}
                </button>
              </div>

              <PromptSceneDisplay
                scenes={scenes}
                characterRegistry={characterRegistry}
                summary={summary}
                jobId={jobId}
                script={generatedScript ?? undefined}
                colorProfile={colorProfile ?? undefined}
                colorProfileConfidence={colorProfileConfidence}
                logEntries={logEntries}
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

        {/* History Sidebar - always visible when there's history */}
        {hasHistory && (
          <PromptHistoryPanel
            onViewJob={handleViewJob}
            onRegenerateJob={handleRegenerateJob}
            onRetryJob={handleRetryJob}
            currentJobId={jobId}
            onJobsChange={handleJobsChange}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}
      </main>
    </ErrorBoundary>
  );
}
