"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLang } from "@/lib/lang";
import type { Scene, CharacterRegistry, PromptJobSummary, GeneratedScript, CinematicProfile, GeminiLogEntry } from "@/lib/prompt";
import { downloadJson as downloadJsonUtil, downloadText } from "@/lib/prompt/download-utils";
import { getYouTubeThumbnail } from "@/lib/prompt/utils";
import VeoCharacterPanel from "./PromptCharacterPanel";
import VeoHistoryPanel from "./PromptHistoryPanel";
import VeoColorProfilePanel from "./PromptColorProfilePanel";
import VeoLogPanel from "./PromptLogPanel";
import VeoSceneCards from "./PromptSceneCards";
import { highlightJson } from "./json-highlight";
import styles from "./PromptSceneDisplay.module.css";
import jsonStyles from "./PromptJsonView.module.css";

// Batch-based pagination for JSON view (uses actual batch size from job)

interface VeoSceneDisplayProps {
  scenes: Scene[];
  characterRegistry: CharacterRegistry;
  summary: PromptJobSummary;
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
  // BUG FIX #14: Pagination for large datasets in JSON view
  const [jsonPage, setJsonPage] = useState(0);

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
    downloadJson(scenes, `prompt-scenes-${jobId}.json`);
  }, [scenes, jobId, downloadJson]);

  const handleDownloadScenesTxt = useCallback(() => {
    const content = scenes.map(s => JSON.stringify(s, null, 2)).join("\n\n");
    downloadTxt(content, `prompt-scenes-${jobId}.txt`);
  }, [scenes, jobId, downloadTxt]);

  const handleDownloadCharacters = useCallback(() => {
    downloadJson(characterRegistry, `prompt-characters-${jobId}.json`);
  }, [characterRegistry, jobId, downloadJson]);

  const handleDownloadScript = useCallback(() => {
    if (script) {
      downloadJson(script, `prompt-script-${jobId}.json`);
    }
  }, [script, jobId, downloadJson]);

  // Batch-based pagination for JSON view
  const batchSize = summary.batchSize || 30; // Default to 30 if not specified
  const totalBatches = useMemo(() => Math.ceil(scenes.length / batchSize), [scenes.length, batchSize]);
  const hasMultipleBatches = totalBatches > 1;

  // Get scenes for current batch in JSON view
  const batchScenes = useMemo(() => {
    if (!hasMultipleBatches) return scenes;
    const start = jsonPage * batchSize;
    const end = start + batchSize;
    return scenes.slice(start, end);
  }, [scenes, jsonPage, batchSize, hasMultipleBatches]);

  // Scenes JSON for the JSON tab (batch-based view)
  const scenesJson = useMemo(() => JSON.stringify(batchScenes, null, 2), [batchScenes]);
  const highlightedScenesJson = useMemo(() => highlightJson(scenesJson, jsonStyles), [scenesJson]);

  // Full JSON for copy (not paginated)
  const fullScenesJson = useMemo(() => JSON.stringify(scenes, null, 2), [scenes]);

  const handleCopyScenesJson = useCallback(async () => {
    try {
      // BUG FIX #14: Always copy full JSON, not just current page
      await navigator.clipboard.writeText(fullScenesJson);
      setScenesCopyStatus("Copied!");
      setTimeout(() => setScenesCopyStatus(""), 2000);
    } catch {
      setScenesCopyStatus("Failed");
      setTimeout(() => setScenesCopyStatus(""), 2000);
    }
  }, [fullScenesJson]);

  // Batch navigation controls for JSON view
  const handleJsonPrevBatch = useCallback(() => {
    setJsonPage(p => Math.max(0, p - 1));
  }, []);

  const handleJsonNextBatch = useCallback(() => {
    setJsonPage(p => Math.min(totalBatches - 1, p + 1));
  }, [totalBatches]);

  const hasLogs = logEntries && logEntries.length > 0;

  const tabs: { key: TabType; label: string }[] = [
    { key: "scenes", label: lang.prompt.result.scenes },
    { key: "json", label: "JSON" },
    { key: "characters", label: lang.prompt.result.characters },
    ...(colorProfile ? [{ key: "color" as TabType, label: lang.prompt.result.color }] : []),
    ...(hasLogs ? [{ key: "logs" as TabType, label: "Logs" }] : []),
    ...(onViewJob ? [{ key: "history" as TabType, label: lang.prompt.history.title }] : []),
  ];

  // Get video thumbnail URL
  const thumbnailUrl = summary.videoId ? getYouTubeThumbnail(summary.videoId, "high") : null;
  // Get video title from script or use video ID as fallback
  const videoTitle = script?.title || `Video ${summary.videoId}`;

  return (
    <div className={styles.container}>
        {/* Video Summary Header - Thumbnail + Title */}
        <div className={styles.videoSummaryHeader}>
        {thumbnailUrl && (
          <div className={styles.thumbnailWrapper}>
            <img
              src={thumbnailUrl}
              alt={videoTitle}
              className={styles.thumbnail}
            />
          </div>
        )}
        <div className={styles.videoInfo}>
          <h3 className={styles.videoTitle}>{videoTitle}</h3>
          <a
            href={summary.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.videoLink}
          >
            {summary.youtubeUrl}
          </a>
        </div>
      </div>

      {/* Stats and Download Header */}
      <div className={styles.summaryHeader}>
        <div className={styles.summaryStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{summary.actualScenes}</span>
            <span className={styles.statLabel}>{lang.prompt.result.summaryStats.totalScenes}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{summary.charactersFound}</span>
            <span className={styles.statLabel}>{lang.prompt.result.summaryStats.characters}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {summary.mode === "direct" ? lang.prompt.modes.direct : lang.prompt.modes.hybrid}
            </span>
            <span className={styles.statLabel}>{lang.prompt.result.summaryStats.mode}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{summary.processingTime}</span>
            <span className={styles.statLabel}>{lang.prompt.result.summaryStats.processingTime}</span>
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
            {lang.prompt.result.download}
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
                {lang.prompt.result.downloadOptions.scenesJson}
              </button>
              <button onClick={handleDownloadScenesTxt}>
                {lang.prompt.result.downloadOptions.scenesTxt}
              </button>
              <button onClick={handleDownloadCharacters}>
                {lang.prompt.result.downloadOptions.characters}
              </button>
              {script && (
                <button onClick={handleDownloadScript}>
                  {lang.prompt.result.downloadOptions.script}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs - Navigation */}
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

      {/* Retry Section for Failed/Partial Jobs */}
      {(summary.status === "failed" || summary.status === "partial") && summary.error && (
        <div className={styles.retrySection}>
          <p className={styles.failedMessage}>
            {summary.status === "failed"
              ? lang.prompt.result.jobFailed
              : lang.prompt.result.jobPartial
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
              {lang.prompt.result.retryJob}
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className={styles.content}>
        {/* Scenes Tab - Interactive card list */}
        {activeTab === "scenes" && (
          <VeoSceneCards scenes={scenes} />
        )}

        {/* JSON Tab - Raw scenes JSON code view (batch-based) */}
        {activeTab === "json" && (
          <div className={jsonStyles.jsonViewContainer}>
            <div className={jsonStyles.jsonHeader}>
              <h3>
                Scenes ({scenes.length})
                {hasMultipleBatches && (
                  <span style={{ fontWeight: 400, fontSize: '0.85em', marginLeft: '0.5rem', opacity: 0.7 }}>
                    - Batch {jsonPage + 1}/{totalBatches} (scenes {jsonPage * batchSize + 1}-{Math.min((jsonPage + 1) * batchSize, scenes.length)})
                  </span>
                )}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {hasMultipleBatches && (
                  <>
                    <button
                      onClick={handleJsonPrevBatch}
                      disabled={jsonPage === 0}
                      className={jsonStyles.copyButton}
                      style={{
                        opacity: jsonPage === 0 ? 0.5 : 1,
                        cursor: jsonPage === 0 ? 'not-allowed' : 'pointer',
                        padding: '0.5rem 0.75rem'
                      }}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Batch {jsonPage + 1} / {totalBatches}
                    </span>
                    <button
                      onClick={handleJsonNextBatch}
                      disabled={jsonPage >= totalBatches - 1}
                      className={jsonStyles.copyButton}
                      style={{
                        opacity: jsonPage >= totalBatches - 1 ? 0.5 : 1,
                        cursor: jsonPage >= totalBatches - 1 ? 'not-allowed' : 'pointer',
                        padding: '0.5rem 0.75rem'
                      }}
                    >
                      Next →
                    </button>
                  </>
                )}
                <button onClick={handleCopyScenesJson} className={jsonStyles.copyButton}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  {scenesCopyStatus || "Copy All"}
                </button>
              </div>
            </div>
            <pre className={jsonStyles.jsonContent}>
              <code>{highlightedScenesJson}</code>
            </pre>
          </div>
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
