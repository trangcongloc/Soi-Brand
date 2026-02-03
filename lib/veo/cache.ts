/**
 * VEO Pipeline - Async cache facade (D1 + localStorage fallback)
 * Re-exports everything from cache-remote for async D1 operations
 */

// Re-export everything from cache-remote
export * from "./cache-remote";

// Export types for convenience
export type { CachedVeoJob, CachedVeoJobInfo } from "./types";

// Export storage type checker and sync function
export { isUsingCloudStorage, syncJobToCloud } from "./cache-remote";
