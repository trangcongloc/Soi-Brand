"use client";

import { memo, useState, useMemo } from "react";
import type { Scene } from "@/lib/prompt/types";
import { highlightJson } from "./json-highlight";
import styles from "./PromptSceneCards.module.css";

interface VeoSceneCardsProps {
  scenes: Scene[];
}

function SceneCard({
  scene,
  index,
  isExpanded,
  onToggle,
}: {
  scene: Scene;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
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
        </div>
      )}
    </div>
  );
}

function VeoSceneCards({ scenes }: VeoSceneCardsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.cardList}>
      {scenes.map((scene, i) => (
        <SceneCard
          key={scene.id ?? i}
          scene={scene}
          index={i}
          isExpanded={expandedIndex === i}
          onToggle={() => handleToggle(i)}
        />
      ))}
    </div>
  );
}

export default memo(VeoSceneCards);
