// PROMPT 20 - Payment reminder cron.
// Daily run. Finds invoices that are unpaid and overdue by N days, sends a
// Twilio SMS plus a Resend email, logs both to sms_messages and audit_log.
// Idempotent: a vendor will not get the same reminder twice in 20 hours.
//
// Env contract:
//   CRON_SECRET                 required, bearer token
//   PAYMENT_REMINDER_DAYS_AHEAD optional, default "0" (0 = due today, 1 = due tomorrow)
//   PAYMENT_REMINDER_DAYS_LATE  optional, default "1" (overdue by this many days)
//
// Schedule: 14:00 UTC daily (09:00 CT in summer DST, 08:00 CT in winter).

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms, smsTemplates } from "@/lib/twilio";
import { sendEmail } from "@/lib/resend";
import {
  authorizeCron,
  RunTracker,
  alreadyDone,
  recordAudit,
} from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEDUPE_WINDOW_HOURS = 20;

interface InvoiceRow {
  id: string;
  amount: number | string;
  due_date: string | null;
  vendor_id: string | null;
  event_id: string | null;
  status: string;
  vendors?: {
    business_name?: string | null;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  market_events?: {
    event_date?: string | null;
    locations?: { name?: string | null } | null;
  } | null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authorizeCron(req);
  if (!auth.ok) return auth.response!;

  const tracker = new RunTracker("payment-reminders");
  const daysLate = Number.parseInt(process.env.PAYMENT_REMINDER_DAYS_LATE ?? "1", 10);
  const today = new Date();
  const cutoff = new Date(today.getTime() - daysLate * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const db = createAdminClient();

  const { data, error } = await db
    .from("invoices")
    .select(
      "id, amount, due_date, vendor_id, event_id, status, vendors(business_name, contact_name, email, phone), market_events:event_id(event_date, locations(name))"
    )
    .in("status", ["unpaid", "overdue"])
    .lte("due_date", cutoff);

  if (error) {
    tracker.err(`invoice query failed: ${error.message}`);
    return NextResponse.json(tracker.summary(), { status: 500 });
  }

  const invoices = (data ?? []) as unknown as InvoiceRow[];
  tracker.inc("candidates", invoices.length);

  for (const inv of invoices) {
    if (!inv.vendor_id) {
      tracker.inc("skipped_no_vendor");
      continue;
    }

    const dedupeKey = {
      action: "payment_reminder_sent",
      entityType: "invoice",
      entityId: inv.id,
      windowHours: DEDUPE_WINDOW_HOURS,
    };
    if (await alreadyDone(db, dedupeKey)) {
      tracker.inc("skipped_already_sent");
      continue;
    }

    const businessName = inv.vendors?.business_name ?? inv.vendors?.contact_name ?? "vendor";
    const phone = inv.vendors?.phone ?? null;
    const email = inv.vendors?.email ?? null;
    const locationName = inv.market_events?.locations?.name ?? "the market";
    const eventDate = inv.market_events?.event_date ?? "your upcoming market";
    const amount = `$${Number(inv.amount).toFixed(2)}`;

    let smsOk = false;
    let emailOk = false;

    if (phone) {
      const body = smsTemplates.payment_reminder_tuesday({
        vendorName: businessName,
        location: locationName,
        date: eventDate,
      });
      const res = await sendSms({
        to: phone,
        body,
        vendorId: inv.vendor_id,
        messageType: "payment_reminder_tuesday",
      });
      smsOk = res.success;
      if (!res.success) tracker.err(`sms invoice=${inv.id}: ${res.errorMessage ?? "failed"}`);
      else tracker.inc("sms_sent");
    } else {
      tracker.inc("skipped_no_phone");
    }

    if (email) {
      const subject = `Payment reminder: ${locationName} on ${eventDate}`;
      const html = `<p>Hi ${escape(businessName)},</p><p>Friendly reminder that ${escape(amount)} for <strong>${escape(locationName)}</strong> on <strong>${escape(eventDate)}</strong> is past due${inv.due_date ? ` (due ${escape(inv.due_date)})` : ""}.</p><p>Pay via Zelle, Venmo, or CashApp to lock in your booth.</p><p>Move Mountains Market</p>`;
      const text = `Hi ${businessName}, friendly reminder that ${amount} for ${locationName} on ${eventDate} is past due. Pay via Zelle, Venmo, or CashApp to lock in your booth. Move Mountains Market`;
      const res = await sendEmail({
        to: email,
        subject,
        html,
        text,
        tags: [{ name: "category", value: "payment_reminder" }],
      });
      emailOk = res.success;
      if (!res.success) tracker.err(`email invoice=${inv.id}: ${res.errorMessage ?? "failed"}`);
      else tracker.inc("email_sent");
    } else {
      tracker.inc("skipped_no_email");
    }

    await recordAudit(db, {
      action: "payment_reminder_sent",
      entityType: "invoice",
      entityId: inv.id,
      newValues: {
        smsOk,
        emailOk,
        amount: Number(inv.amount),
        dueDate: inv.due_date,
        cron: "payment-reminders",
      },
    });
    tracker.inc("processed");
  }

  return NextResponse.json(tracker.summary());
}

function escape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
