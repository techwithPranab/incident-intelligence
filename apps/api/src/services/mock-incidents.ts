import type { NormalizedIncident, ServiceNowRecord } from "@incident-intelligence/servicenow";

const catalog = [
  ["Network", "VPN", "VPN connection fails for remote employee", "Network Support"],
  ["Network", "DNS", "Internal application hostname cannot be resolved", "Network Support"],
  ["Hardware", "Laptop", "Laptop repeatedly shuts down during normal use", "Desktop Support"],
  ["Hardware", "Printer", "Office printer is unavailable to the floor", "Desktop Support"],
  ["Software", "Email", "Email client cannot synchronize mailbox", "Messaging Support"],
  ["Software", "ERP", "ERP transaction fails while submitting purchase order", "Business Apps"],
  ["Access", "Password", "User account is locked after password change", "Identity Support"],
  ["Access", "MFA", "MFA challenge is not delivered to registered device", "Identity Support"],
  ["Database", "Performance", "Customer database queries are timing out", "Database Operations"],
  ["Infrastructure", "Server", "Application server health check is failing", "Cloud Operations"],
] as const;
const states = ["1", "2", "2", "3", "6", "6", "7"];
function rng(seed: number) { let value = seed >>> 0; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; }; }
function pick<T>(items: readonly T[], random: () => number): T { return items[Math.floor(random() * items.length)] as T; }
function sysId(index: number): string { return `mock${index.toString(16).padStart(28, "0")}`; }
function snDate(date: Date): string { return date.toISOString().replace("T", " ").replace(".000Z", ""); }
function calculatedPriority(impact: number, urgency: number): number { const matrix = [[1, 1, 2], [1, 2, 3], [2, 3, 4]]; return matrix[impact - 1]?.[urgency - 1] ?? 4; }

export interface MockIncident extends NormalizedIncident { relatedIncidentNumbers: string[] }
export function generateMockIncidents(count = 500, seed = 20261115): MockIncident[] {
  if (!Number.isInteger(count) || count < 1 || count > 10_000) throw new Error("count must be between 1 and 10000");
  const random = rng(seed); const now = new Date("2026-11-15T06:00:00.000Z"); const incidents: MockIncident[] = [];
  for (let index = 1; index <= count; index += 1) {
    const [category, subcategory, summary, group] = pick(catalog, random); const impact = 1 + Math.floor(random() * 3); const urgency = 1 + Math.floor(random() * 3); const priority = calculatedPriority(impact, urgency);
    const state = pick(states, random); const ageDays = Math.floor(random() * 180); const openedAt = new Date(now.valueOf() - ageDays * 86_400_000 - Math.floor(random() * 86_400_000));
    const isResolved = state === "6" || state === "7"; const resolvedAt = isResolved ? new Date(Math.min(now.valueOf(), openedAt.valueOf() + (2 + Math.floor(random() * 96)) * 3_600_000)) : undefined;
    const number = `INC${String(1_000_000 + index).padStart(7, "0")}`; const relatedIncidentNumbers = index > 20 && random() < 0.18 ? [`INC${String(1_000_000 + 1 + Math.floor(random() * (index - 1))).padStart(7, "0")}`] : [];
    const raw: ServiceNowRecord = { sys_id: sysId(index), number, short_description: summary, description: `${summary}. Affected user reports the issue from site ${1 + Math.floor(random() * 12)}.`, category, subcategory, impact: String(impact), urgency: String(urgency), priority: String(priority), state, assignment_group: { value: group.toLowerCase().replaceAll(" ", "_"), display_value: group }, opened_at: snDate(openedAt), sys_created_on: snDate(openedAt), sys_updated_on: snDate(resolvedAt ?? new Date(openedAt.valueOf() + 3_600_000)), resolution_notes: isResolved ? `Service restored after ${subcategory.toLowerCase()} remediation was verified with the requester.` : "", close_code: isResolved ? "Solved (Permanently)" : "", ...(relatedIncidentNumbers[0] ? { parent_incident: relatedIncidentNumbers[0] } : {}) };
    incidents.push({ source: "servicenow", sourceSysId: raw.sys_id, number, shortDescription: summary, description: String(raw.description), category, subcategory, impact, urgency, priority, state, assignmentGroup: { value: group.toLowerCase().replaceAll(" ", "_"), displayValue: group, sysId: group.toLowerCase().replaceAll(" ", "_") }, openedAt, ...(resolvedAt ? { resolvedAt, closeCode: "Solved (Permanently)", resolutionNotes: String(raw.resolution_notes) } : {}), sourceCreatedAt: openedAt, sourceUpdatedAt: resolvedAt ?? new Date(openedAt.valueOf() + 3_600_000), relatedIncidentNumbers, raw });
  }
  return incidents;
}
