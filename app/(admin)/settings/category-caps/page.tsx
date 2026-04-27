// PROMPT 19 - Settings: Category caps overview.
// Read-only summary of currently-set caps per upcoming event with a deep link to per-event config.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function CategoryCapsTab() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: events }, { data: caps }, { data: cats }] = await Promise.all([
    supabase
      .from("market_events")
      .select("id, event_date, status, locations(name)")
      .gte("event_date", today)
      .in("status", ["scheduled", "live"])
      .order("event_date", { ascending: true })
      .limit(20),
    supabase.from("category_caps").select("id, event_id, product_category_id, cap"),
    supabase.from("product_categories").select("id, name").eq("active", true)
  ]);

  const catName = new Map<string, string>((cats ?? []).map((c: any) => [c.id, c.name]));
  const capsByEvent = new Map<string, Array<{ name: string; cap: number }>>();
  for (const c of caps ?? []) {
    const list = capsByEvent.get((c as any).event_id) ?? [];
    list.push({ name: catName.get((c as any).product_category_id) ?? "Unknown", cap: (c as any).cap });
    capsByEvent.set((c as any).event_id, list);
  }

  return (
    <div className="space-y-4">
      <section className="bg-card border rounded-lg p-6 space-y-3">
        <header>
          <h2 className="text-lg font-semibold">Category caps per event</h2>
          <p className="text-xs text-muted-foreground">
            Per-event configuration lives on the event detail page. This tab summarizes all upcoming
            events.
          </p>
        </header>

        <div className="space-y-3">
          {(events ?? []).map((e: any) => {
            const list = capsByEvent.get(e.id) ?? [];
            return (
              <div key={e.id} className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(e.event_date)} - {e.locations?.name ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {list.length} cap{list.length === 1 ? "" : "s"} configured
                    </p>
                  </div>
                  <Link
                    href={`/admin/events/${e.id}`}
                    className="text-xs px-3 py-1.5 rounded-md border bg-card hover:bg-accent"
                  >
                    Open event
                  </Link>
                </div>
                {list.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {list.map((c, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-muted/30"
                      >
                        {c.name}: max {c.cap}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No caps set. Defaults to unlimited.</p>
                )}
              </div>
            );
          })}
          {(!events || events.length === 0) && (
            <p className="text-sm text-muted-foreground py-4">No upcoming events scheduled.</p>
          )}
        </div>
      </section>
    </div>
  );
}
