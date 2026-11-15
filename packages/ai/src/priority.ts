import { z } from "zod";
export type PriorityMatrix = Record<`${1 | 2 | 3}:${1 | 2 | 3}`, 1 | 2 | 3 | 4 | 5>;
export const priorityMatrixSchema = z.object({ "1:1": z.number().int().min(1).max(5), "1:2": z.number().int().min(1).max(5), "1:3": z.number().int().min(1).max(5), "2:1": z.number().int().min(1).max(5), "2:2": z.number().int().min(1).max(5), "2:3": z.number().int().min(1).max(5), "3:1": z.number().int().min(1).max(5), "3:2": z.number().int().min(1).max(5), "3:3": z.number().int().min(1).max(5) });
export const DEFAULT_PRIORITY_MATRIX: PriorityMatrix = { "1:1": 1, "1:2": 1, "1:3": 2, "2:1": 2, "2:2": 3, "2:3": 3, "3:1": 3, "3:2": 4, "3:3": 4 };
export function calculatePriority(impact: 1 | 2 | 3, urgency: 1 | 2 | 3, matrix: PriorityMatrix): 1 | 2 | 3 | 4 | 5 { return matrix[`${impact}:${urgency}`]; }
