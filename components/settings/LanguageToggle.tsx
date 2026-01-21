import { LanguageCode } from "@/lib/lang";
import styles from "./SettingsButton.module.css";

interface LanguageToggleProps {
    langCode: LanguageCode;
    onSwitch: (code: LanguageCode) => void;
    label: string;
}

export default function LanguageToggle({
    langCode,
    onSwitch,
    label,
}: LanguageToggleProps) {
    return (
        <>
            <div className={styles.divider}>
                <span>{label}</span>
            </div>

            <div className={styles.languageSection}>
                <div className={styles.languageToggle}>
                    <div
                        className={`${styles.langSlider} ${langCode === "en" ? styles.langSliderRight : ""}`}
                    />
                    <button
                        onClick={() => onSwitch("vi")}
                        className={`${styles.langOption} ${langCode === "vi" ? styles.langActive : ""}`}
                    >
                        <span className={styles.langFlag}>🇻🇳</span>
                        <span className={styles.langLabel}>Tiếng Việt</span>
                    </button>
                    <button
                        onClick={() => onSwitch("en")}
                        className={`${styles.langOption} ${langCode === "en" ? styles.langActive : ""}`}
                    >
                        <span className={styles.langFlag}>🇬🇧</span>
                        <span className={styles.langLabel}>English</span>
                    </button>
                </div>
            </div>
        </>
    );
}
