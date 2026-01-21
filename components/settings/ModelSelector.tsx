"use client";

import { useRef, useEffect } from "react";
import { GEMINI_MODELS } from "@/lib/geminiModels";
import { GeminiModel } from "@/lib/types";
import styles from "./SettingsButton.module.css";

interface ModelSelectorProps {
    selectedModel: GeminiModel;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (model: GeminiModel) => void;
    langCode: string;
    lang: {
        aiModel: string;
        free: string;
        paid: string;
    };
}

export default function ModelSelector({
    selectedModel,
    isOpen,
    onToggle,
    onSelect,
    langCode,
    lang,
}: ModelSelectorProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                isOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                onToggle();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onToggle]);

    const currentModel = GEMINI_MODELS.find((m) => m.id === selectedModel);

    return (
        <div className={styles.section}>
            <label className={styles.label}>
                <span className={styles.labelIcon}>
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                </span>
                {lang.aiModel}
            </label>
            <div className={styles.customDropdown} ref={dropdownRef}>
                <button
                    className={`${styles.dropdownButton} ${isOpen ? styles.dropdownButtonOpen : ""}`}
                    onClick={onToggle}
                    type="button"
                >
                    <span className={styles.dropdownButtonText}>
                        {currentModel?.name || "Select Model"}
                    </span>
                    <span
                        className={`${styles.tierBadge} ${styles[`tierBadge${currentModel?.tier === "free" ? "Free" : "Paid"}`]}`}
                    >
                        {currentModel?.tier === "free"
                            ? lang.free
                            : lang.paid}
                    </span>
                    <svg
                        className={`${styles.dropdownIcon} ${isOpen ? styles.dropdownIconOpen : ""}`}
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                    >
                        <path
                            d="M2 4L6 8L10 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                {isOpen && (
                    <div className={styles.dropdownMenu}>
                        {GEMINI_MODELS.map((model) => (
                            <button
                                key={model.id}
                                className={`${styles.dropdownItem} ${model.id === selectedModel ? styles.dropdownItemSelected : ""}`}
                                onClick={() => onSelect(model.id)}
                                type="button"
                            >
                                <div className={styles.dropdownItemContent}>
                                    <span className={styles.dropdownItemName}>
                                        {model.name}
                                    </span>
                                    <span
                                        className={`${styles.tierBadge} ${styles[`tierBadge${model.tier === "free" ? "Free" : "Paid"}`]}`}
                                    >
                                        {model.tier === "free"
                                            ? lang.free
                                            : lang.paid}
                                    </span>
                                </div>
                                <div className={styles.dropdownItemDesc}>
                                    {langCode === "vi"
                                        ? model.descriptionVi
                                        : model.description}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
