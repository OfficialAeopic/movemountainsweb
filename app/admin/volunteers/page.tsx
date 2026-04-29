// /admin/volunteers — list view for the new volunteers table.
// Status filter via ?status=, search via ?q=. Mirrors /admin/applications style.

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type VolunteerStatus = "new" | "contacted" | "active" | "inactive";

const STATUS_TABS: { key: VolunteerStatus | "all"; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "all", label: "All" }
];

const STATUS_BADGE: Record<VolunteerStatus, string> = {
  new: "bg-amber-100 text-amber-900 border-amber-200",
  contacted: "bg-sky-100 text-sky-900 border-sky-200",
  active: "bg-emerald-100 text-emerald-900 border-emerald-200",
  inactive: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

type Search = Promise<{ status?: string; q?: string }>;

export default async function VolunteersList({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const status = (params.status as VolunteerStatus | "all" | undefined) ?? "new";
  const q = (params.q ?? "").trim();

  // The admin layout already required staff. Use the service-role client here
  // to read with no RLS friction during the bridge phase.
  const supabase = createAdminClient();

  let query = supabase
    .from("volunteers" as any)
    .select("id, name, email, phone, interests, availability, status, created_at")
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (q.length) {
    const like = `%${q.replace(/%/g, "")}%`;
    query = query.or(`name.ilike.${like},email.ilike.${like}`);
  }

  const { data: rows } = await query;
  const list: any[] = (rows ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Volunteers</h1>
        <p className="text-sm text-muted-foreground">
          People who signed up via the volunteer form. Reach out to confirm shifts before each market.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === status;
          const href =
            tab.key === "all" ? "/admin/volunteers?status=all" : "/admin/volunteers?status=" + tab.key;
          return (
            <Link
              key={tab.key}
              href={href + (q ? "&q=" + encodeURIComponent(q) : "")}
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
        <form action="/admin/volunteers" method="get" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="text-sm border rounded-md px-2 py-1 bg-card"
          />
          <button type="submit" className="text-sm px-3 py-1 rounded-md border bg-card hover:bg-accent">
            Search
          </button>
        </form>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Name</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Contact</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Roles</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Availability</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Submitted</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((row) => (
              <tr key={row.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-sm">
                  <div>{row.email}</div>
                  {row.phone ? <div className="text-xs text-muted-foreground">{row.phone}</div> : null}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                  {Array.isArray(row.interests) && row.interests.length
                    ? row.interests.join(", ")
                    : "-"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                  {row.availability ?? "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 text-xs rounded-md border " +
                      (STATUS_BADGE[row.status as VolunteerStatus] ??
                        "bg-zinc-100 text-zinc-700 border-zinc-200")
                    }
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No volunteers match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
