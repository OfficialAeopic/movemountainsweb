// PROMPT 16 - Email Lists module: subscriber list with search, source filter, tag filter.
// Source values populated by import + signup forms: signup-form, market-day-survey, manual-add, import.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ImportCsvButton } from "./_components/import-csv-button";
import { ExportCsvLink } from "./_components/export-csv-link";

const SOURCE_LABELS: Record<string, string> = {
  "signup-form": "Signup form",
  "market-day-survey": "Market day survey",
  "manual-add": "Manual add",
  "import": "CSV import"
};

type SearchParams = Promise<{
  q?: string;
  source?: string;
  tag?: string;
  status?: string;
  location?: string;
}>;

export default async function EmailListsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("email_subscribers")
    .select("id, email, name, phone, source, raffle_entries, unsubscribed, created_at, location_id, locations(name)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (sp.q && sp.q.trim().length > 0) {
    const term = sp.q.trim();
    query = query.or("email.ilike.%" + term + "%,name.ilike.%" + term + "%");
  }
  if (sp.source && sp.source !== "all") query = query.eq("source", sp.source);
  if (sp.location && sp.location !== "all") query = query.eq("location_id", sp.location);
  if (sp.status === "subscribed") query = query.eq("unsubscribed", false);
  if (sp.status === "unsubscribed") query = query.eq("unsubscribed", true);

  const [{ data: rows }, { data: locations }, { data: sources }, totals] = await Promise.all([
    query,
    supabase.from("locations").select("id, name").eq("active", true).order("name"),
    supabase.from("email_subscribers").select("source").not("source", "is", null),
    Promise.all([
      supabase.from("email_subscribers").select("id", { count: "exact", head: true }).eq("unsubscribed", false),
      supabase.from("email_subscribers").select("id", { count: "exact", head: true }).eq("unsubscribed", true)
    ])
  ]);

  const subscribedCount = (totals[0] as any)?.count ?? 0;
  const unsubscribedCount = (totals[1] as any)?.count ?? 0;

  const distinctSources = Array.from(new Set((sources ?? []).map((r: any) => r.source).filter(Boolean)));

  // Build export URL preserving filters.
  const exportParams = new URLSearchParams();
  if (sp.q) exportParams.set("q", sp.q);
  if (sp.source) exportParams.set("source", sp.source);
  if (sp.location) exportParams.set("location", sp.location);
  if (sp.status) exportParams.set("status", sp.status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Email lists</h1>
          <p className="text-sm text-muted-foreground">
            Customer subscribers from signup forms, market day surveys, and bulk imports.
          </p>
        </div>
        <div className="flex gap-2">
          <ImportCsvButton locations={locations ?? []} />
          <ExportCsvLink params={exportParams.toString()} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Subscribed" value={String(subscribedCount)} />
        <Stat label="Unsubscribed" value={String(unsubscribedCount)} />
        <Stat label="Total" value={String(subscribedCount + unsubscribedCount)} />
      </div>

      <form action="/admin/email-lists" method="get" className="flex flex-wrap items-center gap-2 bg-card border rounded-lg p-3">
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search email or name"
          className="flex-1 min-w-[180px] text-sm border rounded-md px-3 py-1.5 bg-background"
        />
        <select name="source" defaultValue={sp.source ?? "all"} className="text-sm border rounded-md px-2 py-1.5 bg-background">
          <option value="all">All sources</option>
          {distinctSources.map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s] ?? s}</option>
          ))}
        </select>
        <select name="location" defaultValue={sp.location ?? "all"} className="text-sm border rounded-md px-2 py-1.5 bg-background">
          <option value="all">All locations</option>
          {(locations ?? []).map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? "all"} className="text-sm border rounded-md px-2 py-1.5 bg-background">
          <option value="all">All statuses</option>
          <option value="subscribed">Subscribed only</option>
          <option value="unsubscribed">Unsubscribed only</option>
        </select>
        <Button type="submit" variant="outline" size="sm">Filter</Button>
        {(sp.q || sp.source || sp.location || sp.status) && (
          <Link href="/admin/email-lists" className="text-xs text-muted-foreground hover:text-foreground">
            Clear
          </Link>
        )}
      </form>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Email</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Name</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Location</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Source</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Raffle</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Added</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No subscribers match this filter. Import a CSV to get started.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row: any) => (
                <tr key={row.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={"/admin/email-lists/" + row.id} className="font-medium text-primary hover:underline">
                      {row.email}
                    </Link>
                    {row.phone ? <p className="text-xs text-muted-foreground">{row.phone}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.locations?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {row.source ? (SOURCE_LABELS[row.source] ?? row.source) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.raffle_entries ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3">
                    {row.unsubscribed ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-rose-100 text-rose-900 border-rose-200">
                        Unsubscribed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-emerald-100 text-emerald-900 border-emerald-200">
                        Subscribed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing up to 500 most recent subscribers. Use search and filters to narrow further.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
