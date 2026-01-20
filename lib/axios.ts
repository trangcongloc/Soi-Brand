// Shared axios instance with default configuration
import axios from "axios";

// Default timeout of 30 seconds for all API requests
const DEFAULT_TIMEOUT = 30000;

// Create axios instance with default config
export const apiClient = axios.create({
    timeout: DEFAULT_TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
});

// Export timeout constant for cases where custom timeout is needed
export { DEFAULT_TIMEOUT };
