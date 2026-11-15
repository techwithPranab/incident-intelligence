import crypto from "node:crypto";
import { ServiceNowClient, parseFieldMappings, synchronizeIncidents, type IncidentSyncRepository, type NormalizedIncident, type SyncFailure, type SyncProgress } from "@incident-intelligence/servicenow";
import { env } from "../config/env.js";
import { IncidentModel, IncidentSyncHistoryModel } from "../models/index.js";
import { logger } from "../lib/logger.js";

export type SyncType = "full" | "incremental";
function requireConfig(): ServiceNowClient {
  if (!env.SERVICENOW_INSTANCE_URL) throw new Error("SERVICENOW_INSTANCE_URL is not configured");
  const auth = env.SERVICENOW_AUTH_TYPE === "oauth2" ? { type: "oauth2" as const, ...(env.SERVICENOW_CLIENT_ID ? { clientId: env.SERVICENOW_CLIENT_ID } : {}), ...(env.SERVICENOW_CLIENT_SECRET ? { clientSecret: env.SERVICENOW_CLIENT_SECRET } : {}) } : { type: "basic" as const, ...(env.SERVICENOW_USERNAME ? { username: env.SERVICENOW_USERNAME } : {}), ...(env.SERVICENOW_PASSWORD ? { password: env.SERVICENOW_PASSWORD } : {}) };
  return new ServiceNowClient({ instanceUrl: env.SERVICENOW_INSTANCE_URL, auth, pageSize: env.SERVICENOW_PAGE_SIZE, maxRetries: env.SERVICENOW_MAX_RETRIES });
}
export async function startIncidentSync(type: SyncType, initiatedBy: string): Promise<string> {
  const syncId = crypto.randomUUID(); await IncidentSyncHistoryModel.create({ syncId, type, status: "queued", initiatedBy, recordsRead: 0, recordsUpserted: 0, recordsFailed: 0 });
  void runIncidentSync(syncId, type).catch((error: unknown) => logger.error({ err: error, syncId }, "Incident sync failed")); return syncId;
}
export async function runIncidentSync(syncId: string, type: SyncType): Promise<void> {
  const history = await IncidentSyncHistoryModel.findOneAndUpdate({ syncId, status: "queued" }, { $set: { status: "running", startedAt: new Date() } }, { new: true }); if (!history) throw new Error(`Sync ${syncId} is not queued`);
  try {
    const updatedAfter = type === "incremental" ? await latestSuccessfulCursor() : undefined;
    const repository: IncidentSyncRepository = {
      upsertBatch: async (incidents) => upsertIncidents(incidents),
      checkpoint: async (progress, failures) => updateCheckpoint(syncId, progress, failures),
    };
    const result = await synchronizeIncidents({ client: requireConfig(), repository, ...(updatedAfter ? { query: { updatedAfter } } : {}), mappings: parseFieldMappings(env.SERVICENOW_FIELD_MAPPINGS_JSON), batchSize: env.SYNC_BATCH_SIZE });
    await IncidentSyncHistoryModel.updateOne({ syncId }, { $set: { status: result.failed ? "partial" : "completed", completedAt: new Date() } });
  } catch (error) { await IncidentSyncHistoryModel.updateOne({ syncId }, { $set: { status: "failed", completedAt: new Date() }, $push: { failures: { sourceId: "sync", code: "SYNC_ERROR", message: error instanceof Error ? error.message : "Unknown sync error" } }, $inc: { recordsFailed: 1 } }); throw error; }
}
async function latestSuccessfulCursor(): Promise<Date | undefined> { const latest = await IncidentSyncHistoryModel.findOne({ status: { $in: ["completed", "partial"] }, cursor: { $exists: true } }).sort({ completedAt: -1 }).lean() as { cursor?: string } | null; if (!latest?.cursor) return undefined; const parsed = new Date(latest.cursor.replace(" ", "T") + "Z"); return Number.isNaN(parsed.valueOf()) ? undefined : parsed; }
async function upsertIncidents(incidents: NormalizedIncident[]): Promise<number> { if (!incidents.length) return 0; await IncidentModel.bulkWrite(incidents.map((incident) => ({ updateOne: { filter: { source: "servicenow", sourceSysId: incident.sourceSysId }, update: { $set: incident }, upsert: true } })), { ordered: false }); return incidents.length; }
async function updateCheckpoint(syncId: string, progress: SyncProgress, failures: SyncFailure[]): Promise<void> { await IncidentSyncHistoryModel.updateOne({ syncId }, { $set: { recordsRead: progress.read, recordsUpserted: progress.upserted, recordsFailed: progress.failed, ...(progress.cursor ? { cursor: progress.cursor } : {}), failures: failures.slice(-1000) } }); }
