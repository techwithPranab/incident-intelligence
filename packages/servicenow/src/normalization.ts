import { z } from "zod";
import type { NormalizedIncident, ReferenceValue, ServiceNowFieldMapping, ServiceNowRecord, ServiceNowValue } from "./types.js";
export const DEFAULT_FIELD_MAPPINGS: ServiceNowFieldMapping[] = [
  { source: "sys_id", target: "sourceSysId" }, { source: "number", target: "number" }, { source: "short_description", target: "shortDescription" },
  { source: "description", target: "description" }, { source: "category", target: "category" }, { source: "subcategory", target: "subcategory" },
  { source: "impact", target: "impact" }, { source: "urgency", target: "urgency" }, { source: "priority", target: "priority" }, { source: "state", target: "state" },
  { source: "assignment_group", target: "assignmentGroup" }, { source: "assigned_to", target: "assignedTo" }, { source: "opened_at", target: "openedAt" },
  { source: "resolved_at", target: "resolvedAt" }, { source: "closed_at", target: "closedAt" }, { source: "sys_created_on", target: "sourceCreatedAt" },
  { source: "sys_updated_on", target: "sourceUpdatedAt" }, { source: "close_code", target: "closeCode" }, { source: "close_notes", target: "closeNotes" },
  { source: "resolution_notes", target: "resolutionNotes" }, { source: "business_service", target: "businessService" }, { source: "cmdb_ci", target: "configurationItem" },
];
const requiredSchema = z.object({ sourceSysId: z.string().min(1), number: z.string().min(1), shortDescription: z.string().min(1) });
const dateTargets = new Set<keyof NormalizedIncident>(["openedAt", "resolvedAt", "closedAt", "sourceCreatedAt", "sourceUpdatedAt"]);
const numberTargets = new Set<keyof NormalizedIncident>(["impact", "urgency", "priority"]);
const referenceTargets = new Set<keyof NormalizedIncident>(["assignmentGroup", "assignedTo", "businessService", "configurationItem"]);
function stringValue(value: ServiceNowValue | undefined): string | undefined { if (value === null || value === undefined || value === "") return undefined; if (typeof value === "object") return value.display_value ?? value.value; return String(value); }
function referenceValue(value: ServiceNowValue | undefined): ReferenceValue | undefined { if (value === null || value === undefined || value === "") return undefined; if (typeof value === "object") return { ...(value.value ? { value: value.value, sysId: value.value } : {}), ...(value.display_value ? { displayValue: value.display_value } : {}) }; return { value: String(value), sysId: String(value) }; }
export function normalizeIncident(record: ServiceNowRecord, mappings: ServiceNowFieldMapping[] = DEFAULT_FIELD_MAPPINGS): NormalizedIncident {
  const normalized: Record<string, unknown> = { source: "servicenow", raw: record };
  for (const mapping of mappings) { const source = record[mapping.source]; if (source === undefined || source === null || source === "") continue;
    if (dateTargets.has(mapping.target)) { const text = stringValue(source); const date = text ? new Date(text.replace(" ", "T") + (/[zZ]|[+-]\d\d:\d\d$/.test(text) ? "" : "Z")) : undefined; if (date && !Number.isNaN(date.valueOf())) normalized[mapping.target] = date; }
    else if (numberTargets.has(mapping.target)) { const number = Number(stringValue(source)); if (Number.isInteger(number)) normalized[mapping.target] = number; }
    else if (referenceTargets.has(mapping.target)) normalized[mapping.target] = referenceValue(source); else normalized[mapping.target] = stringValue(source);
  }
  requiredSchema.parse(normalized); return normalized as unknown as NormalizedIncident;
}
export function parseFieldMappings(json: string | undefined): ServiceNowFieldMapping[] { if (!json?.trim()) return DEFAULT_FIELD_MAPPINGS; const schema = z.array(z.object({ source: z.string().min(1), target: z.string().min(1), displayValue: z.boolean().optional() })); return schema.parse(JSON.parse(json)) as ServiceNowFieldMapping[]; }
