import mongoose, { type FilterQuery, type SortOrder } from "mongoose";
import { IncidentAiAnalysisModel, IncidentModel, type Incident } from "../models/index.js";

export interface IncidentFilters { search?: string | undefined; category?: string | undefined; priority?: number | undefined; assignmentGroup?: string | undefined; state?: string | undefined; from?: Date | undefined; to?: Date | undefined; page: number; limit: number; sort: "openedAt" | "sourceUpdatedAt" | "priority" | "number"; order: "asc" | "desc" }
function buildFilter(input: IncidentFilters): FilterQuery<Incident> {
  const filter: FilterQuery<Incident> = {};
  if (input.search) filter.$text = { $search: input.search };
  if (input.category) filter.category = input.category;
  if (input.priority) filter.priority = input.priority;
  if (input.assignmentGroup) filter["assignmentGroup.displayValue"] = input.assignmentGroup;
  if (input.state) filter.state = input.state;
  if (input.from || input.to) filter.openedAt = { ...(input.from ? { $gte: input.from } : {}), ...(input.to ? { $lte: input.to } : {}) };
  return filter;
}
const projection = { raw: 0, __v: 0 };
export async function listIncidents(input: IncidentFilters) {
  const filter = buildFilter(input); const direction = input.order === "asc" ? 1 : -1;
  const sort: Record<string, SortOrder | { $meta: string }> = input.search ? { score: { $meta: "textScore" }, [input.sort]: direction } : { [input.sort]: direction };
  const [items, total, facets] = await Promise.all([
    IncidentModel.find(filter, input.search ? { ...projection, score: { $meta: "textScore" } } : projection).sort(sort).skip((input.page - 1) * input.limit).limit(input.limit).lean(),
    IncidentModel.countDocuments(filter),
    IncidentModel.aggregate([{ $facet: {
      categories: [{ $match: { category: { $nin: [null, ""] } } }, { $group: { _id: "$category" } }, { $sort: { _id: 1 } }],
      assignmentGroups: [{ $match: { "assignmentGroup.displayValue": { $nin: [null, ""] } } }, { $group: { _id: "$assignmentGroup.displayValue" } }, { $sort: { _id: 1 } }],
      states: [{ $match: { state: { $nin: [null, ""] } } }, { $group: { _id: "$state" } }, { $sort: { _id: 1 } }],
    } }]),
  ]);
  const values = facets[0] ?? { categories: [], assignmentGroups: [], states: [] };
  return { items, pagination: { page: input.page, limit: input.limit, total, pages: Math.ceil(total / input.limit) }, filters: { categories: values.categories.map((item: { _id: string }) => item._id), assignmentGroups: values.assignmentGroups.map((item: { _id: string }) => item._id), states: values.states.map((item: { _id: string }) => item._id) } };
}
export async function getIncident(identifier: string) {
  const identity = mongoose.isValidObjectId(identifier) ? { $or: [{ _id: identifier }, { sourceSysId: identifier }, { number: identifier.toUpperCase() }] } : { $or: [{ sourceSysId: identifier }, { number: identifier.toUpperCase() }] };
  const incident = await IncidentModel.findOne(identity, projection).lean() as unknown as ({ _id: mongoose.Types.ObjectId; openedAt?: Date; sourceCreatedAt?: Date; resolvedAt?: Date; closedAt?: Date; sourceUpdatedAt?: Date } & Record<string, unknown>) | null; if (!incident) return null;
  const analyses = await IncidentAiAnalysisModel.find({ incidentId: incident._id }).sort({ createdAt: -1 }).select("-__v").lean();
  const history = [
    incident.openedAt ? { type: "opened", at: incident.openedAt, label: "Incident opened" } : null,
    incident.sourceCreatedAt ? { type: "created", at: incident.sourceCreatedAt, label: "Created in ServiceNow" } : null,
    incident.resolvedAt ? { type: "resolved", at: incident.resolvedAt, label: "Incident resolved" } : null,
    incident.closedAt ? { type: "closed", at: incident.closedAt, label: "Incident closed" } : null,
    incident.sourceUpdatedAt ? { type: "updated", at: incident.sourceUpdatedAt, label: "Last synchronized source update" } : null,
  ].filter(Boolean).sort((a, b) => new Date(a!.at).valueOf() - new Date(b!.at).valueOf());
  return { incident, history, analyses };
}
