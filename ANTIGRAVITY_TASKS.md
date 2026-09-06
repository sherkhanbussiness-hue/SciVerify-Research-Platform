# ANTIGRAVITY — Tasks: SciVerify (Continuation Build)

## Phase A — Confirm/redo the investigation Cursor started

- [x] Get Cursor's Phase 1 investigation output if it exists (ask the user
      to paste it in); otherwise redo this investigation yourself
- [x] Confirm which subdomain is specified (physics_sim or
      nasa_noaa_dataset) from ANTIGRAVITY_ARCHITECTURE.md
- [x] Identify every page/component currently rendering mock/placeholder
      data, with exact file paths
- [x] Identify any existing API client/fetch wrapper, even if pointed at
      fake data
- [x] List every variable in .env.example and what it's for
- [x] Confirm the monorepo structure (pnpm workspaces) and whether a
      backend/api-server folder already exists (check under artifacts/)

## Phase B — Build the backend

- [x] Write 5 fixtures with verified reference answers and tolerance rules
- [x] Build the fixture store
- [x] Build the agent runner (sends prompt + input data to an LLM,
      receives generated code) — add an env var placeholder for the LLM
      API key if one doesn't already exist
- [x] Build sandboxed code execution (subprocess/container with timeout;
      captures stdout/stderr/exit code/time/output)
- [x] Build the grader, producing
      { ran, correct, error, output, latency_ms } per fixture
- [x] Build the results aggregator (per-fixture + aggregate stats)
- [x] Implement GET /fixtures
- [x] Implement POST /fixtures/:id/run
- [x] Implement GET /results
- [x] Implement GET /results/summary

## Phase C — Integrate with the existing frontend

- [x] Replace all mock/placeholder data calls with real backend calls
- [x] Configure CORS between frontend and backend
- [x] Add an environment variable for the backend base URL
- [x] Reuse the frontend's existing loading/error UI pattern for real
      API calls, if one exists

## Phase D — Security & config hygiene

- [x] Confirm no secrets are hardcoded anywhere in new code
- [x] Add any new env variables to .env.example as blank placeholders
      with a one-line comment
- [x] Confirm .gitignore still excludes .env, node_modules, build
      artifacts, and local db files

## Phase E — Verification (your own QA pass)

- [x] Prove the full pipeline end-to-end on fixture #1; show the actual
      result object before running the rest
- [x] Run all 5 fixtures; show the aggregate summary output
- [x] Test sandbox behavior on: timeout, crash, no output, malformed
      output, filesystem/network access attempt
- [x] Confirm none of the above take down the backend process
- [x] Check for resource leaks across repeated runs
- [x] Test numeric edge cases: NaN, infinity, negative zero, extreme floats
- [x] Confirm the app builds and starts cleanly (frontend + backend) with
      no new console errors
- [x] Write a short build/bug-fix log: what was built, what broke, what
      was changed

