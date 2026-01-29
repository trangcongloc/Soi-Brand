"use client";

import { memo, useCallback } from "react";
import { useLang } from "@/lib/lang";
import { Scene, CharacterRegistry, VeoJobSummary, GeneratedScript } from "@/lib/veo";
import { downloadFile as downloadFileUtil } from "@/lib/veo/download-utils";
import styles from "./VeoDownloadPanel.module.css";

interface VeoDownloadPanelProps {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  summary: VeoJobSummary;
  script?: GeneratedScript;
  jobId: string;
}

function VeoDownloadPanel({
  scenes,
  characterRegistry,
  summary,
  script,
  jobId,
}: VeoDownloadPanelProps) {
  const lang = useLang();

  const downloadFile = useCallback(
    (content: string, filename: string, type: string) => {
      downloadFileUtil(content, filename, type);
    },
    []
  );

  // 1. All Scenes (JSON) - all scenes in JSON format
  const handleDownloadScenesJson = useCallback(() => {
    downloadFile(
      JSON.stringify(scenes, null, 2),
      `${scenes.length}-${summary.videoId}-${jobId}.json`,
      "application/json"
    );
  }, [scenes, summary.videoId, jobId, downloadFile]);

  // 2. All Scenes (TXT) - each scene as JSON separated by blank lines
  const handleDownloadScenesTxt = useCallback(() => {
    const content = scenes
      .map((scene) => JSON.stringify(scene, null, 2))
      .join("\n\n");
    downloadFile(
      content,
      `${scenes.length}-${summary.videoId}-${jobId}.txt`,
      "text/plain"
    );
  }, [scenes, summary.videoId, jobId, downloadFile]);

  // 3. Script - the generated script/transcript
  const handleDownloadScript = useCallback(() => {
    if (!script) return;
    downloadFile(
      JSON.stringify(script, null, 2),
      `script-${summary.videoId}-${jobId}.json`,
      "application/json"
    );
  }, [script, summary.videoId, jobId, downloadFile]);

  // 4. Characters - all characters with their variations from scenes
  const handleDownloadCharacters = useCallback(() => {
    // Collect all character variations from scenes
    const characterVariations: Record<string, Array<{ sceneIndex: number; variations: Record<string, string> }>> = {};

    scenes.forEach((scene, index) => {
      if (scene.characterVariations) {
        for (const [charName, variations] of Object.entries(scene.characterVariations)) {
          if (!characterVariations[charName]) {
            characterVariations[charName] = [];
          }
          characterVariations[charName].push({
            sceneIndex: index + 1,
            variations: variations as Record<string, string>,
          });
        }
      }
    });

    const data = {
      characters: characterRegistry,
      sceneVariations: characterVariations,
    };
    const charCount = Object.keys(characterRegistry).length;
    downloadFile(
      JSON.stringify(data, null, 2),
      `chars-${charCount}-${summary.videoId}-${jobId}.json`,
      "application/json"
    );
  }, [characterRegistry, scenes, summary.videoId, jobId, downloadFile]);

  const downloadOptions = [
    {
      label: lang.veo.result.downloadOptions.scenesJson,
      description: lang.veo.result.downloadOptions.scenesJsonDesc.replace("{count}", String(scenes.length)),
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
      onClick: handleDownloadScenesJson,
    },
    {
      label: lang.veo.result.downloadOptions.scenesTxt,
      description: lang.veo.result.downloadOptions.scenesTxtDesc.replace("{count}", String(scenes.length)),
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
        </svg>
      ),
      onClick: handleDownloadScenesTxt,
    },
    ...(script ? [{
      label: lang.veo.result.downloadOptions.script,
      description: lang.veo.result.downloadOptions.scriptDesc,
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
      onClick: handleDownloadScript,
    }] : []),
    {
      label: lang.veo.result.downloadOptions.characters,
      description: lang.veo.result.downloadOptions.charactersDesc.replace("{count}", String(Object.keys(characterRegistry).length)),
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
