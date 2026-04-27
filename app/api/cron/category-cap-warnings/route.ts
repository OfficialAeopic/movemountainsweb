// PROMPT 20 - Category cap warnings cron.
// Daily run. For each upcoming market_event in the next N days (default 14),
// computes per-category fill against the configured caps and emails the admin
// when any category is at 80% or higher. Idempotent per (event, category) per
// day so repeated runs do not spam.
//
// Schedule: 13:00 UTC daily (08:00 CT in summer DST).
//
// Env contract:
//   CRON_SECRET                     required
//   ADMIN_NOTIFICATION_EMAIL        required for sends; if missing, route logs a note
//   CATEGORY_CAP_LOOKAHEAD_DAYS     optional, default 14

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import {
  authorizeCron,
  RunTracker,
  alreadyDone,
  recordAudit,
  calculateCapFill,
  categoriesNearCap,
  type AssignedVendor,
  type CategoryCap,
} from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEDUPE_WINDOW_HOURS = 22; // one warning per event/category/day

interface MarketEventRow {
  id: string;
  event_date: string;
  locations?: { name?: string | null } | null;
}

interface CategoryCapRow {
  product_category_id: string;
  cap: number;
  product_categories?: { name?: string | null } | null;
}

interface EventVendorRow {
  vendor_id: string;
  vendors?: { product_categories?: string[] | null } | null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authorizeCron(req);
  if (!auth.ok) return auth.response!;

  const tracker = new RunTracker("category-cap-warnings");
  const db = createAdminClient();
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? null;
  if (!adminEmail) {
    tracker.note("ADMIN_NOTIFICATION_EMAIL not set, will compute but not send");
  }

  const lookaheadDays = Number.parseInt(
    process.env.CATEGORY_CAP_LOOKAHEAD_DAYS ?? "14",
    10
  );
  const today = isoDate(new Date());
  const horizon = isoDate(addDays(new Date(), lookaheadDays));

  const { data: events, error: evErr } = await db
    .from("market_events")
    .select("id, event_date, locations(name)")
    .gte("event_date", today)
    .lte("event_date", horizon)
    .neq("status", "cancelled");

  if (evErr) {
    tracker.err(`market_events query failed: ${evErr.message}`);
    return NextResponse.json(tracker.summary(), { status: 500 });
  }

  const eventList = (events ?? []) as unknown as MarketEventRow[];
  tracker.inc("events_checked", eventList.length);

  for (const ev of eventList) {
    const { data: capRows, error: capErr } = await db
      .from("category_caps")
      .select("product_category_id, cap, product_categories(name)")
      .eq("event_id", ev.id);

    if (capErr) {
      tracker.err(`caps event=${ev.id}: ${capErr.message}`);
      continue;
    }
    const caps: CategoryCap[] = ((capRows ?? []) as unknown as CategoryCapRow[]).map(
      (c) => ({
        productCategoryId: c.product_category_id,
        cap: c.cap,
        name: c.product_categories?.name ?? undefined,
      })
    );
    if (caps.length === 0) {
      tracker.inc("events_without_caps");
      continue;
    }

    const { data: assignedRows, error: avErr } = await db
      .from("event_vendors")
      .select("vendor_id, vendors(product_categories)")
      .eq("event_id", ev.id);

    if (avErr) {
      tracker.err(`vendors event=${ev.id}: ${avErr.message}`);
      continue;
    }
    const assigned: AssignedVendor[] = ((assignedRows ?? []) as unknown as EventVendorRow[]).map(
      (r) => ({
        vendorId: r.vendor_id,
        productCategoryIds: r.vendors?.product_categories ?? [],
      })
    );

    const fill = calculateCapFill(assigned, caps);
    const hot = categoriesNearCap(fill);
    if (hot.length === 0) continue;

    tracker.inc("events_with_warnings");

    const filtered = [];
    for (const h of hot) {
      const dedupeKey = {
        action: "category_cap_warning_sent",
        entityType: "category_cap",
        entityId: `${ev.id}:${h.productCategoryId}`,
        windowHours: DEDUPE_WINDOW_HOURS,
      };
      if (await alreadyDone(db, dedupeKey)) {
        tracker.inc("skipped_already_warned");
        continue;
      }
      filtered.push(h);
    }
    if (filtered.length === 0) continue;

    const locationName = ev.locations?.name ?? "Unknown location";
    const subject = `Category cap warning: ${locationName} on ${ev.event_date}`;
    const rows = filtered
      .map(
        (f) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escape(f.name ?? "category")}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;">${f.count} / ${f.cap}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;">${Math.round(f.fillPct * 100)}%</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${f.exceeded ? "OVER" : "near cap"}</td></tr>`
      )
      .join("");
    const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#222;"><p>${filtered.length} categor${filtered.length === 1 ? "y is" : "ies are"} approaching or exceeding cap for <strong>${escape(locationName)}</strong> on <strong>${escape(ev.event_date)}</strong>.</p><table style="border-collapse:collapse;margin-top:10px;"><thead><tr><th style="text-align:left;padding:6px 12px;border-bottom:2px solid #333;">Category</th><th style="text-align:right;padding:6px 12px;border-bottom:2px solid #333;">Filled</th><th style="text-align:right;padding:6px 12px;border-bottom:2px solid #333;">%</th><th style="padding:6px 12px;border-bottom:2px solid #333;">Status</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:18px;">Review the event in the CRM to approve or hold incoming applications in these categories.</p></body></html>`;
    const text = filtered
      .map((f) => `${f.name ?? "category"}: ${f.count}/${f.cap} (${Math.round(f.fillPct * 100)}%)${f.exceeded ? " OVER" : ""}`)
      .join("\n");

    let emailOk = false;
    if (adminEmail) {
      const res = await sendEmail({
        to: adminEmail,
        subject,
        html,
        text,
        tags: [{ name: "category", value: "category_cap_warning" }],
      });
      emailOk = res.success;
      if (res.success) tracker.inc("emails_sent");
      else tracker.err(`email event=${ev.id}: ${res.errorMessage ?? "failed"}`);
    }

    for (const h of filtered) {
      await recordAudit(db, {
        action: "category_cap_warning_sent",
        entityType: "category_cap",
        entityId: `${ev.id}:${h.productCategoryId}`,
        newValues: {
          emailOk,
          eventId: ev.id,
          eventDate: ev.event_date,
          category: h.name,
          count: h.count,
          cap: h.cap,
          fillPct: h.fillPct,
          exceeded: h.exceeded,
          cron: "category-cap-warnings",
        },
      });
    }
    tracker.inc("warnings_processed", filtered.length);
  }

  return NextResponse.json(tracker.summary());
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function escape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
