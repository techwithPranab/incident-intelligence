import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
describe("API foundation", () => {
  const app = createApp();
  it("reports liveness", async () => { const result = await request(app).get("/api/v1/health"); expect(result.status).toBe(200); expect(result.body.status).toBe("ok"); });
  it("reports dependency readiness separately", async () => { const result = await request(app).get("/api/v1/ready"); expect(result.status).toBe(503); expect(result.body.dependencies.mongodb).toBe("down"); });
  it("protects authenticated endpoints", async () => { const result = await request(app).get("/api/v1/me"); expect(result.status).toBe(401); });
  it("protects incident and analytics endpoints", async () => { expect((await request(app).get("/api/v1/incidents")).status).toBe(401); expect((await request(app).get("/api/v1/analytics/overview")).status).toBe(401); });
  it("protects assistant and feedback endpoints", async () => { expect((await request(app).post("/api/v1/ai/chat").send({ message: "Show critical incidents" })).status).toBe(401); expect((await request(app).post("/api/v1/ai/feedback").send({ messageId: "x", rating: "positive" })).status).toBe(401); });
  it("validates incident filters before database access", async () => {
    const token = jwt.sign({ email: "analyst@example.com", roles: ["analyst"] }, env.JWT_SECRET, { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, subject: "507f1f77bcf86cd799439011", expiresIn: "5m" });
    const result = await request(app).get("/api/v1/incidents?priority=9").set("authorization", `Bearer ${token}`); expect(result.status).toBe(400); expect(result.body.error.code).toBe("VALIDATION_ERROR");
  });
  it("fails closed when AI is not configured", async () => {
    const token = jwt.sign({ email: "analyst@example.com", roles: ["analyst"] }, env.JWT_SECRET, { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, subject: "507f1f77bcf86cd799439011", expiresIn: "5m" });
    const result = await request(app).post("/api/v1/ai/classify").set("authorization", `Bearer ${token}`).send({ description: "Remote employees cannot establish a VPN connection." });
    expect(result.status).toBe(503); expect(result.body.error.code).toBe("AI_PROVIDER_DISABLED");
  });
});
