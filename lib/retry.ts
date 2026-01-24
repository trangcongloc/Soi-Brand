// Retry logic with exponential backoff

import { logger } from "./logger";

export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    retryableErrors?: string[];
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onRetry">> = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ENOTFOUND",
        "MODEL_OVERLOAD",
        "RATE_LIMIT",
        "503",
        "429",
        "overloaded",
        "Service Unavailable",
    ],
};

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
    attempt: number,
    initialDelayMs: number,
    maxDelayMs: number,
    backoffMultiplier: number
): number {
    // Exponential backoff
    const exponentialDelay =
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

    // Add jitter (±20%)
    const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);

    return Math.round(cappedDelay + jitter);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorString = `${error.name} ${error.message}`.toLowerCase();

    return retryableErrors.some((retryable) =>
        errorString.includes(retryable.toLowerCase())
    );
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
        retryableErrors,
    } = { ...DEFAULT_OPTIONS, ...options };

    const { onRetry } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if this is the last attempt
            if (attempt === maxAttempts) {
                throw lastError;
            }

            // Check if error is retryable
            if (!isRetryableError(lastError, retryableErrors)) {
                throw lastError;
            }

            // Calculate delay for next attempt
            const delayMs = calculateDelay(
                attempt,
                initialDelayMs,
                maxDelayMs,
                backoffMultiplier
            );

            // Call onRetry callback if provided
            if (onRetry) {
                onRetry(attempt, lastError, delayMs);
            }

            logger.log(
                `Retry attempt ${attempt}/${maxAttempts} after ${delayMs}ms due to: ${lastError.message}`
            );

            // Wait before retrying
            await sleep(delayMs);
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error("Retry failed");
}


