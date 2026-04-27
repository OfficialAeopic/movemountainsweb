import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  downloadSignedDocument,
  getStatus,
} from "@/lib/signature-api/contracts";
import { getSignatureWebhookSecret } from "@/lib/signature-api/client";
import { sendSms } from "@/lib/twilio/sms";

export const runtime = "nodejs";

/**
 * SignatureAPI webhook.
 *
 * Expected payload shape (defensive, per blueprint section "Webhook Handler"):
 *  {
 *    event: "envelope.completed" | "envelope.declined" | "envelope.viewed" | ...,
 *    envelope_id: string,
 *    signer?: { name?: string; email?: string; phone?: string },
 *    metadata?: { application_id?: string, vendor_id?: string, vendor_phone?: string }
 *  }
 *
 * The handler:
 *   1. Verifies signature header if SIGNATURE_API_WEBHOOK_SECRET is set.
 *   2. On envelope.completed: downloads PDF, uploads to Supabase Storage,
 *      updates applications.waiver_signed + waiver_document_url, then
 *      triggers a confirmation SMS.
 *   3. Always returns 200 unless the signature check fails.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Step 1: signature verification (optional, env-gated).
  const secret = getSignatureWebhookSecret();
  if (secret) {
    const sigHeader =
      req.headers.get("x-signatureapi-signature") ??
      req.headers.get("x-signature") ??
      "";
    if (!verifySignature(rawBody, sigHeader, secret)) {
      console.warn("[signatureapi webhook] signature verification failed");
      return new NextResponse("invalid signature", { status: 401 });
    }
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch (err) {
    console.warn("[signatureapi webhook] invalid JSON:", err);
    return new NextResponse("ok", { status: 200 });
  }

  const event = String(payload.event ?? payload.type ?? "");
  const envelopeId = String(
    payload.envelope_id ?? payload.envelopeId ?? (payload as { id?: string }).id ?? ""
  );
  const metadata = (payload.metadata ?? {}) as Record<string, string>;

  if (!envelopeId) {
    console.warn("[signatureapi webhook] missing envelope id");
    return new NextResponse("ok", { status: 200 });
  }

  // Branch by event. We only act on completion. Other events are acknowledged
  // and could be logged later.
  if (event === "envelope.completed" || event === "completed") {
    try {
      await handleCompleted(envelopeId, metadata);
    } catch (err) {
      console.error("[signatureapi webhook] handleCompleted error:", err);
      // Still 200 so SignatureAPI does not hammer retries. The error is logged.
    }
  } else {
    console.log(`[signatureapi webhook] unhandled event: ${event} envelope=${envelopeId}`);
  }

  return new NextResponse("ok", { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "signatureapi-webhook" });
}

function verifySignature(rawBody: string, header: string, secret: string): boolean {
  if (!header) return false;
  // Accept either raw hex hmac or "sha256=..." prefixed.
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  if (provided.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

async function handleCompleted(
  envelopeId: string,
  metadata: Record<string, string>
): Promise<void> {
  // 1. Pull final status (idempotent if SDK metadata is incomplete).
  const status = await getStatus(envelopeId);

  // 2. Download signed PDF.
  let storagePath: string | null = null;
  let publicUrl: string | null = null;

  const dl = await downloadSignedDocument(envelopeId);
  if (dl.buffer && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createAdminClient();
    const bucket = process.env.SUPABASE_WAIVERS_BUCKET ?? "waivers";
    const filename = `${envelopeId}.pdf`;
    const { error: uploadErr } = await db.storage
      .from(bucket)
      .upload(filename, dl.buffer, {
        contentType: dl.contentType,
        upsert: true,
      });
    if (uploadErr) {
      console.warn("[signatureapi webhook] supabase upload error:", uploadErr.message);
    } else {
      storagePath = `${bucket}/${filename}`;
      const { data: pub } = db.storage.from(bucket).getPublicUrl(filename);
      publicUrl = pub?.publicUrl ?? null;
    }
  } else if (dl.stub) {
    publicUrl = status.signedDocumentUrl;
  }

  // 3. Update applications row.
  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    try {
      const db = createAdminClient();
      const patch: Record<string, unknown> = {
        waiver_signed: true,
        signature_envelope_id: envelopeId,
      };
      if (publicUrl) patch.waiver_document_url = publicUrl;
      if (storagePath) patch.waiver_storage_path = storagePath;

      let updated = false;

      if (metadata.application_id) {
        const { error } = await db
          .from("applications")
          .update(patch)
          .eq("id", metadata.application_id);
        if (!error) updated = true;
      }

      if (!updated) {
        const { error } = await db
          .from("applications")
          .update(patch)
          .eq("signature_envelope_id", envelopeId);
        if (error) {
          console.warn("[signatureapi webhook] applications update error:", error.message);
        }
      }
    } catch (err) {
      console.warn("[signatureapi webhook] DB update failed:", err);
    }
  }

  // 4. Trigger confirmation SMS if we have a phone.
  const phone = metadata.vendor_phone ?? metadata.phone ?? "";
  if (phone) {
    await sendSms({
      to: phone,
      body: "Waiver received! Complete your payment to reserve your spot.\n- Move Mountains Market",
      vendorId: metadata.vendor_id ?? null,
      messageType: "approval",
    });
  }
}
