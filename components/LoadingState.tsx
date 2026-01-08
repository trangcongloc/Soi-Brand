"use client";

import { useState, useEffect } from "react";
import styles from "./LoadingState.module.css";

export default function LoadingState() {
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

            <h3 className={styles.title}>Đang phân tích kênh YouTube...</h3>

            <div className={styles.steps}>
                <div
                    className={`${styles.step} ${
                        step >= 0 ? styles.active : ""
                    }`}
                >
                    <div className={styles.stepIcon}>
                        {step > 0 ? "✓" : "⟳"}
                    </div>
                    <p>Đang lấy thông tin kênh</p>
                </div>
                <div
                    className={`${styles.step} ${
                        step >= 1 ? styles.active : ""
                    }`}
                >
                    <div className={styles.stepIcon}>
                        {step > 1 ? "✓" : step === 1 ? "⟳" : "◯"}
                    </div>
                    <p>Đang phân tích nội dung</p>
                </div>
                <div
                    className={`${styles.step} ${
                        step >= 2 ? styles.active : ""
                    }`}
                >
                    <div className={styles.stepIcon}>
                        {step === 2 ? "⟳" : "◯"}
                    </div>
                    <p>Đang tạo báo cáo</p>
                </div>
            </div>

            <p className={styles.note}>
                Quá trình này có thể mất 30-60 giây...
            </p>
        </div>
    );
}
