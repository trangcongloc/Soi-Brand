"use client";

import { useState, useEffect } from "react";
import styles from "./LoadingState.module.css";
import { useLang } from "@/lib/lang";

export default function LoadingState() {
    const lang = useLang();
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 3000),
            setTimeout(() => setStep(2), 10000),
        ];
        return () => timers.forEach((t) => clearTimeout(t));
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.spinner}>
                {/* Single clean ring for modern look */}
                <div className={styles.spinnerRing}></div>
            </div>

            <h3 className={styles.title}>{lang.loading.title}</h3>

            <div className={styles.steps}>
                <div
                    className={`${styles.step} ${
                        step >= 0 ? styles.active : ""
                    }`}
                >
                    <div className={styles.stepIcon}>
                        {step > 0 ? "✓" : "⟳"}
                    </div>
                    <p>{lang.loading.steps.fetchingChannel}</p>
                </div>
                <div
                    className={`${styles.step} ${
                        step >= 1 ? styles.active : ""
                    }`}
                >
                    <div className={styles.stepIcon}>
                        {step > 1 ? "✓" : step === 1 ? "⟳" : "◯"}
                    </div>
                    <p>{lang.loading.steps.analyzingContent}</p>
                </div>
                <div
                    className={`${styles.step} ${
                        step >= 2 ? styles.active : ""
                    }`}
                >
                    <div className={styles.stepIcon}>
                        {step === 2 ? "⟳" : "◯"}
                    </div>
                    <p>{lang.loading.steps.generatingReport}</p>
                </div>
            </div>

            <p className={styles.note}>{lang.loading.note}</p>
        </div>
    );
}
