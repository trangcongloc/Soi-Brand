"use client";

import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/lang";
import { getCachedJobList, deleteCachedJob, CachedPromptJobInfo, isUsingCloudStorage, syncJobToCloud } from "@/lib/prompt";
import { listenToJobUpdates } from "@/lib/prompt/storage-utils";
import styles from "./PromptHistoryPanel.module.css";

interface VeoHistoryPanelProps {
  onViewJob: (jobId: string) => void;
  onRegenerateJob?: (jobId: string) => void;
  onRetryJob?: (jobId: string) => void;
  currentJobId?: string;
  onJobsChange?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

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

function VeoHistoryPanel({ onViewJob, onRegenerateJob, onRetryJob, currentJobId, onJobsChange, collapsed = false, onToggleCollapse }: VeoHistoryPanelProps) {
  const lang = useLang();
  const [jobs, setJobs] = useState<CachedPromptJobInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [storageType, setStorageType] = useState<'cloud' | 'local'>('local');
  const [syncingJobs, setSyncingJobs] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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

  // BUG FIX #21: Force re-render every 5 seconds for better countdown UX
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const hasCountdowns = jobs.some(
      job => job.expiresAt && (job.status === 'failed' || job.status === 'partial')
    );

    if (!hasCountdowns) return; // Skip interval if no countdowns

    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 5000); // Update every 5 seconds for responsive countdown

    return () => clearInterval(interval);
  }, [jobs]);

  // Check storage type on mount and when jobs change
  useEffect(() => {
    isUsingCloudStorage().then((isCloud: boolean) => {
      setStorageType(isCloud ? 'cloud' : 'local');
    });
  }, [jobs]);

  // BUG FIX #13: Move state reset to finally block and add error handling
  const handleDelete = useCallback(async (jobId: string) => {
    setLoading(true);
    try {
      // Delete from both local and cloud
      await deleteCachedJob(jobId);
      await refreshJobs();
    } catch (error) {
      console.error("[VeoHistory] Failed to delete job:", error);
      // Still refresh to show current state
      await refreshJobs().catch(() => {});
    } finally {
      setConfirmDeleteId(null); // Always reset confirmation state
      setLoading(false);
    }
  }, [refreshJobs]);


  const handleSyncJob = useCallback(async (jobId: string) => {
    setSyncingJobs(prev => new Set(prev).add(jobId));
    try {
      const success = await syncJobToCloud(jobId);
      if (success) {
        // Refresh to show updated storage source
        await refreshJobs();
      } else {
        alert(lang.prompt.history.syncFailed);
      }
    } catch (error) {
      console.error("[VeoHistory] Failed to sync job:", error);
      alert(lang.prompt.history.syncFailed);
    } finally {
      setSyncingJobs(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }, [refreshJobs, lang]);

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
    // jobId format: prompt_1706371200000_abc123
    const parts = jobId.split("_");
    if (parts.length >= 3) {
      return `${parts[1].slice(-7)}_${parts[2]}`;  // "1200000_abc123"
    }
    return jobId.slice(-15);
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    if (status === "in_progress") {
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          className={`${styles.statusIcon} ${styles.statusIconSpinning}`}
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      );
    }
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
    const inProgress = jobs.filter(j => j.status === "in_progress").length;
    const partial = jobs.filter(j => j.status === "partial").length;
    const failed = jobs.filter(j => j.status === "failed").length;
    return { completed, inProgress, partial, failed, total: jobs.length };
  }, [jobs]);

  // Filter jobs by search query and status
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Filter by status if selected
    if (statusFilter) {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((job) => {
        const videoIdMatch = job.videoId?.toLowerCase().includes(query);
        const jobIdMatch = job.jobId.toLowerCase().includes(query);
        const videoUrlMatch = job.videoUrl?.toLowerCase().includes(query);
        return videoIdMatch || jobIdMatch || videoUrlMatch;
      });
    }

    return filtered;
  }, [jobs, searchQuery, statusFilter]);

  const sortedJobs = useMemo(() => {
    // Always sort by date (newest first)
    return [...filteredJobs].sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredJobs]);

  // Filter jobs for display
  const visibleJobs = showAll ? sortedJobs : sortedJobs.slice(0, VISIBLE_COUNT);
  const hasMore = sortedJobs.length > VISIBLE_COUNT;
  const hiddenCount = sortedJobs.length - VISIBLE_COUNT;

  // Collapsed state - show only toggle button
  if (collapsed) {
    return (
      <div className={`${styles.sidebar} ${styles.sidebarCollapsed}`}>
        <button
          className={styles.collapseToggle}
          onClick={onToggleCollapse}
          aria-label="Expand history panel"
          title={lang.prompt.history.title}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {jobs.length > 0 && <span className={styles.collapsedBadge}>{jobs.length}</span>}
        </button>
      </div>
    );
  }

  if (loading && jobs.length === 0) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <button
            className={styles.collapseToggle}
            onClick={onToggleCollapse}
            aria-label="Collapse history panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className={styles.empty}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <button
            className={styles.collapseToggle}
            onClick={onToggleCollapse}
            aria-label="Collapse history panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
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
            <p>{lang.prompt.history.noJobs}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <button
          className={styles.collapseToggle}
          onClick={onToggleCollapse}
          aria-label="Collapse history panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>
            {lang.prompt.history.title}
            {storageType === 'cloud' && (
              <span className={styles.cloudBadge}>Synced</span>
            )}
          </h3>
        </div>
        {jobs.length > 0 && (
          <div className={styles.jobStats}>
            <button
              className={`${styles.statInProgress} ${statusFilter === 'in_progress' ? styles.statActive : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'in_progress' ? null : 'in_progress')}
              title={lang.prompt.history.statusInProgress || "In Progress"}
              disabled={jobStats.inProgress === 0}
            >
              ◐ {jobStats.inProgress}
            </button>
            <button
              className={`${styles.statCompleted} ${statusFilter === 'completed' ? styles.statActive : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'completed' ? null : 'completed')}
              title={lang.prompt.history.statusCompleted}
              disabled={jobStats.completed === 0}
            >
              ✓ {jobStats.completed}
            </button>
            <button
              className={`${styles.statPartial} ${statusFilter === 'partial' ? styles.statActive : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'partial' ? null : 'partial')}
              title={lang.prompt.history.statusPartial}
              disabled={jobStats.partial === 0}
            >
              ⚠ {jobStats.partial}
            </button>
            <button
              className={`${styles.statFailed} ${statusFilter === 'failed' ? styles.statActive : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'failed' ? null : 'failed')}
              title={lang.prompt.history.statusFailed}
              disabled={jobStats.failed === 0}
            >
              ✗ {jobStats.failed}
            </button>
          </div>
        )}
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
              placeholder={lang.prompt.history.searchPlaceholder}
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

<div className={styles.list}>
        <AnimatePresence>
          {visibleJobs.map((job, index) => {
            const isExpired = job.expiresAt ? Date.now() > job.expiresAt : false;
            const showRetryCountdown = job.expiresAt && (job.status === 'failed' || job.status === 'partial');
            // Cache deletion time: 7 days from timestamp
            const cacheExpiresAt = job.timestamp + (7 * 24 * 60 * 60 * 1000);
            const showCacheCountdown = job.status === 'completed' && cacheExpiresAt > Date.now();

            return (
            <motion.div
              key={job.jobId}
              className={`${styles.jobCard} ${currentJobId === job.jobId ? styles.active : ""} ${isExpired ? styles.expiredJob : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => {
                if (currentJobId === job.jobId) return;
                // If job has scenes, view it (even if marked as in_progress)
                if (job.sceneCount > 0) {
                  onViewJob(job.jobId);
                } else if (job.status === 'in_progress' && onRetryJob) {
                  onRetryJob(job.jobId); // Resume in_progress job without scenes
                }
              }}
              style={{ cursor: (job.status === 'in_progress' || job.sceneCount > 0) && currentJobId !== job.jobId ? 'pointer' : 'default' }}
            >
              <div className={styles.jobInfo}>
                <div className={styles.jobHeader}>
                  {getStatusIcon(job.status)}
                  <span className={styles.jobVideoId}>{truncateUrl(job.videoUrl)}</span>
                  <span className={styles.jobMode}>{job.mode}</span>
                  {job.storageSource === 'cloud' && (
                    <span className={styles.cloudBadgeSmall}>Synced</span>
                  )}
                  {job.hasScript && !job.error && (
                    <span className={styles.scriptBadge} title={lang.prompt.history.scriptCached}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {lang.prompt.history.scriptCached}
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
                {job.status === 'in_progress' && (
                  <div className={styles.inProgressIndicator}>
                    <span className={styles.inProgressMessage}>
                      {lang.prompt.history.clickToResume || "Click to resume"}
                    </span>
                  </div>
                )}
                {job.error && (
                  <div className={styles.errorIndicator}>
                    <span className={styles.errorMessage}>
                      {job.error.failedBatch
                        ? lang.prompt.history.failedAtBatch
                            .replace("{current}", String(job.error.failedBatch))
                            .replace("{total}", String(job.error.totalBatches))
                        : lang.prompt.history.generationFailed
                      }
                    </span>
                    {job.error.retryable && (
                      <span className={styles.retryableHint}>• {lang.prompt.history.retryable}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom-right time badges */}
              <div className={styles.timebadges}>
                {/* Retry countdown for failed/partial jobs (red/orange) */}
                {showRetryCountdown && !isExpired && (
                  <div className={styles.retryTimeBadge}>
                    {formatTimeRemaining(job.expiresAt!)}
                  </div>
                )}

                {/* Cache expiration for completed jobs (green) */}
                {showCacheCountdown && (
                  <div className={styles.cacheTimeBadge}>
                    {formatTimeRemaining(cacheExpiresAt)}
                  </div>
                )}

                {/* Expired indicator */}
                {isExpired && (
                  <div className={styles.expiredBadge}>
                    {lang.prompt.expired}
                  </div>
                )}
              </div>

              <div className={styles.jobActions}>
                {confirmDeleteId !== job.jobId && (
                  <>
                    {/* Retry button - show for failed jobs */}
                    {job.error && job.error.retryable && onRetryJob && (
                      <button
                        className={isExpired ? styles.disabledButton : styles.actionButton}
                        data-action="retry"
                        onClick={(e) => { e.stopPropagation(); !isExpired && onRetryJob(job.jobId); }}
                        disabled={isExpired}
                        title={isExpired ? lang.prompt.jobExpiredCannotRetry : lang.prompt.history.retryFromBatch}
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
                        
                      </button>
                    )}
                    {/* Regenerate button - show for completed jobs with script */}
                    {job.hasScript && !job.error && onRegenerateJob && (
                      <button
                        data-action="regenerate"
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegenerateJob(job.jobId); }}
                        title={lang.prompt.history.regenerate}
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
                    {job.storageSource === 'local' && storageType === 'cloud' && job.status === 'completed' && (
                      <button
                        data-action="sync"
                        className={styles.actionButton}
                        onClick={(e) => { e.stopPropagation(); handleSyncJob(job.jobId); }}
                        disabled={syncingJobs.has(job.jobId)}
                        title={lang.prompt.history.syncToCloud}
                      >
                        {syncingJobs.has(job.jobId) ? (
                          <>
                            <span className={styles.spinnerSmall} />
                            
                          </>
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                            
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}

                {/* Delete button - expands when clicked */}
                <div
                  className={`${styles.deleteButton} ${confirmDeleteId === job.jobId ? styles.deleteButtonExpanded : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {confirmDeleteId === job.jobId ? (
                    <>
                      <span className={styles.deleteConfirmText}>Delete?</span>
                      <button
                        className={styles.deleteConfirmIcon}
                        onClick={() => handleDelete(job.jobId)}
                        title={lang.prompt.history.deleteButton}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        className={styles.deleteCancelIcon}
                        onClick={() => setConfirmDeleteId(null)}
                        title={lang.prompt.history.cancelAction}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      data-action="delete"
                      className={styles.deleteIcon}
                      onClick={() => setConfirmDeleteId(job.jobId)}
                      aria-label={lang.prompt.history.deleteJob}
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
                  )}
                </div>
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
              ? lang.prompt.history.showLess
              : `${lang.prompt.history.showMore} (${hiddenCount})`}
          </button>
        )}
      </div>
    </div>
      </div>
    </div>
  );
}

export default memo(VeoHistoryPanel);
