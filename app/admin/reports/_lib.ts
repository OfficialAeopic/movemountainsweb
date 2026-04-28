// PROMPT 18 - Reports shared helpers.
// Date range parsing, CSV serializer, and small aggregation helpers.

export type RangeKey = "30d" | "quarter" | "year" | "custom";

export interface DateRange {
  key: RangeKey;
  startIso: string; // YYYY-MM-DD inclusive
  endIso: string;   // YYYY-MM-DD inclusive
  label: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/**
 * Resolve the active date range from URL search params.
 * Falls back to the last 30 days when nothing is provided.
 */
export function resolveRange(sp: { range?: string; start?: string; end?: string }): DateRange {
  const today = new Date();
  const todayIso = toIso(today);

  if (sp.range === "custom" && sp.start && sp.end) {
    return {
      key: "custom",
      startIso: sp.start,
      endIso: sp.end,
      label: `${sp.start} to ${sp.end}`
    };
  }

  if (sp.range === "year") {
    const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    return { key: "year", startIso: toIso(start), endIso: todayIso, label: "Year to date" };
  }

  if (sp.range === "quarter") {
    const q = Math.floor(today.getUTCMonth() / 3);
    const start = new Date(Date.UTC(today.getUTCFullYear(), q * 3, 1));
    return { key: "quarter", startIso: toIso(start), endIso: todayIso, label: "This quarter" };
  }

  // default: last 30 days
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 30);
  return { key: "30d", startIso: toIso(start), endIso: todayIso, label: "Last 30 days" };
}

/**
 * Inline CSV serializer. Quotes fields containing commas, quotes, or newlines.
 * No external dep per Prompt 18 constraint.
 */
export function toCsv(rows: Array<Record<string, unknown>>, headers?: string[]): string {
  if (rows.length === 0) return (headers ?? []).join(",") + "\n";
  const cols = headers ?? Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => escape(r[c])).join(",")).join("\n");
  return head + "\n" + body + "\n";
}

/**
 * Group an array of records by a key returning a Map for stable iteration.
 */
export function groupBy<T, K extends string | number>(rows: T[], keyFn: (r: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const row of rows) {
    const k = keyFn(row);
    const list = out.get(k) ?? [];
    list.push(row);
    out.set(k, list);
  }
  return out;
}

export function sumNumeric(rows: Array<Record<string, unknown>>, field: string): number {
  return rows.reduce((acc, r) => acc + Number(r[field] ?? 0), 0);
}

export function monthKey(iso: string): string {
  // YYYY-MM
  return iso.slice(0, 7);
}
