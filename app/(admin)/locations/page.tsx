import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function LocationsList() {
  const supabase = await createClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, slug, name, schedule_description, max_vendors, active")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Locations</h1>
          <p className="text-sm text-muted-foreground">Market venues</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Name</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Schedule</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Max Vendors</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(locations ?? []).map((loc) => (
              <tr key={loc.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={"/admin/locations/" + loc.slug} className="font-medium text-primary hover:underline">{loc.name}</Link>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{loc.schedule_description}</td>
                <td className="px-4 py-3 text-sm">{loc.max_vendors ?? "-"}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={loc.active ? "text-primary" : "text-muted-foreground"}>{loc.active ? "Active" : "Inactive"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
