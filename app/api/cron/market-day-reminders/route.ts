// PROMPT 20 - Market day reminder cron.
// Runs hourly. Finds market_events scheduled for ~24 hours in the future and
// sends each assigned vendor an SMS plus the market-day-reminder email.
// Idempotent per (event, vendor) pair via audit_log.
//
// Schedule: top of every hour, 0 * * * *. The hourly cadence means a reminder
// fires within an hour of the 24-hour mark. Times are UTC; quiet-hour windows
// (no sends 02:00-07:00 UTC, roughly 21:00-02:00 CT) are enforced by the route.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms, smsTemplates } from "@/lib/twilio";
import { sendEmail, marketDayReminderTemplate } from "@/lib/resend";
import {
  authorizeCron,
  RunTracker,
  alreadyDone,
  recordAudit,
} from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEDUPE_WINDOW_HOURS = 36; // 1 reminder per (event, vendor) per market

interface EventVendorRow {
  id: string;
  event_id: string;
  vendor_id: string;
  booth_number: string | null;
  payment_status: string | null;
  vendors?: {
    business_name?: string | null;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  market_events?: {
    id?: string;
    event_date?: string | null;
    start_time?: string | null;
    vendor_map_url?: string | null;
    locations?: { name?: string | null } | null;
  } | null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authorizeCron(req);
  if (!auth.ok) return auth.response!;

  const tracker = new RunTracker("market-day-reminders");

  // Quiet hours: skip 02:00-07:00 UTC (21:00-02:00 CT roughly).
  const utcHour = new Date().getUTCHours();
  if (utcHour >= 2 && utcHour < 7) {
    tracker.note(`skipped: quiet hour ${utcHour} UTC`);
    return NextResponse.json(tracker.summary());
  }

  // Target dates: tomorrow and the day after, inclusive. Hourly runs let a
  // reminder fire within an hour of the 24h-out mark.
  const tomorrow = isoDate(addDays(new Date(), 1));

  const db = createAdminClient();

  const { data, error } = await db
    .from("event_vendors")
    .select(
      "id, event_id, vendor_id, booth_number, payment_status, vendors(business_name, contact_name, email, phone), market_events:event_id(id, event_date, start_time, vendor_map_url, locations(name))"
    )
    .eq("market_events.event_date", tomorrow);

  if (error) {
    tracker.err(`event_vendors query failed: ${error.message}`);
    return NextResponse.json(tracker.summary(), { status: 500 });
  }

  const rows = ((data ?? []) as unknown as EventVendorRow[]).filter(
    (r) => r.market_events && r.market_events.event_date === tomorrow
  );
  tracker.inc("candidates", rows.length);

  for (const row of rows) {
    const dedupeKey = {
      action: "market_day_reminder_sent",
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
    const phone = row.vendors?.phone ?? null;
    const email = row.vendors?.email ?? null;
    const locationName = row.market_events?.locations?.name ?? "the market";
    const eventDate = row.market_events?.event_date ?? tomorrow;
    const setupTime = row.market_events?.start_time ?? "see vendor email";
    const boothNumber = row.booth_number ?? undefined;
    const mapUrl = row.market_events?.vendor_map_url ?? undefined;

    let smsOk = false;
    let emailOk = false;

    if (phone) {
      const body = boothNumber
        ? smsTemplates.map_posted({
            vendorName: businessName,
            location: locationName,
            date: eventDate,
            boothNumber,
          })
        : smsTemplates.survey_request({
            location: `${locationName} tomorrow`,
            surveyLink: mapUrl ?? "",
          });
      const res = await sendSms({
        to: phone,
        body,
        vendorId: row.vendor_id,
        messageType: "market_day_reminder",
      });
      smsOk = res.success;
      if (res.success) tracker.inc("sms_sent");
      else tracker.err(`sms event_vendor=${row.id}: ${res.errorMessage ?? "failed"}`);
    } else {
      tracker.inc("skipped_no_phone");
    }

    if (email) {
      const tpl = marketDayReminderTemplate({
        vendorName: businessName,
        location: locationName,
        date: eventDate,
        setupTime,
        boothNumber,
        mapUrl,
      });
      const res = await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [{ name: "category", value: "market_day_reminder" }],
      });
      emailOk = res.success;
      if (res.success) tracker.inc("email_sent");
      else tracker.err(`email event_vendor=${row.id}: ${res.errorMessage ?? "failed"}`);
    } else {
      tracker.inc("skipped_no_email");
    }

    await recordAudit(db, {
      action: "market_day_reminder_sent",
      entityType: "event_vendor",
      entityId: row.id,
      newValues: {
        smsOk,
        emailOk,
        eventId: row.event_id,
        vendorId: row.vendor_id,
        cron: "market-day-reminders",
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
