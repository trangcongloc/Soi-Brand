"use client";

import { PromptWorkflow } from "@/lib/prompt";
import { useLang } from "@/lib/lang";
import styles from "./PromptForm.module.css";

interface PromptWorkflowSelectorProps {
  workflow: PromptWorkflow;
  onChange: (workflow: PromptWorkflow) => void;
  isLoading: boolean;
}

export function PromptWorkflowSelector({ workflow, onChange, isLoading }: PromptWorkflowSelectorProps) {
  const lang = useLang();

  return (
    <div className={styles.workflowSelector}>
      <button
        type="button"
        className={`${styles.workflowTab} ${workflow === "url-to-scenes" ? styles.active : ""}`}
        onClick={() => onChange("url-to-scenes")}
        disabled={isLoading}
        title={lang.prompt.workflow.urlToScenesDesc}
      >
        <span className={styles.workflowNumber}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </span>
        <span className={styles.workflowName}>{lang.prompt.workflow.urlToScenes}</span>
      </button>
      <button
        type="button"
        className={`${styles.workflowTab} ${workflow === "url-to-script" ? styles.active : ""}`}
        onClick={() => onChange("url-to-script")}
        disabled={isLoading}
        title={lang.prompt.workflow.urlToScriptDesc}
      >
        <span className={styles.workflowNumber}>1</span>
        <span className={styles.workflowName}>{lang.prompt.workflow.urlToScript}</span>
      </button>
      <button
        type="button"
        className={`${styles.workflowTab} ${workflow === "script-to-scenes" ? styles.active : ""}`}
        onClick={() => onChange("script-to-scenes")}
        disabled={isLoading}
        title={lang.prompt.workflow.scriptToScenesDesc}
      >
        <span className={styles.workflowNumber}>2</span>
        <span className={styles.workflowName}>{lang.prompt.workflow.scriptToScenes}</span>
      </button>
    </div>
  );
}
