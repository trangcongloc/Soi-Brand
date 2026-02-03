/**
 * Browser environment detection utilities
 * Eliminates duplicate isBrowser() implementations across the VEO module
 */

/**
 * Checks if code is running in a browser environment
 * @returns true if window and localStorage are available
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}
