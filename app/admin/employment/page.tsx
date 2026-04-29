// /admin/employment — list view for employment_applications.
// Status filter via ?status=, search via ?q=. Mirrors /admin/applications style.

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type EmploymentStatus = "new" | "reviewing" | "interviewed" | "hired" | "rejected" | "archived";

const STATUS_TABS: { key: EmploymentStatus | "all"; label: string }[] = [
  { key: "new", label: "New" },
  { key: "reviewing", label: "Reviewing" },
  { key: "interviewed", label: "Interviewed" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" }
];

const STATUS_BADGE: Record<EmploymentStatus, string> = {
  new: "bg-amber-100 text-amber-900 border-amber-200",
  reviewing: "bg-sky-100 text-sky-900 border-sky-200",
  interviewed: "bg-indigo-100 text-indigo-900 border-indigo-200",
  hired: "bg-emerald-100 text-emerald-900 border-emerald-200",
  rejected: "bg-rose-100 text-rose-900 border-rose-200",
  archived: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

type Search = Promise<{ status?: string; q?: string }>;

export default async function EmploymentList({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const status = (params.status as EmploymentStatus | "all" | undefined) ?? "new";
  const q = (params.q ?? "").trim();

  const supabase = createAdminClient();
  let query = supabase
    .from("employment_applications" as any)
    .select(
      "id, name, email, phone, position_interest, experience, resume_url, additional_info, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (q.length) {
    const like = `%${q.replace(/%/g, "")}%`;
    query = query.or(`name.ilike.${like},email.ilike.${like},position_interest.ilike.${like}`);
  }

  const { data: rows } = await query;
  const list: any[] = (rows ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Employment applications</h1>
        <p className="text-sm text-muted-foreground">
          Job applicants from the Careers page. Move to Reviewing once you have read the application.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {STATUS_TABS.map((tab) => {
          const active = tab.key === status;
          const href =
            tab.key === "all" ? "/admin/employment?status=all" : "/admin/employment?status=" + tab.key;
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
        <form action="/admin/employment" method="get" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, position"
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
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Applicant</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Contact</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Position</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Resume</th>
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
                <td className="px-4 py-3 text-sm text-muted-foreground">{row.position_interest ?? "-"}</td>
                <td className="px-4 py-3 text-sm">
                  {row.resume_url ? (
                    <a
                      href={row.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 text-xs rounded-md border " +
                      (STATUS_BADGE[row.status as EmploymentStatus] ??
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
                  No employment applications match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
