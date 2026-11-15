"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginRequestSchema, type LoginRequest } from "@incident-intelligence/shared";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter(); const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginRequest>({ resolver: zodResolver(loginRequestSchema) });
  const submit = async (value: LoginRequest) => { try { const result = await login(value); sessionStorage.setItem("incident-intelligence.session", JSON.stringify(result)); router.replace("/dashboard"); } catch (error) { setError("root", { message: error instanceof Error ? error.message : "Sign in failed" }); } };
  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="hidden bg-ink p-16 text-white lg:flex lg:flex-col lg:justify-between"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">Incident Intelligence</p><div><h1 className="max-w-xl text-5xl font-semibold leading-tight">Turn incident history into operational clarity.</h1><p className="mt-6 max-w-lg text-lg text-slate-300">Secure analytics, evidence-grounded AI assistance, and ServiceNow synchronization in one workspace.</p></div><p className="text-sm text-slate-400">Enterprise incident operations</p></section>
    <section className="flex items-center justify-center p-6"><form onSubmit={handleSubmit(submit)} className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm" noValidate><h2 className="text-2xl font-semibold">Welcome back</h2><p className="mt-2 text-sm text-slate-600">Sign in with your organization account.</p>
      <label className="mt-8 block text-sm font-medium" htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" {...register("email")} className="mt-2 w-full rounded-lg border px-3 py-2.5" aria-invalid={!!errors.email}/>{errors.email && <p className="mt-1 text-sm text-red-700">{errors.email.message}</p>}
      <label className="mt-5 block text-sm font-medium" htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" {...register("password")} className="mt-2 w-full rounded-lg border px-3 py-2.5" aria-invalid={!!errors.password}/>{errors.password && <p className="mt-1 text-sm text-red-700">{errors.password.message}</p>}
      {errors.root && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{errors.root.message}</p>}<button disabled={isSubmitting} className="mt-6 w-full rounded-lg bg-brand-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{isSubmitting ? "Signing in…" : "Sign in"}</button>
    </form></section></main>;
}
