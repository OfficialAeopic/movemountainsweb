// PROMPT 19 - Settings: Locations tab.
// Read-only summary plus a deep link to the existing /admin/locations CRUD.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function LocationsSettingsTab() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, slug, name, city, state, max_vendors, active")
    .order("name");

  return (
    <div className="space-y-4">
      <section className="bg-card border rounded-lg p-6 space-y-3">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Locations</h2>
            <p className="text-xs text-muted-foreground">
              Full CRUD lives in the Locations module. This tab is a quick reference.
            </p>
          </div>
          <Link
            href="/admin/locations"
            className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Open Locations module
          </Link>
        </header>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Name</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">City</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Max vendors</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(locations ?? []).map((l) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-sm">
                    <Link href={`/admin/locations/${l.slug}`} className="text-primary hover:underline">
                      {l.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">
                    {l.city ?? "-"}
                    {l.state ? ", " + l.state : ""}
                  </td>
                  <td className="px-3 py-2 text-sm">{l.max_vendors ?? "-"}</td>
                  <td className="px-3 py-2 text-sm">
                    <span
                      className={
                        "inline-flex items-center px-2 py-0.5 text-xs rounded-md border " +
                        (l.active
                          ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200")
                      }
                    >
                      {l.active ? "active" : "inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!locations || locations.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No locations on file. Create one in the Locations module.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
