import { ValidationState, maskApiKey } from "./useSettingsValidation";
import styles from "./SettingsButton.module.css";

interface ApiKeyInputProps {
    provider: "youtube" | "gemini";
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: (value: string) => void;
    onResetValidation: () => void;
    validation: ValidationState;
    lang: {
        verifying: string;
        invalid: string;
        notConfigured: string;
        configured: string;
        free: string;
        paid: string;
    };
    icon: React.ReactNode;
}

export default function ApiKeyInput({
    provider,
    label,
    value,
    onChange,
    onBlur,
    onResetValidation,
    validation,
    lang,
    icon,
}: ApiKeyInputProps) {
    const status =
        provider === "youtube" ? validation.youtube : validation.gemini;

    const renderBadge = () => {
        if (status === "validating") {
            return (
                <span
                    className={`${styles.tierBadge} ${styles.tierBadgeValidating}`}
                >
                    <span className={styles.spinnerSmall} />
                    {lang.verifying}
                </span>
            );
        }

        if (status === "invalid") {
            const error =
                provider === "youtube"
                    ? validation.youtubeError
                    : validation.geminiError;
            return (
                <span
                    className={`${styles.tierBadge} ${styles.tierBadgeInvalid}`}
                >
                    {error || lang.invalid.toLowerCase()}
                </span>
            );
        }

        if (!value) {
            return (
                <span className={styles.quotaBadge}>{lang.notConfigured}</span>
            );
        }

        if (provider === "gemini" && validation.geminiTier) {
            const isFree = validation.geminiTier === "free";
            return (
                <span
                    className={`${styles.tierBadge} ${styles[isFree ? "tierBadgeFree" : "tierBadgePaid"]}`}
                >
                    {isFree ? lang.free : lang.paid}
                </span>
            );
        }

        return (
            <span className={`${styles.tierBadge} ${styles.tierBadgeFree}`}>
                {lang.configured}
            </span>
        );
    };

    return (
        <div className={styles.section}>
            <label className={styles.label}>
                <span className={styles.labelIcon}>{icon}</span>
                {label}
                {renderBadge()}
            </label>
            <div className={styles.inputWrapper}>
                <input
                    type="password"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        onResetValidation();
                    }}
                    onBlur={(e) => onBlur(e.target.value)}
                    placeholder="AIza..."
                    className={styles.input}
                />
                {value && (
                    <span className={styles.keyPreview}>
                        {maskApiKey(value)}
                    </span>
                )}
            </div>
        </div>
    );
}
