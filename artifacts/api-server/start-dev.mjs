/**
 * start-dev.mjs
 * Sets PORT (default 3001) and starts the API server.
 * Works on Windows PowerShell, CMD, and Unix shells.
 */
process.env.PORT = process.env.PORT ?? "3001";

// Dynamically import the built entry point so the env var is already set.
await import("./dist/index.mjs");
