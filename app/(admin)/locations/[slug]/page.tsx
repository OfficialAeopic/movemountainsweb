import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function LocationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: location } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!location) return notFound();

  const { data: spaces } = await supabase
    .from("space_types")
    .select("*")
    .eq("location_id", location.id)
    .order("display_order");

  const { data: upcoming } = await supabase
    .from("market_events")
    .select("id, event_date, status")
    .eq("location_id", location.id)
    .gte("event_date", new Date().toISOString().slice(0, 10))
    .order("event_date")
    .limit(8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{location.name}</h1>
        <p className="text-sm text-muted-foreground">{location.schedule_description}</p>
      </div>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Row label="Address">{location.address}, {location.city}, {location.state} {location.zip}</Row>
          <Row label="Schedule">{location.schedule_description}</Row>
          <Row label="Max Vendors">{location.max_vendors ?? "-"}</Row>
          <Row label="Property Management">{location.property_management}</Row>
        </dl>
      </section>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Space Types</h2>
        {spaces && spaces.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="pb-2">Name</th><th>First Market</th><th>Recurring</th><th>Capacity</th></tr>
            </thead>
            <tbody className="divide-y">
              {spaces.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{s.name}</td>
                  <td>{s.price_first_market ? formatCurrency(s.price_first_market) : "Contact for pricing"}</td>
                  <td>{s.price_recurring ? formatCurrency(s.price_recurring) : "Contact for pricing"}</td>
                  <td>{s.capacity ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-muted-foreground">No space types configured.</p>}
      </section>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
        {upcoming && upcoming.length > 0 ? (
          <ul className="divide-y">
            {upcoming.map((e) => (
              <li key={e.id} className="py-2 text-sm flex justify-between">
                <span>{e.event_date}</span>
                <span className="text-muted-foreground capitalize">{e.status}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No upcoming events.</p>}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
