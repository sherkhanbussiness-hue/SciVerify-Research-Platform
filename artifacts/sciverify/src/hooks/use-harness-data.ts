import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchFixture,
  fetchFixtures,
  fetchResult,
  fetchResults,
  fetchSummary,
  fetchDatasets,
  createDataset,
  attachDatasetToTask,
  runFixture,
  type FixtureRunResult,
  type PublicFixture,
  type ResultsSummary,
  type DatasetRecord,
} from '@/lib/api';
import {
  datasetsFromFixtures,
  failuresFromResults,
  fixtureToTask,
  modelsFromResults,
  resultToEvaluation,
} from '@/lib/harness-map';
import { tasks as fallbackTasks, datasets as fallbackMockDatasets } from '@/lib/mock-data';

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

export function useDatasetsQuery() {
  return useQuery({
    queryKey: ['datasets'],
    queryFn: fetchDatasets,
  });
}

export function useCreateDatasetMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createDataset,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['datasets'] });
      void client.invalidateQueries({ queryKey: ['fixtures'] });
    },
  });
}

export function useAttachDatasetMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, datasetName }: { taskId: string; datasetName: string }) =>
      attachDatasetToTask(taskId, datasetName),
    onSuccess: (_data, variables) => {
      void client.invalidateQueries({ queryKey: ['fixtures'] });
      void client.invalidateQueries({ queryKey: ['fixtures', variables.taskId] });
      void client.invalidateQueries({ queryKey: ['datasets'] });
    },
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
  const datasetsQuery = useDatasetsQuery();

  const rawFixtures: PublicFixture[] = fixturesQuery.data ?? [];
  const results: FixtureRunResult[] = resultsQuery.data ?? [];
  const summary: ResultsSummary | undefined = summaryQuery.data;

  // Resilient task mapping: if fixtures have loaded use them, otherwise provide seeded tasks
  const tasks = rawFixtures.length > 0 ? rawFixtures.map(fixtureToTask) : (fixturesQuery.isError ? fallbackTasks : []);
  const evaluations = results.map(resultToEvaluation);
  const models = modelsFromResults(results);

  // Combine datasets from dedicated endpoint, fixtures, and fallback seeds
  const backendDatasets = datasetsQuery.data ?? [];
  const fixtureDatasets = datasetsFromFixtures(rawFixtures);

  const mergedDatasetsMap = new Map<string, DatasetRecord>();
  // 1. Seed fallbacks
  for (const ds of fallbackMockDatasets) {
    mergedDatasetsMap.set(ds.name.toLowerCase(), ds as DatasetRecord);
  }
  // 2. Fixture-extracted datasets
  for (const ds of fixtureDatasets) {
    mergedDatasetsMap.set(ds.name.toLowerCase(), ds as DatasetRecord);
  }
  // 3. Dedicated backend datasets (authoritative)
  for (const ds of backendDatasets) {
    mergedDatasetsMap.set(ds.name.toLowerCase(), ds);
  }

  const datasets = Array.from(mergedDatasetsMap.values());
  const failures = failuresFromResults(results, tasks);

  const isLoading = fixturesQuery.isLoading;
  const error = fixturesQuery.error ?? null;

  return {
    fixtures: rawFixtures,
    results,
    summary,
    tasks: tasks.length > 0 ? tasks : (fixturesQuery.isLoading ? [] : fallbackTasks),
    evaluations,
    models,
    datasets,
    failures,
    isLoading,
    error,
  };
}
