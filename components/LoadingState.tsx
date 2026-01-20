"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/lang";
import styles from "./LoadingState.module.css";

const DEFAULT_STEPS_VI = [
    { label: "Đang kiểm tra URL", subLabels: ["Xác thực định dạng link YouTube", "Trích xuất ID kênh", "Kiểm tra kênh tồn tại..."] },
    { label: "Đang tải thông tin kênh", subLabels: ["Kết nối YouTube API", "Lấy số subscriber", "Đếm tổng lượt xem", "Đọc mô tả kênh..."] },
    { label: "Đang tải danh sách video", subLabels: ["Thu thập 50 video gần nhất", "Lấy tiêu đề và mô tả", "Thống kê lượt xem", "Đếm like và comment", "Trích xuất tags SEO..."] },
    { label: "Đang phân tích nội dung", subLabels: ["Phân tích xu hướng nội dung", "Đánh giá tần suất đăng", "Đo hiệu suất video", "Phân loại chủ đề", "Xác định content pillars", "Phân tích đối tượng khán giả", "Đánh giá chiến lược SEO..."] },
    { label: "Đang tạo báo cáo", subLabels: ["Tổng hợp dữ liệu kênh", "Phân tích điểm mạnh", "Xác định cơ hội cải thiện", "Đề xuất chiến lược marketing", "Lên ý tưởng video mới", "Tạo kế hoạch hành động", "Hoàn thiện báo cáo chi tiết..."] },
];

const DEFAULT_STEPS_EN = [
    { label: "Validating URL", subLabels: ["Checking YouTube link format", "Extracting channel ID", "Verifying channel exists..."] },
    { label: "Loading channel info", subLabels: ["Connecting to YouTube API", "Fetching subscriber count", "Getting total views", "Reading channel description..."] },
    { label: "Loading video list", subLabels: ["Collecting recent 50 videos", "Fetching titles and descriptions", "Counting view statistics", "Gathering likes and comments", "Extracting SEO tags..."] },
    { label: "Analyzing content", subLabels: ["Analyzing content trends", "Evaluating posting frequency", "Measuring video performance", "Categorizing topics", "Identifying content pillars", "Analyzing target audience", "Evaluating SEO strategy..."] },
    { label: "Generating report", subLabels: ["Compiling channel data", "Analyzing strengths", "Identifying improvement areas", "Crafting marketing strategy", "Generating video ideas", "Creating action plan", "Finalizing detailed report..."] },
];

const STEP_DURATIONS = [3000, 4000, 5000, 12000, 25000];

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
    const defaultSteps = langCode === "en" ? DEFAULT_STEPS_EN : DEFAULT_STEPS_VI;

    const [currentStep, setCurrentStep] = useState(0);
    const [visibleSubLabelIndex, setVisibleSubLabelIndex] = useState(0);
    const [spinnerFrame, setSpinnerFrame] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [steps, setSteps] = useState<StepLabel[]>(defaultSteps);
    const hasFetchedRef = useRef(false);
    const initialLangRef = useRef(langCode);

    // Update default steps when language changes (only if not yet fetched AI labels)
    useEffect(() => {
        if (!hasFetchedRef.current) {
            setSteps(langCode === "en" ? DEFAULT_STEPS_EN : DEFAULT_STEPS_VI);
        }
    }, [langCode]);

    // Fetch AI-generated labels once on mount
    // Delay fetch until after step 0 completes to prevent mid-step text jump
    useEffect(() => {
        const fetchTimer = setTimeout(async () => {
            // Only fetch once, using the language at mount time
            if (hasFetchedRef.current) return;

            try {
                const response = await fetch(`/api/loading-labels?lang=${initialLangRef.current}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.steps && data.steps.length === 5) {
                        hasFetchedRef.current = true;
                        setSteps(data.steps);
                    }
                }
            } catch {
                // Keep default labels on error
            }
        }, STEP_DURATIONS[0]); // Wait for step 0 duration (2500ms)

        return () => clearTimeout(fetchTimer);
    }, []); // Empty deps - only run once on mount

    // Step progression
    useEffect(() => {
        const stepTimers = STEP_DURATIONS.map((_, index) => {
            return setTimeout(() => {
                setCurrentStep(index);
                setVisibleSubLabelIndex(0); // Reset sub-label index when step changes
            }, STEP_DURATIONS.slice(0, index).reduce((acc, d) => acc + d, 0));
        });

        return () => {
            stepTimers.forEach((t) => clearTimeout(t));
        };
    }, []);

    // Progress through sub-labels one at a time, stop at last one
    useEffect(() => {
        const currentSubLabels = steps[currentStep]?.subLabels || [];
        if (visibleSubLabelIndex >= currentSubLabels.length - 1) return;

        const delay = Math.min(2000, STEP_DURATIONS[currentStep] / currentSubLabels.length);
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
