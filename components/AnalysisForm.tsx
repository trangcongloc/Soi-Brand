"use client";

import { useState, useRef } from "react";
import { isValidYouTubeUrl } from "@/lib/utils";
import styles from "./AnalysisForm.module.css";
import { MarketingReport } from "@/lib/types";
import { useLang } from "@/lib/lang";

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
    const lang = useLang();
    const [url, setUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            onError(lang.form.errors.emptyUrl);
            return;
        }

        // More strict regex for youtube channel urls
        const ytRegex =
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(@|channel\/|c\/|user\/)[a-zA-Z0-9_-]+/;
        if (!ytRegex.test(url) && !isValidYouTubeUrl(url)) {
            onError(lang.form.errors.invalidUrl);
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
                    onError(lang.form.errors.invalidJson);
                }
            } catch (err) {
                onError(lang.form.errors.cannotReadJson);
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className={styles.container} role="search">
            <form
                onSubmit={handleSubmit}
                className={styles.form}
                aria-label="YouTube Channel Analysis"
            >
                <div className={styles.inputGroup}>
                    <label htmlFor="channel-url" className="sr-only">
                        YouTube Channel URL
                    </label>
                    <input
                        id="channel-url"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={lang.form.placeholder}
                        className="input"
                        disabled={isLoading}
                        aria-describedby="url-hint"
                        autoComplete="url"
                    />
                    <span id="url-hint" className="sr-only">
                        Enter a YouTube channel URL like youtube.com/@username
                    </span>
                </div>

                <div className={styles.actions}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{ flex: 1 }}
                        aria-busy={isLoading}
                    >
                        {isLoading
                            ? lang.form.submitButtonLoading
                            : lang.form.submitButton}
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        title={lang.form.uploadButtonTitle}
                        aria-label={lang.form.uploadButtonTitle}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            aria-hidden="true"
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
                        aria-label="Upload JSON report"
                    />
                </div>
            </form>
        </div>
    );
}
