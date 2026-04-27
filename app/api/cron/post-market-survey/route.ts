// PROMPT 20 - Post-market survey cron.
// Runs every morning. Finds market_events whose date is yesterday and emails
// every assigned vendor the post-market survey link.
// Idempotent per (event, vendor) via audit_log.
//
// Schedule: 14:00 UTC daily (same window as payment-reminders, but the date
// filter selects yesterday, so it fires the morning after each market in CT).

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, postMarketSurveyTemplate } from "@/lib/resend";
import {
  authorizeCron,
  RunTracker,
  alreadyDone,
  recordAudit,
} from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEDUPE_WINDOW_HOURS = 168; // 1 survey per (event, vendor) per week

interface EventVendorRow {
  id: string;
  event_id: string;
  vendor_id: string;
  vendors?: {
    business_name?: string | null;
    contact_name?: string | null;
    email?: string | null;
  } | null;
  market_events?: {
    event_date?: string | null;
    locations?: { name?: string | null } | null;
  } | null;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://movemountainsmarket.com";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authorizeCron(req);
  if (!auth.ok) return auth.response!;

  const tracker = new RunTracker("post-market-survey");
  const db = createAdminClient();

  const yesterday = isoDate(addDays(new Date(), -1));

  const { data, error } = await db
    .from("event_vendors")
    .select(
      "id, event_id, vendor_id, vendors(business_name, contact_name, email), market_events:event_id(event_date, locations(name))"
    )
    .eq("market_events.event_date", yesterday);

  if (error) {
    tracker.err(`event_vendors query failed: ${error.message}`);
    return NextResponse.json(tracker.summary(), { status: 500 });
  }

  const rows = ((data ?? []) as unknown as EventVendorRow[]).filter(
    (r) => r.market_events && r.market_events.event_date === yesterday
  );
  tracker.inc("candidates", rows.length);

  for (const row of rows) {
    const dedupeKey = {
      action: "post_market_survey_sent",
      entityType: "event_vendor",
      entityId: row.id,
      windowHours: DEDUPE_WINDOW_HOURS,
    };
    if (await alreadyDone(db, dedupeKey)) {
      tracker.inc("skipped_already_sent");
      continue;
    }

    const businessName =
      row.vendors?.business_name ?? row.vendors?.contact_name ?? "vendor";
    const email = row.vendors?.email ?? null;
    const locationName = row.market_events?.locations?.name ?? "the market";

    if (!email) {
      tracker.inc("skipped_no_email");
      continue;
    }

    const surveyUrl = `${APP_URL.replace(/\/$/, "")}/survey/${row.event_id}?vendor=${row.vendor_id}`;
    const tpl = postMarketSurveyTemplate({
      vendorName: businessName,
      location: locationName,
      surveyUrl,
    });

    const res = await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "category", value: "post_market_survey" }],
    });

    if (res.success) tracker.inc("email_sent");
    else tracker.err(`email event_vendor=${row.id}: ${res.errorMessage ?? "failed"}`);

    await recordAudit(db, {
      action: "post_market_survey_sent",
      entityType: "event_vendor",
      entityId: row.id,
      newValues: {
        emailOk: res.success,
        surveyUrl,
        eventId: row.event_id,
        vendorId: row.vendor_id,
        cron: "post-market-survey",
      },
    });
    tracker.inc("processed");
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
