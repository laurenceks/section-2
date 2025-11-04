import { execSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = resolve(__dirname, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

let gitTag = "";
try {
    gitTag = execSync("git describe --tags --exact-match", { stdio: "pipe" })
        .toString()
        .trim();
} catch {
    console.error("\x1b[31mNo exact Git tag found for this commit.\x1b[0m");
    process.exit(1);
}

if (gitTag !== `v${pkg.version}`) {
    console.error(
        `\x1b[31mGit tag (${gitTag}) does not match package.json version (v${pkg.version}).\x1b[0m`
    );
    process.exit(1);
}

console.log(`\x1b[32mGit tag and npm version match (${gitTag}).\x1b[0m`);
