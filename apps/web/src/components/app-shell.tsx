"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Bot, ChartNoAxesCombined, Gauge, Settings, ShieldCheck } from "lucide-react";
import { clearSession, getSession, type Session } from "@/lib/api";
const links = [{ href: "/dashboard", label: "Dashboard", icon: Gauge }, { href: "/incidents", label: "Incidents", icon: Activity }, { href: "/ai-assistant", label: "AI Assistant", icon: Bot }, { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined }, { href: "/sla", label: "SLA", icon: ShieldCheck }, { href: "/admin", label: "Admin", icon: Settings }];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => { const timer = window.setTimeout(() => { const current = getSession(); setSession(current); if (!current) router.replace("/login"); }, 0); return () => window.clearTimeout(timer); }, [router]);
  if (session === undefined) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading workspace…</div>;
  if (!session) return null;
  return <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]"><aside className="border-r bg-white p-5"><p className="font-semibold">Incident Intelligence</p><nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col" aria-label="Primary">{links.map(({ href, label, icon: Icon }) => <Link className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${pathname.startsWith(href) ? "bg-brand-50 font-medium text-brand-700" : "text-slate-700 hover:bg-slate-100"}`} href={href} key={href}><Icon size={18}/>{label}</Link>)}</nav><div className="mt-8 border-t pt-4 text-sm"><p className="truncate font-medium">{session.user.displayName}</p><p className="truncate text-xs text-slate-500">{session.user.email}</p><button className="mt-3 text-xs font-medium text-brand-700" onClick={() => { clearSession(); router.replace("/login"); }}>Sign out</button></div></aside><main className="min-w-0 p-5 md:p-8">{children}</main></div>;
}
