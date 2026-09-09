import { Router, type Request, type Response, type IRouter } from "express";
import { simulateStar, type StarParams } from "../simulation/star";
import { simulatePulsar, type PulsarParams } from "../simulation/pulsar";
import { simulateAsteroid, type AsteroidParams } from "../simulation/asteroid";
import { simulateBlackHole, type BlackHoleParams } from "../simulation/blackhole";
import { simulateQuasar, type QuasarParams } from "../simulation/quasar";
import { runSandboxed } from "../harness/sandbox";
import { validateScriptSecurity } from "../harness/security";

const simulationRouter: IRouter = Router();

// POST /api/simulation/star
simulationRouter.post("/simulation/star", (req: Request, res: Response) => {
  try {
    const params = req.body as StarParams;
    const result = simulateStar(params);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid star simulation parameters";
    res.status(400).json({ error: "Invalid simulation parameters", message });
  }
});

// POST /api/simulation/pulsar
simulationRouter.post("/simulation/pulsar", (req: Request, res: Response) => {
  try {
    const params = req.body as PulsarParams;
    const result = simulatePulsar(params);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid pulsar simulation parameters";
    res.status(400).json({ error: "Invalid simulation parameters", message });
  }
});

// POST /api/simulation/asteroid
simulationRouter.post("/simulation/asteroid", (req: Request, res: Response) => {
  try {
    const params = req.body as AsteroidParams;
    const result = simulateAsteroid(params);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid asteroid simulation parameters";
    res.status(400).json({ error: "Invalid simulation parameters", message });
  }
});

// POST /api/simulation/blackhole
simulationRouter.post("/simulation/blackhole", (req: Request, res: Response) => {
  try {
    const params = req.body as BlackHoleParams;
    const result = simulateBlackHole(params);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid black hole simulation parameters";
    res.status(400).json({ error: "Invalid simulation parameters", message });
  }
});

// POST /api/simulation/quasar
simulationRouter.post("/simulation/quasar", (req: Request, res: Response) => {
  try {
    const params = req.body as QuasarParams;
    const result = simulateQuasar(params);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid quasar simulation parameters";
    res.status(400).json({ error: "Invalid simulation parameters", message });
  }
});

// POST /api/simulation/verify
simulationRouter.post("/simulation/verify", async (req: Request, res: Response) => {
  try {
    const { script, expected_value, tolerance } = req.body as {
      script: string;
      expected_value?: number;
      tolerance?: number;
    };

    if (!script || typeof script !== "string") {
      res.status(400).json({ error: "A valid python script string is required for sandbox verification." });
      return;
    }

    const securityCheck = validateScriptSecurity(script);
    if (!securityCheck.valid) {
      res.status(400).json({
        error: "Script security violation",
        message: securityCheck.reason,
      });
      return;
    }

    // Execute in the isolated subprocess sandbox
    const capture = await runSandboxed(script, 5000);

    let parsedOutput: Record<string, unknown> | null = null;
    let numericValue: number | null = null;
    let isCorrect = false;

    if (!capture.crashed && capture.stdout) {
      try {
        // Find last non-empty line
        const lines = capture.stdout.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const lastLine = lines[lines.length - 1];
        parsedOutput = JSON.parse(lastLine) as Record<string, unknown>;
        if (parsedOutput && typeof parsedOutput.value === "number" && Number.isFinite(parsedOutput.value)) {
          numericValue = parsedOutput.value;
          if (typeof expected_value === "number" && Number.isFinite(expected_value)) {
            const tol =
              typeof tolerance === "number" && Number.isFinite(tolerance) && tolerance >= 0
                ? tolerance
                : 0.05 * Math.abs(expected_value);
            isCorrect = Math.abs(numericValue - expected_value) <= tol;
          } else {
            isCorrect = true;
          }
        }
      } catch {
        // Output not JSON
      }
    }

    res.json({
      ran: !capture.crashed && capture.exit_code === 0,
      correct: isCorrect,
      crashed: capture.crashed,
      timed_out: capture.timed_out,
      exit_code: capture.exit_code,
      execution_time_ms: capture.execution_time_ms,
      parsed_output: parsedOutput,
      numeric_value: numericValue,
      stdout: capture.stdout,
      stderr: capture.stderr,
      status: !capture.crashed && capture.exit_code === 0 ? "VERIFIED_IN_SANDBOX" : "EXECUTION_FAILED",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sandbox verification error";
    res.status(500).json({ error: "Sandbox error", message });
  }
});

export default simulationRouter;
