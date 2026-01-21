import { motion } from "framer-motion";
import { StepLabel } from "./loadingConstants";
import styles from "./LoadingState.module.css";

interface RetryHistoryItem {
    errorLabel: string;
    retryLabel: string;
}

interface CompletedStepListProps {
    stepsBeforeError: StepLabel[];
    retryHistory: RetryHistoryItem[];
    stepsAfterRetry: StepLabel[];
}

export default function CompletedStepList({
    stepsBeforeError,
    retryHistory,
    stepsAfterRetry,
}: CompletedStepListProps) {
    return (
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
    );
}
