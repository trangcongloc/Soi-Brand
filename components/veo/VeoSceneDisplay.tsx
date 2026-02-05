"use client";

import { memo, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLang } from "@/lib/lang";
import type { Scene, CharacterRegistry, VeoJobSummary, GeneratedScript, CinematicProfile, GeminiLogEntry } from "@/lib/veo";
import { downloadJson as downloadJsonUtil, downloadText } from "@/lib/veo/download-utils";
import VeoCharacterPanel from "./VeoCharacterPanel";
import VeoHistoryPanel from "./VeoHistoryPanel";
import VeoColorProfilePanel from "./VeoColorProfilePanel";
import VeoLogPanel from "./VeoLogPanel";
import VeoSceneCards from "./VeoSceneCards";
import { highlightJson } from "./json-highlight";
import styles from "./VeoSceneDisplay.module.css";
import jsonStyles from "./VeoJsonView.module.css";

// BUG FIX #14: Pagination threshold for large datasets
const JSON_VIEW_PAGE_SIZE = 50; // Scenes per page to prevent browser freeze

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

  // BUG FIX #14: Paginated JSON view for large datasets
  const totalJsonPages = useMemo(() => Math.ceil(scenes.length / JSON_VIEW_PAGE_SIZE), [scenes.length]);
  const isLargeDataset = scenes.length > JSON_VIEW_PAGE_SIZE;

  // Get paginated scenes for JSON view
  const paginatedScenes = useMemo(() => {
    if (!isLargeDataset) return scenes;
    const start = jsonPage * JSON_VIEW_PAGE_SIZE;
    const end = start + JSON_VIEW_PAGE_SIZE;
    return scenes.slice(start, end);
  }, [scenes, jsonPage, isLargeDataset]);

  // Scenes JSON for the scenes tab code view (paginated for large datasets)
  const scenesJson = useMemo(() => JSON.stringify(paginatedScenes, null, 2), [paginatedScenes]);
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

  // BUG FIX #14: Pagination controls for JSON view
  const handleJsonPrevPage = useCallback(() => {
    setJsonPage(p => Math.max(0, p - 1));
  }, []);

  const handleJsonNextPage = useCallback(() => {
    setJsonPage(p => Math.min(totalJsonPages - 1, p + 1));
  }, [totalJsonPages]);

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
        {/* Scenes Tab - Interactive card list */}
        {activeTab === "scenes" && (
          <VeoSceneCards
            scenes={scenes}
            logEntries={logEntries}
            batchSize={summary.batchSize}
          />
        )}

        {/* JSON Tab - Raw scenes JSON code view */}
        {/* BUG FIX #14: Paginated view for large datasets */}
        {activeTab === "json" && (
          <div className={jsonStyles.jsonViewContainer}>
            <div className={jsonStyles.jsonHeader}>
              <h3>
                Scenes ({scenes.length})
                {isLargeDataset && (
                  <span style={{ fontWeight: 400, fontSize: '0.85em', marginLeft: '0.5rem', opacity: 0.7 }}>
                    - Showing {jsonPage * JSON_VIEW_PAGE_SIZE + 1}-{Math.min((jsonPage + 1) * JSON_VIEW_PAGE_SIZE, scenes.length)}
                  </span>
                )}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {isLargeDataset && (
                  <>
                    <button
                      onClick={handleJsonPrevPage}
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
                      {jsonPage + 1} / {totalJsonPages}
                    </span>
                    <button
                      onClick={handleJsonNextPage}
                      disabled={jsonPage >= totalJsonPages - 1}
                      className={jsonStyles.copyButton}
                      style={{
                        opacity: jsonPage >= totalJsonPages - 1 ? 0.5 : 1,
                        cursor: jsonPage >= totalJsonPages - 1 ? 'not-allowed' : 'pointer',
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
