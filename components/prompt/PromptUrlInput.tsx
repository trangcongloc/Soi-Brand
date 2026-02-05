"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PromptWorkflow, extractVideoId, isValidYouTubeUrl, getYouTubeThumbnail } from "@/lib/prompt";
import { useLang } from "@/lib/lang";
import styles from "./PromptForm.module.css";

type ValidationStatus = "idle" | "loading" | "valid" | "invalid";

interface VeoUrlInputProps {
  url: string;
  onChange: (url: string) => void;
  durationMode: "auto" | "custom";
  onDurationModeChange: (mode: "auto" | "custom") => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  isLoading: boolean;
  workflow: PromptWorkflow;
}

export function VeoUrlInput({
  url,
  onChange,
  durationMode,
  onDurationModeChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  isLoading,
  workflow,
}: VeoUrlInputProps) {
  const lang = useLang();
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // BUG FIX #12: Always return cleanup function to prevent race conditions
  const validateUrl = useCallback((inputUrl: string): (() => void) => {
    if (!inputUrl.trim()) {
      setValidationStatus("idle");
      setThumbnailUrl(null);
      setVideoId(null);
      // Return empty cleanup function instead of undefined
      return () => {};
    }

    setValidationStatus("loading");

    // Debounce validation
    const timeoutId = setTimeout(() => {
      // Use canonical validation from lib/prompt/utils
      if (isValidYouTubeUrl(inputUrl)) {
        const extractedId = extractVideoId(inputUrl);
        // BUG FIX #26: extractVideoId now returns null for invalid URLs
        if (extractedId) {
          setVideoId(extractedId);
          setThumbnailUrl(getYouTubeThumbnail(extractedId, "medium"));
          setValidationStatus("valid");
        } else {
          setVideoId(null);
          setThumbnailUrl(null);
          setValidationStatus("invalid");
        }
      } else {
        setVideoId(null);
        setThumbnailUrl(null);
        setValidationStatus("invalid");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const cleanup = validateUrl(url);
    return cleanup;
  }, [url, validateUrl]);

  return (
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
        <div className={styles.urlInputContainer}>
          <input
            id="video-url"
            type="text"
            value={url}
            onChange={(e) => onChange(e.target.value)}
            placeholder={lang.prompt.form.placeholder}
            className={`input ${styles.urlInput} ${validationStatus === "invalid" ? styles.urlInputInvalid : ""} ${validationStatus === "valid" ? styles.urlInputValid : ""}`}
            disabled={isLoading}
          />
          <div className={styles.urlValidationIcon}>
            {validationStatus === "loading" && (
              <svg className={styles.urlSpinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            )}
            {validationStatus === "valid" && (
              <svg className={styles.urlCheckmark} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {validationStatus === "invalid" && (
              <svg className={styles.urlXmark} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Preview */}
      <AnimatePresence>
        {validationStatus === "valid" && thumbnailUrl && (
          <motion.div
            className={styles.thumbnailPreview}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className={styles.thumbnailImage}
              onError={() => {
                // BUG FIX #24: Don't mark URL invalid when thumbnail CDN fails
                // The URL is still valid, just the thumbnail preview isn't available
                setThumbnailUrl(null);
                // Keep validation status as "valid" since the URL format is correct
              }}
            />
            <div className={styles.thumbnailInfo}>
              <span className={styles.thumbnailVideoId}>{videoId}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duration Mode Toggle */}
      <div className={styles.durationSection}>
        <div className={styles.durationHeader}>
          <span className={styles.durationLabel}>{lang.prompt.form.duration}</span>
          <div className={styles.durationToggle}>
            <button
              type="button"
              className={`${styles.durationToggleBtn} ${durationMode === "auto" ? styles.active : ""}`}
              onClick={() => onDurationModeChange("auto")}
              disabled={isLoading}
            >
              {lang.prompt.form.durationAuto}
            </button>
            <button
              type="button"
              className={`${styles.durationToggleBtn} ${durationMode === "custom" ? styles.active : ""}`}
              onClick={() => onDurationModeChange("custom")}
              disabled={isLoading}
            >
              {lang.prompt.form.durationCustom}
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
                <span className={styles.timeLabel}>{lang.prompt.form.from}</span>
                <input
                  id="start-time"
                  type="text"
                  value={startTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  placeholder="00:00"
                  className={styles.timeInput}
                  disabled={isLoading}
                />
                <span className={styles.timeLabel}>{lang.prompt.form.to}</span>
                <input
                  id="end-time"
                  type="text"
                  value={endTime}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                  placeholder="05:30"
                  className={styles.timeInput}
                  disabled={isLoading}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

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
              {isLoading ? lang.prompt.form.processing : lang.prompt.form.extractScript}
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
