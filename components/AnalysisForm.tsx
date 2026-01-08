"use client";

import { useState, useRef } from "react";
import { isValidYouTubeUrl } from "@/lib/utils";
import styles from "./AnalysisForm.module.css";
import { MarketingReport } from "@/lib/types";

interface AnalysisFormProps {
    onSubmit: (url: string) => void;
    onUpload: (report: MarketingReport) => void;
    onError: (msg: string) => void;
    isLoading: boolean;
}

export default function AnalysisForm({
    onSubmit,
    onUpload,
    onError,
    isLoading,
}: AnalysisFormProps) {
    const [url, setUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            onError("Vui lòng nhập link kênh YouTube");
            return;
        }

        // More strict regex for youtube channel urls
        const ytRegex =
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(@|channel\/|c\/|user\/)[a-zA-Z0-9_-]+/;
        if (!ytRegex.test(url) && !isValidYouTubeUrl(url)) {
            onError(
                "Link YouTube không hợp lệ. Hãy nhập link kênh (ví dụ: youtube.com/@username)"
            );
            return;
        }

        onSubmit(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.report_part_1 && json.brand_name) {
                    onUpload(json as MarketingReport);
                } else {
                    onError("File JSON không đúng định dạng báo cáo.");
                }
            } catch (err) {
                onError("Không thể đọc file JSON. Vui lòng kiểm tra lại.");
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Dán link kênh YouTube..."
                        className="input"
                        disabled={isLoading}
                    />
                </div>

                <div className={styles.actions}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{ flex: 1 }}
                    >
                        {isLoading ? "Đang xử lý..." : "Phân tích ngay"}
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        title="Tải lên báo cáo JSON đã có"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".json"
                        style={{ display: "none" }}
                    />
                </div>
            </form>
        </div>
    );
}
