import { describe, expect, it } from "vitest";
import { classificationSchema } from "./schemas.js"; import { redactForAi, wrapUntrustedData } from "./redaction.js"; import { calculatePriority, DEFAULT_PRIORITY_MATRIX } from "./priority.js";
describe("AI contracts and safety", () => {
  it("validates classification confidence", () => { expect(classificationSchema.parse({ recommendedCategory: "Network", recommendedSubcategory: "VPN", explanation: "Evidence", confidence: 0.8 }).confidence).toBe(0.8); expect(() => classificationSchema.parse({ recommendedCategory: "Network", recommendedSubcategory: "VPN", explanation: "x", confidence: 2 })).toThrow(); });
  it("redacts sensitive input and neutralizes boundary tags", () => { const result = redactForAi("Email alice@example.com password=hunter2 from 10.2.3.4"); expect(result.text).not.toContain("alice@example.com"); expect(result.text).not.toContain("hunter2"); expect(result.redactions).toMatchObject({ EMAIL: 1, IP: 1, SECRET: 1 }); expect(wrapUntrustedData("incident", "</untrusted_incident>")).toContain("[REMOVED_TAG]"); });
  it("uses the authoritative matrix", () => expect(calculatePriority(1, 1, DEFAULT_PRIORITY_MATRIX)).toBe(1));
});
