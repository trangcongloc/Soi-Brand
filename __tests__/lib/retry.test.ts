import { withRetry, createRetryWrapper } from "@/lib/retry";

describe("withRetry", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should succeed on first attempt", async () => {
        const mockFn = jest.fn().mockResolvedValue("success");

        const result = await withRetry(mockFn);

        expect(result).toBe("success");
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable error and eventually succeed", async () => {
        const mockFn = jest
            .fn()
            .mockRejectedValueOnce(new Error("ETIMEDOUT"))
            .mockResolvedValueOnce("success");

        const promise = withRetry(mockFn, { maxAttempts: 3, initialDelayMs: 100 });

        // Use advanceTimersByTimeAsync for proper async handling
        await jest.advanceTimersByTimeAsync(200);

        const result = await promise;

        expect(result).toBe("success");
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should throw after max attempts", async () => {
        jest.useRealTimers(); // Use real timers for this test

        const mockFn = jest.fn().mockRejectedValue(new Error("ETIMEDOUT"));

        await expect(
            withRetry(mockFn, { maxAttempts: 2, initialDelayMs: 1 })
        ).rejects.toThrow("ETIMEDOUT");

        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should not retry non-retryable errors", async () => {
        const mockFn = jest.fn().mockRejectedValue(new Error("Some other error"));

        await expect(
            withRetry(mockFn, { maxAttempts: 3 })
        ).rejects.toThrow("Some other error");

        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should call onRetry callback", async () => {
        const mockFn = jest
            .fn()
            .mockRejectedValueOnce(new Error("overloaded"))
            .mockResolvedValueOnce("success");

        const onRetry = jest.fn();

        const promise = withRetry(mockFn, {
            maxAttempts: 3,
            initialDelayMs: 100,
            onRetry,
        });

        await jest.advanceTimersByTimeAsync(200);

        await promise;

        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onRetry).toHaveBeenCalledWith(
            1,
            expect.any(Error),
            expect.any(Number)
        );
    });
});

describe("createRetryWrapper", () => {
    it("should create a wrapper with default options", async () => {
        const wrapper = createRetryWrapper({ maxAttempts: 2 });
        const mockFn = jest.fn().mockResolvedValue("success");

        const result = await wrapper(mockFn);

        expect(result).toBe("success");
    });

    it("should allow overriding options", async () => {
        jest.useFakeTimers();

        const wrapper = createRetryWrapper({ maxAttempts: 2 });
        const mockFn = jest.fn().mockRejectedValue(new Error("ETIMEDOUT"));

        const promise = wrapper(mockFn, { maxAttempts: 1 });

        await expect(promise).rejects.toThrow("ETIMEDOUT");
        expect(mockFn).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });
});
