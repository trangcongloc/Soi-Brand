import { motion } from "framer-motion";
import { formatTime, MAX_AUTO_RETRIES } from "./loadingConstants";
import styles from "./LoadingState.module.css";

interface ErrorStepProps {
    error: string;
    errorTitle: string;
    elapsedTime: number;
    isRetryable: boolean;
    autoRetryCount: number;
    retryCountdown: number | null;
    lang: {
        maxRetriesReached: string;
        retryCount: string;
    };
}

export default function ErrorStep({
    error,
    errorTitle,
    elapsedTime,
    isRetryable,
    autoRetryCount,
    retryCountdown,
    lang,
}: ErrorStepProps) {
    return (
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
                <span className={styles.label}>{errorTitle}</span>
                <span className={styles.elapsedTime}>
                    {formatTime(elapsedTime)}
                </span>
            </div>
            <div className={styles.subLine}>
                <span className={styles.connector}>└</span>
                <span className={styles.errorMessage}>
                    {isRetryable && autoRetryCount >= MAX_AUTO_RETRIES ? (
                        lang.maxRetriesReached.replace(
                            "{max}",
                            String(MAX_AUTO_RETRIES)
                        )
                    ) : (
                        <>
                            {error}
                            {isRetryable &&
                                retryCountdown !== null &&
                                retryCountdown > 0 && (
                                    <span className={styles.countdownText}>
                                        {" "}
                                        {lang.retryCount
                                            .replace(
                                                "{current}",
                                                String(autoRetryCount + 1)
                                            )
                                            .replace(
                                                "{max}",
                                                String(MAX_AUTO_RETRIES)
                                            )
                                            .replace(
                                                "{seconds}",
                                                String(retryCountdown)
                                            )}
                                    </span>
                                )}
                        </>
                    )}
                </span>
            </div>
        </motion.div>
    );
}
