import { connectDatabase, disconnectDatabase } from "../db/connection.js";
import { IncidentModel } from "../models/index.js";
import { generateMockIncidents } from "../services/mock-incidents.js";

const count = Number(process.argv[2] ?? 500); const incidents = generateMockIncidents(count);
await connectDatabase();
const result = await IncidentModel.bulkWrite(incidents.map((incident) => ({ updateOne: { filter: { source: incident.source, sourceSysId: incident.sourceSysId }, update: { $set: incident }, upsert: true } })), { ordered: false });
const persisted = await IncidentModel.countDocuments({ source: "servicenow", sourceSysId: { $in: incidents.map((incident) => incident.sourceSysId) } }); await disconnectDatabase();
if (persisted !== count) throw new Error(`Expected ${count} mock incidents but found ${persisted}`);
process.stdout.write(`Mock seed complete: ${persisted} persisted, ${result.upsertedCount} inserted, ${result.modifiedCount} modified\n`);
