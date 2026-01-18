"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

    useEffect(() => {
        // Step progression
        const stepTimers = STEPS.map((_, index) => {
            return setTimeout(() => {
                setCurrentStep(index);
            }, STEPS.slice(0, index).reduce((acc, s) => acc + s.duration, 0));
        });

        return () => {
            stepTimers.forEach((t) => clearTimeout(t));
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
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className={styles.spinner}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <div className={styles.spinnerRing}></div>
            </motion.div>

            <motion.h3
                className={styles.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                {lang.loading.title}
            </motion.h3>

            <div className={styles.steps}>
                {STEPS.map((step, index) => (
                    <motion.div
                        key={step.key}
                        className={`${styles.step} ${getStepClass(index)}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                    >
                        <motion.div
                            className={styles.stepIcon}
                            animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {getStepIcon(index)}
                        </motion.div>
                        <p>{stepLabels[step.key]}</p>
                    </motion.div>
                ))}
            </div>

            <motion.p
                className={styles.note}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
            >
                {lang.loading.note}
            </motion.p>
        </motion.div>
    );
}
