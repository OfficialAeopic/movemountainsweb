import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteEvent } from "../actions";
import type { EventStatus } from "@/types/database";

const STATUS_VARIANT: Record<EventStatus, "default" | "secondary" | "muted" | "destructive" | "success" | "warning"> = {
  scheduled: "default",
  live: "success",
  complete: "muted",
  cancelled: "destructive"
};

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("market_events")
    .select("*, location:locations(id, name, slug), musician:musicians(id, name, handle)")
    .eq("id", id)
    .single();

  if (!event) return notFound();

  const { data: assignments } = await supabase
    .from("event_vendors")
    .select("id, booth_number, amount, payment_status, vendor:vendors(id, business_name, contact_name, phone, email), space_type:space_types(name)")
    .eq("event_id", id)
    .order("booth_number", { ascending: true, nullsFirst: false });

  const totalVendors = assignments?.length ?? 0;
  const paidCount = (assignments ?? []).filter((a) => a.payment_status === "paid").length;
  const totalCollected = (assignments ?? [])
    .filter((a) => a.payment_status === "paid")
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  const loc = event.location as unknown as { id: string; name: string; slug: string } | null;
  const musician = event.musician as unknown as { id: string; name: string; handle: string | null } | null;

  async function handleDelete() {
    "use server";
    await deleteEvent(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">
            Back to events
          </Link>
          <h1 className="text-2xl font-semibold mt-2">
            {loc?.name ?? "Unknown location"} on {formatDate(event.event_date)}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={STATUS_VARIANT[event.status as EventStatus]}>{event.status}</Badge>
            {event.theme ? <span className="text-sm text-muted-foreground">{event.theme}</span> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={"/admin/events/" + id + "/booth-map"}>Booth map</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={"/admin/events/" + id + "/edit"}>Edit</Link>
          </Button>
          <form action={handleDelete}>
            <Button type="submit" variant="destructive">Delete</Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Vendors assigned" value={String(totalVendors) + (event.vendor_capacity ? " / " + event.vendor_capacity : "")} />
        <Stat label="Paid" value={String(paidCount) + " of " + totalVendors} />
        <Stat label="Collected" value={formatCurrency(totalCollected)} />
      </div>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Row label="Date">{formatDate(event.event_date)}</Row>
          <Row label="Time">
            {event.start_time ? event.start_time.slice(0, 5) : "-"}
            {event.end_time ? " to " + event.end_time.slice(0, 5) : ""}
          </Row>
          <Row label="Location">
            {loc ? (
              <Link href={"/admin/locations/" + loc.slug} className="text-primary hover:underline">
                {loc.name}
              </Link>
            ) : "-"}
          </Row>
          <Row label="Musician">{musician ? musician.name + (musician.handle ? " (" + musician.handle + ")" : "") : "None booked"}</Row>
          <Row label="Vendor capacity">{event.vendor_capacity ?? "-"}</Row>
          <Row label="Raffle prize">{event.raffle_prize_description ?? "-"}</Row>
        </dl>
        {event.notes ? (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Internal notes</p>
            <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
          </div>
        ) : null}
      </section>

      <section className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Vendor assignments</h2>
          <span className="text-xs text-muted-foreground">{totalVendors} assigned</span>
        </div>
        {assignments && assignments.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-2">Booth</th>
                <th>Vendor</th>
                <th>Space</th>
                <th>Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((a) => {
                const vendor = a.vendor as unknown as { id: string; business_name: string; contact_name: string | null; phone: string | null; email: string | null } | null;
                const space = a.space_type as unknown as { name: string } | null;
                return (
                  <tr key={a.id}>
                    <td className="py-2">{a.booth_number ?? "-"}</td>
                    <td>
                      {vendor ? (
                        <Link href={"/admin/vendors/" + vendor.id} className="text-primary hover:underline">
                          {vendor.business_name}
                        </Link>
                      ) : "-"}
                    </td>
                    <td>{space?.name ?? "-"}</td>
                    <td>{a.amount ? formatCurrency(Number(a.amount)) : "-"}</td>
                    <td className="capitalize">{a.payment_status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">No vendors assigned yet.</p>
        )}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
