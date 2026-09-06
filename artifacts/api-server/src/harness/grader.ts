import { logger } from "../lib/logger";
import { numericFromOutput } from "./sandbox";
import type { Fixture, SandboxCapture } from "./types";

export interface Grade {
  ran: boolean;
  correct: boolean | null;
  error: string | null;
  output: unknown;
}

export function gradeFixture(fixture: Fixture, capture: SandboxCapture): Grade {
  if (capture.timed_out) {
    logger.error(
      { fixture_id: fixture.id, kind: "execution_failure", reason: "timeout" },
      "execution failure: sandbox timeout",
    );
    return {
      ran: false,
      correct: null,
      error: `Sandbox timed out after ${capture.execution_time_ms} ms`,
      output: capture.parsed_output,
    };
  }

  if (capture.crashed || capture.exit_code !== 0) {
    const detail =
      capture.stderr.trim() ||
      (capture.exit_code === null
        ? "process failed to start"
        : `exit code ${capture.exit_code}`);
    logger.error(
      {
        fixture_id: fixture.id,
        kind: "execution_failure",
        exit_code: capture.exit_code,
        crashed: capture.crashed,
        stderr: capture.stderr.slice(0, 500),
      },
      "execution failure: process did not complete successfully",
    );
    return {
      ran: false,
      correct: null,
      error: detail,
      output: capture.parsed_output,
    };
  }

  const observed = numericFromOutput(capture.parsed_output);
  if (observed === null) {
    logger.error(
      {
        fixture_id: fixture.id,
        kind: "incorrect_answer",
        reason: "unparseable_output",
        stdout: capture.stdout.slice(0, 500),
      },
      "incorrect answer: process ran (exit 0) but stdout had no numeric value",
    );
    return {
      ran: true,
      correct: false,
      error: "Process ran (exit 0) but stdout did not contain a numeric JSON value",
      output: capture.parsed_output,
    };
  }

  const expected = fixture.reference_answer;
  const delta = Math.abs(observed - expected);
  const ok =
    fixture.tolerance.type === "absolute"
      ? delta <= fixture.tolerance.value
      : expected === 0
        ? delta <= fixture.tolerance.value
        : delta / Math.abs(expected) <= fixture.tolerance.value;

  if (!ok) {
    logger.error(
      {
        fixture_id: fixture.id,
        kind: "incorrect_answer",
        observed,
        expected,
        delta,
        tolerance: fixture.tolerance,
      },
      "incorrect answer: code ran but output missed the reference tolerance",
    );
    return {
      ran: true,
      correct: false,
      error: `Output ${observed} missed reference ${expected} (delta ${delta})`,
      output: capture.parsed_output,
    };
  }

  logger.info(
    {
      fixture_id: fixture.id,
      kind: "correct",
      observed,
      expected,
      delta,
    },
    "fixture output matched reference within tolerance",
  );

  return {
    ran: true,
    correct: true,
    error: null,
    output: capture.parsed_output,
  };
}
