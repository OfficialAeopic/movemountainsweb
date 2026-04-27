// PROMPT 16 - Subscriber detail.
// Shows subscriber data, location bucket, source, raffle entries, unsubscribe controls,
// and any campaign history (campaigns whose target_location_ids includes this subscriber's bucket).

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { setUnsubscribed, deleteSubscriber } from "../actions";

export default async function SubscriberDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("email_subscribers")
    .select("id, email, name, phone, source, raffle_entries, unsubscribed, unsubscribed_at, created_at, location_id, locations(id, name, slug)")
    .eq("id", id)
    .single();

  if (!sub) return notFound();

  // Campaign history: any campaign that targeted the subscriber's location bucket.
  // If sub.location_id is null, only campaigns with empty target_location_ids may apply (broadcast).
  let campaigns: any[] = [];
  if (sub.location_id) {
    const { data } = await supabase
      .from("email_campaigns")
      .select("id, name, subject, status, sent_at, recipient_count, target_location_ids")
      .contains("target_location_ids", [sub.location_id])
      .order("sent_at", { ascending: false, nullsFirst: false });
    campaigns = data ?? [];
  } else {
    const { data } = await supabase
      .from("email_campaigns")
      .select("id, name, subject, status, sent_at, recipient_count, target_location_ids")
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(20);
    campaigns = (data ?? []).filter((c: any) => !c.target_location_ids || c.target_location_ids.length === 0);
  }

  async function handleUnsubscribe() {
    "use server";
    await setUnsubscribed(id, true);
  }
  async function handleResubscribe() {
    "use server";
    await setUnsubscribed(id, false);
  }
  async function handleDelete() {
    "use server";
    await deleteSubscriber(id);
  }

  const loc = sub.locations as unknown as { id: string; name: string; slug: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/email-lists" className="text-sm text-muted-foreground hover:text-foreground">
            Back to email lists
          </Link>
          <h1 className="text-2xl font-semibold mt-2 break-all">{sub.email}</h1>
          <div className="flex items-center gap-2 mt-2">
            {sub.unsubscribed ? (
              <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-rose-100 text-rose-900 border-rose-200">
                Unsubscribed
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-emerald-100 text-emerald-900 border-emerald-200">
                Subscribed
              </span>
            )}
            {sub.source ? (
              <span className="text-xs text-muted-foreground">Source: {sub.source}</span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          {sub.unsubscribed ? (
            <form action={handleResubscribe}>
              <Button type="submit" variant="outline">Resubscribe</Button>
            </form>
          ) : (
            <form action={handleUnsubscribe}>
              <Button type="submit" variant="outline">Mark unsubscribed</Button>
            </form>
          )}
          <form action={handleDelete}>
            <Button type="submit" variant="destructive">Delete</Button>
          </form>
        </div>
      </div>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Subscriber details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Row label="Name">{sub.name ?? "-"}</Row>
          <Row label="Phone">{sub.phone ?? "-"}</Row>
          <Row label="Location bucket">
            {loc ? (
              <Link href={"/admin/locations/" + loc.slug} className="text-primary hover:underline">
                {loc.name}
              </Link>
            ) : "Unbucketed"}
          </Row>
          <Row label="Raffle entries">{sub.raffle_entries ?? 0}</Row>
          <Row label="Added">{formatDate(sub.created_at)}</Row>
          <Row label="Unsubscribed at">{sub.unsubscribed_at ? formatDate(sub.unsubscribed_at) : "-"}</Row>
        </dl>
      </section>

      <section className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Campaign history</h2>
          <span className="text-xs text-muted-foreground">{campaigns.length} matching campaigns</span>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No campaigns have targeted this bucket yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-2">Campaign</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c: any) => (
                <tr key={c.id}>
                  <td className="py-2">{c.name}</td>
                  <td className="text-muted-foreground">{c.subject}</td>
                  <td className="capitalize">{c.status}</td>
                  <td>{c.recipient_count ?? 0}</td>
                  <td className="text-muted-foreground">{c.sent_at ? formatDate(c.sent_at) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}
