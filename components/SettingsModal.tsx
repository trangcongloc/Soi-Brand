import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/lang";
import { colors } from "@/lib/theme";
import { getUserSettings, saveUserSettings, isValidApiKeyFormat, UserSettings } from "@/lib/userSettings";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { langCode } = useLanguage();
    const [youtubeApiKey, setYoutubeApiKey] = useState("");
    const [geminiApiKey, setGeminiApiKey] = useState("");
    const [showYoutubeKey, setShowYoutubeKey] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            const settings = getUserSettings();
            setYoutubeApiKey(settings.youtubeApiKey || "");
            setGeminiApiKey(settings.geminiApiKey || "");
            setSaveMessage(null);
        }
    }, [isOpen]);

    const handleSave = () => {
        const settings: UserSettings = {};

        // Validate and save YouTube API key if provided
        if (youtubeApiKey.trim()) {
            const isValid = isValidApiKeyFormat(youtubeApiKey, "youtube");
            if (!isValid) {
                setSaveMessage({
                    type: "error",
                    text: langCode === "vi"
                        ? "YouTube API key không hợp lệ (phải >= 30 ký tự, chỉ chữ/số/-/_)"
                        : "Invalid YouTube API key format (must be >= 30 chars, alphanumeric/-/_)"
                });
                return;
            }
            settings.youtubeApiKey = youtubeApiKey.trim();
        }

        // Validate and save Gemini API key if provided
        if (geminiApiKey.trim()) {
            const isValid = isValidApiKeyFormat(geminiApiKey, "gemini");
            if (!isValid) {
                setSaveMessage({
                    type: "error",
                    text: langCode === "vi"
                        ? "Gemini API key không hợp lệ (phải >= 30 ký tự)"
                        : "Invalid Gemini API key format (must be >= 30 chars)"
                });
                return;
            }
            settings.geminiApiKey = geminiApiKey.trim();
        }

        saveUserSettings(settings);
        setSaveMessage({
            type: "success",
            text: langCode === "vi"
                ? "Đã lưu cài đặt thành công!"
                : "Settings saved successfully!"
        });

        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const handleClear = () => {
        setYoutubeApiKey("");
        setGeminiApiKey("");
        saveUserSettings({});
        setSaveMessage({
            type: "success",
            text: langCode === "vi"
                ? "Đã xóa tất cả API keys. Sẽ sử dụng keys mặc định."
                : "Cleared all API keys. Will use default keys."
        });
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: colors.overlay,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "1rem",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: colors.bgCard,
                    borderRadius: "16px",
                    padding: "2rem",
                    maxWidth: "500px",
                    width: "100%",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    maxHeight: "90vh",
                    overflow: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "700", color: colors.textMain, margin: 0 }}>
                        {langCode === "vi" ? "⚙️ Cài đặt API Keys" : "⚙️ API Keys Settings"}
                    </h2>
                    <p style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "0.5rem" }}>
                        {langCode === "vi"
                            ? "Nhập API keys của bạn hoặc để trống để sử dụng keys mặc định"
                            : "Enter your API keys or leave empty to use default keys"}
                    </p>
                </div>

                {/* YouTube API Key */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: colors.textMain, display: "block", marginBottom: "0.5rem" }}>
                        YouTube Data API Key
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showYoutubeKey ? "text" : "password"}
                            value={youtubeApiKey}
                            onChange={(e) => setYoutubeApiKey(e.target.value)}
                            placeholder={langCode === "vi" ? "Nhập YouTube API key..." : "Enter YouTube API key..."}
                            style={{
                                width: "100%",
                                padding: "0.75rem 2.5rem 0.75rem 0.75rem",
                                fontSize: "13px",
                                border: `1px solid ${colors.borderLight}`,
                                borderRadius: "8px",
                                background: colors.bgMuted,
                                color: colors.textMain,
                                fontFamily: "monospace",
                            }}
                        />
                        <button
                            onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                            style={{
                                position: "absolute",
                                right: "0.5rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: colors.textSecondary,
                                padding: "0.5rem",
                            }}
                            title={showYoutubeKey ? "Hide" : "Show"}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {showYoutubeKey ? (
                                    <>
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                    <p style={{ fontSize: "11px", color: colors.textLight, marginTop: "0.35rem" }}>
                        {langCode === "vi"
                            ? "Lấy key tại: console.cloud.google.com/apis/credentials"
                            : "Get key at: console.cloud.google.com/apis/credentials"}
                    </p>
                </div>

                {/* Gemini API Key */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: colors.textMain, display: "block", marginBottom: "0.5rem" }}>
                        Google Gemini API Key
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showGeminiKey ? "text" : "password"}
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder={langCode === "vi" ? "Nhập Gemini API key..." : "Enter Gemini API key..."}
                            style={{
                                width: "100%",
                                padding: "0.75rem 2.5rem 0.75rem 0.75rem",
                                fontSize: "13px",
                                border: `1px solid ${colors.borderLight}`,
                                borderRadius: "8px",
                                background: colors.bgMuted,
                                color: colors.textMain,
                                fontFamily: "monospace",
                            }}
                        />
                        <button
                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                            style={{
                                position: "absolute",
                                right: "0.5rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: colors.textSecondary,
                                padding: "0.5rem",
                            }}
                            title={showGeminiKey ? "Hide" : "Show"}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {showGeminiKey ? (
                                    <>
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                    <p style={{ fontSize: "11px", color: colors.textLight, marginTop: "0.35rem" }}>
                        {langCode === "vi"
                            ? "Lấy key tại: ai.google.dev/gemini-api/docs/api-key"
                            : "Get key at: ai.google.dev/gemini-api/docs/api-key"}
                    </p>
                </div>

                {/* Save Message */}
                {saveMessage && (
                    <div
                        style={{
                            padding: "0.75rem 1rem",
                            borderRadius: "8px",
                            marginBottom: "1rem",
                            background: saveMessage.type === "success" ? colors.successLight : colors.errorLight,
                            color: saveMessage.type === "success" ? colors.successDark : colors.errorDark,
                            fontSize: "13px",
                            fontWeight: "500",
                        }}
                    >
                        {saveMessage.text}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                        onClick={handleSave}
                        style={{
                            flex: 1,
                            padding: "0.875rem 1rem",
                            fontSize: "14px",
                            fontWeight: "600",
                            background: colors.brand,
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                        }}
                    >
                        {langCode === "vi" ? "Lưu cài đặt" : "Save Settings"}
                    </button>
                    <button
                        onClick={handleClear}
                        style={{
                            padding: "0.875rem 1rem",
                            fontSize: "14px",
                            fontWeight: "600",
                            background: colors.bgHover,
                            color: colors.textMain,
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                        }}
                    >
                        {langCode === "vi" ? "Xóa" : "Clear"}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "0.875rem 1rem",
                            fontSize: "14px",
                            fontWeight: "500",
                            background: "transparent",
                            color: colors.textSecondary,
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                        }}
                    >
                        {langCode === "vi" ? "Đóng" : "Close"}
                    </button>
                </div>

                {/* Info */}
                <div
                    style={{
                        marginTop: "1.5rem",
                        padding: "1rem",
                        background: colors.infoLight,
                        borderRadius: "8px",
                        border: `1px solid ${colors.info}`,
                    }}
                >
                    <p style={{ fontSize: "11px", color: colors.infoDark, margin: 0, lineHeight: "1.6" }}>
                        <strong style={{ display: "block", marginBottom: "0.35rem" }}>
                            {langCode === "vi" ? "📌 Lưu ý:" : "📌 Note:"}
                        </strong>
                        {langCode === "vi"
                            ? "API keys được lưu trên trình duyệt của bạn. Nếu không nhập, ứng dụng sẽ tự động sử dụng keys mặc định."
                            : "API keys are stored in your browser. If not provided, the app will use default keys."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
