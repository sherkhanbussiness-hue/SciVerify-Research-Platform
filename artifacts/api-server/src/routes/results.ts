import { Router, type IRouter } from "express";
import { getResult, listResults, summarizeResults } from "../harness/store";
import { sanitizeString } from "../lib/sanitize";

const router: IRouter = Router();

router.get("/results/summary", (_req, res) => {
  try {
    res.json(summarizeResults());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to summarize results";
    res.status(500).json({ error: "Internal server error", message: sanitizeString(message) });
  }
});

router.get("/results/:id", (req, res) => {
  try {
    const result = getResult(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Result not found" });
      return;
    }
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get result";
    res.status(500).json({ error: "Internal server error", message: sanitizeString(message) });
  }
});

router.get("/results", (_req, res) => {
  try {
    res.json(listResults());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list results";
    res.status(500).json({ error: "Internal server error", message: sanitizeString(message) });
  }
});

export default router;
