import { describe, expect, it } from "vitest";
import { generateMockIncidents } from "./mock-incidents.js";
describe("mock incident generator", () => {
  it("generates 500 deterministic, unique, internally consistent incidents", () => {
    const incidents = generateMockIncidents(); expect(incidents).toHaveLength(500); expect(new Set(incidents.map((item) => item.sourceSysId)).size).toBe(500); expect(new Set(incidents.map((item) => item.number)).size).toBe(500);
    expect(incidents.some((item) => item.resolvedAt && item.resolutionNotes)).toBe(true); expect(incidents.some((item) => item.relatedIncidentNumbers.length > 0)).toBe(true); expect(generateMockIncidents(1)[0]).toEqual(incidents[0]);
  });
  it("rejects unsafe counts", () => expect(() => generateMockIncidents(10_001)).toThrow());
});
