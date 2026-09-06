# ANTIGRAVITY — Rules: SciVerify (Continuation Build)

## Context: Why this changed

Cursor AI completed Phase 0 (reading docs) and Phase 1 (investigating the
existing frontend codebase), then stopped due to hitting a usage limit
before any backend code was written. Antigravity is now picking up
construction from Phase 2 onward — not doing pure QA on someone else's
finished work, since there isn't finished work yet.

This means Antigravity is temporarily wearing two hats: builder AND its
own QA. Both matter — don't skip verification just because you're also
the one who wrote the code.

## Do

- First, ask to see Cursor's Phase 1 investigation output (the summary of
  mock data locations, existing API client setup, .env.example variables,
  monorepo structure). If it's not available, redo that investigation
  yourself before writing any backend code — do not build blind.
- Build the backend exactly as specified in ANTIGRAVITY_ARCHITECTURE.md:
  fixture store, agent runner, sandboxed execution, grader, results
  aggregator, and the 4 API endpoints.
- Replace every mock/placeholder data call in the frontend with a real
  call to the backend you build. Do not change frontend styling, layout,
  or component structure — only the data layer.
- Handle CORS between frontend and backend.
- Use environment variables for all secrets and config (LLM API key,
  database URL, backend base URL). Never hardcode them. Add any new
  variable you introduce to .env.example as a blank placeholder with a
  one-line comment.
- Always execute agent-generated code in a sandbox (subprocess with
  timeout, or container) — never in the main process.
- Compute or source every reference answer from real ground truth. Never
  fabricate one.
- Keep "did it run" and "was it correct" as two separate signals in every
  result — never conflate a crash with an incorrect answer.
- Once the backend and integration are built, run your own QA pass on it:
  test timeouts, crashes, malformed output, numeric edge cases (NaN,
  infinity), and resource leaks across repeated runs, exactly as a
  separate QA pass would.
- Log every failure clearly and distinctly. Keep a short build/bug-fix log
  of what you built, what broke, and what you changed.
- Work through ANTIGRAVITY_TASKS.md in order and report progress after
  each major item — don't silently batch everything into one giant diff.

## Don't

- Don't assume Cursor's investigation was complete or correct — verify
  key claims yourself (mock data locations, .env.example contents)
  before relying on them.
- Don't expand scope beyond one subdomain and 5 fixtures.
- Don't skip sandboxing for code execution, even to move faster.
- Don't mark a task complete without actually testing it and telling me
  what you tested and what the result was.
- Don't touch frontend visual design or component structure.

## Ownership Boundary (for this continuation)

- **You own, for now:** everything from Phase 2 onward — backend
  construction, frontend integration, and verification/QA of your own
  work, since Cursor did not complete the build.
- **Still off-limits:** frontend visual design (Replit-built), and
  expanding scope beyond the original one-subdomain, 5-fixture plan.
