import { Router, type IRouter } from "express";
import { getResult, listResults, summarizeResults } from "../harness/store";

const router: IRouter = Router();

router.get("/results/summary", (_req, res) => {
  res.json(summarizeResults());
});

router.get("/results/:id", (req, res) => {
  const result = getResult(req.params.id);
  if (!result) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  res.json(result);
});

router.get("/results", (_req, res) => {
  res.json(listResults());
});

export default router;
