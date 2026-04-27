import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { EventFilters } from "./_components/event-filters";
import type { EventStatus } from "@/types/database";

type SearchParams = Promise<{
  location?: string;
  status?: string;
  from?: string;
  to?: string;
}>;

const STATUS_VARIANT: Record<EventStatus, "default" | "secondary" | "muted" | "destructive" | "success" | "warning"> = {
  scheduled: "default",
  live: "success",
  complete: "muted",
  cancelled: "destructive"
};

export default async function EventsList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("market_events")
    .select("id, event_date, start_time, end_time, status, theme, vendor_capacity, location:locations(id, name)")
    .order("event_date", { ascending: false });

  if (sp.location) query = query.eq("location_id", sp.location);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.from) query = query.gte("event_date", sp.from);
  if (sp.to) query = query.lte("event_date", sp.to);

  const { data: events } = await query;

  // Vendor counts per event
  const ids = (events ?? []).map((e) => e.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: ev } = await supabase
      .from("event_vendors")
      .select("event_id")
      .in("event_id", ids);
    for (const row of ev ?? []) {
      counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">Schedule and manage market dates.</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">New event</Link>
        </Button>
      </div>

      <EventFilters locations={locations ?? []} />

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Location</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Theme</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Vendors</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(events ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No events match these filters.
                </td>
              </tr>
            ) : (
              (events ?? []).map((e) => {
                const loc = e.location as unknown as { id: string; name: string } | null;
                const count = counts.get(e.id) ?? 0;
                const cap = e.vendor_capacity ?? null;
                return (
                  <tr key={e.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={"/admin/events/" + e.id} className="font-medium text-primary hover:underline">
                        {formatDate(e.event_date)}
                      </Link>
                      {e.start_time ? (
                        <p className="text-xs text-muted-foreground">{e.start_time.slice(0, 5)}{e.end_time ? " to " + e.end_time.slice(0, 5) : ""}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm">{loc?.name ?? "Unknown"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{e.theme ?? "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      {count}{cap ? " / " + cap : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[e.status as EventStatus]}>{e.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={"/admin/events/" + e.id} className="text-sm text-primary hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
