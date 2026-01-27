"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { logger } from "@/lib/logger";
import { Scene } from "@/lib/veo";
import styles from "./VeoSceneCard.module.css";

interface VeoSceneCardProps {
  scene: Scene;
  index: number;
}

function VeoSceneCard({ scene, index }: VeoSceneCardProps) {
  const lang = useLang();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(scene.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error("Failed to copy:", err);
    }
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.sceneNumber}>Scene {index + 1}</span>
        <button
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
        >
{expanded ? lang.veo.result.sceneCard.collapse : lang.veo.result.sceneCard.expand}
          <svg
            className={`${styles.chevron} ${expanded ? styles.open : ""}`}
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
      </div>

      {/* Description (always visible) */}
      <p className={styles.description}>{scene.description}</p>

      {/* Character (if present) */}
      {scene.character && scene.character.toLowerCase() !== "none" && (
        <div className={styles.characterBadge}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{scene.character.split("-")[0].trim()}</span>
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.details}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Object */}
            {scene.object && (
              <div className={styles.detailSection}>
                <h4>{lang.veo.result.sceneCard.object}</h4>
                <p>{scene.object}</p>
              </div>
            )}

            {/* Full Character */}
            {scene.character && scene.character.toLowerCase() !== "none" && (
              <div className={styles.detailSection}>
                <h4>{lang.veo.result.sceneCard.character}</h4>
                <p className={styles.characterFull}>{scene.character}</p>
              </div>
            )}

            {/* Visual Specs */}
            {scene.visual_specs && (
              <div className={styles.detailSection}>
                <h4>{lang.veo.result.sceneCard.visualSpecs}</h4>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.primarySubject}</span>
                    <span>{scene.visual_specs.primary_subject}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.environment}</span>
                    <span>{scene.visual_specs.environment}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.keyDetails}</span>
                    <span>{scene.visual_specs.key_details}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lighting */}
            {scene.lighting && (
              <div className={styles.detailSection}>
                <h4>{lang.veo.result.sceneCard.lighting}</h4>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.mood}</span>
                    <span>{scene.lighting.mood}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.source}</span>
                    <span>{scene.lighting.source}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.shadows}</span>
                    <span>{scene.lighting.shadows}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Composition */}
            {scene.composition && (
              <div className={styles.detailSection}>
                <h4>{lang.veo.result.sceneCard.composition}</h4>
                <div className={styles.specGrid}>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.angle}</span>
                    <span>{scene.composition.angle}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.framing}</span>
                    <span>{scene.composition.framing}</span>
                  </div>
                  <div>
                    <span className={styles.specLabel}>{lang.veo.result.sceneCard.focus}</span>
                    <span>{scene.composition.focus}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Style (collapsible) */}
            {scene.style && (
              <details className={styles.styleDetails}>
                <summary>{lang.veo.result.sceneCard.style}</summary>
                <div className={styles.styleGrid}>
                  {Object.entries(scene.style).map(([key, value]) => (
                    <div key={key} className={styles.styleItem}>
                      <span className={styles.specLabel}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Prompt */}
            <div className={styles.promptSection}>
              <div className={styles.promptHeader}>
                <h4>{lang.veo.result.sceneCard.prompt}</h4>
                <button
                  className={styles.copyButton}
                  onClick={handleCopyPrompt}
                >
                  {copied ? (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {lang.veo.result.sceneCard.copied}
                    </>
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      {lang.veo.result.sceneCard.copyPrompt}
                    </>
                  )}
                </button>
              </div>
              <p className={styles.prompt}>{scene.prompt}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(VeoSceneCard);
