# CURSOR AI — Tasks: SciVerify

- [ ] Choose the subdomain (`physics_sim` or `nasa_noaa_dataset`) and
      document the choice
- [ ] Write 5 fixtures with verified reference answers and tolerance rules
- [ ] Build the fixture store
- [ ] Build the agent runner (sends prompt + input data, receives code)
- [ ] Build sandboxed code execution (subprocess/container with timeout,
      captures stdout/stderr/exit code/time/output)
- [ ] Build the grader (separates "did it run" from "was it correct")
- [ ] Build the results aggregator with per-fixture and aggregate stats
- [ ] Implement `GET /fixtures`
- [ ] Implement `POST /fixtures/:id/run`
- [ ] Implement `GET /results`
- [ ] Implement `GET /results/summary`
- [ ] Inspect the existing Replit frontend's fetch calls / expected shapes
- [ ] Replace frontend mock data with real backend calls
- [ ] Configure CORS between Replit frontend and backend
- [ ] Add environment variable for backend URL (local vs. deployed)
- [ ] Prove the full pipeline end-to-end on fixture #1
- [ ] Run all 5 fixtures once the pipeline is proven
- [ ] Confirm error logging is clear enough to hand off to Antigravity
