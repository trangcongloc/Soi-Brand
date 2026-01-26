"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import {
  VeoMode,
  VoiceLanguage,
  VeoWorkflow,
  Scene,
  CharacterRegistry,
  VeoJobSummary,
  VeoSSEEvent,
  GeneratedScript,
  setCachedJob,
  hasProgress,
  loadProgress,
  clearProgress,
} from "@/lib/veo";
import { VeoForm, VeoLoadingState, VeoSceneDisplay } from "@/components/veo";
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

  // Resume dialog state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeProgress, setResumeProgress] = useState<{
    batch: number;
    total: number;
  } | null>(null);

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for resumable progress on mount
  useEffect(() => {
    if (hasProgress()) {
      const progress = loadProgress();
      if (progress && progress.status === "in_progress") {
        setResumeProgress({
          batch: progress.completedBatches,
          total: progress.totalBatches,
        });
        setShowResumeDialog(true);
      }
    }
  }, []);

  // Auto dismiss error after 5 seconds
  useEffect(() => {
    if (error && state !== "loading") {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, state]);

  const handleError = useCallback(
    (errorType: string, message?: string) => {
      const errorKey = errorType as keyof typeof lang.veo.errors;
      const errorMessage =
        lang.veo.errors[errorKey] || message || lang.veo.errors.UNKNOWN_ERROR;
      setError(errorMessage);
      setState("error");
    },
    [lang]
  );

  const handleSubmit = useCallback(
    async (options: {
      workflow: VeoWorkflow;
      videoUrl?: string;
      startTime?: string;
      endTime?: string;
      scriptText?: string;
      mode: VeoMode;
      sceneCount: number;
      batchSize: number;
      voice: VoiceLanguage;
    }) => {
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

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/veo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
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

                  case "complete":
                    if (options.workflow === "url-to-script") {
                      // Step 1 complete - show script
                      setState("script-complete");
                    } else {
                      // Step 2 complete - show scenes
                      setScenes(event.data.scenes);
                      setCharacterRegistry(event.data.characterRegistry);
                      setSummary(event.data.summary);
                      setJobId(event.data.jobId);
                      setState("complete");

                      // Cache the result
                      setCachedJob(event.data.jobId, {
                        videoId: event.data.summary.videoId,
                        videoUrl: event.data.summary.youtubeUrl,
                        summary: event.data.summary,
                        scenes: event.data.scenes,
                        characterRegistry: event.data.characterRegistry,
                      });
                    }

                    // Clear any in-progress state
                    clearProgress();
                    break;

                  case "error":
                    handleError(event.data.type, event.data.message);
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
    [handleError, lang]
  );

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState("idle");
  }, []);

  const handleResumeYes = useCallback(() => {
    setShowResumeDialog(false);
    clearProgress();
  }, []);

  const handleResumeNo = useCallback(() => {
    setShowResumeDialog(false);
    clearProgress();
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setState("idle");
    setScenes([]);
    setCharacterRegistry({});
    setSummary(null);
    setJobId("");
    setGeneratedScript(null);
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
              <div className={styles.container}>
                {/* Header */}
                <motion.h1 className={styles.title} variants={fadeInUp}>
                  {lang.veo.title}
                </motion.h1>

                {/* Form */}
                <motion.div className={styles.formWrapper} variants={fadeInUp}>
                  {/* Resume Dialog */}
                  <AnimatePresence>
                    {showResumeDialog && resumeProgress && (
                      <motion.div
                        className={styles.resumeDialog}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <h3>{lang.veo.resume.title}</h3>
                        <p>
                          {lang.veo.resume.message
                            .replace("{batch}", String(resumeProgress.batch))
                            .replace("{total}", String(resumeProgress.total))}
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
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {state === "loading" && (
            <motion.div
              key="loading"
              className={styles.container}
              aria-live="polite"
              aria-busy="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <VeoLoadingState
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
  );
}
