"use client";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiFetch } from "@/lib/api";
import type { OverviewResponse, TrendResponse } from "@/lib/types";
import { ErrorState, LoadingState } from "./query-state";
export function DashboardView() {
  const overview = useQuery({ queryKey: ["analytics", "overview"], queryFn: () => apiFetch<OverviewResponse>("/analytics/overview") });
  const trends = useQuery({ queryKey: ["analytics", "trends", 30], queryFn: () => apiFetch<TrendResponse>("/analytics/trends?days=30") });
  if (overview.isLoading || trends.isLoading) return <LoadingState label="Loading incident analytics…"/>;
  if (overview.error || trends.error) return <ErrorState message={(overview.error ?? trends.error)?.message ?? "Unable to load analytics"}/>;
  const data = overview.data!; const cards = [["Total incidents", data.totals.total], ["Open incidents", data.totals.open], ["Resolved incidents", data.totals.resolved], ["Critical incidents", data.totals.critical]] as const;
  return <><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <section key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-3 text-3xl font-semibold">{value.toLocaleString()}</p></section>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2"><ChartCard title="Incident trends"><ResponsiveContainer width="100%" height={280}><LineChart data={trends.data!.items}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{ fontSize: 11 }}/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Line type="monotone" dataKey="opened" stroke="#0b78d0" strokeWidth={2}/><Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2}/></LineChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Priority distribution"><ResponsiveContainer width="100%" height={280}><BarChart data={data.priorityDistribution}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="#0b78d0" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Top categories"><ResponsiveContainer width="100%" height={280}><BarChart layout="vertical" data={data.categoryDistribution}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={100}/><Tooltip/><Bar dataKey="count" fill="#7c3aed" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></ChartCard>
    <ChartCard title="Open workload by assignment group"><ResponsiveContainer width="100%" height={280}><BarChart layout="vertical" data={data.assignmentGroupWorkload}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }}/><Tooltip/><Bar dataKey="count" fill="#ea580c" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></ChartCard></div>
    <p className="mt-6 text-xs text-slate-500">SLA metrics are shown only when imported source SLA records exist. Currently tracked: {data.totals.slaTracked}; breached: {data.totals.slaBreached}.</p></>;
}
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border bg-white p-5"><h2 className="mb-5 font-semibold">{title}</h2>{children}</section>; }
