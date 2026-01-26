"use client";

import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/lang";
import styles from "./VeoLoadingState.module.css";

interface VeoLoadingStateProps {
  batch: number;
  totalBatches: number;
  scenesGenerated: number;
  message?: string;
  characters?: string[];
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
  onCancel,
}: VeoLoadingStateProps) {
  const lang = useLang();
  const [spinnerIndex, setSpinnerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerIndex((prev) => (prev + 1) % spinnerFrames.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = totalBatches > 0 ? (batch / totalBatches) * 100 : 0;

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
            <span>
              {lang.veo.loading.batchProgress
                .replace("{current}", String(batch))
                .replace("{total}", String(totalBatches))}
            </span>
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
