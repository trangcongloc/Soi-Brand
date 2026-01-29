"use client";

import { motion, AnimatePresence } from "framer-motion";
import { VeoWorkflow } from "@/lib/veo";
import { useLang } from "@/lib/lang";
import styles from "./VeoForm.module.css";

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
  workflow: VeoWorkflow;
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
        <input
          id="video-url"
          type="text"
          value={url}
          onChange={(e) => onChange(e.target.value)}
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
              onClick={() => onDurationModeChange("auto")}
              disabled={isLoading}
            >
              {lang.veo.form.durationAuto}
            </button>
            <button
              type="button"
              className={`${styles.durationToggleBtn} ${durationMode === "custom" ? styles.active : ""}`}
              onClick={() => onDurationModeChange("custom")}
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
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  placeholder="00:00"
                  className={styles.timeInput}
                  disabled={isLoading}
                />
                <span className={styles.timeLabel}>{lang.veo.form.to}</span>
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
  );
}
