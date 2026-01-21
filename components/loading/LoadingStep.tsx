import { motion, AnimatePresence } from "framer-motion";
import { StepLabel, BRAILLE_FRAMES, formatTime } from "./loadingConstants";
import styles from "./LoadingState.module.css";

interface LoadingStepProps {
    currentStep: number;
    steps: StepLabel[];
    visibleSubLabelIndex: number;
    spinnerFrame: number;
    elapsedTime: number;
}

export default function LoadingStep({
    currentStep,
    steps,
    visibleSubLabelIndex,
    spinnerFrame,
    elapsedTime,
}: LoadingStepProps) {
    const currentTask = steps[currentStep];

    return (
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
                <span className={styles.label}>{currentTask.label}</span>
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
                        {currentTask.subLabels[visibleSubLabelIndex]}
                    </motion.span>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
