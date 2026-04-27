// PROMPT 20 - Contract follow-up cron.
// Daily run. Finds applications where a SignatureAPI envelope was sent and the
// waiver remains unsigned 3 days later, sends a Resend follow-up email.
// Idempotent per application via audit_log dedupe.
//
// Schedule: 15:00 UTC daily (10:00 CT in summer DST).
//
// Env contract:
//   CRON_SECRET                  required
//   CONTRACT_FOLLOWUP_DAYS       optional, default "3"

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import {
  authorizeCron,
  RunTracker,
  alreadyDone,
  recordAudit,
} from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEDUPE_WINDOW_HOURS = 72; // one follow-up per application per 3-day window

interface ApplicationRow {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  waiver_envelope_id: string | null;
  waiver_signed: boolean | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
  status: string;
  locations?: { name?: string | null } | null;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://movemountainsmarket.com";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authorizeCron(req);
  if (!auth.ok) return auth.response!;

  const tracker = new RunTracker("contract-followup");
  const db = createAdminClient();

  const followupDays = Number.parseInt(
    process.env.CONTRACT_FOLLOWUP_DAYS ?? "3",
    10
  );
  const cutoffIso = new Date(
    Date.now() - followupDays * 86_400_000
  ).toISOString();

  const { data, error } = await db
    .from("applications")
    .select(
      "id, business_name, contact_name, email, waiver_envelope_id, waiver_signed, created_at, updated_at, decided_at, status, locations(name)"
    )
    .eq("status", "approved")
    .eq("waiver_signed", false)
    .not("waiver_envelope_id", "is", null)
    .lte("decided_at", cutoffIso);

  if (error) {
    tracker.err(`applications query failed: ${error.message}`);
    return NextResponse.json(tracker.summary(), { status: 500 });
  }

  const apps = (data ?? []) as unknown as ApplicationRow[];
  tracker.inc("candidates", apps.length);

  for (const app of apps) {
    if (!app.email) {
      tracker.inc("skipped_no_email");
      continue;
    }
    const dedupeKey = {
      action: "contract_followup_sent",
      entityType: "application",
      entityId: app.id,
      windowHours: DEDUPE_WINDOW_HOURS,
    };
    if (await alreadyDone(db, dedupeKey)) {
      tracker.inc("skipped_already_sent");
      continue;
    }

    const businessName = app.business_name ?? app.contact_name ?? "vendor";
    const locationName = app.locations?.name ?? "Move Mountains Market";
    const resumeUrl = `${APP_URL.replace(/\/$/, "")}/portal/waiver?application=${app.id}`;

    const subject = `Reminder: sign your ${locationName} liability waiver`;
    const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#222;"><p>Hi ${escape(businessName)},</p><p>Your application for <strong>${escape(locationName)}</strong> was approved, but the liability waiver is still unsigned.</p><p>Booth confirmation cannot proceed until the waiver is on file.</p><p style="margin:24px 0;"><a href="${escape(resumeUrl)}" style="background:#3F5B3F;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:4px;display:inline-block;">Sign the waiver</a></p><p>Reply to this email if you need a fresh signing link.</p><p>Move Mountains Market</p></body></html>`;
    const text = `Hi ${businessName}, your application for ${locationName} was approved, but the liability waiver is still unsigned. Booth confirmation cannot proceed until the waiver is on file. Sign here: ${resumeUrl}. Move Mountains Market`;

    const res = await sendEmail({
      to: app.email,
      subject,
      html,
      text,
      tags: [{ name: "category", value: "contract_followup" }],
    });

    if (res.success) tracker.inc("email_sent");
    else tracker.err(`email application=${app.id}: ${res.errorMessage ?? "failed"}`);

    await recordAudit(db, {
      action: "contract_followup_sent",
      entityType: "application",
      entityId: app.id,
      newValues: {
        emailOk: res.success,
        envelopeId: app.waiver_envelope_id,
        cron: "contract-followup",
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
