import path from "node:path";
import { existsSync } from "node:fs";

// Automatically load .env if present in root or current directory
const rootEnv = path.resolve(import.meta.dirname, "../../.env");
if (existsSync(rootEnv)) {
  try {
    process.loadEnvFile(rootEnv);
  } catch {}
} else if (existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {}
}

process.env.PORT = process.env.PORT || "3001";

// Dynamically import the built entry point so the env var is already set.
await import("./dist/index.mjs");
