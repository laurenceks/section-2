import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import importPlugin from "eslint-plugin-import";
import {defineConfig} from "eslint/config";

export default defineConfig([
    pluginJs.configs.recommended,
    tseslint.configs.recommended,
    eslintPluginPrettierRecommended,
    importPlugin.flatConfigs.recommended,
    { linterOptions: { reportUnusedInlineConfigs: "error" } },
    { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    {
        rules: {
            "prettier/prettier": ["warn", { tabWidth: 4, endOfLine: "auto" }],
            "no-plusplus": [2, { allowForLoopAfterthoughts: true }],
            "no-underscore-dangle": 0,
            "import/extensions": [2, "never"],
            "import/no-unresolved": 2,
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
        },
    },
    { languageOptions: { globals: globals.browser } },
    {
        settings: {
            "import/resolver": {
                typescript: true,
                node: true,
            },
            "import/parsers": {
                "@typescript-eslint/parser": [".ts", ".tsx"],
            },
        },
    },
]);
