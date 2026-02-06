/**
 * Prompt API Module
 * Exports for API route handlers
 */

// Schema
export { PromptRequestSchema, type PromptRequest } from "./schema";

// Helpers
export {
  calculateStreamTimeout,
  mapToPromptErrorType,
  formatErrorMessage,
  createSSEEncoder,
  createErrorResponse,
  createRateLimitResponse,
  generateEventId,
  eventTracker,
  type SSEEncoder,
} from "./helpers";

// Log Helpers
export {
  createPendingLog,
  createCompletedLog,
  createErrorLog,
} from "./log-helpers";

// Batch Error Handler
export { handleBatchError, initializeBatchResume } from "./batch-error-handler";

// Batch Runner
export { runBatchLoop } from "./batch-runner";
export type { BatchLoopConfig, BatchLoopResult } from "./batch-runner";

// Workflows
export {
  runUrlToScript,
  runScriptToScenesDirect,
  runScriptToScenesHybrid,
  runUrlToScenesDirect,
} from "./workflows";
