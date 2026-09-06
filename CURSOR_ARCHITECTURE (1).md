# CURSOR AI — Architecture: SciVerify

## Project Context

**SciVerify** is a Scientific Code-Execution Reliability Harness.

The problem it addresses: AI-for-science agents are hyped far beyond their
actual reliability. On the UnivEarth benchmark, agents answer science
questions with only ~33% accuracy, and their generated code fails to
execute ~58% of the time. SciVerify measures this directly: give an AI
agent a narrow scientific task, let it generate code, execute that code in
a controlled environment, and compare the output against a known-correct
reference answer.

**v1 scope:** one subdomain only (basic physics simulation OR a public
NASA/NOAA dataset task — pick one, don't mix), 5 task fixtures each with a
known-correct reference answer, one agent run proven end-to-end on fixture
#1 before scaling to all 5.

**Ownership split:**
- **Frontend** — already built separately in Replit. Not yours to redesign.
- **Cursor AI (you)** — backend + integrating the existing Replit frontend
  with it.
- **Antigravity** — bug-fixing/QA on top of what you build (see their own
  docs — don't duplicate that work here).

---

## System Components

1. **Fixture store** — 5 task fixtures, each with:
   - `id`
   - `prompt` (the scientific task given to the agent, in plain language)
   - `subdomain` (`physics_sim` or `nasa_noaa_dataset`)
   - `reference_answer` (the known-correct value/output)
   - `tolerance` (numeric tolerance or comparison rule for grading —
     scientific answers are rarely exact string matches)
   - `input_data` (dataset path, initial conditions, constants, etc.)

2. **Agent runner** — sends a fixture's `prompt` (+ relevant input data) to
   an LLM/agent, receives back generated code (assume Python unless told
   otherwise).

3. **Sandboxed code execution** — executes the agent-generated code in an
   isolated environment (subprocess with timeout, or a container/sandbox —
   never execute untrusted code directly in the main process). Captures:
   - stdout/stderr
   - exit code
   - execution time
   - whether it crashed, timed out, or completed
   - the final numeric/text output it produced (if any)

4. **Grader** — compares the executed output against `reference_answer`
   using the fixture's `tolerance` rule. Produces a per-fixture result:
   `{ ran: bool, correct: bool|null, error: string|null, output: any, latency_ms: number }`

5. **Results aggregator / API** — exposes results across all fixture runs
   so the frontend can display:
   - per-fixture pass/fail on "did it run"
   - per-fixture pass/fail on "was it correct"
   - aggregate execution-success rate and accuracy rate (the two headline
     numbers, mirroring the 33% / 58%-failure framing from UnivEarth)

## API Contract

- `GET /fixtures` — list the 5 fixtures (prompt + subdomain, not the answer)
- `POST /fixtures/:id/run` — trigger an agent attempt + execution + grading
  for one fixture, return the full result object
- `GET /results` — return all stored results (for a results dashboard/table)
- `GET /results/summary` — return aggregate stats (execution rate, accuracy
  rate, average latency)

Adjust exact names/shapes to match what the Replit frontend's fetch calls
already expect — check its code before finalizing this contract.

## Data Flow

```
Frontend (Replit)
   │  POST /fixtures/:id/run
   ▼
API layer
   │  loads fixture
   ▼
Agent runner  ──▶ generated code
   │
   ▼
Sandboxed execution ──▶ stdout / exit code / output / crash info
   │
   ▼
Grader ──▶ { ran, correct, error, output, latency_ms }
   │
   ▼
Results store ──▶ GET /results, GET /results/summary
   │
   ▼
Frontend renders result
```
