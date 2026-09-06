import type { Dataset, Evaluation, Failure, Model, ScientificTask } from '@/lib/mock-data';
import type { FixtureRunResult, PublicFixture, ResultsSummary } from '@/lib/api';

export function fixtureToTask(fixture: PublicFixture): ScientificTask {
  return {
    id: fixture.id,
    title: fixture.title,
    domain: 'Physics',
    difficulty: fixture.difficulty,
    description: fixture.description,
    question: fixture.prompt,
    runtime: fixture.runtime,
    inputs: fixture.inputs,
    outputs: fixture.outputs,
    method: fixture.method,
    answer: 'Withheld from clients; graded server-side against a physics-derived reference.',
    criteria: fixture.criteria,
    dataset: fixture.dataset,
  };
}

export function resultToEvaluation(result: FixtureRunResult): Evaluation {
  const status: Evaluation['status'] = !result.ran
    ? 'Failed'
    : result.correct === true
      ? 'Success'
      : 'Partial';
  return {
    id: result.id,
    taskId: result.fixture_id,
    modelId: result.model,
    status,
    accuracy: result.correct === true ? 100 : 0,
    runtime: Number((result.execution_time_ms / 1000).toFixed(2)),
    codeLines: result.generated_code ? result.generated_code.split('\n').length : 0,
    date: new Date(result.created_at).toLocaleString(),
    failure: result.error ?? undefined,
  };
}

export function modelsFromResults(results: FixtureRunResult[]): Model[] {
  const names = [...new Set(results.map((item) => item.model).filter(Boolean))];
  const ids = names.length ? names : ['configured-agent'];
  return ids.map((id, index) => ({
    id,
    name: id,
    provider: id === 'stub-agent' ? 'Local stub' : 'LLM API',
    color: ['#57d4d9', '#b59afb', '#65dca1'][index % 3],
    accent: ['#163d45', '#32254f', '#173d30'][index % 3],
  }));
}

export function datasetsFromFixtures(fixtures: PublicFixture[]): Dataset[] {
  const unique = [...new Set(fixtures.map((item) => item.dataset))];
  return unique.map((name, index) => ({
    id: `ds-${index + 1}`,
    name,
    domain: 'Physics' as const,
    records: String(fixtures.filter((item) => item.dataset === name).length),
    source: 'Pinned constants in fixture input_data',
    license: 'Internal',
    version: 'v1',
    updated: new Date().toLocaleDateString(),
    description: name,
  }));
}

export function failuresFromResults(
  results: FixtureRunResult[],
  tasks: ScientificTask[],
): Failure[] {
  return results
    .filter((item) => item.ran === false || item.correct === false)
    .map((item) => {
      const task = tasks.find((entry) => entry.id === item.fixture_id);
      return {
        id: item.id,
        task: task?.title ?? item.fixture_id,
        model: item.model,
        type: item.ran === false ? 'Execution failure' : 'Incorrect answer',
        error: item.error ?? 'Unknown failure',
        severity: item.ran === false ? 'High' : 'Medium',
        resolution: item.ran === false
          ? 'Inspect stderr and sandbox timeout/crash flags.'
          : 'Inspect numeric delta vs reference tolerance.',
      } satisfies Failure;
    });
}

export function formatPct(rate: number | null): string {
  if (rate === null) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

export function comparisonFromSummary(summary: ResultsSummary, modelName: string) {
  const execution = summary.execution_success_rate;
  const accuracy = summary.accuracy_rate;
  const failure = execution === null ? null : 1 - execution;
  const score =
    execution === null || accuracy === null ? null : execution * 0.6 + accuracy * 0.4;
  return {
    model: modelName,
    tasks: summary.per_fixture.length || 5,
    execution: formatPct(execution),
    accuracy: formatPct(accuracy),
    runtime: summary.average_latency_ms === null
      ? '—'
      : `${(summary.average_latency_ms / 1000).toFixed(1)}s`,
    failure: formatPct(failure),
    score: score === null ? '—' : (score * 100).toFixed(1),
    reliability: execution === null ? 0 : execution * 100,
    accuracyNum: accuracy === null ? 0 : accuracy * 100,
  };
}
