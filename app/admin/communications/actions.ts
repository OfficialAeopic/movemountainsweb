"use server";
// PROMPT 12 - Communications server actions.
// Compose drafts only. Real send paths land in prompts 13 (Twilio) and 14 (Resend).

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/auth";

export async function saveSmsDraft(formData: FormData): Promise<void> {
  const session = await requireStaff();
  const vendorId = String(formData.get("vendor_id") ?? "").trim();
  const templateKey = String(formData.get("template_key") ?? "custom").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!vendorId || !body) {
    redirect("/admin/communications/compose?error=" + encodeURIComponent("Recipient and message body are required."));
  }

  const admin = createAdminClient();

  const { data: vendor } = await admin
    .from("vendors")
    .select("phone")
    .eq("id", vendorId)
    .single();

  if (!vendor?.phone) {
    redirect("/admin/communications/compose?error=" + encodeURIComponent("Selected vendor has no phone on file."));
  }

  await admin.from("sms_messages").insert({
    vendor_id: vendorId,
    to_phone: vendor.phone,
    body,
    template_key: templateKey,
    status: "queued",
    sent_by: session.userId
  });

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "sms_draft_saved",
    entity_type: "sms_message",
    new_values: { vendor_id: vendorId, template_key: templateKey, length: body.length }
  });

  revalidatePath("/admin/communications");
  revalidatePath("/admin/communications/compose");
  redirect("/admin/communications/compose?saved=1&channel=sms");
}

export async function saveEmailDraft(formData: FormData): Promise<void> {
  const session = await requireStaff();
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyText = String(formData.get("body_text") ?? "").trim();
  const attachmentUrl = String(formData.get("attachment_url") ?? "").trim() || null;
  const targets = formData.getAll("target_location_ids").map((v) => String(v));

  if (!name || !subject || !bodyText) {
    redirect("/admin/communications/compose?error=" + encodeURIComponent("Name, subject, and body are required."));
  }

  const admin = createAdminClient();

  await admin.from("email_campaigns").insert({
    name,
    subject,
    body_text: bodyText,
    attachment_url: attachmentUrl,
    target_location_ids: targets,
    status: "draft",
    created_by: session.userId
  });

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "email_draft_saved",
    entity_type: "email_campaign",
    new_values: { name, subject, target_count: targets.length, has_attachment: !!attachmentUrl }
  });

  revalidatePath("/admin/communications/email");
  revalidatePath("/admin/communications/compose");
  redirect("/admin/communications/compose?saved=1&channel=email");
}
