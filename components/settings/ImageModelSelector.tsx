"use client";

import { useRef, useEffect } from "react";
import { GEMINI_IMAGE_MODELS } from "@/lib/geminiModels";
import { GeminiImageModel } from "@/lib/types";
import styles from "./SettingsButton.module.css";

interface ImageModelSelectorProps {
    selectedModel: GeminiImageModel;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (model: GeminiImageModel) => void;
    langCode: string;
    lang: {
        imageModel: string;
        free: string;
        paid: string;
    };
}

export default function ImageModelSelector({
    selectedModel,
    isOpen,
    onToggle,
    onSelect,
    langCode,
    lang,
}: ImageModelSelectorProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const currentModel = GEMINI_IMAGE_MODELS.find((m) => m.id === selectedModel);

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
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </span>
                {lang.imageModel}
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
                        {GEMINI_IMAGE_MODELS.map((model) => (
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
