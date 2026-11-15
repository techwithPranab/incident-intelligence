import type { Role } from "@incident-intelligence/shared";
declare global { namespace Express { interface Request { auth?: { userId: string; email: string; roles: Role[] } } } }
export {};
