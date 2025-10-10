import type { Config } from "jest";

export default async (): Promise<Config> => {
    return {
        preset: "ts-jest/presets/default-esm",
        extensionsToTreatAsEsm: [".ts"],
        transform: {
            "^.+\\.tsx?$": [
                "ts-jest",
                {
                    useESM: true,
                    isolatedModules: true,
                },
            ],
        },
        setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
        verbose: false,
        noStackTrace: true,
        testLocationInResults: false,
        testEnvironment: "node",
    } as Config;
};
