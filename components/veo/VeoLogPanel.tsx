"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { GeminiLogEntry } from "@/lib/veo/types";
import { highlightJson } from "./json-highlight";
import styles from "./VeoLogPanel.module.css";

type LogMode = "compact" | "verbose";

interface VeoLogPanelProps {
  entries: GeminiLogEntry[];
}

/**
 * Get phase display label
 */
function getPhaseLabel(entry: GeminiLogEntry): string {
  switch (entry.phase) {
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
 * Format character count with commas
 */
function formatChars(n: number): string {
  return n.toLocaleString();
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
  const hasRetries = entry.timing.retries > 0;
  const hasError = !!entry.error;

  return (
    <div className={styles.compactEntry}>
      <div className={styles.compactHeader}>
        <span className={`${styles.phaseLabel} ${phaseCls}`}>
          [{entry.phase === "phase-2" ? "Phase 2" : entry.phase === "phase-1" ? "Phase 1" : "Phase 0"}] {phaseLabel}
        </span>
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
      </div>
      <div className={styles.compactDetail}>
        <span className={styles.sentLabel}>{"> "} Sent:</span>{" "}
        {formatChars(entry.request.promptLength)} chars{" "}
        <span className={styles.recvLabel}>{"< "} Recv:</span>{" "}
        {entry.response.parsedSummary}
        {entry.tokens && (
          <span className={styles.tokens}>
            {formatChars(entry.tokens.total)} tokens
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Verbose log entry component
 */
function VerboseEntry({ entry }: { entry: GeminiLogEntry }) {
  const phaseLabel = getPhaseLabel(entry);
  const phaseCls = getPhaseLabelClass(entry.phase);

  const prettyRequest = useMemo(() => tryPrettyJson(entry.request.body), [entry.request.body]);
  const prettyResponse = useMemo(() => tryPrettyJson(entry.response.body), [entry.response.body]);

  return (
    <div className={styles.verboseEntry}>
      <div className={`${styles.verboseHeader} ${phaseCls}`}>
        {"━━━"} [{entry.phase === "phase-2" ? "Phase 2" : entry.phase === "phase-1" ? "Phase 1" : "Phase 0"}] {phaseLabel} {"━".repeat(30)}
      </div>

      <div className={`${styles.sectionLabel} ${styles.requestLabel}`}>
        {"▶"} REQUEST ({formatChars(entry.request.promptLength)} chars)
      </div>
      <div className={styles.codeBlock}>{highlightJsonLocal(prettyRequest)}</div>

      <div className={`${styles.sectionLabel} ${styles.responseLabel}`}>
        {"◀"} RESPONSE ({entry.tokens ? `${formatChars(entry.tokens.total)} tokens` : `${formatChars(entry.response.responseLength)} chars`} {"\u00B7"} {formatDuration(entry.timing.durationMs)})
      </div>
      <div className={styles.codeBlock}>{highlightJsonLocal(prettyResponse)}</div>

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

export default function VeoLogPanel({ entries }: VeoLogPanelProps) {
  const [mode, setMode] = useState<LogMode>("compact");
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [entries.length]);

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

  if (entries.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.terminal}>
          <div className={styles.empty}>No log entries yet</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
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
        {mode === "compact" ? (
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
          entries.map((entry) => (
            <VerboseEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
