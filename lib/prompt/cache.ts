/**
 * Prompt Pipeline - Async cache facade (D1 + localStorage fallback)
 * Re-exports everything from cache-remote for async D1 operations
 */

// Re-export everything from cache-remote
export * from "./cache-remote";

// Export types for convenience
export type { CachedPromptJob, CachedPromptJobInfo } from "./types";

// Export storage type checker, sync function, and granular delete functions
export { isUsingCloudStorage, syncJobToCloud, deleteJobFromLocal, deleteJobFromCloud } from "./cache-remote";
