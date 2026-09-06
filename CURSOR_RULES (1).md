# CURSOR AI — Rules: SciVerify

## Do

- Treat the Replit frontend as fixed. Inspect its existing code (routes it
  calls, expected response shapes, any mock data it was built against)
  before writing your API — match your contract to what it already expects
  wherever reasonable, rather than forcing frontend changes.
- Replace any mock-data calls in the frontend with real fetches to your
  backend, but keep component structure and styling untouched.
- Handle CORS properly between the Replit-hosted frontend and your backend.
- Add environment variable configuration for the backend URL so the
  frontend can point at local vs. deployed backend without code changes.
- Always execute agent-generated code in a sandbox (subprocess with
  timeout, or container) — never in the main process.
- Compute or source every reference answer from real ground truth (actual
  physics equations or actual NASA/NOAA dataset values). Never fabricate one.
- Log errors and failures clearly and distinctly (execution failure vs.
  incorrect answer) — Antigravity's bug-fixing pass depends on this.

## Don't

- Don't redesign frontend components, restyle anything, or add new
  pages/screens beyond what the backend genuinely requires (e.g. a
  "running..." state) — and even then, check if the frontend already has a
  loading pattern to reuse before adding a new one.
- Don't expand scope to multiple subdomains or extra task types. One
  subdomain, 5 fixtures — ship that first.
- Don't skip sandboxing for code execution, even for a quick demo.
- Don't do Antigravity's job — don't spend cycles on exhaustive edge-case
  hardening or QA sweeps; get the harness working end-to-end and hand off
  clean, logged failure modes for them to dig into.

## Ownership Boundary

- **You own:** backend logic, API, sandboxed execution, grading, and the
  integration glue connecting the existing Replit frontend to real data.
- **You do not own:** frontend visual design/structure (Replit), or
  bug-fixing/QA passes (Antigravity).
