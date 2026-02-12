"use client";

import { motion } from "framer-motion";
import { UI_SPLASH_COMPLETION_DELAY_MS } from "@/lib/ui-config";
import styles from "./SplashScreen.module.css";

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    // YouTube play button inspired path
    const icon = {
        hidden: {
            pathLength: 0,
            opacity: 0,
        },
        visible: {
            pathLength: 1,
            opacity: 1,
        },
    };

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            onAnimationComplete={(definition) => {
                if (definition === "exit") {
                    onComplete();
                }
            }}
        >
            <div className={styles.content}>
                <motion.svg
                    className={styles.svg}
                    viewBox="0 0 100 100"
                    initial="hidden"
                    animate="visible"
                >
                    {/* Outer rounded rectangle (YouTube shape) */}
                    <motion.rect
                        x="10"
                        y="25"
                        width="80"
                        height="50"
                        rx="12"
                        ry="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        variants={icon}
                        transition={{
                            pathLength: {
                                duration: 0.8,
                                ease: "easeInOut",
                            },
                            opacity: { duration: 0.2 },
                        }}
                    />
                    {/* Play triangle */}
                    <motion.path
                        d="M 40 38 L 40 62 L 65 50 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        variants={icon}
                        transition={{
                            pathLength: {
                                duration: 0.6,
                                ease: "easeInOut",
                                delay: 0.5,
                            },
                            opacity: { duration: 0.2, delay: 0.5 },
                        }}
                    />
                </motion.svg>

                <motion.div
                    className={styles.textContainer}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                >
                    <span className={styles.title}>Soi&apos;Brand</span>
                    <span className={styles.subtitle}>Marketing Analytics</span>
                </motion.div>

                {/* Progress line */}
                <div className={styles.progressContainer}>
                    <motion.div
                        className={styles.progressLine}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                            duration: 1.8,
                            ease: [0.4, 0, 0.2, 1],
                            delay: 0.3,
                        }}
                        onAnimationComplete={() => {
                            setTimeout(onComplete, UI_SPLASH_COMPLETION_DELAY_MS);
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
