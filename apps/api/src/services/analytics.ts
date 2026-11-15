import { IncidentModel } from "../models/index.js";
const closedStates = ["6", "7", "Resolved", "Closed"];
export async function overviewAnalytics() {
  const [result] = await IncidentModel.aggregate([{ $facet: {
    totals: [{ $group: { _id: null, total: { $sum: 1 }, open: { $sum: { $cond: [{ $not: [{ $in: ["$state", closedStates] }] }, 1, 0] } }, resolved: { $sum: { $cond: [{ $in: ["$state", closedStates] }, 1, 0] } }, critical: { $sum: { $cond: [{ $eq: ["$priority", 1] }, 1, 0] } }, slaBreached: { $sum: { $cond: [{ $eq: ["$sla.breached", true] }, 1, 0] } }, slaTracked: { $sum: { $cond: [{ $ne: [{ $type: "$sla.dueAt" }, "missing"] }, 1, 0] } } } }],
    priorities: [{ $match: { priority: { $ne: null } } }, { $group: { _id: "$priority", count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
    categories: [{ $match: { category: { $nin: [null, ""] } } }, { $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }],
    assignmentGroups: [{ $match: { state: { $nin: closedStates }, "assignmentGroup.displayValue": { $nin: [null, ""] } } }, { $group: { _id: "$assignmentGroup.displayValue", count: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ["$priority", 1] }, 1, 0] } } } }, { $sort: { count: -1 } }, { $limit: 10 }],
  } }]);
  const aggregateTotals = result?.totals?.[0] ?? { total: 0, open: 0, resolved: 0, critical: 0, slaBreached: 0, slaTracked: 0 };
  const totals = { total: aggregateTotals.total, open: aggregateTotals.open, resolved: aggregateTotals.resolved, critical: aggregateTotals.critical, slaBreached: aggregateTotals.slaBreached, slaTracked: aggregateTotals.slaTracked };
  return { totals, priorityDistribution: (result?.priorities ?? []).map(rename), categoryDistribution: (result?.categories ?? []).map(rename), assignmentGroupWorkload: (result?.assignmentGroups ?? []).map(rename) };
}
function rename(item: { _id: string | number; count: number; critical?: number }) { return { name: String(item._id), count: item.count, ...(item.critical === undefined ? {} : { critical: item.critical }) }; }
export async function trendAnalytics(days: number) {
  const start = new Date(); start.setUTCDate(start.getUTCDate() - days + 1); start.setUTCHours(0, 0, 0, 0);
  const rows = await IncidentModel.aggregate([{ $match: { openedAt: { $gte: start } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$openedAt", timezone: "UTC" } }, opened: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ["$state", closedStates] }, 1, 0] } } } }, { $sort: { _id: 1 } }]);
  const byDate = new Map(rows.map((row) => [row._id as string, row])); return Array.from({ length: days }, (_, offset) => { const date = new Date(start); date.setUTCDate(start.getUTCDate() + offset); const key = date.toISOString().slice(0, 10); const row = byDate.get(key); return { date: key, opened: row?.opened ?? 0, resolved: row?.resolved ?? 0 }; });
}
