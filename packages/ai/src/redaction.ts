const patterns: { label: string; regex: RegExp }[] = [
  { label: "EMAIL", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi }, { label: "IP", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { label: "PHONE", regex: /(?<!\w)(?:\+?\d[\d ()-]{7,}\d)(?!\w)/g }, { label: "SECRET", regex: /\b(?:api[_-]?key|password|secret|token)\s*[:=]\s*[^\s,;]+/gi },
  { label: "BEARER", regex: /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi },
];
export interface RedactionResult { text: string; redactions: Record<string, number> }
export function redactForAi(value: string, maxCharacters = 12_000): RedactionResult { let text = value.slice(0, maxCharacters); const redactions: Record<string, number> = {}; for (const pattern of patterns) text = text.replace(pattern.regex, () => { redactions[pattern.label] = (redactions[pattern.label] ?? 0) + 1; return `[REDACTED_${pattern.label}]`; }); return { text, redactions }; }
export function wrapUntrustedData(label: string, value: string): string { return `<untrusted_${label}>\n${value.replaceAll(`</untrusted_${label}>`, "[REMOVED_TAG]")}\n</untrusted_${label}>`; }
