"use client";

import { memo, useState, useMemo } from "react";
import type { Scene, GeminiLogEntry } from "@/lib/veo/types";
import { highlightJson } from "./json-highlight";
import styles from "./VeoSceneCards.module.css";

interface VeoSceneCardsProps {
  scenes: Scene[];
  logEntries?: GeminiLogEntry[];
  batchSize?: number;
}

/**
 * Find the matching phase-2 log entry for a scene by batch number.
 * Scene at index i -> batchNumber = Math.floor(i / batchSize)
 */
function findLogEntryForScene(
  sceneIndex: number,
  logEntries: GeminiLogEntry[],
  batchSize: number
): GeminiLogEntry | undefined {
  const targetBatch = Math.floor(sceneIndex / batchSize);
  return logEntries.find(
    (entry) => entry.phase === "phase-2" && entry.batchNumber === targetBatch
  );
}

function SceneCard({
  scene,
  index,
  isExpanded,
  onToggle,
  logEntry,
}: {
  scene: Scene;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  logEntry?: GeminiLogEntry;
}) {
  const mediaType = scene.mediaType ?? "image";
  const promptPreview =
    scene.description.length > 150
      ? scene.description.slice(0, 150) + "..."
      : scene.description;

  const sceneJsonHighlighted = useMemo(() => {
    if (!isExpanded) return null;
    return highlightJson(JSON.stringify(scene, null, 2), styles);
  }, [isExpanded, scene]);

  const requestHighlighted = useMemo(() => {
    if (!isExpanded || !logEntry) return null;
    try {
      const pretty = JSON.stringify(JSON.parse(logEntry.request.body), null, 2);
      return highlightJson(pretty, styles);
    } catch {
      return logEntry.request.body;
    }
  }, [isExpanded, logEntry]);

  const responseHighlighted = useMemo(() => {
    if (!isExpanded || !logEntry) return null;
    try {
      const pretty = JSON.stringify(JSON.parse(logEntry.response.body), null, 2);
      return highlightJson(pretty, styles);
    } catch {
      return logEntry.response.body;
    }
  }, [isExpanded, logEntry]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={onToggle}>
        <span className={styles.sceneNumber}>#{index + 1}</span>
        <span
          className={`${styles.mediaBadge} ${
            mediaType === "video"
              ? styles.mediaBadgeVideo
              : styles.mediaBadgeImage
          }`}
        >
          {mediaType}
        </span>
        <span className={styles.promptPreview}>{promptPreview}</span>
        <svg
          className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {isExpanded && (
        <div className={styles.cardDetails}>
          {/* Scene JSON */}
          <div className={styles.detailSection}>
            <span className={`${styles.detailLabel} ${styles.detailLabelScene}`}>
              Scene JSON
            </span>
            <pre className={styles.codeBlock}>
              <code>{sceneJsonHighlighted}</code>
            </pre>
          </div>

          {/* Request Sent */}
          <div className={styles.detailSection}>
            <span className={`${styles.detailLabel} ${styles.detailLabelRequest}`}>
              Request Sent
            </span>
            {logEntry ? (
              <pre className={styles.codeBlock}>
                <code>{requestHighlighted}</code>
              </pre>
            ) : (
              <span className={styles.noData}>No matching log entry found</span>
            )}
          </div>

          {/* Response Received */}
          <div className={styles.detailSection}>
            <span className={`${styles.detailLabel} ${styles.detailLabelResponse}`}>
              Response Received
            </span>
            {logEntry ? (
              <pre className={styles.codeBlock}>
                <code>{responseHighlighted}</code>
              </pre>
            ) : (
              <span className={styles.noData}>No matching log entry found</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VeoSceneCards({ scenes, logEntries, batchSize = 5 }: VeoSceneCardsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.cardList}>
      {scenes.map((scene, i) => {
        const logEntry = logEntries
          ? findLogEntryForScene(i, logEntries, batchSize)
          : undefined;

        return (
          <SceneCard
            key={scene.id ?? i}
            scene={scene}
            index={i}
            isExpanded={expandedIndex === i}
            onToggle={() => handleToggle(i)}
            logEntry={logEntry}
          />
        );
      })}
    </div>
  );
}

export default memo(VeoSceneCards);
