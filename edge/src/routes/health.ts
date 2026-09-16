import { Router } from "express";
import { BrainClient } from "../clients/brainClient.js";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    service: "namami-edge",
    data_mode: process.env.DATA_MODE || "FIXTURE",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/readyz", async (req, res) => {
  try {
    const brainStatus = await BrainClient.checkHealth();
    res.json({
      status: "ready",
      edge: "ok",
      brain: brainStatus.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "brain unreachable";
    res.status(503).json({
      status: "not_ready",
      edge: "ok",
      brain: "degraded",
      error: message,
    });
  }
});

healthRouter.get("/metrics", (_req, res) => {
  res.json({
    uptime_seconds: process.uptime(),
    memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});
