"use client";

import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { getCachedJobList, deleteCachedJob, clearAllJobs, CachedVeoJobInfo, isUsingCloudStorage } from "@/lib/veo";
import { listenToJobUpdates } from "@/lib/veo/storage-utils";
import styles from "./VeoHistoryPanel.module.css";

interface VeoHistoryPanelProps {
  onViewJob: (jobId: string) => void;
  onRegenerateJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void; // New: retry failed job
  currentJobId?: string;
  onJobsChange?: () => void;
}

type SortOption = "date-desc" | "date-asc" | "status" | "scenes-desc" | "scenes-asc";

const VISIBLE_COUNT = 5;

/**
 * Format time remaining until expiration
 */
function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const remainingMs = expiresAt - now;

  if (remainingMs <= 0) return 'expired';

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function VeoHistoryPanel({ onViewJob, onRegenerateJob, onRetryJob, currentJobId, onJobsChange }: VeoHistoryPanelProps) {
  const lang = useLang();
  const [jobs, setJobs] = useState<CachedVeoJobInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [storageType, setStorageType] = useState<'cloud' | 'local'>('local');

  const refreshJobs = useCallback(async () => {
    setLoading(true);
    try {
      const jobList = await getCachedJobList();
      setJobs(jobList);
    } catch (error) {
      console.error("[VeoHistory] Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
    onJobsChange?.();
  }, [onJobsChange]);

  // Refresh jobs when component mounts or when jobs change
  useEffect(() => {
    // Initial refresh
    refreshJobs();

    // Listen for job updates (both same-tab and cross-tab via BroadcastChannel)
    const unsubscribe = listenToJobUpdates(() => {
      refreshJobs();
    });

    // Listen for database key changes
    const handleKeyChange = () => {
      refreshJobs();
    };
    window.addEventListener('database-key-changed', handleKeyChange);

    return () => {
      unsubscribe();
      window.removeEventListener('database-key-changed', handleKeyChange);
    };
  }, [refreshJobs]);

  // Force re-render every minute to update countdowns
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const hasCountdowns = jobs.some(
      job => job.expiresAt && (job.status === 'failed' || job.status === 'partial')
    );

    if (!hasCountdowns) return; // Skip interval if no countdowns

    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [jobs]);

  // Check storage type on mount and when jobs change
  useEffect(() => {
    isUsingCloudStorage().then((isCloud: boolean) => {
      setStorageType(isCloud ? 'cloud' : 'local');
    });
  }, [jobs]);

  const handleDelete = useCallback(async (jobId: string) => {
    setLoading(true);
    try {
      await deleteCachedJob(jobId);
      setConfirmDeleteId(null);
      await refreshJobs();
    } finally {
      setLoading(false);
    }
  }, [refreshJobs]);

  const handleClearAll = useCallback(async () => {
    setLoading(true);
    try {
      await clearAllJobs();
      setConfirmClearAll(false);
      await refreshJobs();
    } finally {
      setLoading(false);
    }
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

  const formatJobId = useCallback((jobId: string) => {
    // jobId format: veo_1706371200000_abc123
    const parts = jobId.split("_");
    if (parts.length >= 3) {
      return `${parts[1].slice(-7)}_${parts[2]}`;  // "1200000_abc123"
    }
    return jobId.slice(-15);
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

  // Filter jobs by search query (videoId or jobId)
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const query = searchQuery.toLowerCase().trim();
    return jobs.filter((job) => {
      const videoIdMatch = job.videoId?.toLowerCase().includes(query);
      const jobIdMatch = job.jobId.toLowerCase().includes(query);
      const videoUrlMatch = job.videoUrl?.toLowerCase().includes(query);
      return videoIdMatch || jobIdMatch || videoUrlMatch;
    });
  }, [jobs, searchQuery]);

  const sortedJobs = useMemo(() => {
    const jobsCopy = [...filteredJobs];

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
  }, [filteredJobs, sortBy]);

  // Filter jobs for display
  const visibleJobs = showAll ? sortedJobs : sortedJobs.slice(0, VISIBLE_COUNT);
  const hasMore = sortedJobs.length > VISIBLE_COUNT;
  const hiddenCount = sortedJobs.length - VISIBLE_COUNT;

  if (loading && jobs.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

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
          <h3 className={styles.title}>
            {lang.veo.history.title}
            <span className={storageType === 'cloud' ? styles.cloudBadge : styles.localBadge}>
              {storageType === 'cloud' ? `☁️ ${lang.veo.history.cloudStorage}` : `💾 ${lang.veo.history.localStorage}`}
            </span>
          </h3>
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

      {/* Search Bar */}
      {jobs.length > 0 && (
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrapper}>
            <svg
              className={styles.searchIcon}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={lang.veo.history.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <span className={styles.searchResultCount}>
              {filteredJobs.length} / {jobs.length}
            </span>
          )}
        </div>
      )}

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
          {visibleJobs.map((job, index) => {
            const isExpired = job.expiresAt ? Date.now() > job.expiresAt : false;
            const showCountdown = job.expiresAt && (job.status === 'failed' || job.status === 'partial');

            return (
            <motion.div
              key={job.jobId}
              className={`${styles.jobCard} ${currentJobId === job.jobId ? styles.active : ""} ${isExpired ? styles.expiredJob : ""}`}
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
                  {job.hasScript && !job.error && (
                    <span className={styles.scriptBadge} title={lang.veo.history.scriptCached}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {lang.veo.history.scriptCached}
                    </span>
                  )}
                </div>
                <div className={styles.jobMeta}>
                  <span>{job.sceneCount} scenes</span>
                  <span className={styles.separator}>•</span>
                  <span>{job.charactersFound} chars</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.jobDate}>{formatDate(job.timestamp)}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.jobIdText}>{formatJobId(job.jobId)}</span>
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

                {/* Countdown timer for failed/partial jobs */}
                {showCountdown && !isExpired && (
                  <div className={styles.countdown}>
                    <span className={styles.countdownText}>
                      {formatTimeRemaining(job.expiresAt!)} {lang.veo.leftToRetry}
                    </span>
                  </div>
                )}

                {isExpired && (
                  <div className={styles.expired}>
                    <span className={styles.expiredText}>{lang.veo.expired}</span>
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
                        className={isExpired ? styles.disabledButton : styles.retryButton}
                        onClick={() => !isExpired && onRetryJob(job.jobId)}
                        disabled={isExpired}
                        title={isExpired ? lang.veo.jobExpiredCannotRetry : lang.veo.history.retryFromBatch}
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
                          <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 73.51 15"/>
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
            );
          })}
        </AnimatePresence>

        {/* Show more/less toggle */}
        {hasMore && (
          <button
            className={styles.showMoreBtn}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? lang.veo.history.showLess
              : `${lang.veo.history.showMore} (${hiddenCount})`}
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(VeoHistoryPanel);
