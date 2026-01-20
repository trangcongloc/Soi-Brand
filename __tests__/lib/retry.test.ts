import { withRetry, createRetryWrapper } from "@/lib/retry";

// Mock the logger
jest.mock("@/lib/logger", () => ({
    logger: {
        log: jest.fn(),
        error: jest.fn(),
    },
}));

describe("retry", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("withRetry", () => {
        it("returns result on first successful attempt", async () => {
            const fn = jest.fn().mockResolvedValue("success");

            const result = await withRetry(fn);

            expect(result).toBe("success");
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it("retries on retryable error and succeeds", async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error("ETIMEDOUT"))
                .mockResolvedValueOnce("success");

            const resultPromise = withRetry(fn, {
                maxAttempts: 3,
                initialDelayMs: 100,
            });

            // Fast-forward through the delay
            await jest.advanceTimersByTimeAsync(200);

            const result = await resultPromise;

            expect(result).toBe("success");
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it("throws after max attempts exceeded", async () => {
            jest.useRealTimers(); // Use real timers for this test

            const fn = jest.fn().mockRejectedValue(new Error("ETIMEDOUT"));

            await expect(
                withRetry(fn, {
                    maxAttempts: 3,
                    initialDelayMs: 10,
                    maxDelayMs: 20,
                })
            ).rejects.toThrow("ETIMEDOUT");

            expect(fn).toHaveBeenCalledTimes(3);
        });

        it("throws immediately for non-retryable errors", async () => {
            const fn = jest.fn().mockRejectedValue(new Error("Invalid input"));

            await expect(
                withRetry(fn, {
                    maxAttempts: 3,
                    retryableErrors: ["ETIMEDOUT"],
                })
            ).rejects.toThrow("Invalid input");

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it("calls onRetry callback on retry", async () => {
            const onRetry = jest.fn();
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error("503"))
                .mockResolvedValueOnce("success");

            const resultPromise = withRetry(fn, {
                maxAttempts: 3,
                initialDelayMs: 100,
                onRetry,
            });

            await jest.advanceTimersByTimeAsync(200);
            await resultPromise;

            expect(onRetry).toHaveBeenCalledTimes(1);
            expect(onRetry).toHaveBeenCalledWith(
                1,
                expect.any(Error),
                expect.any(Number)
            );
        });

        it("respects maxDelayMs cap", async () => {
            jest.useRealTimers(); // Use real timers for this test

            const onRetry = jest.fn();
            const fn = jest.fn().mockRejectedValue(new Error("429"));

            try {
                await withRetry(fn, {
                    maxAttempts: 3,
                    initialDelayMs: 500,
                    maxDelayMs: 100,
                    backoffMultiplier: 10,
                    onRetry,
                });
            } catch {
                // Expected to fail
            }

            // Check that delays were capped
            expect(onRetry).toHaveBeenCalled();
            onRetry.mock.calls.forEach((call) => {
                const delayMs = call[2];
                // With jitter, max should be around 120 (100 + 20%)
                expect(delayMs).toBeLessThanOrEqual(150);
            });
        });

        it("handles MODEL_OVERLOAD as retryable", async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error("MODEL_OVERLOAD"))
                .mockResolvedValueOnce("success");

            const resultPromise = withRetry(fn, {
                maxAttempts: 2,
                initialDelayMs: 100,
            });

            await jest.advanceTimersByTimeAsync(200);
            const result = await resultPromise;

            expect(result).toBe("success");
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it("handles RATE_LIMIT as retryable", async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error("RATE_LIMIT exceeded"))
                .mockResolvedValueOnce("success");

            const resultPromise = withRetry(fn, {
                maxAttempts: 2,
                initialDelayMs: 100,
            });

            await jest.advanceTimersByTimeAsync(200);
            const result = await resultPromise;

            expect(result).toBe("success");
        });
    });

    describe("createRetryWrapper", () => {
        it("creates a wrapper with default options", async () => {
            const retryFn = createRetryWrapper({
                maxAttempts: 2,
                initialDelayMs: 50,
            });

            const fn = jest.fn().mockResolvedValue("wrapped");
            const result = await retryFn(fn);

            expect(result).toBe("wrapped");
        });

        it("allows overriding options", async () => {
            const retryFn = createRetryWrapper({
                maxAttempts: 2,
            });

            const fn = jest.fn().mockRejectedValue(new Error("ETIMEDOUT"));

            const resultPromise = retryFn(fn, { maxAttempts: 1 });

            await expect(resultPromise).rejects.toThrow("ETIMEDOUT");
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });
});
