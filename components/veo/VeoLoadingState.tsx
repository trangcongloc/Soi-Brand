"use client";

import { memo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { GeneratedScript } from "@/lib/veo";
import styles from "./VeoLoadingState.module.css";

interface VeoLoadingStateProps {
  batch: number;
  totalBatches: number;
  scenesGenerated: number;
  message?: string;
  characters?: string[];
  generatedScript?: GeneratedScript | null;
  onCancel?: () => void;
}

// Braille spinner animation
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function VeoLoadingState({
  batch,
  totalBatches,
  scenesGenerated,
  message,
  characters = [],
  generatedScript,
  onCancel,
}: VeoLoadingStateProps) {
  const lang = useLang();
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [showScriptPreview, setShowScriptPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerIndex((prev) => (prev + 1) % spinnerFrames.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Auto-expand script preview when script is generated
  useEffect(() => {
    if (generatedScript) {
      setShowScriptPreview(true);
    }
  }, [generatedScript]);

  const progressPercent = totalBatches > 0 ? (batch / totalBatches) * 100 : 0;

  // Only show batch progress when generating scenes (not during script generation)
  // Script generation: totalBatches === 1 && scenesGenerated === 0 → hide
  // Scene generation: totalBatches > 1 || scenesGenerated > 0 → show
  const showBatchProgress = totalBatches > 1 || scenesGenerated > 0;

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedScript]);

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.spinner}>{spinnerFrames[spinnerIndex]}</span>
          <h2 className={styles.title}>{lang.veo.loading.title}</h2>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <motion.div
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className={styles.progressInfo}>
            {showBatchProgress && (
              <span>
                {lang.veo.loading.batchProgress
                  .replace("{current}", String(batch))
                  .replace("{total}", String(totalBatches))}
              </span>
            )}
            <span>
              {lang.veo.loading.scenesGenerated.replace(
                "{count}",
                String(scenesGenerated)
              )}
            </span>
          </div>
        </div>

        {/* Current Message */}
        {message && (
          <motion.p
            className={styles.message}
            key={message}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {message}
          </motion.p>
        )}

        {/* Characters Found */}
        {characters.length > 0 && (
          <div className={styles.characters}>
            <span className={styles.charactersLabel}>
              {lang.veo.result.characters}:
            </span>
            <div className={styles.characterTags}>
              {characters.map((name) => (
                <motion.span
                  key={name}
                  className={styles.characterTag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {name}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Script Preview (for combined workflow) */}
        <AnimatePresence>
          {generatedScript && (
            <motion.div
              className={styles.scriptPreview}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.scriptPreviewHeader}>
                <span className={styles.scriptPreviewLabel}>
                  {lang.veo.script.title}
                </span>
                <div className={styles.scriptPreviewActions}>
                  <button
                    className={styles.scriptActionBtn}
                    onClick={() => setShowScriptPreview(!showScriptPreview)}
                    type="button"
                  >
                    {showScriptPreview ? lang.veo.loading.hideScript : lang.veo.loading.showScript}
                  </button>
                  <button
                    className={`${styles.scriptActionBtn} ${copied ? styles.copied : ""}`}
                    onClick={handleCopyScript}
                    type="button"
                  >
                    {copied ? lang.veo.result.sceneCard.copied : lang.veo.script.copy}
                  </button>
                  <button
                    className={styles.scriptActionBtn}
                    onClick={handleDownloadScript}
                    type="button"
                  >
                    {lang.veo.script.download}
                  </button>
                </div>
              </div>
              {/* Script metadata */}
              <div className={styles.scriptMeta}>
                {generatedScript.title && (
                  <span className={styles.scriptMetaItem}>
                    <strong>{lang.veo.script.videoTitle}:</strong> {generatedScript.title}
                  </span>
                )}
                {generatedScript.duration && (
                  <span className={styles.scriptMetaItem}>
                    <strong>{lang.veo.script.duration}:</strong> {generatedScript.duration}
                  </span>
                )}
                {generatedScript.characters?.length > 0 && (
                  <span className={styles.scriptMetaItem}>
                    <strong>{lang.veo.script.characters}:</strong> {generatedScript.characters.join(", ")}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {showScriptPreview && (
                  <motion.div
                    className={styles.scriptPreviewContent}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <pre className={styles.scriptText}>
                      {generatedScript.rawText.slice(0, 1000)}
                      {generatedScript.rawText.length > 1000 && "..."}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Button */}
        {onCancel && (
          <button className={styles.cancelButton} onClick={onCancel}>
            {lang.loadingState.cancel}
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default memo(VeoLoadingState);
