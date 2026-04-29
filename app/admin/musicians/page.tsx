// /admin/musicians — list view for the musicians directory.
// Renders both legacy `active` and new `is_active` so neither column is lost
// during the bridge transition.

import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type Search = Promise<{ q?: string; show?: string }>;

export default async function MusiciansList({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const show = params.show ?? "all"; // all | website | active

  const supabase = createAdminClient();
  let query = supabase
    .from("musicians" as any)
    .select(
      "id, name, handle, email, phone, website, photo_url, instagram_url, facebook_url, display_on_website, is_active, active, notes, created_at"
    )
    .order("created_at", { ascending: false });

  if (q.length) {
    const like = `%${q.replace(/%/g, "")}%`;
    query = query.or(`name.ilike.${like},email.ilike.${like},handle.ilike.${like}`);
  }
  if (show === "website") query = query.eq("display_on_website", true);
  if (show === "active") query = query.eq("is_active", true);

  const { data: rows } = await query;
  const list: any[] = (rows ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Musicians</h1>
        <p className="text-sm text-muted-foreground">
          Local musicians who applied to play. Toggle &quot;Display on website&quot; to feature them on the public
          site (toggle is read-only here for v1; edit via Supabase Studio).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {[
          { k: "all", label: "All" },
          { k: "website", label: "On website" },
          { k: "active", label: "Active" }
        ].map((t) => {
          const active = show === t.k;
          return (
            <a
              key={t.k}
              href={"/admin/musicians?show=" + t.k + (q ? "&q=" + encodeURIComponent(q) : "")}
              className={
                "px-3 py-1.5 text-sm rounded-md border transition " +
                (active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-accent border-transparent")
              }
            >
              {t.label}
            </a>
          );
        })}
        <form action="/admin/musicians" method="get" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="show" value={show} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, handle, email"
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
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Artist</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Contact</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Links</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">On site</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Active</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((row) => {
              // Coalesce: prefer is_active, fall back to legacy `active`.
              const effectiveActive =
                row.is_active === null || row.is_active === undefined ? row.active : row.is_active;
              return (
                <tr key={row.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    {row.handle ? <div className="text-xs text-muted-foreground">@{row.handle}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{row.email ?? "-"}</div>
                    {row.phone ? <div className="text-xs text-muted-foreground">{row.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground space-x-2">
                    {row.website ? (
                      <a className="underline" href={row.website} target="_blank" rel="noreferrer">
                        site
                      </a>
                    ) : null}
                    {row.instagram_url ? (
                      <a className="underline" href={row.instagram_url} target="_blank" rel="noreferrer">
                        IG
                      </a>
                    ) : null}
                    {row.facebook_url ? (
                      <a className="underline" href={row.facebook_url} target="_blank" rel="noreferrer">
                        FB
                      </a>
                    ) : null}
                    {!row.website && !row.instagram_url && !row.facebook_url ? "-" : null}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input type="checkbox" checked={!!row.display_on_website} disabled />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input type="checkbox" checked={!!effectiveActive} disabled />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(row.created_at)}</td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No musicians match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Edit toggles in Supabase Studio for now. Inline editing UI is queued for the next pass.
      </p>
    </div>
  );
}
