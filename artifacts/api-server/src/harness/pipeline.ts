import { generateCode } from "./agent";
import { getFixture } from "./fixtures";
import { gradeFixture } from "./grader";
import { runSandboxed, confidenceFromOutput } from "./sandbox";
import { validateScriptSecurity } from "./security";
import { saveResult } from "./store";
import { logger } from "../lib/logger";
import { sanitizeString } from "../lib/sanitize";
import type { FixtureRunResult } from "./types";
import { retrieveFormulas, formatContext } from "./retrieval";

/** Maximum number of retry attempts after the initial attempt fails. */
const MAX_RETRIES = 2;

export async function runFixtureById(id: string): Promise<FixtureRunResult> {
  const fixture = getFixture(id);
  if (!fixture) {
    throw Object.assign(new Error(`Unknown fixture: ${id}`), { status: 404 });
  }

  const wallStart = Date.now();
  let model = process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";
  let provider: string | undefined;

  // ── Phase-2 retry tracking ────────────────────────────────────────────────
  // first_attempt_correct: set after the very first full attempt (code gen →
  //   security → sandbox → grade), regardless of outcome.
  // retry_count: incremented each time we loop back due to failure.
  // final_correct / correct: always reflect the last attempt's grade result.
  let retry_count = 0;
  let first_attempt_correct: boolean | null = null;
  // Phase-3: confidence from the last successful sandbox run
  let self_reported_confidence: number | undefined;

  // Phase-4: retrieval-grounded generation
  const retrievedEntries = retrieveFormulas(fixture.prompt);
  const formattedContext = formatContext(retrievedEntries);
  const retrieval_used = retrievedEntries.length > 0;
  const retrieved_context = retrievedEntries.map(
    (e) => `[${e.title}] ${e.formula} | ${e.variables}`,
  );

  // State that gets overwritten each attempt and used in the final saveResult
  let generated_code: string | null = null;
  let lastCapture: Awaited<ReturnType<typeof runSandboxed>> | null = null;
  let lastGrade: ReturnType<typeof gradeFixture> | null = null;
  let agentError: string | null = null;
  let securityError: string | null = null;

  // ── Attempt loop ───────────────────────────────────────────────────────────
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      retry_count = attempt;
      logger.info(
        { fixture_id: fixture.id, attempt, max_retries: MAX_RETRIES },
        `self-correction: retry attempt ${attempt}`,
      );
    }

    // 1. Code generation ────────────────────────────────────────────────────
    let attemptCode: string | null = null;
    try {
      const generation = await generateCode(fixture, {
        retrievedContext: formattedContext,
      });
      attemptCode = generation.code;
      model = generation.model;
      provider = generation.provider;
      // Reset error state from any prior attempt
      agentError = null;
      securityError = null;
    } catch (err) {
      const message = sanitizeString(err instanceof Error ? err.message : String(err));
      agentError = message;
      logger.error(
        { fixture_id: fixture.id, attempt, kind: "execution_failure", stage: "agent_runner", message },
        "execution failure: agent did not return code",
      );

      // Record first_attempt_correct on attempt 0 regardless
      if (attempt === 0) first_attempt_correct = null;

      if (attempt < MAX_RETRIES) continue; // retry

      // Exhausted all attempts — save failure result
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
        provider,
        retry_count,
        first_attempt_correct,
        final_correct: null,
        retrieval_used,
        retrieved_context,
      });
    }

    // 2. Security validation ────────────────────────────────────────────────
    const securityCheck = validateScriptSecurity(attemptCode);
    if (!securityCheck.valid) {
      const message = `Script rejected for security violation: ${securityCheck.reason ?? "forbidden system or network operations detected"}`;
      securityError = message;
      logger.warn(
        { fixture_id: fixture.id, attempt, kind: "security_violation", stage: "security_validator", message },
        "security violation: generated code failed security validation",
      );

      if (attempt === 0) first_attempt_correct = null;

      if (attempt < MAX_RETRIES) continue; // retry — ask the model again

      // Exhausted — save security-failure result
      return saveResult({
        fixture_id: fixture.id,
        subdomain: fixture.subdomain,
        ran: false,
        correct: null,
        error: message,
        output: null,
        latency_ms: Date.now() - wallStart,
        generated_code: attemptCode,
        stdout: "",
        stderr: "",
        exit_code: null,
        timed_out: false,
        crashed: false,
        execution_time_ms: 0,
        model,
        provider,
        retry_count,
        first_attempt_correct,
        final_correct: null,
        retrieval_used,
        retrieved_context,
      });
    }

    // 3. Sandbox execution + grade ──────────────────────────────────────────
    generated_code = attemptCode;
    let capture: Awaited<ReturnType<typeof runSandboxed>>;
    let grade: ReturnType<typeof gradeFixture>;
    try {
      capture = await runSandboxed(generated_code);
      grade = gradeFixture(fixture, capture);
    } catch (err) {
      const message = sanitizeString(err instanceof Error ? err.message : String(err));
      logger.error(
        { fixture_id: fixture.id, attempt, kind: "execution_failure", stage: "sandbox_runner", message },
        "execution failure: sandbox execution or grading threw an error",
      );

      if (attempt === 0) first_attempt_correct = null;

      if (attempt < MAX_RETRIES) continue; // retry

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
        stderr: message,
        exit_code: null,
        timed_out: false,
        crashed: true,
        execution_time_ms: 0,
        model,
        provider,
        retry_count,
        first_attempt_correct,
        final_correct: null,
        retrieval_used,
        retrieved_context,
      });
    }

    lastCapture = capture;
    lastGrade = grade;

    // Phase-3: extract confidence from this attempt's parsed output
    const attemptConfidence = confidenceFromOutput(capture.parsed_output);
    if (attemptConfidence !== null) {
      self_reported_confidence = attemptConfidence;
    }

    // Record first-attempt outcome
    if (attempt === 0) {
      first_attempt_correct = grade.correct;
    }

    // If the answer is correct (or it ran but is wrong after max retries) — stop
    const shouldRetry = !grade.correct && attempt < MAX_RETRIES;
    if (!shouldRetry) {
      logger.info(
        {
          fixture_id: fixture.id,
          attempt,
          retry_count,
          correct: grade.correct,
          first_attempt_correct,
        },
        grade.correct
          ? "self-correction: fixture passed"
          : "self-correction: all attempts exhausted",
      );
      break;
    }

    logger.info(
      { fixture_id: fixture.id, attempt, correct: grade.correct },
      "self-correction: attempt failed — retrying",
    );
  }

  // ── Save final result ──────────────────────────────────────────────────────
  if (!lastCapture || !lastGrade) {
    // Should not happen; guard for type safety
    return saveResult({
      fixture_id: fixture.id,
      subdomain: fixture.subdomain,
      ran: false,
      correct: null,
      error: agentError ?? securityError ?? "Unknown pipeline error",
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
      provider,
      retry_count,
      first_attempt_correct,
      final_correct: null,
      retrieval_used,
      retrieved_context,
    });
  }

  return saveResult({
    fixture_id: fixture.id,
    subdomain: fixture.subdomain,
    ran: lastGrade.ran,
    correct: lastGrade.correct,       // backward-compat: still the final outcome
    error: lastGrade.error,
    output: lastGrade.output,
    latency_ms: Date.now() - wallStart,
    generated_code,
    stdout: lastCapture.stdout,
    stderr: lastCapture.stderr,
    exit_code: lastCapture.exit_code,
    timed_out: lastCapture.timed_out,
    crashed: lastCapture.crashed,
    execution_time_ms: lastCapture.execution_time_ms,
    model,
    provider,
    retry_count,
    first_attempt_correct,
    final_correct: lastGrade.correct,  // mirrors `correct` for Phase-3/4 convenience
    self_reported_confidence,
    retrieval_used,
    retrieved_context,
  });
}
