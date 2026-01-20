// Reset modules before each test to get fresh logger state
beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
});

describe("logger", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        jest.spyOn(console, "log").mockImplementation();
        jest.spyOn(console, "error").mockImplementation();
        jest.spyOn(console, "warn").mockImplementation();
        jest.spyOn(console, "info").mockImplementation();
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    describe("log level: silent", () => {
        it("logs nothing when LOG_LEVEL=silent", async () => {
            process.env.LOG_LEVEL = "silent";
            const { logger } = await import("@/lib/logger");

            logger.log("test message");
            logger.info("info message");
            logger.warn("warn message");
            logger.error("error message");

            expect(console.log).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe("log level: error", () => {
        it("only logs errors when LOG_LEVEL=error", async () => {
            process.env.LOG_LEVEL = "error";
            const { logger } = await import("@/lib/logger");

            logger.log("test message");
            logger.info("info message");
            logger.error("error message");

            expect(console.log).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("error message");
        });

        it("does not show stack trace at error level", async () => {
            process.env.LOG_LEVEL = "error";
            const { logger } = await import("@/lib/logger");

            const testError = new Error("test error");
            logger.error("error message", testError);

            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith("error message");
        });
    });

    describe("log level: info", () => {
        it("logs info, warn, and errors when LOG_LEVEL=info", async () => {
            process.env.LOG_LEVEL = "info";
            const { logger } = await import("@/lib/logger");

            logger.log("log message");
            logger.info("info message");
            logger.warn("warn message");
            logger.error("error message");

            expect(console.log).toHaveBeenCalledWith("log message");
            expect(console.info).toHaveBeenCalledWith("info message");
            expect(console.warn).toHaveBeenCalledWith("warn message");
            expect(console.error).toHaveBeenCalledWith("error message");
        });

        it("does not log verbose messages at info level", async () => {
            process.env.LOG_LEVEL = "info";
            const { logger } = await import("@/lib/logger");

            logger.verbose("verbose message");

            expect(console.log).not.toHaveBeenCalledWith(
                "[VERBOSE]",
                "verbose message"
            );
        });
    });

    describe("log level: verbose", () => {
        it("logs everything including verbose and stack traces", async () => {
            process.env.LOG_LEVEL = "verbose";
            const { logger } = await import("@/lib/logger");

            logger.log("log message");
            logger.verbose("verbose message");

            expect(console.log).toHaveBeenCalledWith("log message");
            expect(console.log).toHaveBeenCalledWith("[VERBOSE]", "verbose message");
        });

        it("shows full stack trace at verbose level", async () => {
            process.env.LOG_LEVEL = "verbose";
            const { logger } = await import("@/lib/logger");

            const testError = new Error("test error");
            logger.error("error message", testError);

            expect(console.error).toHaveBeenCalledTimes(2);
            expect(console.error).toHaveBeenCalledWith("error message");
            expect(console.error).toHaveBeenCalledWith(testError);
        });
    });

    describe("default log level", () => {
        it("defaults to info in development", async () => {
            delete process.env.LOG_LEVEL;
            // NODE_ENV is already "test" in jest, which behaves like development
            const { logger } = await import("@/lib/logger");

            logger.log("test");
            logger.info("info");

            expect(console.log).toHaveBeenCalled();
            expect(console.info).toHaveBeenCalled();
        });

        it("uses error level when explicitly set", async () => {
            process.env.LOG_LEVEL = "error";
            const { logger } = await import("@/lib/logger");

            logger.log("test");
            logger.error("error");

            expect(console.log).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("error");
        });
    });
});
