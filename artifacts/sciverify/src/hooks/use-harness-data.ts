import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchFixture,
  fetchFixtures,
  fetchResult,
  fetchResults,
  fetchSummary,
  runFixture,
  type FixtureRunResult,
  type PublicFixture,
  type ResultsSummary,
} from '@/lib/api';
import {
  datasetsFromFixtures,
  failuresFromResults,
  fixtureToTask,
  modelsFromResults,
  resultToEvaluation,
} from '@/lib/harness-map';

export function useFixturesQuery() {
  return useQuery({
    queryKey: ['fixtures'],
    queryFn: fetchFixtures,
  });
}

export function useFixtureQuery(id: string) {
  return useQuery({
    queryKey: ['fixtures', id],
    queryFn: () => fetchFixture(id),
    enabled: Boolean(id),
  });
}

export function useResultsQuery() {
  return useQuery({
    queryKey: ['results'],
    queryFn: fetchResults,
  });
}

export function useResultQuery(id: string) {
  return useQuery({
    queryKey: ['results', id],
    queryFn: () => fetchResult(id),
    enabled: Boolean(id),
  });
}

export function useSummaryQuery() {
  return useQuery({
    queryKey: ['results-summary'],
    queryFn: fetchSummary,
  });
}

export function useRunFixtureMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runFixture(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['results'] });
      void client.invalidateQueries({ queryKey: ['results-summary'] });
    },
  });
}

export function useHarnessView() {
  const fixturesQuery = useFixturesQuery();
  const resultsQuery = useResultsQuery();
  const summaryQuery = useSummaryQuery();

  const fixtures: PublicFixture[] = fixturesQuery.data ?? [];
  const results: FixtureRunResult[] = resultsQuery.data ?? [];
  const summary: ResultsSummary | undefined = summaryQuery.data;

  const tasks = fixtures.map(fixtureToTask);
  const evaluations = results.map(resultToEvaluation);
  const models = modelsFromResults(results);
  const datasets = datasetsFromFixtures(fixtures);
  const failures = failuresFromResults(results, tasks);

  const isLoading = fixturesQuery.isLoading || resultsQuery.isLoading || summaryQuery.isLoading;
  const error =
    fixturesQuery.error ?? resultsQuery.error ?? summaryQuery.error ?? null;

  return {
    fixtures,
    results,
    summary,
    tasks,
    evaluations,
    models,
    datasets,
    failures,
    isLoading,
    error,
  };
}
