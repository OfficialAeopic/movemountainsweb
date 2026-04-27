import { getTwilioClient, getTwilioPhoneNumber, isTwilioConfigured } from "./client";
import { createAdminClient } from "../supabase/admin";
import type { SmsTemplateKey } from "./templates";

export interface SendSmsInput {
  to: string;
  body: string;
  vendorId?: string | null;
  messageType?: SmsTemplateKey | string;
  // If true, do not write to sms_messages. Default false.
  skipLog?: boolean;
}

export interface SendSmsResult {
  success: boolean;
  sid: string | null;
  status: string;
  errorMessage: string | null;
  stub: boolean;
}

/**
 * Send a single SMS via Twilio and log the attempt to sms_messages.
 * Returns a stub success when Twilio env vars are missing so callers can
 * keep working in dev without secrets.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const { to, body, vendorId = null, messageType = "custom", skipLog = false } = input;

  if (!isTwilioConfigured()) {
    const result: SendSmsResult = {
      success: true,
      sid: null,
      status: "stub",
      errorMessage: null,
      stub: true,
    };
    if (!skipLog) await logSmsAttempt({ to, body, vendorId, messageType, result });
    return result;
  }

  const client = getTwilioClient();
  const from = getTwilioPhoneNumber();

  if (!client || !from) {
    const result: SendSmsResult = {
      success: false,
      sid: null,
      status: "failed",
      errorMessage: "Twilio client unavailable",
      stub: false,
    };
    if (!skipLog) await logSmsAttempt({ to, body, vendorId, messageType, result });
    return result;
  }

  try {
    const msg = await client.messages.create({ to, from, body });
    const result: SendSmsResult = {
      success: true,
      sid: msg.sid,
      status: msg.status ?? "queued",
      errorMessage: null,
      stub: false,
    };
    if (!skipLog) await logSmsAttempt({ to, body, vendorId, messageType, result });
    return result;
  } catch (err) {
    const result: SendSmsResult = {
      success: false,
      sid: null,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : String(err),
      stub: false,
    };
    if (!skipLog) await logSmsAttempt({ to, body, vendorId, messageType, result });
    return result;
  }
}

export interface BulkSmsRecipient {
  to: string;
  vendorId?: string | null;
  // Optional per-recipient body override. Falls back to bulk body.
  body?: string;
}

export interface SendBulkSmsInput {
  recipients: BulkSmsRecipient[];
  body: string;
  messageType?: SmsTemplateKey | string;
}

export async function sendBulkSms(
  input: SendBulkSmsInput
): Promise<{ sent: number; failed: number; results: SendSmsResult[] }> {
  const { recipients, body, messageType = "custom" } = input;
  const results: SendSmsResult[] = [];
  let sent = 0;
  let failed = 0;

  // Sequential to respect Twilio rate limits and keep log ordering deterministic.
  for (const r of recipients) {
    const res = await sendSms({
      to: r.to,
      body: r.body ?? body,
      vendorId: r.vendorId,
      messageType,
    });
    results.push(res);
    if (res.success) sent++;
    else failed++;
  }

  return { sent, failed, results };
}

export async function getDeliveryStatus(messageSid: string): Promise<{
  status: string;
  errorMessage: string | null;
}> {
  if (!isTwilioConfigured()) {
    return { status: "stub", errorMessage: null };
  }
  const client = getTwilioClient();
  if (!client) return { status: "unknown", errorMessage: "client unavailable" };
  try {
    const msg = await client.messages(messageSid).fetch();
    return {
      status: msg.status ?? "unknown",
      errorMessage: msg.errorMessage ?? null,
    };
  } catch (err) {
    return {
      status: "unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

interface LogInput {
  to: string;
  body: string;
  vendorId: string | null;
  messageType: string;
  result: SendSmsResult;
}

async function logSmsAttempt(input: LogInput): Promise<void> {
  // Best-effort log. Never throw out of this function.
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return;
    }
    const db = createAdminClient();
    await db.from("sms_messages").insert({
      vendor_id: input.vendorId,
      phone: input.to,
      message_type: input.messageType,
      message_body: input.body,
      twilio_sid: input.result.sid,
      status: input.result.status,
      error_message: input.result.errorMessage,
    });
  } catch (err) {
    console.warn("[twilio] sms_messages log failed:", err);
  }
}

/**
 * Update sms_messages row for an inbound delivery webhook from Twilio.
 * Used by app/api/webhooks/twilio/route.ts.
 */
export async function updateSmsStatusBySid(
  sid: string,
  status: string,
  errorMessage?: string | null
): Promise<void> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return;
    }
    const db = createAdminClient();
    const patch: Record<string, unknown> = { status };
    if (errorMessage !== undefined) patch.error_message = errorMessage;
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    await db.from("sms_messages").update(patch).eq("twilio_sid", sid);
  } catch (err) {
    console.warn("[twilio] updateSmsStatusBySid failed:", err);
  }
}
