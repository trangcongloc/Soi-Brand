"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLang } from "@/lib/lang";
import type { Scene, CharacterRegistry, VeoJobSummary, GeneratedScript, CinematicProfile, GeminiLogEntry } from "@/lib/veo";
import { downloadJson as downloadJsonUtil, downloadText } from "@/lib/veo/download-utils";
import VeoCharacterPanel from "./VeoCharacterPanel";
import VeoHistoryPanel from "./VeoHistoryPanel";
import VeoColorProfilePanel from "./VeoColorProfilePanel";
import VeoLogPanel from "./VeoLogPanel";
import { VeoJsonView } from "./VeoJsonView";
import { highlightJson } from "./json-highlight";
import styles from "./VeoSceneDisplay.module.css";
import jsonStyles from "./VeoJsonView.module.css";

interface VeoSceneDisplayProps {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  summary: VeoJobSummary;
  jobId: string;
  script?: GeneratedScript;
  colorProfile?: CinematicProfile;
  colorProfileConfidence?: number;
  logEntries?: GeminiLogEntry[];
  onViewJob?: (jobId: string) => void;
  onRegenerateJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void;
  onJobsChange?: () => void;
}

type TabType = "scenes" | "json" | "characters" | "color" | "history" | "logs";

function VeoSceneDisplay({
  scenes,
  characterRegistry,
  summary,
  jobId,
  script,
  colorProfile,
  colorProfileConfidence,
  logEntries,
  onViewJob,
  onRegenerateJob,
  onRetryJob,
  onJobsChange,
}: VeoSceneDisplayProps) {
  const lang = useLang();
  const [activeTab, setActiveTab] = useState<TabType>("scenes");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [scenesCopyStatus, setScenesCopyStatus] = useState("");
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

  // Download functions (using utility functions)
  const downloadJson = useCallback((data: unknown, filename: string) => {
    downloadJsonUtil(data, filename);
    setShowDownloadMenu(false);
  }, []);

  const downloadTxt = useCallback((content: string, filename: string) => {
    downloadText(content, filename);
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

  // Scenes JSON for the scenes tab code view
  const scenesJson = useMemo(() => JSON.stringify(scenes, null, 2), [scenes]);
  const highlightedScenesJson = useMemo(() => highlightJson(scenesJson, jsonStyles), [scenesJson]);

  const handleCopyScenesJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(scenesJson);
      setScenesCopyStatus("Copied!");
      setTimeout(() => setScenesCopyStatus(""), 2000);
    } catch {
      setScenesCopyStatus("Failed");
      setTimeout(() => setScenesCopyStatus(""), 2000);
    }
  }, [scenesJson]);

  const hasLogs = logEntries && logEntries.length > 0;

  const tabs: { key: TabType; label: string }[] = [
    { key: "scenes", label: lang.veo.result.scenes },
    { key: "json", label: "JSON" },
    { key: "characters", label: lang.veo.result.characters },
    ...(colorProfile ? [{ key: "color" as TabType, label: lang.veo.result.color }] : []),
    ...(hasLogs ? [{ key: "logs" as TabType, label: "Logs" }] : []),
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

      {/* Retry Section for Failed/Partial Jobs */}
      {(summary.status === "failed" || summary.status === "partial") && summary.error && (
        <div className={styles.retrySection}>
          <p className={styles.failedMessage}>
            {summary.status === "failed"
              ? lang.veo.result.jobFailed
              : lang.veo.result.jobPartial
            }
            {summary.error.failedBatch && summary.error.totalBatches && (
              <span> (Failed at batch {summary.error.failedBatch}/{summary.error.totalBatches})</span>
            )}
          </p>
          {summary.error.retryable && onRetryJob && (
            <button
              className={styles.retryButton}
              onClick={() => onRetryJob(jobId)}
            >
              {lang.veo.result.retryJob}
            </button>
          )}
        </div>
      )}

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
            {tab.key === "logs" && hasLogs && (
              <span className={styles.badge}>{logEntries.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {/* Scenes Tab - JSON code view */}
        {activeTab === "scenes" && (
          <div className={jsonStyles.jsonViewContainer}>
            <div className={jsonStyles.jsonHeader}>
              <h3>Scenes ({scenes.length})</h3>
              <button onClick={handleCopyScenesJson} className={jsonStyles.copyButton}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                {scenesCopyStatus || "Copy All"}
              </button>
            </div>
            <pre className={jsonStyles.jsonContent}>
              <code>{highlightedScenesJson}</code>
            </pre>
          </div>
        )}

        {/* JSON Tab */}
        {activeTab === "json" && (
          <VeoJsonView
            scenes={scenes}
            characterRegistry={characterRegistry}
            summary={summary}
            jobId={jobId}
          />
        )}

        {/* Characters Tab */}
        {activeTab === "characters" && (
          <VeoCharacterPanel
            characterRegistry={characterRegistry}
            scenes={scenes}
          />
        )}

        {/* Color Tab */}
        {activeTab === "color" && colorProfile && (
          <VeoColorProfilePanel
            profile={colorProfile}
            confidence={colorProfileConfidence ?? 0}
            defaultExpanded={true}
          />
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && hasLogs && (
          <VeoLogPanel entries={logEntries} />
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
