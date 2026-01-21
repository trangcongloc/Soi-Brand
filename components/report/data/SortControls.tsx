import React from "react";
import { motion } from "framer-motion";
import styles from "@/components/ReportDisplay.module.css";
import { sortAnimations } from "@/lib/animations";
import { SortOrder } from "./usePostsSorting";

interface SortControlsProps {
    sortOrder: SortOrder;
    onSortChange: (order: SortOrder) => void;
    lang: {
        sortBy: string;
        sortLatest: string;
        sortRating: string;
    };
}

export default function SortControls({
    sortOrder,
    onSortChange,
    lang,
}: SortControlsProps) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
                style={{
                    fontSize: "11px",
                    color: "#666",
                    fontWeight: 500,
                }}
            >
                {lang.sortBy}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
                <motion.button
                    onClick={() => onSortChange("latest")}
                    className={`${styles.sortButton} ${sortOrder === "latest" ? styles.sortButtonActive : ""}`}
                    whileTap={{ scale: sortAnimations.buttonScale }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: sortAnimations.buttonDuration }}
                >
                    {lang.sortLatest}
                </motion.button>
                <motion.button
                    onClick={() => onSortChange("rating")}
                    className={`${styles.sortButton} ${sortOrder === "rating" ? styles.sortButtonActive : ""}`}
                    whileTap={{ scale: sortAnimations.buttonScale }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: sortAnimations.buttonDuration }}
                >
                    {lang.sortRating}
                </motion.button>
            </div>
        </div>
    );
}
