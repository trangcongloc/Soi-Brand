"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, useLang } from "@/lib/lang";
import {
    StepLabel,
    DEFAULT_STEPS_VI,
    DEFAULT_STEPS_EN,
    STEP_DURATIONS,
    BRAILLE_FRAMES,
    LABELS_CACHE_KEY,
    CachedLabels,
    ERROR_TITLES_VI,
    ERROR_TITLES_EN,
    RETRYABLE_ERRORS,
    MAX_AUTO_RETRIES,
    RETRY_INTERVAL_SECONDS,
} from "./loadingConstants";
import LoadingStep from "./LoadingStep";
import ErrorStep from "./ErrorStep";
import CompletedStepList from "./CompletedStepList";
import ActionButtons from "./ActionButtons";
import styles from "./LoadingState.module.css";

interface LoadingStateProps {
    onCancel?: () => void;
    onRetry?: () => void;
    error?: string | null;
    errorType?: string | null;
    disableAILabels?: boolean;
}

export default function LoadingState({
    onCancel,
    onRetry,
    error,
    errorType,
    disableAILabels,
}: LoadingStateProps) {
    const { langCode } = useLanguage();
    const lang = useLang();
    const defaultSteps =
        langCode === "en" ? DEFAULT_STEPS_EN : DEFAULT_STEPS_VI;

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
    const [steps] = useState<StepLabel[]>(getInitialSteps);

    const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
    const [retryHistory, setRetryHistory] = useState<
        { errorLabel: string; retryLabel: string }[]
    >([]);
    const [autoRetryCount, setAutoRetryCount] = useState(0);

    const hasStartedRef = useRef(false);
    const stepAtErrorRef = useRef<number>(0);

    const isRetryable = errorType ? RETRYABLE_ERRORS.includes(errorType) : false;

    const errorTitles = langCode === "en" ? ERROR_TITLES_EN : ERROR_TITLES_VI;
    const errorTitle = errorType
        ? errorTitles[errorType] || errorTitles.UNKNOWN
        : errorTitles.UNKNOWN;

    // Fetch fresh AI labels in background for next run
    useEffect(() => {
        if (disableAILabels) return;

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

        if (!hasCache) {
            fetch(`/api/loading-labels?lang=${langCode}`)
                .then((response) =>
                    response.ok ? response.json() : null
                )
                .then((data) => {
                    if (data?.steps?.length === 5) {
                        try {
                            localStorage.setItem(
                                LABELS_CACHE_KEY,
                                JSON.stringify({
                                    labels: data.steps,
                                    lang: langCode,
                                })
                            );
                        } catch {
                            // Cache write failed
                        }
                    }
                })
                .catch(() => {});
        }
    }, [disableAILabels, langCode]);

    // Save current step when error occurs
    useEffect(() => {
        if (error) {
            stepAtErrorRef.current = currentStep;
        }
    }, [error, currentStep]);

    // Step progression
    useEffect(() => {
        if (error) return;

        const startFromStep = hasStartedRef.current
            ? stepAtErrorRef.current
            : 0;
        hasStartedRef.current = true;

        const remainingSteps = STEP_DURATIONS.slice(startFromStep);
        const stepTimers = remainingSteps.map((_, index) => {
            const actualStepIndex = startFromStep + index;
            const delay =
                index === 0
                    ? 0
                    : remainingSteps.slice(0, index).reduce((acc, d) => acc + d, 0);

            return setTimeout(() => {
                setCurrentStep(actualStepIndex);
                setVisibleSubLabelIndex(0);
            }, delay);
        });

        return () => {
            stepTimers.forEach((t) => clearTimeout(t));
        };
    }, [error]);

    // Progress through sub-labels
    useEffect(() => {
        if (error) return;

        const currentSubLabels = steps[currentStep]?.subLabels || [];
        if (visibleSubLabelIndex >= currentSubLabels.length - 1) return;

        const delay = Math.min(
            2000,
            STEP_DURATIONS[currentStep] / currentSubLabels.length
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

    // Start countdown when retryable error appears
    useEffect(() => {
        if (
            error &&
            isRetryable &&
            onRetry &&
            autoRetryCount < MAX_AUTO_RETRIES
        ) {
            setRetryCountdown(RETRY_INTERVAL_SECONDS);
        } else {
            setRetryCountdown(null);
        }
    }, [error, isRetryable, onRetry, autoRetryCount]);

    // Countdown timer
    useEffect(() => {
        if (retryCountdown === null || retryCountdown <= 0) return;
        const timer = setTimeout(
            () => setRetryCountdown((prev) => prev! - 1),
            1000
        );
        return () => clearTimeout(timer);
    }, [retryCountdown]);

    // Auto-retry when countdown reaches 0
    useEffect(() => {
        if (retryCountdown === 0 && onRetry) {
            handleAutoRetry();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retryCountdown]);

    const handleAutoRetry = () => {
        setAutoRetryCount((prev) => prev + 1);
        setRetryHistory((prev) => [
            ...prev,
            {
                errorLabel: errorTitle,
                retryLabel: lang.loadingState.retrying,
            },
        ]);
        setRetryCountdown(null);
        onRetry?.();
    };

    const handleManualRetry = () => {
        setAutoRetryCount(0);
        setRetryHistory((prev) => [
            ...prev,
            {
                errorLabel: errorTitle,
                retryLabel: lang.loadingState.retrying,
            },
        ]);
        setRetryCountdown(null);
        onRetry?.();
    };

    // Split completed steps
    const firstErrorStep =
        retryHistory.length > 0 ? stepAtErrorRef.current : currentStep;
    const stepsBeforeError = steps.slice(
        0,
        Math.min(firstErrorStep, currentStep)
    );
    const stepsAfterRetry =
        retryHistory.length > 0
            ? steps.slice(firstErrorStep, currentStep)
            : [];

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
                            <ErrorStep
                                error={error}
                                errorTitle={errorTitle}
                                elapsedTime={elapsedTime}
                                isRetryable={isRetryable}
                                autoRetryCount={autoRetryCount}
                                retryCountdown={retryCountdown}
                                lang={{
                                    maxRetriesReached:
                                        lang.loadingState.maxRetriesReached,
                                    retryCount: lang.loadingState.retryCount,
                                }}
                            />
                        ) : (
                            <LoadingStep
                                currentStep={currentStep}
                                steps={steps}
                                visibleSubLabelIndex={visibleSubLabelIndex}
                                spinnerFrame={spinnerFrame}
                                elapsedTime={elapsedTime}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Completed steps - grow upward */}
                <CompletedStepList
                    stepsBeforeError={stepsBeforeError}
                    retryHistory={retryHistory}
                    stepsAfterRetry={stepsAfterRetry}
                />

                {/* Action buttons */}
                <ActionButtons
                    error={error ?? null}
                    onRetry={error && onRetry ? handleManualRetry : undefined}
                    onCancel={onCancel}
                    onStopAutoRetry={() => setRetryCountdown(null)}
                    lang={{
                        retryNow: lang.loadingState.retryNow,
                        dismiss: lang.loadingState.dismiss,
                        cancel: lang.loadingState.cancel,
                    }}
                />
            </div>
        </motion.div>
    );
}
