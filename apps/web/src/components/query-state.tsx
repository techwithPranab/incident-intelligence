export function LoadingState({ label = "Loading data…" }: { label?: string }) { return <div className="mt-8 rounded-xl border bg-white p-8 text-sm text-slate-500" role="status">{label}</div>; }
export function ErrorState({ message }: { message: string }) { return <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">{message}</div>; }
