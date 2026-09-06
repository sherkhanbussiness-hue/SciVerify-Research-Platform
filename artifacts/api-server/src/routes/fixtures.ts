import { Router, type IRouter } from "express";
import { listFixtures, getFixture } from "../harness/fixtures";
import { runFixtureById } from "../harness/pipeline";
import { toPublicFixture } from "../harness/types";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/fixtures", (_req, res) => {
  res.json(listFixtures().map(toPublicFixture));
});

router.get("/fixtures/:id", (req, res) => {
  const fixture = getFixture(req.params.id);
  if (!fixture) {
    res.status(404).json({ error: "Fixture not found" });
    return;
  }
  res.json(toPublicFixture(fixture));
});

router.post("/fixtures/:id/run", async (req, res) => {
  try {
    const result = await runFixtureById(req.params.id);
    res.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, fixture_id: req.params.id }, "POST /fixtures/:id/run failed");
    res.status(status).json({ error: message });
  }
});

export default router;
