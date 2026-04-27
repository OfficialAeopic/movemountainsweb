import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSmsStatusBySid } from "@/lib/twilio/sms";

export const runtime = "nodejs";

/**
 * Twilio webhook handler.
 *
 * Twilio sends two kinds of POSTs to this endpoint:
 *  1. Status callbacks (form-urlencoded): MessageSid, MessageStatus, ErrorMessage, etc.
 *     Mapped to sms_messages.status / delivered_at / error_message.
 *  2. Inbound SMS (form-urlencoded): From, To, Body, MessageSid, etc.
 *     Logged into sms_messages with message_type "inbound".
 *
 * If the request is unparsable or Twilio env is missing, we still return 200
 * so Twilio does not retry against a permanently broken handler.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let params: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const usp = new URLSearchParams(text);
      params = Object.fromEntries(usp.entries());
    } else if (contentType.includes("application/json")) {
      params = (await req.json()) as Record<string, string>;
    } else {
      // Try form first, fall back to text noop.
      const text = await req.text();
      try {
        const usp = new URLSearchParams(text);
        params = Object.fromEntries(usp.entries());
      } catch {
        params = {};
      }
    }

    const messageSid = params.MessageSid ?? params.SmsSid ?? "";
    const messageStatus = params.MessageStatus ?? params.SmsStatus ?? "";
    const errorMessage = params.ErrorMessage ?? null;
    const from = params.From ?? "";
    const to = params.To ?? "";
    const body = params.Body ?? "";

    // Branch 1: status callback (no Body).
    if (messageSid && messageStatus && !body) {
      await updateSmsStatusBySid(messageSid, messageStatus.toLowerCase(), errorMessage);
      return new NextResponse("ok", { status: 200 });
    }

    // Branch 2: inbound SMS (Body present, From present).
    if (from && body) {
      try {
        if (
          process.env.SUPABASE_SERVICE_ROLE_KEY &&
          process.env.NEXT_PUBLIC_SUPABASE_URL
        ) {
          const db = createAdminClient();
          // Try to match a vendor by phone for traceability.
          const { data: vendorMatch } = await db
            .from("vendors")
            .select("id")
            .eq("phone", from)
            .maybeSingle();

          await db.from("sms_messages").insert({
            vendor_id: vendorMatch?.id ?? null,
            phone: from,
            message_type: "inbound",
            message_body: body,
            twilio_sid: messageSid || null,
            status: "received",
          });
        }
      } catch (err) {
        console.warn("[twilio webhook] inbound log failed:", err);
      }

      // TwiML empty response so Twilio does not auto-reply.
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    // Unknown payload shape. Acknowledge so Twilio does not retry forever.
    console.warn("[twilio webhook] unrecognized payload", {
      keys: Object.keys(params),
    });
    return new NextResponse("ok", { status: 200 });
  } catch (err) {
    console.error("[twilio webhook] handler error:", err);
    return new NextResponse("error", { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "twilio-webhook" });
}
