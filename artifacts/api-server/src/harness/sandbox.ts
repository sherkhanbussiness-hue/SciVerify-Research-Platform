import { spawn, execSync, type ChildProcess } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { logger } from "../lib/logger";
import type { SandboxCapture } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

function pythonExecutable(): string {
  return process.env["PYTHON_BIN"] ?? (process.platform === "win32" ? "python" : "python3");
}

function killSubprocess(child: ChildProcess): void {
  const pid = child.pid;
  if (!pid) return;

  if (process.platform === "win32") {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    } catch {
      try {
        child.kill();
      } catch {
        // Process may have already terminated
      }
    }
  } else {
    try {
      child.kill("SIGKILL");
    } catch {
      try {
        child.kill();
      } catch {
        // Process may have already terminated
      }
    }
  }
}

function parseOutput(stdout: string): unknown {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return null;
  }
  const last = lines[lines.length - 1];
  try {
    const parsed = JSON.parse(last) as unknown;
    if (parsed && typeof parsed === "object" && "value" in parsed) {
      return parsed;
    }
    return parsed;
  } catch {
    // Check for Python pseudo-JSON numbers like {"value": NaN} or {"value": Infinity}
    const valMatch = last.match(/^{\s*["']?value["']?\s*:\s*(NaN|[-+]?Infinity)\s*}$/i);
    if (valMatch?.[1]) {
      return { value: valMatch[1] };
    }
    const numeric = Number(last);
    if (!Number.isNaN(numeric)) {
      return { value: numeric };
    }
    return last;
  }
}

function extractNumeric(output: unknown): number | null {
  if (typeof output === "number") {
    return Number.isFinite(output) ? output : null;
  }
  if (output && typeof output === "object" && "value" in output) {
    const value = (output as { value: unknown }).value;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string" && value.trim()) {
      const n = Number(value);
      if (!Number.isNaN(n) && Number.isFinite(n)) {
        return n;
      }
    }
  }
  return null;
}

export function numericFromOutput(output: unknown): number | null {
  return extractNumeric(output);
}

/**
 * Extracts the optional `confidence` field from parsed agent output.
 * The agent is prompted to emit {"value": <number>, "confidence": <0-100>}.
 * Returns null if the field is absent or not a valid finite number in [0, 100].
 */
export function confidenceFromOutput(output: unknown): number | null {
  if (!output || typeof output !== "object") return null;
  const record = output as Record<string, unknown>;
  const raw = record["confidence"];
  if (typeof raw !== "number") return null;
  if (!Number.isFinite(raw)) return null;
  // Clamp to valid range
  if (raw < 0 || raw > 100) return null;
  return raw;
}

export async function runSandboxed(
  code: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<SandboxCapture> {
  const workDir = await mkdtemp(path.join(tmpdir(), "sciverify-"));
  const scriptPath = path.join(workDir, "main.py");
  await writeFile(scriptPath, code, "utf8");

  const started = Date.now();
  const bin = pythonExecutable();

  try {
    const capture = await new Promise<SandboxCapture>((resolve) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;

      const childEnv: NodeJS.ProcessEnv = {
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1",
      };
      if (process.platform === "win32") {
        childEnv.SYSTEMROOT = process.env.SYSTEMROOT;
        childEnv.WINDIR = process.env.WINDIR;
        childEnv.PATH = process.env.PATH;
        childEnv.PATHEXT = process.env.PATHEXT;
      }

      const child = spawn(bin, ["-I", "-B", scriptPath], {
        cwd: workDir,
        env: childEnv,
        windowsHide: true,
      });

      const timer = setTimeout(() => {
        timedOut = true;
        killSubprocess(child);
      }, timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });

      const finish = (exitCode: number | null, crashed: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        const execution_time_ms = Date.now() - started;
        const parsed_output = parseOutput(stdout);
        resolve({
          stdout,
          stderr,
          exit_code: exitCode,
          execution_time_ms,
          timed_out: timedOut,
          crashed,
          parsed_output,
        });
      };

      child.on("error", (err) => {
        stderr += `${err.message}\n`;
        finish(null, true);
      });

      child.on("close", (code) => {
        finish(code, timedOut || (code !== 0 && code !== null));
      });
    });

    if (capture.timed_out) {
      logger.warn({ workDir, timeoutMs }, "sandbox execution timed out");
    } else if (capture.exit_code !== 0) {
      logger.warn(
        {
          exit_code: capture.exit_code,
          crashed: capture.crashed,
          stderr: capture.stderr.slice(0, 500),
        },
        "sandbox execution did not complete successfully",
      );
    }

    return capture;
  } finally {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch (err) {
      logger.warn({ workDir, err }, "failed to clean up sandbox workDir");
    }
  }
}
