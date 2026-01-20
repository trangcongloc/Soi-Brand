"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./LoadingState.module.css";

const DEFAULT_STEPS = [
    { label: "Đang kiểm tra URL", subLabel: "Xác thực định dạng link YouTube và trích xuất ID kênh..." },
    { label: "Đang tải thông tin kênh", subLabel: "Kết nối YouTube API, lấy số subscriber, lượt xem tổng và mô tả kênh..." },
    { label: "Đang tải danh sách video", subLabel: "Thu thập 50 video gần nhất, thống kê view, like, comment từng video..." },
    { label: "Đang phân tích nội dung", subLabel: "Phân tích xu hướng nội dung, tần suất đăng, hiệu suất theo thời gian..." },
    { label: "Đang tạo báo cáo", subLabel: "Tổng hợp insight, đề xuất chiến lược marketing và ý tưởng video mới..." },
];

const STEP_DURATIONS = [2500, 3500, 5000, 12000, 20000];

const BRAILLE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface StepLabel {
    label: string;
    subLabel: string;
}

export default function LoadingState() {
    const [currentStep, setCurrentStep] = useState(0);
    const [spinnerFrame, setSpinnerFrame] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [steps, setSteps] = useState<StepLabel[]>(DEFAULT_STEPS);

    // Fetch AI-generated labels
    // Delay fetch until after step 0 completes to prevent mid-step text jump
    useEffect(() => {
        const fetchTimer = setTimeout(async () => {
            try {
                const response = await fetch("/api/loading-labels");
                if (response.ok) {
                    const data = await response.json();
                    if (data.steps && data.steps.length === 5) {
                        setSteps(data.steps);
                    }
                }
            } catch {
                // Keep default labels on error
            }
        }, STEP_DURATIONS[0]); // Wait for step 0 duration (2500ms)

        return () => clearTimeout(fetchTimer);
    }, []);

    // Step progression
    useEffect(() => {
        const stepTimers = STEP_DURATIONS.map((_, index) => {
            return setTimeout(() => {
                setCurrentStep(index);
            }, STEP_DURATIONS.slice(0, index).reduce((acc, d) => acc + d, 0));
        });

        return () => {
            stepTimers.forEach((t) => clearTimeout(t));
        };
    }, []);

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
                                <span className={styles.subLabel}>
                                    {currentTask.subLabel}
                                </span>
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
            </div>
        </motion.div>
    );
}
