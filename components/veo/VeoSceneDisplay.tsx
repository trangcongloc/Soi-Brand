"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { useLang } from "@/lib/lang";
import { Scene, CharacterRegistry, VeoJobSummary, GeneratedScript } from "@/lib/veo";
import VeoSceneCard from "./VeoSceneCard";
import VeoCharacterPanel from "./VeoCharacterPanel";
import VeoHistoryPanel from "./VeoHistoryPanel";
import styles from "./VeoSceneDisplay.module.css";

interface VeoSceneDisplayProps {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  summary: VeoJobSummary;
  jobId: string;
  script?: GeneratedScript;
  onViewJob?: (jobId: string) => void;
  onRegenerateJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void;
  onJobsChange?: () => void;
}

type TabType = "scenes" | "characters" | "history";

function VeoSceneDisplay({
  scenes,
  characterRegistry,
  summary,
  jobId,
  script,
  onViewJob,
  onRegenerateJob,
  onRetryJob,
  onJobsChange,
}: VeoSceneDisplayProps) {
  const lang = useLang();
  const [activeTab, setActiveTab] = useState<TabType>("scenes");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Download functions
  const downloadJson = useCallback((data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  }, []);

  const downloadTxt = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  }, []);

  const handleDownloadScenesJson = useCallback(() => {
    downloadJson(scenes, `veo-scenes-${jobId}.json`);
  }, [scenes, jobId, downloadJson]);

  const handleDownloadScenesTxt = useCallback(() => {
    const content = scenes.map(s => JSON.stringify(s, null, 2)).join("\n\n");
    downloadTxt(content, `veo-scenes-${jobId}.txt`);
  }, [scenes, jobId, downloadTxt]);

  const handleDownloadCharacters = useCallback(() => {
    downloadJson(characterRegistry, `veo-characters-${jobId}.json`);
  }, [characterRegistry, jobId, downloadJson]);

  const handleDownloadScript = useCallback(() => {
    if (script) {
      downloadJson(script, `veo-script-${jobId}.json`);
    }
  }, [script, jobId, downloadJson]);

  const tabs: { key: TabType; label: string }[] = [
    { key: "scenes", label: lang.veo.result.scenes },
    { key: "characters", label: lang.veo.result.characters },
    // Only show history tab if onViewJob handler is provided
    ...(onViewJob ? [{ key: "history" as TabType, label: lang.veo.history.title }] : []),
  ];

  return (
    <div className={styles.container}>
      {/* Summary Header - Always visible */}
      <div className={styles.summaryHeader}>
        <div className={styles.summaryStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{summary.actualScenes}</span>
            <span className={styles.statLabel}>{lang.veo.result.summaryStats.totalScenes}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{summary.charactersFound}</span>
            <span className={styles.statLabel}>{lang.veo.result.summaryStats.characters}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {summary.mode === "direct" ? lang.veo.modes.direct : lang.veo.modes.hybrid}
            </span>
            <span className={styles.statLabel}>{lang.veo.result.summaryStats.mode}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{summary.processingTime}</span>
            <span className={styles.statLabel}>{lang.veo.result.summaryStats.processingTime}</span>
          </div>
        </div>

        {/* Download Dropdown */}
        <div className={styles.downloadDropdown} ref={downloadRef}>
          <button
            className={styles.downloadBtn}
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {lang.veo.result.download}
            <svg
              className={`${styles.chevron} ${showDownloadMenu ? styles.open : ""}`}
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
          {showDownloadMenu && (
            <div className={styles.downloadMenu}>
              <button onClick={handleDownloadScenesJson}>
                {lang.veo.result.downloadOptions.scenesJson}
              </button>
              <button onClick={handleDownloadScenesTxt}>
                {lang.veo.result.downloadOptions.scenesTxt}
              </button>
              <button onClick={handleDownloadCharacters}>
                {lang.veo.result.downloadOptions.characters}
              </button>
              {script && (
                <button onClick={handleDownloadScript}>
                  {lang.veo.result.downloadOptions.script}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === "scenes" && (
              <span className={styles.badge}>{scenes.length}</span>
            )}
            {tab.key === "characters" && (
              <span className={styles.badge}>
                {Object.keys(characterRegistry).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {/* Scenes Tab */}
        {activeTab === "scenes" && (
          <div className={styles.scenesList}>
            {scenes.map((scene, index) => (
              <VeoSceneCard key={index} scene={scene} index={index} />
            ))}
          </div>
        )}

        {/* Characters Tab */}
        {activeTab === "characters" && (
          <VeoCharacterPanel
            characterRegistry={characterRegistry}
            scenes={scenes}
          />
        )}

        {/* History Tab */}
        {activeTab === "history" && onViewJob && (
          <VeoHistoryPanel
            onViewJob={onViewJob}
            onRegenerateJob={onRegenerateJob}
            onRetryJob={onRetryJob}
            currentJobId={jobId}
            onJobsChange={onJobsChange}
          />
        )}
      </div>
    </div>
  );
}

export default memo(VeoSceneDisplay);
