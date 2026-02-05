const nextJest = require("next/jest");

const createJestConfig = nextJest({
    dir: "./",
});

const customJestConfig = {
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    testEnvironment: "jsdom",
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    testPathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/.next/",
        "<rootDir>/tests/e2e/",
        "<rootDir>/__tests__/fixtures/prompt/(?!.*\\.test\\.ts$).*",
    ],
    testMatch: [
        "**/__tests__/**/*.test.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)",
        "!**/__tests__/fixtures/**/*.ts",
    ],
    collectCoverageFrom: [
        "lib/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}",
        "!**/*.d.ts",
        "!**/node_modules/**",
    ],
};

module.exports = createJestConfig(customJestConfig);
