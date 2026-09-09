import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger";
import type { FixtureRunResult, ResultsSummary } from "./types";

const MAX_STORED_RESULTS = 1000;
const results: FixtureRunResult[] = [];

export function saveResult(result: Omit<FixtureRunResult, "id" | "created_at">): FixtureRunResult {
  const stored: FixtureRunResult = {
    ...result,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  results.unshift(stored);
  if (results.length > MAX_STORED_RESULTS) {
    results.pop();
  }
  return stored;
}

export function listResults(): FixtureRunResult[] {
  return [...results];
}

export function getResult(id: string): FixtureRunResult | undefined {
  return results.find((item) => item.id === id);
}

export function summarizeResults(): ResultsSummary {
  const total_runs = results.length;
  if (total_runs === 0) {
    return {
      total_runs: 0,
      execution_success_rate: null,
      accuracy_rate: null,
      average_latency_ms: null,
      per_fixture: [],
    };
  }

  const ranCount = results.filter((item) => item.ran).length;
  const correctCount = results.filter((item) => item.correct === true).length;
  const latencySum = results.reduce((sum, item) => sum + item.latency_ms, 0);

  const fixtureIds = [...new Set(results.map((item) => item.fixture_id))];
  const per_fixture = fixtureIds.map((fixture_id) => {
    const subset = results.filter((item) => item.fixture_id === fixture_id);
    const ran = subset.filter((item) => item.ran).length;
    const correct = subset.filter((item) => item.correct === true).length;
    const latency = subset.reduce((sum, item) => sum + item.latency_ms, 0);
    return {
      fixture_id,
      runs: subset.length,
      execution_success_rate: ran / subset.length,
      accuracy_rate: ran > 0 ? correct / ran : null,
      average_latency_ms: subset.length ? latency / subset.length : null,
    };
  });

  const summary: ResultsSummary = {
    total_runs,
    execution_success_rate: ranCount / total_runs,
    accuracy_rate: ranCount > 0 ? correctCount / ranCount : null,
    average_latency_ms: latencySum / total_runs,
    per_fixture,
  };

  logger.info(
    {
      total_runs: summary.total_runs,
      execution_success_rate: summary.execution_success_rate,
      accuracy_rate: summary.accuracy_rate,
      average_latency_ms: summary.average_latency_ms,
    },
    "results summary",
  );

  return summary;
}
