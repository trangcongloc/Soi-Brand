"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import styles from "./patch.module.css";

interface PatchNote {
    version: string;
    date: string;
    changes: {
        type: "feature" | "fix" | "improvement" | "breaking";
        description: string;
    }[];
}

const patchNotes: PatchNote[] = [
    {
        version: "1.2.0",
        date: "2026-01-21",
        changes: [
            {
                type: "feature",
                description: "Improved video fetch logic - fetches all videos from last 30 days, minimum 50 videos if fewer",
            },
            {
                type: "improvement",
                description: "Made loading labels funnier and more engaging for 18-35 age group",
            },
            {
                type: "improvement",
                description: "Removed overly professional tone from loading states",
            },
        ],
    },
    {
        version: "1.1.0",
        date: "2026-01-21",
        changes: [
            {
                type: "feature",
                description: "Added patch notes page at /patch",
            },
            {
                type: "feature",
                description: "Added version indicator at bottom right of main page",
            },
            {
                type: "improvement",
                description: "Clean up dead code and improve logging",
            },
            {
                type: "improvement",
                description: "Added Claude Code setup documentation",
            },
        ],
    },
    {
        version: "1.0.0",
        date: "2026-01-20",
        changes: [
            {
                type: "feature",
                description: "Initial release of Soi'Brand",
            },
            {
                type: "feature",
                description: "YouTube channel analysis with Google Gemini AI",
            },
            {
                type: "feature",
                description: "Marketing report generation with brand positioning, funnel analysis, and content strategy",
            },
            {
                type: "feature",
                description: "Multi-language support (Vietnamese and English)",
            },
        ],
    },
];

const getTypeColor = (type: PatchNote["changes"][0]["type"]) => {
    switch (type) {
        case "feature":
            return "#22c55e";
        case "fix":
            return "#ef4444";
        case "improvement":
            return "#3b82f6";
        case "breaking":
            return "#f59e0b";
        default:
            return "#6b7280";
    }
};

const getTypeBadge = (type: PatchNote["changes"][0]["type"]) => {
    switch (type) {
        case "feature":
            return "NEW";
        case "fix":
            return "FIX";
        case "improvement":
            return "IMPROVED";
        case "breaking":
            return "BREAKING";
        default:
            return type.toUpperCase();
    }
};

export default function PatchNotesPage() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={styles.content}
            >
                <div className={styles.header}>
                    <button onClick={() => router.back()} className={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className={styles.title}>Patch Notes</h1>
                    <p className={styles.subtitle}>What's new in Soi'Brand</p>
                </div>

                <div className={styles.timeline}>
                    {patchNotes.map((patch, index) => (
                        <motion.div
                            key={patch.version}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={styles.patchCard}
                        >
                            <div className={styles.patchHeader}>
                                <div>
                                    <h2 className={styles.version}>v{patch.version}</h2>
                                    <p className={styles.date}>{new Date(patch.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                                </div>
                            </div>

                            <div className={styles.changes}>
                                {patch.changes.map((change, changeIndex) => (
                                    <div key={changeIndex} className={styles.changeItem}>
                                        <span
                                            className={styles.badge}
                                            style={{ backgroundColor: getTypeColor(change.type) }}
                                        >
                                            {getTypeBadge(change.type)}
                                        </span>
                                        <p className={styles.changeDescription}>{change.description}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
