import type { IncidentQuery, NormalizedIncident, ServiceNowFieldMapping } from "./types.js";
import type { ServiceNowClient } from "./client.js";
import { normalizeIncident } from "./normalization.js";
export interface SyncFailure { sourceId: string; code: string; message: string }
export interface SyncProgress { read: number; upserted: number; failed: number; cursor?: string }
export interface IncidentSyncRepository { upsertBatch(incidents: NormalizedIncident[]): Promise<number>; checkpoint(progress: SyncProgress, failures: SyncFailure[]): Promise<void> }
export interface SyncResult extends SyncProgress { failures: SyncFailure[] }
export async function synchronizeIncidents(input: { client: ServiceNowClient; repository: IncidentSyncRepository; query?: IncidentQuery; mappings?: ServiceNowFieldMapping[]; batchSize?: number }): Promise<SyncResult> {
  const progress: SyncProgress = { read: 0, upserted: 0, failed: 0 }; const failures: SyncFailure[] = []; let batch: NormalizedIncident[] = [];
  const flush = async () => { if (!batch.length) return; progress.upserted += await input.repository.upsertBatch(batch); batch = []; await input.repository.checkpoint(progress, failures); };
  for await (const page of input.client.iterateIncidents(input.query)) for (const record of page.records) { progress.read += 1; try { batch.push(normalizeIncident(record, input.mappings)); const cursor = record.sys_updated_on; progress.cursor = typeof cursor === "string" ? cursor : record.sys_id; } catch (error) { progress.failed += 1; failures.push({ sourceId: record.sys_id ?? "unknown", code: "NORMALIZATION_ERROR", message: error instanceof Error ? error.message : "Invalid incident" }); } if (batch.length >= (input.batchSize ?? 100)) await flush(); }
  await flush(); await input.repository.checkpoint(progress, failures); return { ...progress, failures };
}
