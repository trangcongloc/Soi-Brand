"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, useLang } from "@/lib/lang";
import styles from "./LoadingState.module.css";

const DEFAULT_STEPS_VI = [
    {
        label: "Xác thực đường dẫn kênh",
        subLabels: [
            "Phân tích cấu trúc và định dạng URL",
            "Giải mã định danh kênh YouTube",
            "Xác minh trạng thái hoạt động kênh",
        ],
    },
    {
        label: "Thu thập thông tin kênh",
        subLabels: [
            "Thiết lập kết nối đến YouTube API",
            "Thu thập dữ liệu người đăng ký",
            "Tổng hợp số liệu lượt xem tổng",
            "Phân tích thông tin hồ sơ kênh",
        ],
    },
    {
        label: "Quét toàn bộ kho video",
        subLabels: [
            "Duyệt qua 50 video được đăng gần nhất",
            "Trích xuất metadata và thông tin chi tiết",
            "Ghi nhận số liệu lượt xem từng video",
            "Tổng hợp lượt thích và bình luận",
            "Thu thập toàn bộ SEO tags",
        ],
    },
    {
        label: "Phân tích chiến lược nội dung",
        subLabels: [
            "Phát hiện xu hướng nội dung chủ đạo",
            "Đánh giá tần suất và nhịp đăng bài",
            "Đo lường chỉ số hiệu suất video",
            "Phân loại chủ đề theo danh mục",
            "Xây dựng bản đồ content pillars",
            "Vẽ chân dung đối tượng khán giả",
            "Chấm điểm chiến lược SEO tổng thể",
        ],
    },
    {
        label: "Tổng hợp báo cáo chi tiết",
        subLabels: [
            "Tổng hợp insight và dữ liệu kênh",
            "Phân tích và làm nổi bật thế mạnh",
            "Khoanh vùng các cơ hội tăng trưởng",
            "Thiết kế chiến lược marketing tổng thể",
            "Đề xuất ý tưởng video tiềm năng",
            "Xây dựng roadmap hành động chi tiết",
            "Hoàn thiện và định dạng báo cáo",
        ],
    },
];

const DEFAULT_STEPS_EN = [
    {
        label: "Validating channel URL",
        subLabels: [
            "Analyzing URL structure and format",
            "Decoding YouTube channel identifier",
            "Verifying channel operational status",
        ],
    },
    {
        label: "Retrieving channel information",
        subLabels: [
            "Establishing connection to YouTube API",
            "Retrieving subscriber count and metrics",
            "Aggregating total view statistics",
            "Analyzing channel profile information",
        ],
    },
    {
        label: "Scanning complete video library",
        subLabels: [
            "Browsing through 50 most recent videos",
            "Extracting metadata and detailed information",
            "Recording view counts for each video",
            "Compiling likes and comment statistics",
            "Harvesting all available SEO tags",
        ],
    },
    {
        label: "Analyzing content strategy",
        subLabels: [
            "Identifying dominant content trends and patterns",
            "Evaluating posting frequency and consistency",
            "Measuring video performance indicators",
            "Categorizing content by topic clusters",
            "Mapping comprehensive content pillars",
            "Building detailed audience persona profiles",
            "Scoring overall SEO strategy effectiveness",
        ],
    },
    {
        label: "Generating comprehensive report",
        subLabels: [
            "Synthesizing channel insights and data points",
            "Analyzing and highlighting key strengths",
            "Identifying growth opportunities and gaps",
            "Designing comprehensive marketing strategy",
            "Generating potential video content ideas",
            "Building detailed action roadmap plan",
            "Finalizing and formatting complete report",
        ],
    },
];

const STEP_DURATIONS = [5000, 5000, 5000, 12000, 25000];

const BRAILLE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface StepLabel {
    label: string;
    subLabels: string[];
}

// localStorage cache for AI-generated labels
const LABELS_CACHE_KEY = 'soibrand_loading_labels';

interface CachedLabels {
    labels: StepLabel[];
    lang: string;
}

interface LoadingStateProps {
    onCancel?: () => void;
    onRetry?: () => void;
    error?: string | null;
    errorType?: string | null;
    disableAILabels?: boolean;
}

// Error title mapping based on errorType
const ERROR_TITLES_VI: Record<string, string> = {
    MODEL_OVERLOAD: "Mô hình AI quá tải",
    NETWORK_ERROR: "Lỗi kết nối",
    RATE_LIMIT: "Giới hạn tần suất",
    GEMINI_QUOTA: "Hết hạn mức API",
    YOUTUBE_QUOTA: "Hết hạn mức YouTube",
    API_CONFIG: "Lỗi cấu hình",
    CHANNEL_NOT_FOUND: "Không tìm thấy kênh",
    AI_PARSE_ERROR: "Lỗi phân tích AI",
    YOUTUBE_API_ERROR: "Lỗi YouTube API",
    GEMINI_API_ERROR: "Lỗi Gemini API",
    UNKNOWN: "Phân tích thất bại",
};

const ERROR_TITLES_EN: Record<string, string> = {
    MODEL_OVERLOAD: "AI Model Overloaded",
    NETWORK_ERROR: "Network Error",
    RATE_LIMIT: "Rate Limited",
    GEMINI_QUOTA: "API Quota Exceeded",
    YOUTUBE_QUOTA: "YouTube Quota Exceeded",
    API_CONFIG: "Configuration Error",
    CHANNEL_NOT_FOUND: "Channel Not Found",
    AI_PARSE_ERROR: "AI Parse Error",
    YOUTUBE_API_ERROR: "YouTube API Error",
    GEMINI_API_ERROR: "Gemini API Error",
    UNKNOWN: "Analysis Failed",
};

// Retryable error types (auto-retry only for these)
const RETRYABLE_ERRORS = ['MODEL_OVERLOAD', 'NETWORK_ERROR', 'RATE_LIMIT', 'GEMINI_QUOTA', 'AI_PARSE_ERROR'];

export default function LoadingState({ onCancel, onRetry, error, errorType, disableAILabels }: LoadingStateProps) {
    const { langCode } = useLanguage();
    const lang = useLang();
    const defaultSteps =
        langCode === "en" ? DEFAULT_STEPS_EN : DEFAULT_STEPS_VI;

    // Initialize steps: use cached AI labels if available, otherwise use defaults
    const getInitialSteps = (): StepLabel[] => {
        if (disableAILabels) return defaultSteps;

        try {
            const cached = localStorage.getItem(LABELS_CACHE_KEY);
            if (cached) {
                const data: CachedLabels = JSON.parse(cached);
                if (data.lang === langCode && data.labels?.length === 5) {
                    return data.labels;
                }
            }
        } catch {
            // Cache read failed, use defaults
        }
        return defaultSteps;
    };

    const [currentStep, setCurrentStep] = useState(0);
    const [visibleSubLabelIndex, setVisibleSubLabelIndex] = useState(0);
    const [spinnerFrame, setSpinnerFrame] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [steps] = useState<StepLabel[]>(getInitialSteps()); // Never change steps after initialization

    // Auto-retry state
    const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
    const [retryHistory, setRetryHistory] = useState<{ errorLabel: string; retryLabel: string }[]>([]);
    const [autoRetryCount, setAutoRetryCount] = useState(0);
    const MAX_AUTO_RETRIES = 3;
    const RETRY_INTERVAL_SECONDS = 30;

    // Track step progression state for retry
    const hasStartedRef = useRef(false);
    const stepAtErrorRef = useRef<number>(0);

    const isRetryable = errorType && RETRYABLE_ERRORS.includes(errorType);

    // Get error title based on errorType
    const errorTitles = langCode === "en" ? ERROR_TITLES_EN : ERROR_TITLES_VI;
    const errorTitle = errorType ? (errorTitles[errorType] || errorTitles.UNKNOWN) : errorTitles.UNKNOWN;

    // Fetch fresh AI labels in background for next run (only if not cached)
    useEffect(() => {
        if (disableAILabels) return;

        // Check if we already have cached labels for this language
        let hasCache = false;
        try {
            const cached = localStorage.getItem(LABELS_CACHE_KEY);
            if (cached) {
                const data: CachedLabels = JSON.parse(cached);
                if (data.lang === langCode && data.labels?.length === 5) {
                    hasCache = true;
                }
            }
        } catch {
            // Cache check failed
        }

        // Only fetch if no cache exists
        if (!hasCache) {
            fetch(`/api/loading-labels?lang=${langCode}`)
                .then(response => response.ok ? response.json() : null)
                .then(data => {
                    if (data?.steps?.length === 5) {
                        try {
                            localStorage.setItem(LABELS_CACHE_KEY, JSON.stringify({
                                labels: data.steps,
                                lang: langCode,
                            }));
                        } catch {
                            // Cache write failed
                        }
                    }
                })
                .catch(() => {});
        }
    }, [disableAILabels, langCode]);

    // Save current step when error occurs (don't add to history until retry)
    useEffect(() => {
        if (error) {
            stepAtErrorRef.current = currentStep;
        }
    }, [error, currentStep]);

    // Step progression - apply pending labels only at step transitions
    // On retry, continue from where we left off
    useEffect(() => {
        if (error) return; // Don't start new timers if there's an error

        // Determine starting step: 0 for initial load, or saved step for retry
        const startFromStep = hasStartedRef.current ? stepAtErrorRef.current : 0;
        hasStartedRef.current = true;

        // Create timers only for remaining steps
        const remainingSteps = STEP_DURATIONS.slice(startFromStep);
        const stepTimers = remainingSteps.map((_, index) => {
            const actualStepIndex = startFromStep + index;
            const delay = index === 0
                ? 0
                : remainingSteps.slice(0, index).reduce((acc, d) => acc + d, 0);

            return setTimeout(
                () => {
                    setCurrentStep(actualStepIndex);
                    setVisibleSubLabelIndex(0);
                },
                delay,
            );
        });

        return () => {
            stepTimers.forEach((t) => clearTimeout(t));
        };
    }, [error]);

    // Progress through sub-labels one at a time, stop at last one or when error occurs
    useEffect(() => {
        if (error) return; // Stop progression on error

        const currentSubLabels = steps[currentStep]?.subLabels || [];
        if (visibleSubLabelIndex >= currentSubLabels.length - 1) return;

        const delay = Math.min(
            2000,
            STEP_DURATIONS[currentStep] / currentSubLabels.length,
        );
        const timer = setTimeout(() => {
            setVisibleSubLabelIndex((prev) => prev + 1);
        }, delay);

        return () => clearTimeout(timer);
    }, [currentStep, visibleSubLabelIndex, steps, error]);

    // Braille spinner animation
    useEffect(() => {
        const interval = setInterval(() => {
            setSpinnerFrame((prev) => (prev + 1) % BRAILLE_FRAMES.length);
        }, 80);

        return () => clearInterval(interval);
    }, []);

    // Elapsed time counter
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Start countdown when retryable error appears (if not exceeded max retries)
    useEffect(() => {
        if (error && isRetryable && onRetry && autoRetryCount < MAX_AUTO_RETRIES) {
            setRetryCountdown(RETRY_INTERVAL_SECONDS);
        } else {
            setRetryCountdown(null);
        }
    }, [error, isRetryable, onRetry, autoRetryCount]);

    // Countdown timer
    useEffect(() => {
        if (retryCountdown === null || retryCountdown <= 0) return;
        const timer = setTimeout(() => setRetryCountdown(prev => prev! - 1), 1000);
        return () => clearTimeout(timer);
    }, [retryCountdown]);

    // Auto-retry when countdown reaches 0
    useEffect(() => {
        if (retryCountdown === 0 && onRetry) {
            handleAutoRetry();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retryCountdown]);

    // Handle auto-retry
    const handleAutoRetry = () => {
        setAutoRetryCount(prev => prev + 1);
        // Add error with retry sub-label to history
        setRetryHistory(prev => [
            ...prev,
            {
                errorLabel: errorTitle,
                retryLabel: lang.loadingState.retrying
            }
        ]);
        setRetryCountdown(null);
        onRetry?.();
    };

    // Handle manual retry (resets auto-retry count)
    const handleManualRetry = () => {
        setAutoRetryCount(0);
        // Add error with retry sub-label to history
        setRetryHistory(prev => [
            ...prev,
            {
                errorLabel: errorTitle,
                retryLabel: lang.loadingState.retrying
            }
        ]);
        setRetryCountdown(null);
        onRetry?.();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Split completed steps: before first error vs after retry
    const firstErrorStep = retryHistory.length > 0 ? stepAtErrorRef.current : currentStep;
    const stepsBeforeError = steps.slice(0, Math.min(firstErrorStep, currentStep));
    const stepsAfterRetry = retryHistory.length > 0 ? steps.slice(firstErrorStep, currentStep) : [];
    const currentTask = steps[currentStep];

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.terminal}>
                {/* Current step or error - fixed position */}
                <div className={styles.currentTask}>
                    <AnimatePresence mode="wait">
                        {error ? (
                            <motion.div
                                key="error"
                                className={`${styles.step} ${styles.error}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                            >
                                <div className={styles.mainLine}>
                                    <span className={styles.errorIcon}>✕</span>
                                    <span className={styles.label}>
                                        {errorTitle}
                                    </span>
                                    <span className={styles.elapsedTime}>
                                        {formatTime(elapsedTime)}
                                    </span>
                                </div>
                                <div className={styles.subLine}>
                                    <span className={styles.connector}>└</span>
                                    <span className={styles.errorMessage}>
                                        {isRetryable && autoRetryCount >= MAX_AUTO_RETRIES ? (
                                            // Max retries exceeded message
                                            lang.loadingState.maxRetriesReached.replace('{max}', String(MAX_AUTO_RETRIES))
                                        ) : (
                                            <>
                                                {error}
                                                {isRetryable && retryCountdown !== null && retryCountdown > 0 && (
                                                    <span className={styles.countdownText}>
                                                        {' '}{lang.loadingState.retryCount
                                                            .replace('{current}', String(autoRetryCount + 1))
                                                            .replace('{max}', String(MAX_AUTO_RETRIES))
                                                            .replace('{seconds}', String(retryCountdown))}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`current-${currentStep}`}
                                className={styles.step}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                            >
                                <div className={styles.mainLine}>
                                    <span className={styles.statusIcon}>
                                        {BRAILLE_FRAMES[spinnerFrame]}
                                    </span>
                                    <span className={styles.label}>
                                        {currentTask.label}
                                    </span>
                                    <span className={styles.elapsedTime}>
                                        {formatTime(elapsedTime)}
                                    </span>
                                </div>
                                <div className={styles.subLine}>
                                    <span className={styles.connector}>└</span>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={visibleSubLabelIndex}
                                            className={styles.subLabel}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {
                                                currentTask.subLabels[
                                                    visibleSubLabelIndex
                                                ]
                                            }
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Completed steps - grow upward */}
                <div className={styles.completedList}>
                    {/* Steps completed before error */}
                    {stepsBeforeError.map((step, index) => (
                        <motion.div
                            key={`completed-before-${index}`}
                            className={`${styles.step} ${styles.completed}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 0.5, height: "auto" }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <div className={styles.mainLine}>
                                <span className={styles.checkIcon}>✓</span>
                                <span className={styles.completedLabel}>
                                    {step.label}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {/* Error and retry history */}
                    {retryHistory.map((item, index) => (
                        <motion.div
                            key={`history-${index}`}
                            className={`${styles.step} ${styles.completed}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 0.5, height: "auto" }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <div className={styles.mainLine}>
                                <span className={styles.errorIconMuted}>✕</span>
                                <span className={styles.completedLabel}>
                                    {item.errorLabel}
                                </span>
                            </div>
                            <div className={styles.subLine}>
                                <span className={styles.connectorRetry}>↻</span>
                                <span className={styles.retryLabel}>
                                    {item.retryLabel}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {/* Steps completed after retry */}
                    {stepsAfterRetry.map((step, index) => (
                        <motion.div
                            key={`completed-after-${index}`}
                            className={`${styles.step} ${styles.completed}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 0.5, height: "auto" }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <div className={styles.mainLine}>
                                <span className={styles.checkIcon}>✓</span>
                                <span className={styles.completedLabel}>
                                    {step.label}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Action buttons */}
                <div className={styles.actionButtons}>
                    {error && onRetry && (
                        <motion.button
                            className={styles.retryLink}
                            onClick={handleManualRetry}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                        >
                            {lang.loadingState.retryNow}
                        </motion.button>
                    )}
                    {onCancel && (
                        <motion.button
                            className={styles.cancelLink}
                            onClick={() => {
                                setRetryCountdown(null); // Stop auto-retry
                                onCancel();
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                        >
                            {error
                                ? lang.loadingState.dismiss
                                : lang.loadingState.cancel}
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
