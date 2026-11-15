export const INCIDENT_SOURCE_FIELDS = ["sys_id", "number", "short_description", "description", "category", "subcategory", "impact", "urgency", "priority", "state", "assignment_group", "assigned_to", "opened_at", "resolved_at", "closed_at", "sys_created_on", "sys_updated_on", "close_code", "close_notes", "resolution_notes", "business_service", "cmdb_ci"] as const;
export type ServiceNowValue = string | number | boolean | null | { value?: string; display_value?: string; link?: string };
export type ServiceNowRecord = Record<string, ServiceNowValue> & { sys_id: string };
export interface ServiceNowFieldMapping { source: string; target: keyof NormalizedIncident; displayValue?: boolean }
export interface ServiceNowAuthConfig { type: "oauth2" | "basic"; clientId?: string; clientSecret?: string; username?: string; password?: string }
export interface ServiceNowConnectorConfig { instanceUrl: string; auth: ServiceNowAuthConfig; fieldMappings?: ServiceNowFieldMapping[]; pageSize?: number; maxRetries?: number; requestTimeoutMs?: number }
export interface IncidentQuery { updatedAfter?: Date; sysIds?: string[]; extraQuery?: string }
export interface ReferenceValue { value?: string; displayValue?: string; sysId?: string }
export interface NormalizedIncident {
  source: "servicenow"; sourceSysId: string; number: string; shortDescription: string; description?: string;
  category?: string; subcategory?: string; impact?: number; urgency?: number; priority?: number; state?: string;
  assignmentGroup?: ReferenceValue; assignedTo?: ReferenceValue; openedAt?: Date; resolvedAt?: Date; closedAt?: Date;
  sourceCreatedAt?: Date; sourceUpdatedAt?: Date; closeCode?: string; closeNotes?: string; resolutionNotes?: string;
  businessService?: ReferenceValue; configurationItem?: ReferenceValue; raw: ServiceNowRecord;
}
export interface IncidentPage { records: ServiceNowRecord[]; offset: number; hasMore: boolean }
export class ServiceNowError extends Error { constructor(message: string, public readonly status?: number, public readonly retryable = false) { super(message); this.name = "ServiceNowError"; } }
