// PROMPT 18 - Reports CSV export endpoint.
// GET /api/reports/export?section=revenue|vendors|events|applications|communications
// &range=30d|quarter|year|custom&start=YYYY-MM-DD&end=YYYY-MM-DD
//
// Server-only. Requires staff session via createClient (admin layout already protects
// the surface that links here, but we re-check here in case the URL is shared).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "@/lib/supabase/auth";
import { resolveRange, toCsv, groupBy, sumNumeric, monthKey } from "@/app/(admin)/reports/_lib";

export const dynamic = "force-dynamic";

type Section = "revenue" | "vendors" | "events" | "applications" | "communications";

const ALLOWED: Section[] = ["revenue", "vendors", "events", "applications", "communications"];

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session || (session.role !== "admin" && session.role !== "staff")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const section = (url.searchParams.get("section") ?? "") as Section;
  if (!ALLOWED.includes(section)) {
    return NextResponse.json({ error: "invalid section" }, { status: 400 });
  }

  const range = resolveRange({
    range: url.searchParams.get("range") ?? undefined,
    start: url.searchParams.get("start") ?? undefined,
    end: url.searchParams.get("end") ?? undefined
  });

  const supabase = await createClient();
  let csv = "";
  let filename = `${section}-${range.startIso}-to-${range.endIso}.csv`;

  if (section === "revenue") {
    const { data: paid } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, amount, paid_date, payment_method, vendors(business_name), market_events:event_id(event_date, locations(name))"
      )
      .eq("status", "paid")
      .gte("paid_date", range.startIso)
      .lte("paid_date", range.endIso)
      .order("paid_date", { ascending: true });

    const rows = (paid ?? []).map((r: any) => ({
      invoice_number: r.invoice_number ?? r.id,
      vendor: r.vendors?.business_name ?? "",
      event_date: r.market_events?.event_date ?? "",
      location: r.market_events?.locations?.name ?? "",
      payment_method: r.payment_method ?? "",
      paid_date: r.paid_date ?? "",
      amount: r.amount ?? 0
    }));

    // Append a totals block as a second CSV section.
    const byLocation = Array.from(
      groupBy(paid ?? [], (r: any) => (r.market_events?.locations?.name as string) ?? "Unattached").entries()
    ).map(([location, rs]) => ({ location, collected: sumNumeric(rs as any[], "amount"), invoices: rs.length }));
    const byMonth = Array.from(
      groupBy(paid ?? [], (r: any) => monthKey(String(r.paid_date ?? ""))).entries()
    )
      .filter(([k]) => k.length === 7)
      .map(([month, rs]) => ({ month, collected: sumNumeric(rs as any[], "amount"), invoices: rs.length }))
      .sort((a, b) => a.month.localeCompare(b.month));

    csv =
      "Section: Paid invoices\n" +
      toCsv(rows) +
      "\nSection: By location\n" +
      toCsv(byLocation) +
      "\nSection: By month\n" +
      toCsv(byMonth);
  } else if (section === "vendors") {
    const [{ data: vendors }, { data: assignments }] = await Promise.all([
      supabase.from("vendors").select("id, business_name, status, is_recurring, total_markets_attended, created_at"),
      supabase
        .from("event_vendors")
        .select("vendor_id, vendors(business_name), market_events:event_id(event_date)")
        .gte("created_at", range.startIso)
        .lte("created_at", range.endIso + "T23:59:59")
    ]);

    const eventCounts = groupBy(assignments ?? [], (r: any) => r.vendor_id as string);
    const rows = (vendors ?? [])
      .map((v: any) => ({
        vendor_id: v.id,
        business_name: v.business_name,
        status: v.status,
        is_recurring: v.is_recurring,
        total_markets_attended_lifetime: v.total_markets_attended ?? 0,
        events_in_range: eventCounts.get(v.id)?.length ?? 0,
        created_at: v.created_at
      }))
      .sort((a, b) => b.events_in_range - a.events_in_range);

    csv = "Section: Vendors with event activity in range\n" + toCsv(rows);
  } else if (section === "events") {
    const [{ data: events }, { data: ev }, { data: surveys }] = await Promise.all([
      supabase
        .from("market_events")
        .select("id, event_date, status, vendor_capacity, locations(name)")
        .gte("event_date", range.startIso)
        .lte("event_date", range.endIso)
        .order("event_date", { ascending: true }),
      supabase
        .from("event_vendors")
        .select("id, event_id, market_events:event_id(event_date)")
        .gte("market_events.event_date", range.startIso)
        .lte("market_events.event_date", range.endIso),
      supabase
        .from("survey_responses")
        .select("event_id, rating, estimated_revenue, would_return")
        .gte("submitted_at", range.startIso)
        .lte("submitted_at", range.endIso + "T23:59:59")
    ]);

    const byEv = groupBy(ev ?? [], (r: any) => r.event_id as string);
    const surveysBy = groupBy(surveys ?? [], (r: any) => r.event_id as string);

    const rows = (events ?? []).map((e: any) => {
      const vCount = byEv.get(e.id)?.length ?? 0;
      const sList = (surveysBy.get(e.id) ?? []) as any[];
      const ratings = sList.map((s) => Number(s.rating ?? 0)).filter((n) => n > 0);
      const revs = sList.map((s) => Number(s.estimated_revenue ?? 0)).filter((n) => n > 0);
      const wouldReturn = sList.filter((s) => s.would_return === true).length;
      return {
        event_id: e.id,
        event_date: e.event_date,
        location: e.locations?.name ?? "",
        status: e.status,
        capacity: e.vendor_capacity ?? "",
        vendors_assigned: vCount,
        fill_rate_pct: e.vendor_capacity ? Math.round((vCount / e.vendor_capacity) * 100) : "",
        survey_responses: sList.length,
        avg_rating: ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "",
        mean_estimated_revenue: revs.length ? +(revs.reduce((a, b) => a + b, 0) / revs.length).toFixed(2) : "",
        would_return_pct: sList.length ? Math.round((wouldReturn / sList.length) * 100) : ""
      };
    });

    csv = "Section: Events with fill and survey aggregates\n" + toCsv(rows);
  } else if (section === "applications") {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, business_name, email, status, created_at, decided_at, location_id, locations(name)")
      .gte("created_at", range.startIso)
      .lte("created_at", range.endIso + "T23:59:59")
      .order("created_at", { ascending: true });

    const rows = (apps ?? []).map((a: any) => ({
      application_id: a.id,
      business_name: a.business_name,
      email: a.email,
      location: a.locations?.name ?? "",
      status: a.status,
      created_at: a.created_at,
      decided_at: a.decided_at ?? ""
    }));

    const byStatus = Array.from(
      groupBy(apps ?? [], (r: any) => r.status as string).entries()
    ).map(([status, rs]) => ({ status, count: rs.length }));

    csv =
      "Section: Applications in range\n" +
      toCsv(rows) +
      "\nSection: Funnel\n" +
      toCsv(byStatus);
  } else if (section === "communications") {
    const [{ data: sms }, { data: campaigns }, { data: subs }] = await Promise.all([
      supabase
        .from("sms_messages")
        .select("id, to_phone, template_key, status, sent_at")
        .gte("sent_at", range.startIso)
        .lte("sent_at", range.endIso + "T23:59:59")
        .order("sent_at", { ascending: true }),
      supabase
        .from("email_campaigns")
        .select("id, name, subject, status, recipient_count, open_count, click_count, sent_at, created_at")
        .gte("created_at", range.startIso)
        .lte("created_at", range.endIso + "T23:59:59")
        .order("created_at", { ascending: true }),
      supabase.from("email_subscribers").select("id, unsubscribed")
    ]);

    const smsRows = (sms ?? []).map((s: any) => ({
      sent_at: s.sent_at,
      to_phone: s.to_phone,
      template_key: s.template_key ?? "custom",
      status: s.status
    }));
    const campaignRows = (campaigns ?? []).map((c: any) => ({
      name: c.name,
      subject: c.subject,
      status: c.status,
      recipients: c.recipient_count ?? 0,
      opens: c.open_count ?? 0,
      clicks: c.click_count ?? 0,
      sent_at: c.sent_at ?? "",
      created_at: c.created_at
    }));
    const subTotal = (subs ?? []).length;
    const unsub = (subs ?? []).filter((s: any) => s.unsubscribed).length;
    const summary = [
      {
        sms_sent_or_delivered: smsRows.filter((r) => r.status === "sent" || r.status === "delivered").length,
        sms_failed: smsRows.filter((r) => r.status === "failed" || r.status === "undelivered").length,
        email_campaigns: campaignRows.length,
        email_recipients: campaignRows.reduce((a, b) => a + b.recipients, 0),
        email_opens: campaignRows.reduce((a, b) => a + b.opens, 0),
        subscribers_total: subTotal,
        subscribers_unsubscribed: unsub
      }
    ];

    csv =
      "Section: Summary\n" +
      toCsv(summary) +
      "\nSection: SMS messages\n" +
      toCsv(smsRows) +
      "\nSection: Email campaigns\n" +
      toCsv(campaignRows);
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
