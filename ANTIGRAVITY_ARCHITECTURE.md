# ANTIGRAVITY — Architecture: SciVerify

## Project Context

**SciVerify** is a Scientific Code-Execution Reliability Harness. It runs
an AI agent against a narrow scientific task (one subdomain: either basic
physics simulation or a public NASA/NOAA dataset task), captures the code
the agent generates, executes that code in a sandbox, and grades the
result against a known-correct reference answer across 5 task fixtures.

The core question the harness answers: **did the generated code even run,
and if it ran, was the answer correct?** This mirrors the reliability gap
called out in Stanford's 2026 AI Index — agents in this space fail to
execute correctly a majority of the time, so the harness itself needs to
be rock-solid or the whole measurement is meaningless.

## Ownership Split (context for your QA pass)

- **Frontend** — built separately in Replit. Not yours to redesign.
- **Cursor AI** — built the backend (fixture store, agent runner, sandboxed
  execution, grader, API endpoints) and did the integration with the
  Replit frontend.
- **Antigravity (you)** — bug-fixing and reliability QA on everything above.

## System Components You're Auditing

1. **Fixture store** — 5 fixtures, each with a prompt, subdomain,
   reference answer, tolerance rule, and input data.
2. **Agent runner** — sends the prompt to an LLM/agent, gets back
   generated code.
3. **Sandboxed execution** — runs the generated code isolated from the
   main process, captures stdout/stderr, exit code, timing, and output.
4. **Grader** — compares output to the reference answer using the
   tolerance rule, producing `{ ran, correct, error, output, latency_ms }`.
5. **Results API** — surfaces per-fixture and aggregate results
   (execution-success rate, accuracy rate) to the frontend.

## Data Flow (for tracing bugs)

```
Frontend (Replit) → POST /fixtures/:id/run
   → Agent runner → generated code
   → Sandboxed execution → stdout/exit code/output/crash info
   → Grader → { ran, correct, error, output, latency_ms }
   → Results store → GET /results, GET /results/summary
   → Frontend renders result
```

Use this flow to localize where a bug is introduced — most integration
issues will surface either at the sandbox → grader handoff, or the
results API → frontend handoff.
