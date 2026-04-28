// PROMPT 10 - Applications list
// Filterable table of vendor applications. Status filter via query param.
// Status values: pending, approved, denied, waitlist, withdrawn (matches Application schema).

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/database";

const STATUS_TABS: { key: ApplicationStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "denied", label: "Rejected" },
  { key: "waitlist", label: "Waitlist" },
  { key: "withdrawn", label: "Withdrawn" },
  { key: "all", label: "All" }
];

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  approved: "bg-emerald-100 text-emerald-900 border-emerald-200",
  denied: "bg-rose-100 text-rose-900 border-rose-200",
  waitlist: "bg-sky-100 text-sky-900 border-sky-200",
  withdrawn: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

type Search = Promise<{ status?: string; location?: string }>;

export default async function ApplicationsList({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const status = (params.status as ApplicationStatus | "all" | undefined) ?? "pending";
  const locationFilter = params.location ?? "all";

  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select("id, business_name, contact_name, email, status, created_at, location_id, locations(name, slug)")
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (locationFilter !== "all") query = query.eq("location_id", locationFilter);

  const [{ data: rows }, { data: locations }, { data: pendingCount }] = await Promise.all([
    query,
    supabase.from("locations").select("id, name").eq("active", true).order("name"),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending")
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Applications</h1>
        <p className="text-sm text-muted-foreground">
          Vendor submissions awaiting review. Approve to assign a booth and queue an invoice.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === status;
          const href =
            tab.key === "all"
              ? "/admin/applications?status=all"
              : "/admin/applications?status=" + tab.key;
          return (
            <Link
              key={tab.key}
              href={href + (locationFilter !== "all" ? "&location=" + locationFilter : "")}
              className={
                "px-3 py-1.5 text-sm rounded-md border transition " +
                (active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-accent border-transparent")
              }
            >
              {tab.label}
            </Link>
          );
        })}
        <form action="/admin/applications" method="get" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="location" className="text-xs text-muted-foreground">
            Location
          </label>
          <select
            id="location"
            name="location"
            defaultValue={locationFilter}
            className="text-sm border rounded-md px-2 py-1 bg-card"
          >
            <option value="all">All locations</option>
            {(locations ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button type="submit" className="text-sm px-3 py-1 rounded-md border bg-card hover:bg-accent">
            Filter
          </button>
        </form>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Business</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Contact</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Location</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Submitted</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(rows ?? []).map((row: any) => (
              <tr key={row.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={"/admin/applications/" + row.id}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.business_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>{row.contact_name ?? "-"}</div>
                  <div className="text-xs text-muted-foreground">{row.email}</div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{row.locations?.name ?? "-"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 text-xs rounded-md border " +
                      STATUS_BADGE[row.status as ApplicationStatus]
                    }
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No applications match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {status !== "pending" && (pendingCount as any)?.count ? (
        <p className="text-xs text-muted-foreground">
          {(pendingCount as any).count} pending application(s) waiting on review.
        </p>
      ) : null}
    </div>
  );
}
