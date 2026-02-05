"use client";

import { motion } from "framer-motion";
import { useLang } from "@/lib/lang";
import styles from "./VeoForm.module.css";

interface VeoScriptInputProps {
  scriptText: string;
  onChange: (text: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scriptFileName: string;
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function VeoScriptInput({
  scriptText,
  onChange,
  onFileUpload,
  scriptFileName,
  isLoading,
  fileInputRef,
}: VeoScriptInputProps) {
  const lang = useLang();

  return (
    <motion.div
      key="script-input"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={styles.inputGroup}
    >
      <div className={styles.scriptInputArea}>
        <textarea
          id="script-text"
          value={scriptText}
          onChange={(e) => onChange(e.target.value)}
          placeholder={lang.veo.form.scriptPlaceholder}
          className={styles.scriptTextarea}
          disabled={isLoading}
          rows={6}
        />
        <div className={styles.scriptActions}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json"
            onChange={onFileUpload}
            className={styles.fileInput}
            disabled={isLoading}
          />
          <button
            type="button"
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            {lang.veo.form.uploadScript}
          </button>
          {scriptFileName && (
            <span className={styles.fileName}>{scriptFileName}</span>
          )}
        </div>
      </div>
      <p className={styles.inputHint}>{lang.veo.workflow.scriptHint}</p>
    </motion.div>
  );
}
