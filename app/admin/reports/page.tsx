// PROMPT 18 - Reports dashboard.
// Read-only aggregations across revenue, vendors, events, applications, communications.
// All counts and sums use Postgres aggregations via Supabase. Falls back to per-row
// reduce when PostgREST cannot express the group operator (small data volumes only).
// CSV export per section is handled via /api/reports/export?section=...&range=...

import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RangePicker } from "./range-picker";
import { resolveRange, groupBy, sumNumeric, monthKey } from "./_lib";

type Search = Promise<{ range?: string; start?: string; end?: string }>;

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const range = resolveRange(sp);
  const supabase = await createClient();

  // ----- Aggregation queries -----
  // All filtered to the active range where the field semantics fit.
  const [
    invoicesAllInRange,
    invoicesPaidInRange,
    invoicesOutstanding,
    vendorsActive,
    vendorsAll,
    eventsInRange,
    applicationsInRange,
    smsInRange,
    emailCampaignsInRange,
    emailSubscribersAll,
    surveyResponsesInRange,
    locations,
    eventVendorsInRange
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, amount, status, paid_date, created_at, event_id, market_events:event_id(location_id, locations(name))")
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso + "T23:59:59"),
    supabase
      .from("invoices")
      .select("id, amount, paid_date, payment_method, market_events:event_id(location_id, locations(name))")
      .eq("status", "paid")
      .gte("paid_date", range.startIso)
      .lte("paid_date", range.endIso),
    supabase
      .from("invoices")
      .select("id, amount, status, due_date")
      .in("status", ["unpaid", "overdue"]),
    supabase.from("vendors").select("id, status, created_at, is_recurring").eq("status", "active"),
    supabase.from("vendors").select("id, status, created_at, is_recurring"),
    supabase
      .from("market_events")
      .select(
        "id, event_date, status, vendor_capacity, location_id, locations(name)"
      )
      .gte("event_date", range.startIso)
      .lte("event_date", range.endIso),
    supabase
      .from("applications")
      .select("id, status, created_at, location_id, vendor_type_id")
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso + "T23:59:59"),
    supabase
      .from("sms_messages")
      .select("id, status, sent_at, template_key")
      .gte("sent_at", range.startIso)
      .lte("sent_at", range.endIso + "T23:59:59"),
    supabase
      .from("email_campaigns")
      .select("id, status, sent_at, recipient_count, open_count, click_count")
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso + "T23:59:59"),
    supabase
      .from("email_subscribers")
      .select("id, unsubscribed", { count: "exact", head: false }),
    supabase
      .from("survey_responses")
      .select("id, rating, estimated_revenue, would_return, submitted_at, event_id, market_events:event_id(event_date, location_id, locations(name))")
      .gte("submitted_at", range.startIso)
      .lte("submitted_at", range.endIso + "T23:59:59"),
    supabase.from("locations").select("id, name").order("name"),
    supabase
      .from("event_vendors")
      .select("id, event_id, vendor_id, market_events:event_id(event_date, location_id, locations(name), vendor_capacity)")
      .gte("market_events.event_date", range.startIso)
      .lte("market_events.event_date", range.endIso)
  ]);

  // ----- Revenue -----
  const totalInvoiced = sumNumeric(invoicesAllInRange.data ?? [], "amount");
  const totalCollected = sumNumeric(invoicesPaidInRange.data ?? [], "amount");
  const totalOutstanding = sumNumeric(invoicesOutstanding.data ?? [], "amount");

  const revenueByLocation = (() => {
    const grouped = groupBy(invoicesPaidInRange.data ?? [], (r: any) =>
      (r.market_events?.locations?.name as string) ?? "Unattached"
    );
    return Array.from(grouped.entries())
      .map(([location, rows]) => ({
        location,
        amount: sumNumeric(rows as any[], "amount"),
        count: rows.length
      }))
      .sort((a, b) => b.amount - a.amount);
  })();

  const revenueByMonth = (() => {
    const grouped = groupBy(invoicesPaidInRange.data ?? [], (r: any) =>
      monthKey(String(r.paid_date ?? ""))
    );
    return Array.from(grouped.entries())
      .filter(([k]) => k.length === 7)
      .map(([month, rows]) => ({
        month,
        amount: sumNumeric(rows as any[], "amount"),
        count: rows.length
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  })();

  // ----- Vendors -----
  const vendorsActiveCount = (vendorsActive.data ?? []).length;
  // New vendors this quarter window: use the active range as the comparison window.
  const newVendorsInRange = (vendorsAll.data ?? []).filter(
    (v: any) => v.created_at >= range.startIso && v.created_at <= range.endIso + "T23:59:59"
  ).length;
  const recurringRate = (() => {
    const all = vendorsAll.data ?? [];
    if (all.length === 0) return 0;
    const recurring = all.filter((v: any) => v.is_recurring).length;
    return recurring / all.length;
  })();

  // Top vendors by event count: aggregate event_vendors in range per vendor.
  const topVendorsRaw = await supabase
    .from("event_vendors")
    .select("vendor_id, vendors(business_name)")
    .gte("created_at", range.startIso)
    .lte("created_at", range.endIso + "T23:59:59");
  const topVendors = (() => {
    const grouped = groupBy(topVendorsRaw.data ?? [], (r: any) => r.vendor_id as string);
    return Array.from(grouped.entries())
      .map(([vendorId, rows]) => ({
        vendor_id: vendorId,
        business_name: (rows[0] as any).vendors?.business_name ?? "Unknown",
        events: rows.length
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);
  })();

  // ----- Events -----
  const events = eventsInRange.data ?? [];
  const fillRates = (() => {
    const evRows = eventVendorsInRange.data ?? [];
    const byEvent = groupBy(evRows, (r: any) => r.event_id as string);
    return events
      .map((ev: any) => {
        const cap = Number(ev.vendor_capacity ?? 0);
        const vendors = byEvent.get(ev.id)?.length ?? 0;
        return {
          event_id: ev.id,
          event_date: ev.event_date,
          location: (ev as any).locations?.name ?? "-",
          vendors,
          capacity: cap,
          fill: cap > 0 ? vendors / cap : null
        };
      })
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  })();

  // Survey-derived attendance proxy: event -> mean estimated_revenue and avg rating.
  const surveyByEvent = (() => {
    const grouped = groupBy(surveyResponsesInRange.data ?? [], (r: any) => r.event_id as string);
    return Array.from(grouped.entries())
      .map(([eventId, rows]) => {
        const revs = (rows as any[]).map((r) => Number(r.estimated_revenue ?? 0)).filter((n) => n > 0);
        const ratings = (rows as any[]).map((r) => Number(r.rating ?? 0)).filter((n) => n > 0);
        const wouldReturn = (rows as any[]).filter((r) => r.would_return === true).length;
        return {
          event_id: eventId,
          event_date: (rows[0] as any).market_events?.event_date ?? "",
          location: (rows[0] as any).market_events?.locations?.name ?? "-",
          responses: rows.length,
          mean_estimated_revenue: revs.length > 0 ? revs.reduce((a, b) => a + b, 0) / revs.length : 0,
          avg_rating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
          would_return_rate: rows.length > 0 ? wouldReturn / rows.length : 0
        };
      })
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  })();

  // Category distribution: sum the application product_categories in range.
  // PostgREST cannot unnest array columns directly, so this counts category mentions in JS.
  const categoryCounts = await loadCategoryDistribution(supabase, range.startIso, range.endIso);

  // ----- Applications funnel -----
  const apps = applicationsInRange.data ?? [];
  const funnel = {
    total: apps.length,
    pending: apps.filter((a: any) => a.status === "pending").length,
    approved: apps.filter((a: any) => a.status === "approved").length,
    denied: apps.filter((a: any) => a.status === "denied").length,
    waitlist: apps.filter((a: any) => a.status === "waitlist").length,
    withdrawn: apps.filter((a: any) => a.status === "withdrawn").length
  };
  const conversionRate = funnel.total > 0 ? funnel.approved / funnel.total : 0;

  // ----- Communications -----
  const sms = smsInRange.data ?? [];
  const smsSent = sms.filter((s: any) => s.status === "sent" || s.status === "delivered").length;
  const smsFailed = sms.filter((s: any) => s.status === "failed" || s.status === "undelivered").length;
  const campaigns = emailCampaignsInRange.data ?? [];
  const emailRecipients = campaigns.reduce((acc: number, c: any) => acc + Number(c.recipient_count ?? 0), 0);
  const emailOpens = campaigns.reduce((acc: number, c: any) => acc + Number(c.open_count ?? 0), 0);
  const subscribers = emailSubscribersAll.data ?? [];
  const subTotal = subscribers.length;
  const unsubscribed = subscribers.filter((s: any) => s.unsubscribed).length;
  const unsubRate = subTotal > 0 ? unsubscribed / subTotal : 0;
  const openRate = emailRecipients > 0 ? emailOpens / emailRecipients : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Read-only aggregations across the CRM. Adjust the range and use Export per section to pull
          a CSV snapshot.
        </p>
      </div>

      <RangePicker active={range} />

      {/* Revenue */}
      <Section
        title="Revenue"
        exportHref={`/api/reports/export?section=revenue&range=${range.key}&start=${range.startIso}&end=${range.endIso}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Invoiced" value={formatCurrency(totalInvoiced)} hint={`${(invoicesAllInRange.data ?? []).length} invoices in range`} />
          <Stat label="Collected" value={formatCurrency(totalCollected)} hint={`${(invoicesPaidInRange.data ?? []).length} paid in range`} />
          <Stat label="Outstanding" value={formatCurrency(totalOutstanding)} hint={`${(invoicesOutstanding.data ?? []).length} unpaid total`} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Table
            heading="By location"
            head={["Location", "Collected", "Invoices"]}
            rows={revenueByLocation.map((r) => [r.location, formatCurrency(r.amount), r.count])}
            empty="No paid invoices in range."
          />
          <Table
            heading="By month"
            head={["Month", "Collected", "Invoices"]}
            rows={revenueByMonth.map((r) => [r.month, formatCurrency(r.amount), r.count])}
            empty="No paid invoices in range."
          />
        </div>
      </Section>

      {/* Vendors */}
      <Section
        title="Vendors"
        exportHref={`/api/reports/export?section=vendors&range=${range.key}&start=${range.startIso}&end=${range.endIso}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Active vendors" value={String(vendorsActiveCount)} />
          <Stat label="New in range" value={String(newVendorsInRange)} />
          <Stat label="Recurring share" value={`${(recurringRate * 100).toFixed(1)}%`} hint="is_recurring flag" />
        </div>
        <Table
          heading="Top vendors by event assignments in range"
          head={["Vendor", "Events"]}
          rows={topVendors.map((v) => [v.business_name, v.events])}
          empty="No event assignments in this range."
        />
      </Section>

      {/* Events */}
      <Section
        title="Events"
        exportHref={`/api/reports/export?section=events&range=${range.key}&start=${range.startIso}&end=${range.endIso}`}
      >
        <Table
          heading="Vendor fill rate per event"
          head={["Date", "Location", "Vendors", "Capacity", "Fill"]}
          rows={fillRates.map((r) => [
            formatDate(r.event_date),
            r.location,
            r.vendors,
            r.capacity || "-",
            r.fill === null ? "-" : `${(r.fill * 100).toFixed(0)}%`
          ])}
          empty="No events in range."
        />
        <Table
          heading="Survey signal per event (attendance and revenue proxy)"
          head={["Date", "Location", "Responses", "Avg rating", "Mean est. revenue", "Would return"]}
          rows={surveyByEvent.map((s) => [
            formatDate(s.event_date),
            s.location,
            s.responses,
            s.avg_rating > 0 ? s.avg_rating.toFixed(2) : "-",
            s.mean_estimated_revenue > 0 ? formatCurrency(s.mean_estimated_revenue) : "-",
            `${(s.would_return_rate * 100).toFixed(0)}%`
          ])}
          empty="No survey responses in range."
        />
        <Table
          heading="Category distribution from applications in range"
          head={["Category", "Mentions"]}
          rows={categoryCounts.map((c) => [c.name, c.count])}
          empty="No applications in range."
        />
      </Section>

      {/* Applications funnel */}
      <Section
        title="Applications funnel"
        exportHref={`/api/reports/export?section=applications&range=${range.key}&start=${range.startIso}&end=${range.endIso}`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Stat label="Total" value={String(funnel.total)} />
          <Stat label="Pending" value={String(funnel.pending)} />
          <Stat label="Approved" value={String(funnel.approved)} />
          <Stat label="Denied" value={String(funnel.denied)} />
          <Stat label="Waitlist" value={String(funnel.waitlist)} />
          <Stat label="Withdrawn" value={String(funnel.withdrawn)} />
        </div>
        <div className="mt-4">
          <Stat
            label="Conversion rate (approved / total)"
            value={`${(conversionRate * 100).toFixed(1)}%`}
            hint="Counts applications created in the active range."
          />
        </div>
      </Section>

      {/* Communications */}
      <Section
        title="Communications"
        exportHref={`/api/reports/export?section=communications&range=${range.key}&start=${range.startIso}&end=${range.endIso}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="SMS sent / delivered" value={String(smsSent)} hint={`${smsFailed} failed`} />
          <Stat
            label="Email recipients"
            value={String(emailRecipients)}
            hint={`${campaigns.length} campaigns in range`}
          />
          <Stat
            label="Open rate"
            value={openRate === null ? "-" : `${(openRate * 100).toFixed(1)}%`}
            hint="Placeholder until Resend webhook lands"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Stat label="Total subscribers" value={String(subTotal)} />
          <Stat
            label="Unsubscribe rate"
            value={`${(unsubRate * 100).toFixed(2)}%`}
            hint={`${unsubscribed} unsubscribed of ${subTotal}`}
          />
        </div>
      </Section>

      <div className="text-xs text-muted-foreground">
        Locations on file: {locations.data?.length ?? 0}.
      </div>
    </div>
  );
}

// ----- Inline UI helpers (kept local to keep server-component bundle small) -----

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}

function Section({
  title,
  exportHref,
  children
}: {
  title: string;
  exportHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border rounded-lg p-6 space-y-4">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <a
          href={exportHref}
          className="text-xs px-3 py-1.5 rounded-md border bg-card hover:bg-accent"
        >
          Export CSV
        </a>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Table({
  heading,
  head,
  rows,
  empty
}: {
  heading: string;
  head: string[];
  rows: Array<Array<string | number>>;
  empty: string;
}) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="px-3 py-2 border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
        {heading}
      </div>
      <table className="w-full">
        <thead className="bg-muted/20">
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="text-left text-[11px] font-medium uppercase tracking-wider px-3 py-2"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-3 py-6 text-center text-xs text-muted-foreground">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={idx} className="hover:bg-muted/30">
                {r.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Category distribution requires unnesting the product_categories uuid[] column.
 * PostgREST does not expose unnest, so the join runs in JS over the (small) range slice.
 */
async function loadCategoryDistribution(supabase: any, startIso: string, endIso: string) {
  const [{ data: apps }, { data: cats }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, product_categories")
      .gte("created_at", startIso)
      .lte("created_at", endIso + "T23:59:59"),
    supabase.from("product_categories").select("id, name").eq("active", true)
  ]);

  const nameById = new Map<string, string>((cats ?? []).map((c: any) => [c.id, c.name]));
  const tally = new Map<string, number>();
  for (const a of apps ?? []) {
    for (const cat of (a as any).product_categories ?? []) {
      const name = nameById.get(cat) ?? "Unknown";
      tally.set(name, (tally.get(name) ?? 0) + 1);
    }
  }
  return Array.from(tally.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
