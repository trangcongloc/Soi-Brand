"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/lang";
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

interface LoadingStateProps {
    onCancel?: () => void;
}

export default function LoadingState({ onCancel }: LoadingStateProps) {
    const { langCode } = useLanguage();
    const defaultSteps =
        langCode === "en" ? DEFAULT_STEPS_EN : DEFAULT_STEPS_VI;

    const [currentStep, setCurrentStep] = useState(0);
    const [visibleSubLabelIndex, setVisibleSubLabelIndex] = useState(0);
    const [spinnerFrame, setSpinnerFrame] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [steps, setSteps] = useState<StepLabel[]>(defaultSteps);
    const pendingLabelsRef = useRef<StepLabel[] | null>(null);
    // TEMPORARILY DISABLED - AI labels fetch
    // const initialLangRef = useRef(langCode);

    // Fetch AI-generated labels once on mount, store in pending ref
    // TEMPORARILY DISABLED - using default labels only
    // useEffect(() => {
    //     const fetchLabels = async () => {
    //         try {
    //             const response = await fetch(
    //                 `/api/loading-labels?lang=${initialLangRef.current}`,
    //             );
    //             if (response.ok) {
    //                 const data = await response.json();
    //                 if (data.steps && data.steps.length === 5) {
    //                     pendingLabelsRef.current = data.steps;
    //                 }
    //             }
    //         } catch {
    //             // Keep default labels on error
    //         }
    //     };
    //     fetchLabels();
    // }, []);

    // Step progression - apply pending labels only at step transitions
    useEffect(() => {
        const stepTimers = STEP_DURATIONS.map((_, index) => {
            return setTimeout(
                () => {
                    // Apply pending AI labels at step transition if available
                    if (pendingLabelsRef.current) {
                        setSteps(pendingLabelsRef.current);
                        pendingLabelsRef.current = null;
                    }
                    setCurrentStep(index);
                    setVisibleSubLabelIndex(0);
                },
                STEP_DURATIONS.slice(0, index).reduce((acc, d) => acc + d, 0),
            );
        });

        return () => {
            stepTimers.forEach((t) => clearTimeout(t));
        };
    }, []);

    // Progress through sub-labels one at a time, stop at last one
    useEffect(() => {
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
    }, [currentStep, visibleSubLabelIndex, steps]);

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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const completedSteps = steps.slice(0, currentStep);
    const currentTask = steps[currentStep];

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.terminal}>
                {/* Current step - fixed position */}
                <div className={styles.currentTask}>
                    <AnimatePresence mode="wait">
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
                    </AnimatePresence>
                </div>

                {/* Completed steps - grow upward */}
                <div className={styles.completedList}>
                    {completedSteps.map((step, index) => (
                        <motion.div
                            key={`completed-${index}`}
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

                {/* Cancel link */}
                {onCancel && (
                    <motion.button
                        className={styles.cancelLink}
                        onClick={onCancel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                    >
                        {langCode === "en" ? "Cancel" : "Hủy"}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}
