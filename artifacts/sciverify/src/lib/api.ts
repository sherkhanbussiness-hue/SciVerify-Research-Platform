export type Domain = 'Physics' | 'Earth Science' | 'Astronomy' | 'Climate' | 'Data Analysis';
export type RunStatus = 'Success' | 'Failed' | 'Partial';

export interface PublicFixture {
  id: string;
  prompt: string;
  subdomain: 'physics_sim';
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  runtime: string;
  inputs: string[];
  outputs: string[];
  method: string;
  criteria: string[];
  dataset: string;
}

export interface FixtureRunResult {
  id: string;
  fixture_id: string;
  subdomain: 'physics_sim';
  ran: boolean;
  correct: boolean | null;
  error: string | null;
  output: unknown;
  latency_ms: number;
  generated_code: string | null;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  timed_out: boolean;
  crashed: boolean;
  execution_time_ms: number;
  created_at: string;
  model: string;
  /** Which provider produced the code (e.g. "openai", "groq", "stub-agent"). */
  provider?: string;
  /** Number of retries performed after the initial attempt (0 = no retries). */
  retry_count?: number;
  /** Whether the first attempt was correct before any retry. */
  first_attempt_correct?: boolean | null;
  /** Whether the final attempt was correct. Mirrors `correct`. */
  final_correct?: boolean | null;
  /** Self-reported confidence score from the agent (0–100). */
  self_reported_confidence?: number;
  /** Whether retrieval-grounded generation was used for this run. */
  retrieval_used?: boolean;
  /** List of retrieved context snippets injected into the prompt. */
  retrieved_context?: string[];
}

export interface ResultsSummary {
  total_runs: number;
  execution_success_rate: number | null;
  accuracy_rate: number | null;
  average_latency_ms: number | null;
  per_fixture: Array<{
    fixture_id: string;
    runs: number;
    execution_success_rate: number | null;
    accuracy_rate: number | null;
    average_latency_ms: number | null;
  }>;
}

export interface CalibrationBucket {
  label: string;
  min: number;
  max: number;
  midpoint: number;
  count: number;
  correct_count: number;
  actual_accuracy: number | null;
  ideal_accuracy: number;
}

export interface CalibrationReport {
  total_with_confidence: number;
  total_without_confidence: number;
  buckets: CalibrationBucket[];
}

const API_BASE = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function fetchFixtures() {
  return apiFetch<PublicFixture[]>('/api/fixtures');
}

export function fetchFixture(id: string) {
  return apiFetch<PublicFixture>(`/api/fixtures/${encodeURIComponent(id)}`);
}

export function runFixture(id: string) {
  return apiFetch<FixtureRunResult>(`/api/fixtures/${encodeURIComponent(id)}/run`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function fetchResults() {
  return apiFetch<FixtureRunResult[]>('/api/results');
}

export function fetchResult(id: string) {
  return apiFetch<FixtureRunResult>(`/api/results/${encodeURIComponent(id)}`);
}

export function fetchSummary() {
  return apiFetch<ResultsSummary>('/api/results/summary');
}

export function fetchCalibration() {
  return apiFetch<CalibrationReport>('/api/metrics/calibration');
}

export interface DatasetRecord {
  id: string;
  name: string;
  domain: Domain;
  records: string;
  source: string;
  license: string;
  version: string;
  updated: string;
  description: string;
  taskId?: string;
}

export function fetchDatasets() {
  return apiFetch<DatasetRecord[]>('/api/datasets');
}

export function createDataset(payload: {
  name: string;
  domain?: Domain;
  records?: string;
  source?: string;
  license?: string;
  version?: string;
  description?: string;
  taskId?: string;
}) {
  return apiFetch<DatasetRecord>('/api/datasets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function attachDatasetToTask(taskId: string, datasetName: string) {
  return apiFetch<{ success: boolean; taskId: string; dataset: string }>(
    `/api/tasks/${encodeURIComponent(taskId)}/dataset`,
    {
      method: 'POST',
      body: JSON.stringify({ datasetName }),
    }
  );
}
