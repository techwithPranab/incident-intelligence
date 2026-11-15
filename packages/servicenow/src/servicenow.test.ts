import { describe, expect, it, vi } from "vitest";
import { ServiceNowClient } from "./client.js";
import { normalizeIncident } from "./normalization.js";
import { synchronizeIncidents, type IncidentSyncRepository } from "./sync.js";
import type { ServiceNowRecord } from "./types.js";

const raw: ServiceNowRecord = {
  sys_id: "abc123", number: "INC0010001", short_description: "VPN unavailable", description: "Remote users cannot connect",
  priority: "2", impact: "2", urgency: "1", state: "2", sys_updated_on: "2026-11-15 03:30:00",
  assignment_group: { value: "group1", display_value: "Network Support" },
};

describe("incident normalization", () => {
  it("preserves source and normalizes typed fields", () => {
    const result = normalizeIncident(raw);
    expect(result).toMatchObject({ sourceSysId: "abc123", number: "INC0010001", priority: 2, assignmentGroup: { sysId: "group1", displayValue: "Network Support" } });
    expect(result.sourceUpdatedAt?.toISOString()).toBe("2026-11-15T03:30:00.000Z"); expect(result.raw).toBe(raw);
  });
  it("rejects records without required identity", () => expect(() => normalizeIncident({ sys_id: "" } as ServiceNowRecord)).toThrow());
});

describe("ServiceNow client", () => {
  it("paginates and reuses an OAuth token", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: [raw, { ...raw, sys_id: "def456", number: "INC0010002" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: [] }), { status: 200 }));
    const client = new ServiceNowClient({ instanceUrl: "https://example.service-now.com", auth: { type: "oauth2", clientId: "id", clientSecret: "secret" }, pageSize: 2 }, { fetch });
    const pages = []; for await (const page of client.iterateIncidents()) pages.push(page);
    expect(pages).toHaveLength(2); expect(fetch).toHaveBeenCalledTimes(3); expect(String(fetch.mock.calls[2]?.[0])).toContain("sysparm_offset=2");
  });

  it("honors retry-after on rate limits", async () => {
    const sleep = vi.fn(async () => undefined); const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response("", { status: 429, headers: { "retry-after": "2" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: [] }), { status: 200 }));
    const client = new ServiceNowClient({ instanceUrl: "https://example.service-now.com", auth: { type: "basic", username: "user", password: "pass" }, maxRetries: 1 }, { fetch, sleep, random: () => 0 });
    await client.getIncidentPage(0, 100); expect(sleep).toHaveBeenCalledWith(2000);
  });
});

describe("synchronization", () => {
  it("batches valid records and captures invalid records", async () => {
    const client = { async *iterateIncidents() { yield { records: [raw, { sys_id: "bad" } as ServiceNowRecord], offset: 0, hasMore: false }; } } as ServiceNowClient;
    const batches: number[] = []; const repository: IncidentSyncRepository = { upsertBatch: async (items) => { batches.push(items.length); return items.length; }, checkpoint: async () => undefined };
    const result = await synchronizeIncidents({ client, repository, batchSize: 1 });
    expect(result).toMatchObject({ read: 2, upserted: 1, failed: 1 }); expect(batches).toEqual([1]); expect(result.failures[0]?.sourceId).toBe("bad");
  });
});
