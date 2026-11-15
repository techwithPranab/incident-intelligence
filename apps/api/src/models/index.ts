import mongoose, { Schema, model, type InferSchemaType } from "mongoose";

const opts = { timestamps: true, strict: "throw" as const };
const refValue = new Schema({ value: String, displayValue: String, sysId: String }, { _id: false });

const incidentSchema = new Schema({
  source: { type: String, default: "servicenow", index: true },
  sourceSysId: { type: String, required: true }, number: { type: String, required: true },
  shortDescription: { type: String, required: true, trim: true }, description: String,
  category: { type: String, index: true }, subcategory: String,
  impact: { type: Number, min: 1, max: 3 }, urgency: { type: Number, min: 1, max: 3 }, priority: { type: Number, min: 1, max: 5, index: true },
  state: { type: String, index: true }, assignmentGroup: refValue, assignedTo: refValue,
  openedAt: Date, resolvedAt: Date, closedAt: Date, sourceCreatedAt: Date, sourceUpdatedAt: { type: Date, index: true },
  closeCode: String, closeNotes: String, resolutionNotes: String, businessService: refValue, configurationItem: refValue,
  relatedIncidentNumbers: [{ type: String }],
  sla: { dueAt: Date, breached: Boolean, sourceRecordIds: [String] }, raw: { type: Schema.Types.Mixed, required: true },
}, opts);
incidentSchema.index({ source: 1, sourceSysId: 1 }, { unique: true });
incidentSchema.index({ source: 1, number: 1 }, { unique: true });
incidentSchema.index({ shortDescription: "text", description: "text", number: "text" });
incidentSchema.index({ state: 1, priority: 1, openedAt: -1 });
incidentSchema.index({ "assignmentGroup.sysId": 1, state: 1 });

const syncHistorySchema = new Schema({
  syncId: { type: String, required: true, unique: true }, type: { type: String, enum: ["full", "incremental"], required: true },
  status: { type: String, enum: ["queued", "running", "completed", "failed", "partial"], required: true, index: true },
  startedAt: Date, completedAt: Date, cursor: String, recordsRead: { type: Number, default: 0 }, recordsUpserted: { type: Number, default: 0 },
  recordsFailed: { type: Number, default: 0 }, failures: [{ sourceId: String, code: String, message: String }], initiatedBy: String,
}, opts);
syncHistorySchema.index({ createdAt: -1, status: 1 });

const aiAnalysisSchema = new Schema({ incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true, index: true },
  kind: { type: String, enum: ["classification", "root_cause", "priority"], required: true }, status: { type: String, enum: ["pending", "completed", "failed", "reviewed"], required: true },
  output: Schema.Types.Mixed, evidence: [{ sourceType: String, sourceId: String, excerpt: String }], modelVersion: String, promptVersion: String,
  confidence: { type: Number, min: 0, max: 1 }, reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }, reviewedAt: Date,
  usage: { inputTokens: Number, outputTokens: Number, totalTokens: Number }, providerRequestId: String, redactions: Schema.Types.Mixed,
}, opts); aiAnalysisSchema.index({ incidentId: 1, kind: 1, createdAt: -1 });

const embeddingFields = { sourceId: { type: Schema.Types.ObjectId, required: true }, model: { type: String, required: true }, dimensions: { type: Number, required: true }, vector: { type: [Number], required: true, select: false }, contentHash: { type: String, required: true }, metadata: Schema.Types.Mixed };
const incidentEmbeddingSchema = new Schema(embeddingFields, opts); incidentEmbeddingSchema.index({ sourceId: 1, model: 1, contentHash: 1 }, { unique: true });
const knowledgeEmbeddingSchema = new Schema(embeddingFields, opts); knowledgeEmbeddingSchema.index({ sourceId: 1, model: 1, contentHash: 1 }, { unique: true });

const knowledgeArticleSchema = new Schema({ source: { type: String, required: true }, sourceSysId: { type: String, required: true }, number: String, title: { type: String, required: true }, body: String, state: String, categories: [String], publishedAt: Date, sourceUpdatedAt: Date, raw: Schema.Types.Mixed }, opts);
knowledgeArticleSchema.index({ source: 1, sourceSysId: 1 }, { unique: true }); knowledgeArticleSchema.index({ title: "text", body: "text" });

const conversationSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, title: String, lastMessageAt: Date, status: { type: String, enum: ["active", "archived"], default: "active" } }, opts);
const messageSchema = new Schema({ conversationId: { type: Schema.Types.ObjectId, ref: "AiConversation", required: true }, role: { type: String, enum: ["user", "assistant", "tool"], required: true }, content: { type: String, required: true }, citations: [{ sourceType: String, sourceId: String, label: String }], tokenUsage: { input: Number, output: Number }, model: String }, opts); messageSchema.index({ conversationId: 1, createdAt: 1 });
const feedbackSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, messageId: { type: Schema.Types.ObjectId, ref: "AiMessage", required: true }, rating: { type: String, enum: ["positive", "negative"], required: true }, comment: String }, opts); feedbackSchema.index({ userId: 1, messageId: 1 }, { unique: true });

const userSchema = new Schema({ email: { type: String, required: true, unique: true, lowercase: true, trim: true }, displayName: { type: String, required: true }, passwordHash: { type: String, required: true, select: false }, roleIds: [{ type: Schema.Types.ObjectId, ref: "Role" }], roles: [{ type: String, enum: ["administrator", "analyst", "viewer"] }], allowedAssignmentGroupIds: [String], active: { type: Boolean, default: true }, lastLoginAt: Date }, opts);
const roleSchema = new Schema({ name: { type: String, required: true, unique: true, enum: ["administrator", "analyst", "viewer"] }, permissions: [{ type: String, required: true }] }, opts);
const auditLogSchema = new Schema({ actorId: { type: Schema.Types.ObjectId, ref: "User", index: true }, action: { type: String, required: true, index: true }, resourceType: String, resourceId: String, outcome: { type: String, enum: ["success", "failure"], required: true }, ip: String, requestId: String, metadata: Schema.Types.Mixed }, opts); auditLogSchema.index({ createdAt: -1 });
const settingSchema = new Schema({ key: { type: String, required: true, unique: true }, value: { type: Schema.Types.Mixed, required: true }, encrypted: { type: Boolean, default: false }, updatedBy: { type: Schema.Types.ObjectId, ref: "User" } }, opts);
const incidentSlaSchema = new Schema({ source: { type: String, default: "servicenow" }, sourceSysId: { type: String, required: true }, incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true, index: true }, definitionSysId: { type: String, required: true }, definitionName: { type: String, required: true }, stage: String, startTime: Date, plannedEndTime: { type: Date, required: true, index: true }, endTime: Date, hasBreached: { type: Boolean, required: true, index: true }, active: { type: Boolean, default: true }, businessPercentage: Number, businessElapsedMilliseconds: Number, raw: { type: Schema.Types.Mixed, required: true } }, opts);
incidentSlaSchema.index({ source: 1, sourceSysId: 1 }, { unique: true }); incidentSlaSchema.index({ active: 1, hasBreached: 1, plannedEndTime: 1 });

function existingOrCreate<T>(name: string, schema: Schema<T>) { return mongoose.models[name] ?? model<T>(name, schema); }
export type Incident = InferSchemaType<typeof incidentSchema>;
export const IncidentModel = existingOrCreate("Incident", incidentSchema);
export const IncidentSyncHistoryModel = existingOrCreate("IncidentSyncHistory", syncHistorySchema);
export const IncidentAiAnalysisModel = existingOrCreate("IncidentAiAnalysis", aiAnalysisSchema);
export const IncidentEmbeddingModel = existingOrCreate("IncidentEmbedding", incidentEmbeddingSchema);
export const KnowledgeArticleModel = existingOrCreate("KnowledgeArticle", knowledgeArticleSchema);
export const KnowledgeEmbeddingModel = existingOrCreate("KnowledgeEmbedding", knowledgeEmbeddingSchema);
export const AiConversationModel = existingOrCreate("AiConversation", conversationSchema);
export const AiMessageModel = existingOrCreate("AiMessage", messageSchema);
export const AiFeedbackModel = existingOrCreate("AiFeedback", feedbackSchema);
export const UserModel = existingOrCreate("User", userSchema);
export const RoleModel = existingOrCreate("Role", roleSchema);
export const AuditLogModel = existingOrCreate("AuditLog", auditLogSchema);
export const SystemSettingModel = existingOrCreate("SystemSetting", settingSchema);
export const IncidentSlaModel = existingOrCreate("IncidentSla", incidentSlaSchema);
