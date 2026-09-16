import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("edge health endpoints", () => {
  const app = createApp();

  it("returns liveness on /healthz", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("namami-edge");
  });

  it("returns metrics on /metrics", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(typeof res.body.uptime_seconds).toBe("number");
  });
});
