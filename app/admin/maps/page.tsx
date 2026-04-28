// PROMPT 17 - Booth maps index. Routes to per-event booth-map editors.
// The sidebar links here. Per-event maps live at /admin/events/[id]/booth-map.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function BoothMapsIndex() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const { data: upcoming } = await supabase
    .from("market_events")
    .select("id, event_date, status, theme, location:locations(name, slug)")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(20);

  const { data: recent } = await supabase
    .from("market_events")
    .select("id, event_date, status, theme, location:locations(name, slug)")
    .lt("event_date", today)
    .order("event_date", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Booth maps</h1>
        <p className="text-sm text-muted-foreground">
          Pick an event to lay out vendor booths. Each map renders the location's space types as a drag-drop grid.
        </p>
      </div>

      <Section title="Upcoming events" rows={upcoming ?? []} />
      <Section title="Recent events" rows={recent ?? []} />
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: any[] }) {
  return (
    <section className="bg-card border rounded-lg p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="divide-y">
          {rows.map((e) => {
            const loc = e.location as { name: string; slug: string } | null;
            return (
              <li key={e.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{loc?.name ?? "Unknown location"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(e.event_date)}{e.theme ? " · " + e.theme : ""}
                  </p>
                </div>
                <Link
                  href={"/admin/events/" + e.id + "/booth-map"}
                  className="text-sm text-primary hover:underline"
                >
                  Open map
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
