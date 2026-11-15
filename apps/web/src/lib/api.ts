import { loginResponseSchema, type LoginRequest } from "@incident-intelligence/shared";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const SESSION_KEY = "incident-intelligence.session";
export interface Session { accessToken: string; user: { id: string; email: string; displayName: string; roles: string[] } }
export function getSession(): Session | null { if (typeof window === "undefined") return null; const raw = sessionStorage.getItem(SESSION_KEY); if (!raw) return null; try { return JSON.parse(raw) as Session; } catch { sessionStorage.removeItem(SESSION_KEY); return null; } }
export function clearSession(): void { if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY); }
export class ApiRequestError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession(); if (!session) throw new ApiRequestError("Sign in is required", 401);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { accept: "application/json", authorization: `Bearer ${session.accessToken}`, ...init?.headers } });
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) { if (response.status === 401) clearSession(); throw new ApiRequestError(body?.error?.message ?? "Request failed", response.status); } return body as T;
}
export async function login(input: LoginRequest) {
  const response = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
  const body: unknown = await response.json(); if (!response.ok) throw new Error("Unable to sign in. Check your credentials and try again."); return loginResponseSchema.parse(body);
}
