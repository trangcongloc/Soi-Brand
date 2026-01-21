import { motion } from "framer-motion";
import styles from "./LoadingState.module.css";

interface ActionButtonsProps {
    error: string | null;
    onRetry?: () => void;
    onCancel?: () => void;
    onStopAutoRetry: () => void;
    lang: {
        retryNow: string;
        dismiss: string;
        cancel: string;
    };
}

export default function ActionButtons({
    error,
    onRetry,
    onCancel,
    onStopAutoRetry,
    lang,
}: ActionButtonsProps) {
    return (
        <div className={styles.actionButtons}>
            {error && onRetry && (
                <motion.button
                    className={styles.retryLink}
                    onClick={onRetry}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                >
                    {lang.retryNow}
                </motion.button>
            )}
            {onCancel && (
                <motion.button
                    className={styles.cancelLink}
                    onClick={() => {
                        onStopAutoRetry();
                        onCancel();
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                >
                    {error ? lang.dismiss : lang.cancel}
                </motion.button>
            )}
        </div>
    );
}
