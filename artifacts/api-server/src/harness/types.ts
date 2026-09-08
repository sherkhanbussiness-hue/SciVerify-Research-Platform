export const SUBDOMAIN = "physics_sim" as const;
export type Subdomain = typeof SUBDOMAIN;

export interface ToleranceRule {
  type: "absolute" | "relative";
  value: number;
}

export interface Fixture {
  id: string;
  prompt: string;
  subdomain: Subdomain;
  reference_answer: number;
  tolerance: ToleranceRule;
  input_data: Record<string, number | string>;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  runtime: string;
  inputs: string[];
  outputs: string[];
  method: string;
  criteria: string[];
  dataset: string;
  stub_code: string;
}

export interface PublicFixture {
  id: string;
  prompt: string;
  subdomain: Subdomain;
  title: string;
  description: string;
  difficulty: Fixture["difficulty"];
  runtime: string;
  inputs: string[];
  outputs: string[];
  method: string;
  criteria: string[];
  dataset: string;
}

export interface SandboxCapture {
  stdout: string;
  stderr: string;
  exit_code: number | null;
  execution_time_ms: number;
  timed_out: boolean;
  crashed: boolean;
  parsed_output: unknown;
}

export interface FixtureRunResult {
  id: string;
  fixture_id: string;
  subdomain: Subdomain;
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
  /** Which provider produced the code (e.g. "openai", "groq", "stub-agent"). Optional for backward compat with old stored results. */
  provider?: string;
  /** Number of retries attempted after the initial attempt (0 = first attempt succeeded or failed with no retry). */
  retry_count?: number;
  /** Whether the very first attempt (before any retry) produced a correct answer. */
  first_attempt_correct?: boolean | null;
  /** Whether the final attempt (after all retries) produced a correct answer. Mirrors `correct` for convenience. */
  final_correct?: boolean | null;
  /** Self-reported confidence score from the agent (0–100). Present only when the agent includes a "confidence" key in its JSON output. */
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

export function toPublicFixture(fixture: Fixture): PublicFixture {
  return {
    id: fixture.id,
    prompt: fixture.prompt,
    subdomain: fixture.subdomain,
    title: fixture.title,
    description: fixture.description,
    difficulty: fixture.difficulty,
    runtime: fixture.runtime,
    inputs: fixture.inputs,
    outputs: fixture.outputs,
    method: fixture.method,
    criteria: fixture.criteria,
    dataset: fixture.dataset,
  };
}
