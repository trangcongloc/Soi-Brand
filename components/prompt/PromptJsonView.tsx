"use client";

import { useState, useCallback, useMemo } from "react";
import { Scene, CharacterRegistry, PromptJobSummary } from "@/lib/prompt/types";
import { UI_COPY_STATUS_TIMEOUT_MS } from "@/lib/ui-config";
import styles from "./PromptJsonView.module.css";

interface VeoJsonViewProps {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  summary: PromptJobSummary;
  jobId: string;
}

export function VeoJsonView({ scenes, characterRegistry, summary, jobId }: VeoJsonViewProps) {
  const [copyStatus, setCopyStatus] = useState<string>("");

  const jsonData = useMemo(() => ({
    jobId,
    summary: {
      videoId: summary.videoId,
      youtubeUrl: summary.youtubeUrl,
      mode: summary.mode,
      targetScenes: summary.targetScenes,
      actualScenes: scenes.length,
      batches: summary.batches,
      batchSize: summary.batchSize,
      voice: summary.voice,
      charactersFound: summary.charactersFound,
      characters: summary.characters,
      processingTime: summary.processingTime,
      createdAt: summary.createdAt,
      status: summary.status,
    },
    characterRegistry,
    scenes: scenes.map(scene => ({
      // Include ALL scene fields including prompts
      id: scene.id,
      sequence: scene.sequence,
      mediaType: scene.mediaType,
      description: scene.description,
      prompt: scene.prompt, // Generation prompt
      negativePrompt: scene.negativePrompt, // Negative prompt
      voice: scene.voice,
      object: scene.object,
      character: scene.character,
      style: scene.style,
      visual_specs: scene.visual_specs,
      lighting: scene.lighting,
      composition: scene.composition,
      technical: scene.technical,
      characterVariations: scene.characterVariations,
      // Image-specific fields
      image: scene.image,
      // Video-specific fields
      video: scene.video,
      // Platform hints
      platformHints: scene.platformHints,
      // VEO 3 fields (if present)
      audio: scene.audio,
      dialogue: scene.dialogue,
      enhancedCamera: scene.enhancedCamera,
      expressionControl: scene.expressionControl,
      emotionalArc: scene.emotionalArc,
      advancedComposition: scene.advancedComposition,
      qualityScore: scene.qualityScore,
    })),
  }), [jobId, summary, characterRegistry, scenes]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), UI_COPY_STATUS_TIMEOUT_MS);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), UI_COPY_STATUS_TIMEOUT_MS);
    }
  }, [jsonData]);

  return (
    <div className={styles.jsonViewContainer}>
      <div className={styles.jsonHeader}>
        <h3>JSON View</h3>
        <button onClick={handleCopy} className={styles.copyButton}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          {copyStatus || "Copy All"}
        </button>
      </div>
      <pre className={styles.jsonContent}>
        <code>{JSON.stringify(jsonData, null, 2)}</code>
      </pre>
    </div>
  );
}
