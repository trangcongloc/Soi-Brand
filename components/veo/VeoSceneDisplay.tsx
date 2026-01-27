"use client";

import { memo, useState } from "react";
import { useLang } from "@/lib/lang";
import { Scene, CharacterRegistry, VeoJobSummary, GeneratedScript } from "@/lib/veo";
import VeoSceneCard from "./VeoSceneCard";
import VeoCharacterPanel from "./VeoCharacterPanel";
import VeoDownloadPanel from "./VeoDownloadPanel";
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

type TabType = "summary" | "scenes" | "characters" | "download" | "history";

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
  const [activeTab, setActiveTab] = useState<TabType>("summary");

  const tabs: { key: TabType; label: string }[] = [
    { key: "summary", label: lang.veo.result.summary },
    { key: "scenes", label: lang.veo.result.scenes },
    { key: "characters", label: lang.veo.result.characters },
    { key: "download", label: lang.veo.result.download },
    // Only show history tab if onViewJob handler is provided
    ...(onViewJob ? [{ key: "history" as TabType, label: lang.veo.history.title }] : []),
  ];

  return (
    <div className={styles.container}>
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
        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                {lang.veo.result.summaryStats.totalScenes}
              </span>
              <span className={styles.summaryValue}>{summary.actualScenes}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                {lang.veo.result.summaryStats.characters}
              </span>
              <span className={styles.summaryValue}>{summary.charactersFound}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                {lang.veo.result.summaryStats.mode}
              </span>
              <span className={styles.summaryValue}>
                {summary.mode === "direct" ? lang.veo.modes.direct : lang.veo.modes.hybrid}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                {lang.veo.result.summaryStats.voice}
              </span>
              <span className={styles.summaryValue}>{summary.voice}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>
                {lang.veo.result.summaryStats.processingTime}
              </span>
              <span className={styles.summaryValue}>{summary.processingTime}</span>
            </div>
          </div>
        )}

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

        {/* Download Tab */}
        {activeTab === "download" && (
          <VeoDownloadPanel
            scenes={scenes}
            characterRegistry={characterRegistry}
            summary={summary}
            script={script}
            jobId={jobId}
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
