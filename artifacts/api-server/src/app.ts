import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const corsOrigin = process.env["CORS_ORIGIN"];
app.use(
  cors({
    origin: corsOrigin
      ? corsOrigin.split(",").map((value) => value.trim()).filter(Boolean)
      : true,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Defensive JSON syntax error handler to prevent HTML stack trace leakage
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    res.status(400).json({
      error: "Malformed JSON payload",
      message: "The request body contains invalid JSON syntax.",
    });
    return;
  }
  next(err);
});

app.use("/api", router);
app.use(router);

// Global 404 handler for unknown API routes
app.use("/api", (_req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handling middleware to prevent stack trace or server path leaks
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled server error");
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env["NODE_ENV"] === "production"
        ? "An unexpected error occurred."
        : err instanceof Error
          ? err.message
          : "Unknown error",
  });
});

export default app;
