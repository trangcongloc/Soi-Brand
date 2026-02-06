"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type {
  GeminiLogEntry,
  PromptWorkflow,
  PromptMode,
  SceneCountMode,
  AudioSettings,
  MediaType,
} from "@/lib/prompt/types";
import { highlightJson } from "./json-highlight";
import styles from "./PromptLogPanel.module.css";

type LogMode = "compact" | "verbose" | "settings";

// Phase timer tracking for per-phase elapsed time
interface PhaseTimer {
  phase: string;
  startTime: number;      // Date.now() when phase started
  endTime?: number;       // Date.now() when phase completed
  elapsedSeconds: number; // Running counter while active
}

type PhaseType = GeminiLogEntry["phase"];

/** Active job settings for the Settings tab */
interface ActiveJobSettings {
  workflow: PromptWorkflow;
  mode: PromptMode;
  sceneCountMode: SceneCountMode;
  sceneCount: number;
  batchSize: number;
  audio: AudioSettings;
  mediaType: MediaType;
  extractColorProfile: boolean;
  useVideoTitle: boolean;
  useVideoDescription: boolean;
  useVideoChapters: boolean;
  useVideoCaptions: boolean;
  negativePrompt?: string;
  selfieMode?: boolean;
}

interface VeoLogPanelProps {
  entries: GeminiLogEntry[];
  // Progress props
  batch?: number;
  totalBatches?: number;
  scenesGenerated?: number;
  message?: string;
  characters?: string[];
  onCancel?: () => void;
  // Active job settings for the Settings tab
  activeSettings?: ActiveJobSettings | null;
}

/**
 * Get phase display label
 */
function getPhaseLabel(entry: GeminiLogEntry): string {
  switch (entry.phase) {
    case "phase-script":
      return "Script Extraction";
    case "phase-0":
      return "Color Profile Extraction";
    case "phase-1":
      return "Character Extraction";
    case "phase-2":
      return entry.batchNumber !== undefined
        ? `Batch ${entry.batchNumber + 1}`
        : "Scene Generation";
  }
}

/**
 * Get phase CSS class
 */
function getPhaseLabelClass(phase: GeminiLogEntry["phase"]): string {
  switch (phase) {
    case "phase-script":
      return styles.phaseLabelScript;
    case "phase-0":
      return styles.phaseLabel0;
    case "phase-1":
      return styles.phaseLabel1;
    case "phase-2":
      return styles.phaseLabel2;
  }
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Calculate total duration for a group of entries
 */
function calcGroupDuration(entries: GeminiLogEntry[]): number {
  return entries.reduce((sum, e) => sum + e.timing.durationMs, 0);
}

/**
 * Format character count with commas
 */
function formatChars(n: number): string {
  return n.toLocaleString();
}

/**
 * Format elapsed time as m:ss or h:mm:ss
 */
function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Detect current phase from entries or message
 */
function getCurrentPhase(entries: GeminiLogEntry[], message?: string): PhaseType | null {
  // Check message for phase hints first
  if (message) {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("script")) return "phase-script";
    if (lowerMsg.includes("color") || lowerMsg.includes("phase 0") || lowerMsg.includes("video analysis")) return "phase-0";
    if (lowerMsg.includes("character") || lowerMsg.includes("phase 1")) return "phase-1";
    if (lowerMsg.includes("scene") || lowerMsg.includes("phase 2") || lowerMsg.includes("batch")) return "phase-2";
  }

  // Fallback: check last pending entry
  const pending = entries.find(e => e.status === "pending");
  if (pending) return pending.phase;

  // Fallback: check last entry
  if (entries.length > 0) {
    return entries[entries.length - 1].phase;
  }

  return null;
}

/**
 * Get phase display name for compact headers
 */
function getPhaseDisplayName(phase: PhaseType): string {
  switch (phase) {
    case "phase-script":
      return "Script Extraction";
    case "phase-0":
      return "Video Analysis";
    case "phase-1":
      return "Character Extraction";
    case "phase-2":
      return "Scene Generation";
  }
}

/**
 * Wrapper around shared highlightJson that passes local CSS module classes.
 */
function highlightJsonLocal(json: string): React.ReactNode[] {
  return highlightJson(json, styles);
}

/**
 * Try to pretty-print JSON, fall back to raw string
 */
function tryPrettyJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

/**
 * Compact log entry component
 */
function CompactEntry({ entry }: { entry: GeminiLogEntry }) {
  const phaseLabel = getPhaseLabel(entry);
  const phaseCls = getPhaseLabelClass(entry.phase);
  const isPending = entry.status === "pending";
  const hasRetries = entry.timing.retries > 0;
  const hasError = !!entry.error;
  const [expandedSection, setExpandedSection] = useState<"sent" | "recv" | null>(null);

  const prettyRequest = useMemo(() => tryPrettyJson(entry.request.body), [entry.request.body]);
  const prettyResponse = useMemo(() => tryPrettyJson(entry.response.body), [entry.response.body]);

  const toggleSection = (section: "sent" | "recv") => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className={`${styles.compactEntry} ${isPending ? styles.compactEntryPending : ""}`}>
      <div className={styles.compactHeader}>
        <span className={`${styles.phaseLabel} ${phaseCls}`}>
          [{entry.phase === "phase-2" ? "Phase 2" : entry.phase === "phase-1" ? "Phase 1" : "Phase 0"}] {phaseLabel}
        </span>
        {isPending ? (
          <>
            <span className={styles.pendingDot} />
            <span className={styles.statusPending}>SENDING</span>
          </>
        ) : (
          <>
            <span className={styles.duration}>
              {formatDuration(entry.timing.durationMs)}
            </span>
            {hasError ? (
              <span className={styles.statusErr}>ERR {entry.error?.type || ""}</span>
            ) : hasRetries ? (
              <>
                <span className={styles.statusRetry}>
                  ERR {"\u2192"} RETRY({entry.timing.retries})
                </span>
                <span className={styles.statusOk}>{"\u2192"} 200 OK</span>
              </>
            ) : (
              <span className={styles.statusOk}>200 OK</span>
            )}
          </>
        )}
      </div>
      <div className={styles.compactDetail}>
        <button
          className={`${styles.compactExpandBtn} ${styles.sentLabel}`}
          onClick={() => toggleSection("sent")}
          title="Click to expand request body"
        >
          {expandedSection === "sent" ? "\u25BC" : ">"} Sent:
        </button>{" "}
        {formatChars(entry.request.promptLength)} chars{" "}
        {isPending ? (
          <span className={styles.pendingLabel}>Awaiting response...</span>
        ) : hasError ? (
          <span className={styles.statusErr}>
            {"<"} Failed{entry.error?.type === "RETRY" ? " - Retrying..." : ` - ${entry.error?.message || "Unknown error"}`}
          </span>
        ) : (
          <>
            <button
              className={`${styles.compactExpandBtn} ${styles.recvLabel}`}
              onClick={() => toggleSection("recv")}
              title="Click to expand response body"
            >
              {expandedSection === "recv" ? "\u25BC" : "<"} Recv:
            </button>{" "}
            {entry.response.parsedSummary}
            {entry.tokens && (
              <span className={styles.tokens}>
                {formatChars(entry.tokens.total)} tokens
              </span>
            )}
          </>
        )}
      </div>
      {expandedSection === "sent" && (
        <div className={styles.compactCodeBlock}>
          {highlightJsonLocal(prettyRequest)}
        </div>
      )}
      {expandedSection === "recv" && !isPending && (
        <div className={styles.compactCodeBlock}>
          {highlightJsonLocal(prettyResponse)}
        </div>
      )}
    </div>
  );
}

/**
 * Verbose log entry component
 */
function VerboseEntry({ entry }: { entry: GeminiLogEntry }) {
  const phaseLabel = getPhaseLabel(entry);
  const phaseCls = getPhaseLabelClass(entry.phase);
  const isPending = entry.status === "pending";

  const prettyRequest = useMemo(() => tryPrettyJson(entry.request.body), [entry.request.body]);
  const prettyResponse = useMemo(() => tryPrettyJson(entry.response.body), [entry.response.body]);

  return (
    <div className={`${styles.verboseEntry} ${isPending ? styles.verboseEntryPending : ""}`}>
      <div className={`${styles.verboseHeader} ${phaseCls}`}>
        {"━━━"} [{entry.phase === "phase-2" ? "Phase 2" : entry.phase === "phase-1" ? "Phase 1" : "Phase 0"}] {phaseLabel}
        {isPending && <span className={styles.pendingDot} />}
        {isPending && <span className={styles.statusPending}>SENDING</span>}
        {" "}{"━".repeat(30)}
      </div>

      <div className={`${styles.sectionLabel} ${styles.requestLabel}`}>
        {"▶"} REQUEST ({formatChars(entry.request.promptLength)} chars)
      </div>
      <div className={styles.codeBlock}>{highlightJsonLocal(prettyRequest)}</div>

      {isPending ? (
        <div className={`${styles.sectionLabel} ${styles.pendingLabel}`}>
          {"◀"} RESPONSE — awaiting response...
        </div>
      ) : (
        <>
          <div className={`${styles.sectionLabel} ${styles.responseLabel}`}>
            {"◀"} RESPONSE ({entry.tokens ? `${formatChars(entry.tokens.total)} tokens` : `${formatChars(entry.response.responseLength)} chars`} {"\u00B7"} {formatDuration(entry.timing.durationMs)})
          </div>
          <div className={styles.codeBlock}>{highlightJsonLocal(prettyResponse)}</div>
        </>
      )}

      <div className={styles.verboseMeta}>
        <span>Model: {entry.request.model}</span>
        {entry.timing.retries > 0 && (
          <span>Retries: {entry.timing.retries}</span>
        )}
        {entry.tokens && (
          <span>
            Tokens: {formatChars(entry.tokens.prompt)} prompt + {formatChars(entry.tokens.candidates)} candidates = {formatChars(entry.tokens.total)} total
          </span>
        )}
      </div>
    </div>
  );
}

interface PhaseGroups {
  phaseScript: GeminiLogEntry[];
  phase0: GeminiLogEntry[];
  phase1: GeminiLogEntry[];
  phase2Batches: Map<number, GeminiLogEntry[]>;
}

function groupByPhase(entries: GeminiLogEntry[]): PhaseGroups {
  const result: PhaseGroups = {
    phaseScript: [],
    phase0: [],
    phase1: [],
    phase2Batches: new Map(),
  };

  for (const entry of entries) {
    switch (entry.phase) {
      case "phase-script":
        result.phaseScript.push(entry);
        break;
      case "phase-0":
        result.phase0.push(entry);
        break;
      case "phase-1":
        result.phase1.push(entry);
        break;
      case "phase-2": {
        const batch = entry.batchNumber ?? 0;
        const existing = result.phase2Batches.get(batch);
        if (existing) {
          existing.push(entry);
        } else {
          result.phase2Batches.set(batch, [entry]);
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Compact phase header with elapsed time (shown between phase changes)
 */
function CompactPhaseHeader({
  phase,
  timer,
}: {
  phase: PhaseType;
  timer?: PhaseTimer;
}) {
  const isActive = timer && !timer.endTime;
  const elapsed = timer?.endTime
    ? Math.floor((timer.endTime - timer.startTime) / 1000)
    : timer?.elapsedSeconds ?? 0;

  return (
    <div className={styles.compactPhaseHeader}>
      <span className={styles.compactPhaseLine}>──</span>
      <span className={getPhaseLabelClass(phase)}>{getPhaseDisplayName(phase)}</span>
      <span className={styles.compactPhaseLine}>──</span>
      <span className={isActive ? styles.phaseTimeActive : styles.phaseTimeComplete}>
        {isActive ? `${formatElapsedTime(elapsed)}...` : `✓ ${formatElapsedTime(elapsed)}`}
      </span>
      <span className={styles.compactPhaseLine}>──</span>
    </div>
  );
}

function PhaseGroupHeader({
  label,
  count,
  duration,
  phaseClass,
  isOpen,
  onToggle,
  phaseTimer,
}: {
  label: string;
  count: number;
  duration?: number;
  phaseClass: string;
  isOpen: boolean;
  onToggle: () => void;
  phaseTimer?: PhaseTimer;
}) {
  const isPhaseActive = phaseTimer && !phaseTimer.endTime;
  const phaseElapsed = phaseTimer?.endTime
    ? Math.floor((phaseTimer.endTime - phaseTimer.startTime) / 1000)
    : phaseTimer?.elapsedSeconds ?? 0;

  return (
    <button className={`${styles.phaseGroupHeader} ${phaseClass}`} onClick={onToggle}>
      <svg
        className={`${styles.groupChevron} ${isOpen ? styles.groupChevronOpen : ""}`}
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
      {label}
      <span className={styles.groupCount}>({count})</span>
      {phaseTimer && (
        <span className={isPhaseActive ? styles.phaseTimeActive : styles.phaseTimeComplete}>
          {isPhaseActive ? `${formatElapsedTime(phaseElapsed)}...` : `✓ ${formatElapsedTime(phaseElapsed)}`}
        </span>
      )}
      {duration !== undefined && duration > 0 && !phaseTimer && (
        <span className={styles.groupDuration}>{formatDuration(duration)}</span>
      )}
    </button>
  );
}

/**
 * Compact batch sub-header (shown between batch changes within phase-2)
 */
function CompactBatchHeader({
  batchNumber,
  entries,
}: {
  batchNumber: number;
  entries: GeminiLogEntry[];
}) {
  const allComplete = entries.every(e => e.status !== "pending");
  const completedDuration = calcGroupDuration(entries);

  // Live timer for active batches (pending entries have durationMs=0)
  const [liveElapsed, setLiveElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (allComplete) {
      startTimeRef.current = null;
      return;
    }

    // Use earliest entry timestamp as batch start
    if (!startTimeRef.current && entries.length > 0) {
      const earliest = Math.min(...entries.map(e => new Date(e.timestamp).getTime()));
      startTimeRef.current = earliest;
    }

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setLiveElapsed(Date.now() - startTimeRef.current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [allComplete, entries]);

  const displayDuration = allComplete ? completedDuration : liveElapsed;

  return (
    <div className={styles.compactPhaseHeader}>
      <span className={styles.compactPhaseLine}>─</span>
      <span className={styles.phaseLabel2}>Batch {batchNumber + 1}</span>
      <span className={styles.compactPhaseLine}>─</span>
      <span className={allComplete ? styles.phaseTimeComplete : styles.phaseTimeActive}>
        {allComplete ? `✓ ${formatDuration(displayDuration)}` : `${formatDuration(displayDuration)}...`}
      </span>
      <span className={styles.compactPhaseLine}>─</span>
    </div>
  );
}

/**
 * Pre-compute batch groups for compact batch headers
 */
function computeBatchGroups(entries: GeminiLogEntry[]): Map<number, GeminiLogEntry[]> {
  const groups = new Map<number, GeminiLogEntry[]>();
  for (const entry of entries) {
    if (entry.phase === "phase-2" && entry.batchNumber !== undefined) {
      const batch = entry.batchNumber;
      const existing = groups.get(batch);
      if (existing) {
        existing.push(entry);
      } else {
        groups.set(batch, [entry]);
      }
    }
  }
  return groups;
}

/**
 * Render compact entries with phase headers when phase changes
 * and batch sub-headers within phase-2
 */
function renderCompactWithPhaseHeaders(
  entries: GeminiLogEntry[],
  phaseTimers: Map<string, PhaseTimer>
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let currentPhase: PhaseType | null = null;
  let currentBatch: number | null = null;
  const batchGroups = computeBatchGroups(entries);

  for (const entry of entries) {
    // Add phase header when phase changes
    if (entry.phase !== currentPhase) {
      result.push(
        <CompactPhaseHeader
          key={`phase-header-${entry.phase}-${entry.id}`}
          phase={entry.phase}
          timer={phaseTimers.get(entry.phase)}
        />
      );
      currentPhase = entry.phase;
      currentBatch = null; // Reset batch tracking on phase change
    }

    // Add batch sub-header when batch changes within phase-2
    if (entry.phase === "phase-2" && entry.batchNumber !== undefined && entry.batchNumber !== currentBatch) {
      const batchEntries = batchGroups.get(entry.batchNumber);
      if (batchEntries) {
        result.push(
          <CompactBatchHeader
            key={`batch-header-${entry.batchNumber}-${entry.id}`}
            batchNumber={entry.batchNumber}
            entries={batchEntries}
          />
        );
      }
      currentBatch = entry.batchNumber;
    }

    result.push(<CompactEntry key={entry.id} entry={entry} />);
  }

  return result;
}

function VerboseGrouped({
  entries,
  phaseTimers,
}: {
  entries: GeminiLogEntry[];
  phaseTimers: Map<string, PhaseTimer>;
}) {
  const groups = useMemo(() => groupByPhase(entries), [entries]);
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({
    phaseScript: false,
    phase0: false,
    phase1: false,
    phase2: false,
  });
  const [openBatches, setOpenBatches] = useState<Record<number, boolean>>({});

  const togglePhase = (phase: string) => {
    setOpenPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  const toggleBatch = (batch: number) => {
    setOpenBatches((prev) => ({ ...prev, [batch]: !(prev[batch] ?? false) }));
  };

  const sortedBatches = useMemo(
    () => Array.from(groups.phase2Batches.entries()).sort(([a], [b]) => a - b),
    [groups.phase2Batches]
  );

  const phase2TotalEntries = useMemo(
    () => sortedBatches.reduce((sum, [, entries]) => sum + entries.length, 0),
    [sortedBatches]
  );

  const phase2TotalDuration = useMemo(
    () => sortedBatches.reduce((sum, [, entries]) => sum + calcGroupDuration(entries), 0),
    [sortedBatches]
  );

  return (
    <>
      {/* Phase Script: Script Extraction */}
      {groups.phaseScript.length > 0 && (
        <div className={`${styles.phaseGroup} ${styles.phaseGroupScript}`}>
          <PhaseGroupHeader
            label="Script Extraction"
            count={groups.phaseScript.length}
            duration={calcGroupDuration(groups.phaseScript)}
            phaseClass={styles.phaseHeaderScript}
            isOpen={openPhases.phaseScript ?? false}
            onToggle={() => togglePhase("phaseScript")}
            phaseTimer={phaseTimers.get("phase-script")}
          />
          {(openPhases.phaseScript ?? false) &&
            groups.phaseScript.map((entry) => (
              <VerboseEntry key={entry.id} entry={entry} />
            ))}
        </div>
      )}

      {/* Phase 0: Color Profile Extraction */}
      {groups.phase0.length > 0 && (
        <div className={`${styles.phaseGroup} ${styles.phaseGroup0}`}>
          <PhaseGroupHeader
            label="Phase 0: Video Analysis"
            count={groups.phase0.length}
            duration={calcGroupDuration(groups.phase0)}
            phaseClass={styles.phaseHeader0}
            isOpen={openPhases.phase0 ?? false}
            onToggle={() => togglePhase("phase0")}
            phaseTimer={phaseTimers.get("phase-0")}
          />
          {(openPhases.phase0 ?? false) &&
            groups.phase0.map((entry) => (
              <VerboseEntry key={entry.id} entry={entry} />
            ))}
        </div>
      )}

      {/* Phase 1: Character Extraction */}
      {groups.phase1.length > 0 && (
        <div className={`${styles.phaseGroup} ${styles.phaseGroup1}`}>
          <PhaseGroupHeader
            label="Phase 1: Character Extraction"
            count={groups.phase1.length}
            duration={calcGroupDuration(groups.phase1)}
            phaseClass={styles.phaseHeader1}
            isOpen={openPhases.phase1 ?? false}
            onToggle={() => togglePhase("phase1")}
            phaseTimer={phaseTimers.get("phase-1")}
          />
          {(openPhases.phase1 ?? false) &&
            groups.phase1.map((entry) => (
              <VerboseEntry key={entry.id} entry={entry} />
            ))}
        </div>
      )}

      {/* Phase 2: Scene Generation — sub-grouped by batch */}
      {phase2TotalEntries > 0 && (
        <div className={`${styles.phaseGroup} ${styles.phaseGroup2}`}>
          <PhaseGroupHeader
            label="Phase 2: Scene Generation"
            count={phase2TotalEntries}
            duration={phase2TotalDuration}
            phaseClass={styles.phaseHeader2}
            isOpen={openPhases.phase2 ?? false}
            onToggle={() => togglePhase("phase2")}
            phaseTimer={phaseTimers.get("phase-2")}
          />
          {(openPhases.phase2 ?? false) &&
            sortedBatches.map(([batchNum, batchEntries]) => (
              <div key={batchNum} className={styles.batchGroup}>
                <button
                  className={styles.batchGroupHeader}
                  onClick={() => toggleBatch(batchNum)}
                >
                  <svg
                    className={`${styles.groupChevron} ${(openBatches[batchNum] ?? false) ? styles.groupChevronOpen : ""}`}
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  Batch {batchNum + 1}
                  <span className={styles.groupCount}>
                    ({batchEntries.length})
                  </span>
                  <span className={styles.groupDuration}>
                    {formatDuration(calcGroupDuration(batchEntries))}
                  </span>
                </button>
                {(openBatches[batchNum] ?? false) &&
                  batchEntries.map((entry) => (
                    <VerboseEntry key={entry.id} entry={entry} />
                  ))}
              </div>
            ))}
        </div>
      )}
    </>
  );
}

/**
 * Settings view — read-only display of active job configuration
 */
function SettingsView({ settings }: { settings?: ActiveJobSettings | null }) {
  if (!settings) {
    return (
      <div className={styles.empty}>No settings available</div>
    );
  }

  const onOff = (value: boolean) => (
    <span className={value ? styles.settingsValueOn : styles.settingsValueOff}>
      {value ? "on" : "off"}
    </span>
  );

  const sceneCountLabel =
    settings.sceneCountMode === "auto"
      ? `${settings.sceneCount} (auto)`
      : settings.sceneCountMode === "gemini"
        ? `${settings.sceneCount} (gemini)`
        : String(settings.sceneCount);

  return (
    <div className={styles.settingsView}>
      {/* Pipeline */}
      <div className={styles.settingsGroup}>
        <div className={styles.settingsGroupTitle}>
          {"── Pipeline "}{"─".repeat(24)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Workflow</span>
          <span className={styles.settingsValue}>{settings.workflow}</span>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Mode</span>
          <span className={styles.settingsValue}>{settings.mode}</span>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Scene Count</span>
          <span className={styles.settingsValue}>{sceneCountLabel}</span>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Batch Size</span>
          <span className={styles.settingsValue}>{settings.batchSize}</span>
        </div>
      </div>

      {/* Output */}
      <div className={styles.settingsGroup}>
        <div className={styles.settingsGroupTitle}>
          {"── Output "}{"─".repeat(26)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Media Type</span>
          <span className={styles.settingsValue}>{settings.mediaType}</span>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Color Prof.</span>
          {onOff(settings.extractColorProfile)}
        </div>
      </div>

      {/* Audio */}
      <div className={styles.settingsGroup}>
        <div className={styles.settingsGroupTitle}>
          {"── Audio "}{"─".repeat(27)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Voice</span>
          <span className={styles.settingsValue}>{settings.audio.voiceLanguage}</span>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Music</span>
          {onOff(settings.audio.music)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>SFX</span>
          {onOff(settings.audio.soundEffects)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Ambient</span>
          {onOff(settings.audio.environmentalAudio)}
        </div>
      </div>

      {/* Analysis */}
      <div className={styles.settingsGroup}>
        <div className={styles.settingsGroupTitle}>
          {"── Analysis "}{"─".repeat(24)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Title</span>
          {onOff(settings.useVideoTitle)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Description</span>
          {onOff(settings.useVideoDescription)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Chapters</span>
          {onOff(settings.useVideoChapters)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Captions</span>
          {onOff(settings.useVideoCaptions)}
        </div>
      </div>

      {/* Advanced */}
      <div className={styles.settingsGroup}>
        <div className={styles.settingsGroupTitle}>
          {"── Advanced "}{"─".repeat(24)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Selfie Mode</span>
          {onOff(settings.selfieMode ?? false)}
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsLabel}>Neg. Prompt</span>
          <span className={settings.negativePrompt ? styles.settingsValue : styles.settingsValueOff}>
            {settings.negativePrompt || "(none)"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VeoLogPanel({
  entries,
  batch,
  totalBatches,
  scenesGenerated,
  message,
  characters,
  onCancel,
  activeSettings,
}: VeoLogPanelProps) {
  const [mode, setMode] = useState<LogMode>("compact");
  const terminalRef = useRef<HTMLDivElement>(null);
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Phase timer tracking
  const [phaseTimers, setPhaseTimers] = useState<Map<string, PhaseTimer>>(new Map());
  const [activePhase, setActivePhase] = useState<PhaseType | null>(null);

  // Track if we're actively streaming (for elapsed time reset)
  const isStreaming = batch !== undefined || !!message;

  // When not streaming (viewing cached job), sanitize pending entries and compute timers
  const displayEntries = useMemo(() => {
    if (isStreaming) return entries;
    // Mark stale "pending" entries as "completed" when viewing cached data
    return entries.map(e => {
      if (e.status !== "pending") return e;
      return {
        ...e,
        status: "completed" as const,
        response: {
          ...e.response,
          // Replace stale "awaiting response..." with meaningful text
          parsedSummary: e.response.parsedSummary === "awaiting response..."
            ? "(response not captured)"
            : e.response.parsedSummary,
        },
      };
    });
  }, [entries, isStreaming]);

  // Compute phase timers from cached log data when not streaming
  const cachedPhaseTimers = useMemo(() => {
    if (isStreaming || entries.length === 0) return new Map<string, PhaseTimer>();
    const timers = new Map<string, PhaseTimer>();
    for (const entry of entries) {
      const existing = timers.get(entry.phase);
      const entryTime = new Date(entry.timestamp).getTime();
      const entryEnd = entryTime + entry.timing.durationMs;
      if (!existing) {
        timers.set(entry.phase, {
          phase: entry.phase,
          startTime: entryTime,
          endTime: entryEnd,
          elapsedSeconds: Math.floor(entry.timing.durationMs / 1000),
        });
      } else {
        // Extend phase to cover all entries
        const start = Math.min(existing.startTime, entryTime);
        const end = Math.max(existing.endTime ?? entryEnd, entryEnd);
        timers.set(entry.phase, {
          ...existing,
          startTime: start,
          endTime: end,
          elapsedSeconds: Math.floor((end - start) / 1000),
        });
      }
    }
    return timers;
  }, [entries, isStreaming]);

  // Derive current phase from entries/message
  const currentPhase = useMemo(
    () => getCurrentPhase(entries, message),
    [entries, message]
  );

  // Reset elapsed time and phase timers when streaming starts (new job)
  const prevStreamingRef = useRef(false);
  useEffect(() => {
    if (isStreaming && !prevStreamingRef.current) {
      // Just started streaming - reset timer and phase timers
      setElapsedTime(0);
      setPhaseTimers(new Map());
      setActivePhase(null);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Start new phase timer when phase changes
  useEffect(() => {
    if (!isStreaming || !currentPhase) return;

    if (currentPhase !== activePhase) {
      // Mark previous phase as complete
      if (activePhase) {
        setPhaseTimers(prev => {
          const updated = new Map(prev);
          const timer = updated.get(activePhase);
          if (timer && !timer.endTime) {
            updated.set(activePhase, { ...timer, endTime: Date.now() });
          }
          return updated;
        });
      }

      // Start new phase timer (replace if completed, e.g. after auto-retry)
      setPhaseTimers(prev => {
        const updated = new Map(prev);
        const existing = updated.get(currentPhase);
        // Create new timer if none exists OR if existing was already completed
        // (completed timers from a failed first attempt should be replaced on retry)
        if (!existing || existing.endTime) {
          updated.set(currentPhase, {
            phase: currentPhase,
            startTime: Date.now(),
            elapsedSeconds: 0,
          });
        }
        return updated;
      });
      setActivePhase(currentPhase);
    }
  }, [currentPhase, activePhase, isStreaming]);

  // Update elapsed seconds for active phase every second
  useEffect(() => {
    if (!activePhase || !isStreaming) return;
    const interval = setInterval(() => {
      setPhaseTimers(prev => {
        const updated = new Map(prev);
        const timer = updated.get(activePhase);
        if (timer && !timer.endTime) {
          updated.set(activePhase, {
            ...timer,
            elapsedSeconds: Math.floor((Date.now() - timer.startTime) / 1000),
          });
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activePhase, isStreaming]);

  // Elapsed time counter (only runs while streaming)
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Spinner animation
  const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerIndex((prev) => (prev + 1) % spinnerFrames.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // BUG FIX #22: Auto-scroll to bottom when entries change (not just count)
  // Using JSON serialization to detect in-place updates
  const entriesKey = useMemo(() => {
    // Create a simplified key based on entry IDs and statuses
    return displayEntries.map(e => `${e.id}:${e.status}`).join(',');
  }, [displayEntries]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [entriesKey]);

  // Use live timers when streaming, cached timers when viewing saved job
  const effectivePhaseTimers = isStreaming ? phaseTimers : cachedPhaseTimers;

  // Compute totals
  const totals = useMemo(() => {
    let totalTokens = 0;
    let totalDuration = 0;
    for (const entry of displayEntries) {
      if (entry.tokens) totalTokens += entry.tokens.total;
      totalDuration += entry.timing.durationMs;
    }
    return { totalTokens, totalDuration, count: displayEntries.length };
  }, [displayEntries]);

  // BUG FIX #23: Compute progress percentage correctly
  // batch is 1-indexed from the API, so we should use it directly
  // When batch=1/total=5, we want to show progress for "doing batch 1"
  // Progress = (completedBatches / totalBatches) * 100
  // If batch is the current batch being processed, progress = ((batch - 1) / total) * 100
  // But we want to show "in progress", so use batch/total to show forward movement
  const progressPercent = totalBatches && totalBatches > 0
    ? Math.min(((batch ?? 0) / totalBatches) * 100, 100)
    : 0;

  return (
    <div className={styles.panel}>
      {/* Progress Header */}
      {(batch !== undefined || message) && (
        <div className={styles.progressHeader}>
          {/* Status line with spinner and message */}
          <div className={styles.statusLine}>
            <span className={styles.spinner}>{spinnerFrames[spinnerIndex]}</span>
            <span className={styles.statusMessage}>{message || "Processing..."}</span>
          </div>

          {/* Progress bar */}
          {totalBatches && totalBatches > 0 && (
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Meta info row */}
          <div className={styles.metaInfo}>
            <span className={styles.elapsedTime}>{formatElapsedTime(elapsedTime)}</span>
            {batch !== undefined && totalBatches && (
              <span>Batch {batch}/{totalBatches}</span>
            )}
            {scenesGenerated !== undefined && (
              <span>{scenesGenerated} scenes</span>
            )}
            {characters && characters.length > 0 && (
              <span>Characters: {characters.join(", ")}</span>
            )}
            {onCancel && (
              <button
                className={styles.cancelButton}
                onClick={onCancel}
                title="Cancel generation"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${mode === "settings" ? styles.modeTabActive : ""}`}
          onClick={() => setMode("settings")}
        >
          Settings
        </button>
        <button
          className={`${styles.modeTab} ${mode === "compact" ? styles.modeTabActive : ""}`}
          onClick={() => setMode("compact")}
        >
          Compact
        </button>
        <button
          className={`${styles.modeTab} ${mode === "verbose" ? styles.modeTabActive : ""}`}
          onClick={() => setMode("verbose")}
        >
          Verbose
        </button>
      </div>

      <div className={styles.terminal} ref={terminalRef}>
        {mode === "settings" ? (
          <SettingsView settings={activeSettings} />
        ) : displayEntries.length === 0 ? (
          <div className={styles.empty}>{message || "Initializing..."}</div>
        ) : mode === "compact" ? (
          <>
            {renderCompactWithPhaseHeaders(displayEntries, effectivePhaseTimers)}
            <hr className={styles.separator} />
            <div className={styles.totalSummary}>
              Total: {totals.count} phase{totals.count !== 1 ? "s" : ""} | {formatChars(totals.totalTokens)} tokens | {formatDuration(totals.totalDuration)}
            </div>
          </>
        ) : (
          <VerboseGrouped entries={displayEntries} phaseTimers={effectivePhaseTimers} />
        )}
      </div>
    </div>
  );
}
