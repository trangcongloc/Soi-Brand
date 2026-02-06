/**
 * Prompt Pipeline - D1-only Cache
 * Re-exports everything from cache-remote for D1 operations
 * All job data is stored in Cloudflare D1 - no localStorage
 */

// Re-export everything from cache-remote
export * from "./cache-remote";

// Export types for convenience
export type { CachedPromptJob, CachedPromptJobInfo } from "./types";
