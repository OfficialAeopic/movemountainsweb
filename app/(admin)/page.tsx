import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Stats queries (parallel)
  const [
    { count: upcoming },
    { count: pendingApps },
    { count: outstanding },
    { count: activeVendors }
  ] = await Promise.all([
    supabase
      .from("market_events")
      .select("*", { count: "exact", head: true })
      .gte("event_date", new Date().toISOString().slice(0, 10))
      .lte("event_date", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
      .in("status", ["scheduled", "live"]),
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("invoices").select("*", { count: "exact", head: true }).in("status", ["unpaid", "overdue"]),
    supabase.from("vendors").select("*", { count: "exact", head: true }).eq("status", "active")
  ]);

  // Next 4 upcoming events
  const { data: nextEvents } = await supabase
    .from("market_events")
    .select("id, event_date, status, location:locations(name, slug)")
    .gte("event_date", new Date().toISOString().slice(0, 10))
    .in("status", ["scheduled", "live"])
    .order("event_date", { ascending: true })
    .limit(4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Move Mountains Artisan Market overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Upcoming Markets (30d)" value={upcoming ?? 0} href="/admin/events" />
        <StatCard label="Pending Applications" value={pendingApps ?? 0} href="/admin/applications" />
        <StatCard label="Outstanding Payments" value={outstanding ?? 0} href="/admin/payments" />
        <StatCard label="Active Vendors" value={activeVendors ?? 0} href="/admin/vendors" />
      </div>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Upcoming Markets</h2>
        {nextEvents && nextEvents.length > 0 ? (
          <ul className="divide-y">
            {nextEvents.map((e) => (
              <li key={e.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{(e.location as any)?.name ?? "Unknown location"}</p>
                  <p className="text-sm text-muted-foreground">{e.event_date}</p>
                </div>
                <Link href={"/admin/events/" + e.id} className="text-sm text-primary hover:underline">View</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming markets scheduled.</p>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block bg-card border rounded-lg p-4 hover:border-primary transition-colors">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </Link>
  );
}
