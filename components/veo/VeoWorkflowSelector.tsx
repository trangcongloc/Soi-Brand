"use client";

import { VeoWorkflow } from "@/lib/veo";
import { useLang } from "@/lib/lang";
import styles from "./VeoForm.module.css";

interface VeoWorkflowSelectorProps {
  workflow: VeoWorkflow;
  onChange: (workflow: VeoWorkflow) => void;
  isLoading: boolean;
}

export function VeoWorkflowSelector({ workflow, onChange, isLoading }: VeoWorkflowSelectorProps) {
  const lang = useLang();

  return (
    <div className={styles.workflowSelector}>
      <button
        type="button"
        className={`${styles.workflowTab} ${workflow === "url-to-scenes" ? styles.active : ""}`}
        onClick={() => onChange("url-to-scenes")}
        disabled={isLoading}
        title={lang.veo.workflow.urlToScenesDesc}
      >
        <span className={styles.workflowNumber}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </span>
        <span className={styles.workflowName}>{lang.veo.workflow.urlToScenes}</span>
      </button>
      <button
        type="button"
        className={`${styles.workflowTab} ${workflow === "url-to-script" ? styles.active : ""}`}
        onClick={() => onChange("url-to-script")}
        disabled={isLoading}
        title={lang.veo.workflow.urlToScriptDesc}
      >
        <span className={styles.workflowNumber}>1</span>
        <span className={styles.workflowName}>{lang.veo.workflow.urlToScript}</span>
      </button>
      <button
        type="button"
        className={`${styles.workflowTab} ${workflow === "script-to-scenes" ? styles.active : ""}`}
        onClick={() => onChange("script-to-scenes")}
        disabled={isLoading}
        title={lang.veo.workflow.scriptToScenesDesc}
      >
        <span className={styles.workflowNumber}>2</span>
        <span className={styles.workflowName}>{lang.veo.workflow.scriptToScenes}</span>
      </button>
    </div>
  );
}
