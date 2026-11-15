import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { isDatabaseReady } from "./db/connection.js";
import { authRouter } from "./routes/auth.js";
import { syncRouter } from "./routes/sync.js";
import { incidentsRouter } from "./routes/incidents.js";
import { analyticsRouter } from "./routes/analytics.js";
import { aiRouter } from "./routes/ai.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { authenticate } from "./middleware/auth.js";

export function createApp() {
  const app = express(); app.disable("x-powered-by"); app.set("trust proxy", 1);
  app.use(pinoHttp({ logger, genReqId: (req: IncomingMessage, res: ServerResponse) => { const id = req.headers["x-request-id"]?.toString() ?? crypto.randomUUID(); res.setHeader("x-request-id", id); return id; } }));
  app.use(helmet()); app.use(cors({ origin: (origin, cb) => !origin || env.corsOrigins.includes(origin) ? cb(null, true) : cb(new Error("Origin not allowed")), credentials: true }));
  app.use(compression()); app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));
  app.get("/api/v1/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  app.get("/api/v1/ready", (_req, res) => res.status(isDatabaseReady() ? 200 : 503).json({ status: isDatabaseReady() ? "ready" : "not_ready", dependencies: { mongodb: isDatabaseReady() ? "up" : "down" } }));
  app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60_000, limit: 10 }), authRouter);
  app.use("/api/v1/sync", syncRouter);
  app.use("/api/v1/incidents", incidentsRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/ai", aiRouter);
  app.get("/api/v1/me", authenticate, (req, res) => res.json({ user: req.auth }));
  app.use(notFound); app.use(errorHandler); return app;
}
