"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { GeminiLogEntry } from "@/lib/prompt/types";
import { highlightJson } from "./json-highlight";
import styles from "./PromptLogPanel.module.css";

type LogMode = "compact" | "verbose";

interface VeoLogPanelProps {
  entries: GeminiLogEntry[];
  // Progress props
  batch?: number;
  totalBatches?: number;
  scenesGenerated?: number;
  message?: string;
  characters?: string[];
  onCancel?: () => void;
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
              <span className={styles.statusErr}>ERR</span>
            ) : hasRetries ? (
              <>
                <span className={styles.statusRetry}>
                  ERR {"\u2192"} RETRY({entry.timing.retries})
                </span>
                <span className={styles.statusOk}>{"\u2192"} OK</span>
              </>
            ) : (
              <span className={styles.statusOk}>OK</span>
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

function PhaseGroupHeader({
  label,
  count,
  duration,
  phaseClass,
  isOpen,
  onToggle,
}: {
  label: string;
  count: number;
  duration?: number;
  phaseClass: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
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
      {duration !== undefined && duration > 0 && (
        <span className={styles.groupDuration}>{formatDuration(duration)}</span>
      )}
    </button>
  );
}

function VerboseGrouped({ entries }: { entries: GeminiLogEntry[] }) {
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
            label="Phase 0: Color Profile Extraction"
            count={groups.phase0.length}
            duration={calcGroupDuration(groups.phase0)}
            phaseClass={styles.phaseHeader0}
            isOpen={openPhases.phase0 ?? false}
            onToggle={() => togglePhase("phase0")}
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

export default function VeoLogPanel({
  entries,
  batch,
  totalBatches,
  scenesGenerated,
  message,
  characters,
  onCancel,
}: VeoLogPanelProps) {
  const [mode, setMode] = useState<LogMode>("compact");
  const terminalRef = useRef<HTMLDivElement>(null);
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track if we're actively streaming (for elapsed time reset)
  const isStreaming = batch !== undefined || !!message;

  // Reset elapsed time when streaming starts (new job)
  const prevStreamingRef = useRef(false);
  useEffect(() => {
    if (isStreaming && !prevStreamingRef.current) {
      // Just started streaming - reset timer
      setElapsedTime(0);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

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
    return entries.map(e => `${e.id}:${e.status}`).join(',');
  }, [entries]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [entriesKey]);

  // Compute totals
  const totals = useMemo(() => {
    let totalTokens = 0;
    let totalDuration = 0;
    for (const entry of entries) {
      if (entry.tokens) totalTokens += entry.tokens.total;
      totalDuration += entry.timing.durationMs;
    }
    return { totalTokens, totalDuration, count: entries.length };
  }, [entries]);

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
        {entries.length === 0 ? (
          <div className={styles.empty}>{message || "Initializing..."}</div>
        ) : mode === "compact" ? (
          <>
            {entries.map((entry) => (
              <CompactEntry key={entry.id} entry={entry} />
            ))}
            <hr className={styles.separator} />
            <div className={styles.totalSummary}>
              Total: {totals.count} phase{totals.count !== 1 ? "s" : ""} | {formatChars(totals.totalTokens)} tokens | {formatDuration(totals.totalDuration)}
            </div>
          </>
        ) : (
          <VerboseGrouped entries={entries} />
        )}
      </div>
    </div>
  );
}
