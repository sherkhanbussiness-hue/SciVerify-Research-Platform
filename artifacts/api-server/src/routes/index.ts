import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fixturesRouter from "./fixtures";
import resultsRouter from "./results";
import simulationRouter from "./simulation";
import metricsRouter from "./metrics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fixturesRouter);
router.use(resultsRouter);
router.use(simulationRouter);
router.use(metricsRouter);

export default router;
