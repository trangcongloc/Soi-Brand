"use client";

import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { getCachedJobList, deleteCachedJob, clearAllJobs, CachedVeoJobInfo } from "@/lib/veo";
import styles from "./VeoHistoryPanel.module.css";

interface VeoHistoryPanelProps {
  onViewJob: (jobId: string) => void;
  onRegenerateJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void; // New: retry failed job
  currentJobId?: string;
  onJobsChange?: () => void;
}

type SortOption = "date-desc" | "date-asc" | "status" | "scenes-desc" | "scenes-asc";

function VeoHistoryPanel({ onViewJob, onRegenerateJob, onRetryJob, currentJobId, onJobsChange }: VeoHistoryPanelProps) {
  const lang = useLang();
  const [jobs, setJobs] = useState<CachedVeoJobInfo[]>(() => getCachedJobList());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  const refreshJobs = useCallback(() => {
    setJobs(getCachedJobList());
    onJobsChange?.();
  }, [onJobsChange]);

  // Refresh jobs when component mounts or when localStorage changes
  useEffect(() => {
    // Initial refresh
    refreshJobs();

    // Listen for storage changes (when jobs are added from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("veo_job_")) {
        refreshJobs();
      }
    };

    // Listen for custom events (when jobs are added in same tab)
    const handleJobUpdate = () => {
      refreshJobs();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("veo-job-updated", handleJobUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("veo-job-updated", handleJobUpdate);
    };
  }, [refreshJobs]);

  const handleDelete = useCallback((jobId: string) => {
    deleteCachedJob(jobId);
    setConfirmDeleteId(null);
    refreshJobs();
  }, [refreshJobs]);

  const handleClearAll = useCallback(() => {
    clearAllJobs();
    setConfirmClearAll(false);
    refreshJobs();
  }, [refreshJobs]);

  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const truncateUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v") || url.split("/").pop() || "";
      return `...${videoId.slice(-11)}`;
    } catch {
      return url.slice(-15);
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    if (status === "failed") {
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          className={styles.statusIcon}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    }
    if (status === "partial") {
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          className={styles.statusIcon}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    }
    // Completed
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        className={styles.statusIcon}
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }, []);

  const jobStats = useMemo(() => {
    const completed = jobs.filter(j => j.status === "completed").length;
    const partial = jobs.filter(j => j.status === "partial").length;
    const failed = jobs.filter(j => j.status === "failed").length;
    return { completed, partial, failed, total: jobs.length };
  }, [jobs]);

  const sortedJobs = useMemo(() => {
    const jobsCopy = [...jobs];

    switch (sortBy) {
      case "date-desc":
        return jobsCopy.sort((a, b) => b.timestamp - a.timestamp);
      case "date-asc":
        return jobsCopy.sort((a, b) => a.timestamp - b.timestamp);
      case "status":
        // Sort by: completed > partial > failed
        const statusOrder = { completed: 0, partial: 1, failed: 2 };
        return jobsCopy.sort((a, b) => {
          const orderA = statusOrder[a.status] ?? 3;
          const orderB = statusOrder[b.status] ?? 3;
          if (orderA !== orderB) return orderA - orderB;
          // Secondary sort by date (newest first)
          return b.timestamp - a.timestamp;
        });
      case "scenes-desc":
        return jobsCopy.sort((a, b) => {
          if (b.sceneCount !== a.sceneCount) return b.sceneCount - a.sceneCount;
          // Secondary sort by date
          return b.timestamp - a.timestamp;
        });
      case "scenes-asc":
        return jobsCopy.sort((a, b) => {
          if (a.sceneCount !== b.sceneCount) return a.sceneCount - b.sceneCount;
          // Secondary sort by date
          return b.timestamp - a.timestamp;
        });
      default:
        return jobsCopy.sort((a, b) => b.timestamp - a.timestamp);
    }
  }, [jobs, sortBy]);

  if (jobs.length === 0) {
    return (
      <div className={styles.empty}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <p>{lang.veo.history.noJobs}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{lang.veo.history.title}</h3>
          {jobs.length > 0 && (
            <div className={styles.jobStats}>
              {jobStats.completed > 0 && (
                <span className={styles.statCompleted} title={lang.veo.history.statusCompleted}>
                  ✓ {jobStats.completed}
                </span>
              )}
              {jobStats.partial > 0 && (
                <span className={styles.statPartial} title={lang.veo.history.statusPartial}>
                  ⚠ {jobStats.partial}
                </span>
              )}
              {jobStats.failed > 0 && (
                <span className={styles.statFailed} title={lang.veo.history.statusFailed}>
                  ✗ {jobStats.failed}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          {jobs.length > 0 && (
            <>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label={lang.veo.history.sortJobs}
              >
                <option value="date-desc">{lang.veo.history.sortNewest}</option>
                <option value="date-asc">{lang.veo.history.sortOldest}</option>
                <option value="status">{lang.veo.history.sortStatus}</option>
                <option value="scenes-desc">{lang.veo.history.sortMostScenes}</option>
                <option value="scenes-asc">{lang.veo.history.sortLeastScenes}</option>
              </select>
              <button
                className={styles.clearAllButton}
                onClick={() => setConfirmClearAll(true)}
              >
                {lang.veo.history.clearAll}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Clear All Confirmation */}
      <AnimatePresence>
        {confirmClearAll && (
          <motion.div
            className={styles.confirmBanner}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <span>{lang.veo.history.confirmDelete}?</span>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmButton}
                onClick={handleClearAll}
              >
                {lang.veo.history.clearAll}
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setConfirmClearAll(false)}
              >
                {lang.veo.history.cancelAction}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.list}>
        <AnimatePresence>
          {sortedJobs.map((job, index) => (
            <motion.div
              key={job.jobId}
              className={`${styles.jobCard} ${currentJobId === job.jobId ? styles.active : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <div className={styles.jobInfo}>
                <div className={styles.jobHeader}>
                  {getStatusIcon(job.status)}
                  <span className={styles.jobVideoId}>{truncateUrl(job.videoUrl)}</span>
                  <span className={styles.jobMode}>{job.mode}</span>
                </div>
                <div className={styles.jobMeta}>
                  <span>{job.sceneCount} scenes</span>
                  <span className={styles.separator}>•</span>
                  <span>{job.charactersFound} chars</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.jobDate}>{formatDate(job.timestamp)}</span>
                </div>
                {job.error && (
                  <div className={styles.errorIndicator}>
                    <span className={styles.errorMessage}>
                      {job.error.failedBatch
                        ? lang.veo.history.failedAtBatch
                            .replace("{current}", String(job.error.failedBatch))
                            .replace("{total}", String(job.error.totalBatches))
                        : lang.veo.history.generationFailed
                      }
                    </span>
                    {job.error.retryable && (
                      <span className={styles.retryableHint}>• {lang.veo.history.retryable}</span>
                    )}
                  </div>
                )}
                {job.hasScript && !job.error && (
                  <div className={styles.scriptIndicator}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span>{lang.veo.history.scriptCached}</span>
                  </div>
                )}
              </div>

              <div className={styles.jobActions}>
                {confirmDeleteId === job.jobId ? (
                  <div className={styles.confirmInline}>
                    <button
                      className={styles.confirmDeleteButton}
                      onClick={() => handleDelete(job.jobId)}
                    >
                      {lang.veo.history.confirmDelete}
                    </button>
                    <button
                      className={styles.cancelDeleteButton}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      {lang.veo.history.cancelAction}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* View button - show for completed or partial jobs */}
                    {job.sceneCount > 0 && (
                      <button
                        className={styles.viewButton}
                        onClick={() => onViewJob(job.jobId)}
                        disabled={currentJobId === job.jobId}
                      >
                        {lang.veo.history.viewResult}
                      </button>
                    )}
                    {/* Retry button - show for failed jobs */}
                    {job.error && job.error.retryable && onRetryJob && (
                      <button
                        className={styles.retryButton}
                        onClick={() => onRetryJob(job.jobId)}
                        title={lang.veo.history.retryFromBatch}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 4v6h6M23 20v-6h-6"/>
                          <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                        </svg>
                        <span>{lang.veo.history.retryable}</span>
                      </button>
                    )}
                    {/* Regenerate button - show for completed jobs with script */}
                    {job.hasScript && !job.error && onRegenerateJob && (
                      <button
                        className={styles.regenerateButton}
                        onClick={() => onRegenerateJob(job.jobId)}
                        title={lang.veo.history.regenerate}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 4v6h6M23 20v-6h-6"/>
                          <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                        </svg>
                      </button>
                    )}
                    <button
                      className={styles.deleteButton}
                      onClick={() => setConfirmDeleteId(job.jobId)}
                      aria-label={lang.veo.history.deleteJob}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(VeoHistoryPanel);
