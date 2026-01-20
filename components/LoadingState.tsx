"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./LoadingState.module.css";

const STEPS = [
    {
        key: "validating",
        duration: 1000,
        label: "Validating YouTube URL",
        subLabel: "Checking URL format...",
    },
    {
        key: "fetchingChannel",
        duration: 3000,
        label: "Fetching channel data",
        subLabel: "Retrieving channel info...",
    },
    {
        key: "fetchingVideos",
        duration: 5000,
        label: "Loading recent videos",
        subLabel: "Fetching video metadata...",
    },
    {
        key: "analyzingContent",
        duration: 15000,
        label: "Analyzing with Gemini AI",
        subLabel: "Processing content patterns...",
    },
    {
        key: "generatingReport",
        duration: 25000,
        label: "Generating marketing report",
        subLabel: "Compiling insights...",
    },
];

const BRAILLE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export default function LoadingState() {
    const [currentStep, setCurrentStep] = useState(0);
    const [spinnerFrame, setSpinnerFrame] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Step progression
    useEffect(() => {
        const stepTimers = STEPS.map((_, index) => {
            return setTimeout(() => {
                setCurrentStep(index);
            }, STEPS.slice(0, index).reduce((acc, s) => acc + s.duration, 0));
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

    const currentTask = STEPS[currentStep];

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.terminal}>
                <motion.div
                    key={currentTask.key}
                    className={styles.step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className={styles.mainLine}>
                        <span className={styles.statusIcon}>
                            {BRAILLE_FRAMES[spinnerFrame]}
                        </span>
                        <span className={styles.label}>{currentTask.label}</span>
                    </div>
                    <div className={styles.subLine}>
                        <span className={styles.connector}>└</span>
                        <span className={styles.subLabel}>
                            {currentTask.subLabel}
                        </span>
                    </div>
                </motion.div>

                <div className={styles.elapsedTime}>{formatTime(elapsedTime)}</div>
            </div>
        </motion.div>
    );
}
