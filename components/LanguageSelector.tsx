"use client";

import { useLanguage, LanguageCode } from "@/lib/lang";
import styles from "./LanguageSelector.module.css";

export default function LanguageSelector() {
    const { langCode, setLanguage, lang } = useLanguage();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as LanguageCode);
    };

    return (
        <div className={styles.container}>
            <svg
                className={styles.icon}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <select
                value={langCode}
                onChange={handleChange}
                className={styles.select}
                aria-label={lang.language.selector}
            >
                <option value="vi">{lang.language.vietnamese}</option>
                <option value="en">{lang.language.english}</option>
            </select>
        </div>
    );
}
