"use client";

import { memo, useCallback } from "react";
import { useLang } from "@/lib/lang";
import { Scene, CharacterRegistry, VeoJobSummary } from "@/lib/veo";
import styles from "./VeoDownloadPanel.module.css";

interface VeoDownloadPanelProps {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  summary: VeoJobSummary;
  jobId: string;
}

function VeoDownloadPanel({
  scenes,
  characterRegistry,
  summary,
  jobId,
}: VeoDownloadPanelProps) {
  const lang = useLang();

  const downloadFile = useCallback(
    (content: string, filename: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    []
  );

  const handleDownloadScenes = useCallback(() => {
    const data = {
      jobId,
      summary,
      scenes,
      generatedAt: new Date().toISOString(),
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      `veo-scenes-${summary.videoId}.json`,
      "application/json"
    );
  }, [scenes, summary, jobId, downloadFile]);

  const handleDownloadCharacters = useCallback(() => {
    const data = {
      jobId,
      videoId: summary.videoId,
      characters: characterRegistry,
      generatedAt: new Date().toISOString(),
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      `veo-characters-${summary.videoId}.json`,
      "application/json"
    );
  }, [characterRegistry, summary, jobId, downloadFile]);

  const handleDownloadSummary = useCallback(() => {
    const data = {
      jobId,
      ...summary,
      generatedAt: new Date().toISOString(),
    };
    downloadFile(
      JSON.stringify(data, null, 2),
      `veo-summary-${summary.videoId}.json`,
      "application/json"
    );
  }, [summary, jobId, downloadFile]);

  const handleDownloadPrompts = useCallback(() => {
    const prompts = scenes
      .map((scene, index) => `=== SCENE ${index + 1} ===\n\n${scene.prompt}\n`)
      .join("\n");
    downloadFile(
      prompts,
      `veo-prompts-${summary.videoId}.txt`,
      "text/plain"
    );
  }, [scenes, summary.videoId, downloadFile]);

  const downloadOptions = [
    {
      label: lang.veo.result.downloadOptions.allScenes,
      description: `${scenes.length} scenes with all metadata`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      onClick: handleDownloadScenes,
    },
    {
      label: lang.veo.result.downloadOptions.characters,
      description: `${Object.keys(characterRegistry).length} characters`,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      onClick: handleDownloadCharacters,
    },
    {
      label: lang.veo.result.downloadOptions.summary,
      description: "Job metadata and statistics",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      onClick: handleDownloadSummary,
    },
    {
      label: lang.veo.result.downloadOptions.prompts,
      description: "Plain text prompts for generation",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7V4h16v3" />
          <path d="M9 20h6" />
          <path d="M12 4v16" />
        </svg>
      ),
      onClick: handleDownloadPrompts,
    },
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{lang.veo.result.downloadOptions.title}</h3>
      <div className={styles.grid}>
        {downloadOptions.map((option) => (
          <button
            key={option.label}
            className={styles.downloadButton}
            onClick={option.onClick}
          >
            <div className={styles.icon}>{option.icon}</div>
            <div className={styles.info}>
              <span className={styles.label}>{option.label}</span>
              <span className={styles.description}>{option.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(VeoDownloadPanel);
