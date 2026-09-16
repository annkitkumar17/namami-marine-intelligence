import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { AskRequestSchema } from "./schemas/contracts.js";
import { BrainClient } from "./clients/brainClient.js";
import { encodeNavIC25Byte, decodeNavIC25Byte } from "./navic/wire.js";

function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const started = Date.now();
  res.on("finish", () => {
    console.info(
      JSON.stringify({
        msg: "request",
        service: "namami-edge",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: Date.now() - started,
      })
    );
  });
  next();
}

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);
  app.use("/", healthRouter);

  app.post("/v1/ask", async (req: Request, res: Response) => {
    try {
      const validatedRequest = AskRequestSchema.parse(req.body);
      const advisory = await BrainClient.askAdvisory(validatedRequest);
      res.json(advisory);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: "Validation or Brain Service error", details: message });
    }
  });

  app.get("/v1/navic/outbox", (_req: Request, res: Response) => {
    const packetHex = encodeNavIC25Byte(9.28, 79.12, "GO", 0.8, 12.0, 0);
    const decoded = decodeNavIC25Byte(packetHex);
    res.json({
      raw_hex: packetHex,
      byte_count: 25,
      simulation: true,
      demo_label: "SIMULATED NavIC 25-byte packet",
      decoded,
    });
  });

  return app;
}
