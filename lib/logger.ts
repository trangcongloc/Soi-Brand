// Logger utility with configurable log levels
// Set LOG_LEVEL in .env.local: "silent" | "error" | "info" | "verbose"

type LogLevel = "silent" | "error" | "info" | "verbose";

const LOG_LEVELS: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    info: 2,
    verbose: 3,
};

const getLogLevel = (): LogLevel => {
    const level = process.env.LOG_LEVEL as LogLevel;
    if (level && LOG_LEVELS[level] !== undefined) {
        return level;
    }
    // Default: "info" in dev, "error" in prod
    return process.env.NODE_ENV === "production" ? "error" : "info";
};

const shouldLog = (level: LogLevel): boolean => {
    const currentLevel = getLogLevel();
    return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
};

export const logger = {
    // Simple info logs (request summaries, etc.)
    log: (...args: unknown[]) => {
        if (shouldLog("info")) {
            console.log(...args);
        }
    },

    // Informational messages
    info: (...args: unknown[]) => {
        if (shouldLog("info")) {
            console.info(...args);
        }
    },

    // Warnings
    warn: (...args: unknown[]) => {
        if (shouldLog("info")) {
            console.warn(...args);
        }
    },

    // Error messages (always show message, stack only in verbose)
    error: (message: string, error?: unknown) => {
        if (!shouldLog("error")) return;

        // Always show the error message
        console.error(message);

        // Show full stack trace only in verbose mode
        if (error && shouldLog("verbose")) {
            console.error(error);
        }
    },

    // Verbose/debug logs (full details, stack traces)
    verbose: (...args: unknown[]) => {
        if (shouldLog("verbose")) {
            console.log("[VERBOSE]", ...args);
        }
    },
};
