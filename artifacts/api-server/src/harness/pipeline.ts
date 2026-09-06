import { generateCode } from "./agent";
import { getFixture } from "./fixtures";
import { gradeFixture } from "./grader";
import { runSandboxed } from "./sandbox";
import { validateScriptSecurity } from "./security";
import { saveResult } from "./store";
import { logger } from "../lib/logger";
import type { FixtureRunResult } from "./types";

export async function runFixtureById(id: string): Promise<FixtureRunResult> {
  const fixture = getFixture(id);
  if (!fixture) {
    throw Object.assign(new Error(`Unknown fixture: ${id}`), { status: 404 });
  }

  const wallStart = Date.now();
  let generated_code: string | null = null;
  let model = process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";

  try {
    const generation = await generateCode(fixture);
    generated_code = generation.code;
    model = generation.model;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      { fixture_id: fixture.id, kind: "execution_failure", stage: "agent_runner", message },
      "execution failure: agent did not return code",
    );
    return saveResult({
      fixture_id: fixture.id,
      subdomain: fixture.subdomain,
      ran: false,
      correct: null,
      error: message,
      output: null,
      latency_ms: Date.now() - wallStart,
      generated_code: null,
      stdout: "",
      stderr: "",
      exit_code: null,
      timed_out: false,
      crashed: false,
      execution_time_ms: 0,
      model,
    });
  }

  const securityCheck = validateScriptSecurity(generated_code);
  if (!securityCheck.valid) {
    const message = `Script rejected for security violation: ${securityCheck.reason ?? "forbidden system or network operations detected"}`;
    logger.warn(
      { fixture_id: fixture.id, kind: "security_violation", stage: "security_validator", message },
      "security violation: generated code failed security validation",
    );
    return saveResult({
      fixture_id: fixture.id,
      subdomain: fixture.subdomain,
      ran: false,
      correct: null,
      error: message,
      output: null,
      latency_ms: Date.now() - wallStart,
      generated_code,
      stdout: "",
      stderr: "",
      exit_code: null,
      timed_out: false,
      crashed: false,
      execution_time_ms: 0,
      model,
    });
  }

  const capture = await runSandboxed(generated_code);
  const grade = gradeFixture(fixture, capture);

  return saveResult({
    fixture_id: fixture.id,
    subdomain: fixture.subdomain,
    ran: grade.ran,
    correct: grade.correct,
    error: grade.error,
    output: grade.output,
    latency_ms: Date.now() - wallStart,
    generated_code,
    stdout: capture.stdout,
    stderr: capture.stderr,
    exit_code: capture.exit_code,
    timed_out: capture.timed_out,
    crashed: capture.crashed,
    execution_time_ms: capture.execution_time_ms,
    model,
  });
}
