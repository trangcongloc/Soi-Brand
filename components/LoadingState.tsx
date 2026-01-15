"use client";

import { useState, useEffect } from "react";
import styles from "./LoadingState.module.css";
import { useLang } from "@/lib/lang";

const STEPS = [
    { key: "validating", duration: 1000 },
    { key: "fetchingChannel", duration: 3000 },
    { key: "fetchingVideos", duration: 5000 },
    { key: "analyzingContent", duration: 15000 },
    { key: "generatingReport", duration: 25000 },
];

export default function LoadingState() {
    const lang = useLang();
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Step progression
        const stepTimers = STEPS.map((step, index) => {
            return setTimeout(() => {
                setCurrentStep(index);
            }, STEPS.slice(0, index).reduce((acc, s) => acc + s.duration, 0));
        });

        // Progress bar animation
        const totalDuration = STEPS.reduce((acc, s) => acc + s.duration, 0);
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return 95; // Cap at 95% until complete
                return prev + 1;
            });
        }, totalDuration / 100);

        return () => {
            stepTimers.forEach((t) => clearTimeout(t));
            clearInterval(progressInterval);
        };
    }, []);

    const stepLabels: { [key: string]: string } = {
        validating: lang.loading.steps.validating || "Validating URL...",
        fetchingChannel: lang.loading.steps.fetchingChannel,
        fetchingVideos: lang.loading.steps.fetchingVideos || "Retrieving videos...",
        analyzingContent: lang.loading.steps.analyzingContent,
        generatingReport: lang.loading.steps.generatingReport,
    };

    const getStepIcon = (stepIndex: number) => {
        if (stepIndex < currentStep) return "✓";
        if (stepIndex === currentStep) return "⟳";
        return "○";
    };

    const getStepClass = (stepIndex: number) => {
        if (stepIndex < currentStep) return styles.completed;
        if (stepIndex === currentStep) return styles.active;
        return "";
    };

    return (
        <div className={styles.container}>
            <div className={styles.spinner}>
                <div className={styles.spinnerRing}></div>
            </div>

            <h3 className={styles.title}>{lang.loading.title}</h3>

            {/* Progress Bar */}
            <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className={styles.progressText}>{Math.round(progress)}%</span>
            </div>

            <div className={styles.steps}>
                {STEPS.map((step, index) => (
                    <div
                        key={step.key}
                        className={`${styles.step} ${getStepClass(index)}`}
                    >
                        <div className={styles.stepIcon}>
                            {getStepIcon(index)}
                        </div>
                        <p>{stepLabels[step.key]}</p>
                    </div>
                ))}
            </div>

            <p className={styles.note}>{lang.loading.note}</p>
        </div>
    );
}
