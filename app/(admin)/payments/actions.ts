"use server";
// PROMPT 11 - Invoice server actions.
// Manual mark-paid (no Stripe). Reminder enqueues an SMS via the lib/twilio
// stub another agent is owning. This file imports the stub lazily so it does
// not crash if the stub is not yet exporting.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/auth";

export async function markInvoicePaid(formData: FormData): Promise<void> {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const paymentMethod = String(formData.get("payment_method") ?? "").trim() || null;
  const paymentReference = String(formData.get("payment_reference") ?? "").trim() || null;
  const paidDate = String(formData.get("paid_date") ?? "").trim() || new Date().toISOString().slice(0, 10);

  if (!id) redirect("/admin/payments");

  const admin = createAdminClient();

  const { data: inv, error: invErr } = await admin
    .from("invoices")
    .update({
      status: "paid",
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      paid_date: paidDate
    })
    .eq("id", id)
    .select("event_vendor_id")
    .single();

  if (invErr) {
    redirect("/admin/payments/" + id + "?error=" + encodeURIComponent(invErr.message));
  }

  // Cascade: flip the linked event_vendor row to paid as well.
  if (inv?.event_vendor_id) {
    await admin
      .from("event_vendors")
      .update({
        payment_status: "paid",
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        paid_at: new Date().toISOString()
      })
      .eq("id", inv.event_vendor_id);
  }

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "invoice_marked_paid",
    entity_type: "invoice",
    entity_id: id,
    new_values: { payment_method: paymentMethod, payment_reference: paymentReference, paid_date: paidDate }
  });

  // TODO: queue confirmation email (lib/resend) and confirmation SMS (lib/twilio).

  revalidatePath("/admin/payments");
  revalidatePath("/admin/payments/" + id);
  redirect("/admin/payments/" + id + "?paid=1");
}

export async function sendInvoiceReminder(formData: FormData): Promise<void> {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/payments");

  const admin = createAdminClient();

  const { data: inv } = await admin
    .from("invoices")
    .select(
      "id, amount, due_date, vendor_id, event_id, status, vendors(business_name, phone), market_events:event_id(event_date, locations(name))"
    )
    .eq("id", id)
    .single();

  if (!inv) redirect("/admin/payments");

  const phone = (inv as any).vendors?.phone ?? null;
  const business = (inv as any).vendors?.business_name ?? "vendor";
  const eventDate = (inv as any).market_events?.event_date ?? "your upcoming market";
  const locationName = (inv as any).market_events?.locations?.name ?? "the market";
  const body =
    `Hi ${business}, friendly reminder: $${Number((inv as any).amount).toFixed(2)} for ${locationName} on ${eventDate} is due` +
    ((inv as any).due_date ? ` by ${(inv as any).due_date}` : "") +
    `. Pay via Zelle, Venmo, CashApp, or Apple Pay. - Move Mountains Market`;

  // Log the reminder regardless of whether the Twilio stub is wired.
  // The lib/twilio module is owned by a parallel agent; if the export is missing
  // we still record the queued message in sms_messages so the audit trail is intact.
  let twilioSid: string | null = null;
  let smsStatus: string = "queued";
  let errorMessage: string | null = null;
  if (phone) {
    try {
      // Lazy dynamic import. The stub may export a sendSms or be missing entirely.
      // @ts-ignore - lib/twilio lands in a parallel branch.
      const twilio = await import("@/lib/twilio").catch(() => null);
      if (twilio && typeof (twilio as any).sendSms === "function") {
        const result = await (twilio as any).sendSms({ to: phone, body });
        twilioSid = result?.sid ?? null;
        smsStatus = result?.status ?? "sent";
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      smsStatus = "failed";
    }
  } else {
    errorMessage = "no phone on file";
    smsStatus = "failed";
  }

  await admin.from("sms_messages").insert({
    twilio_sid: twilioSid,
    vendor_id: (inv as any).vendor_id,
    event_id: (inv as any).event_id ?? null,
    to_phone: phone ?? "",
    body,
    template_key: "payment_reminder_24h",
    status: smsStatus,
    error_message: errorMessage,
    sent_by: session.userId
  });

  // Reminder fact lives in the audit_log + sms_messages rows. The 0001 invoices
  // schema does not yet carry reminder_sent / reminder_sent_at columns; if those
  // land in a later migration, update them here.

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "invoice_reminder_sent",
    entity_type: "invoice",
    entity_id: id,
    new_values: { phone, status: smsStatus, error: errorMessage }
  });

  revalidatePath("/admin/payments/" + id);
  redirect("/admin/payments/" + id + "?reminder=1");
}

export async function cancelInvoice(formData: FormData): Promise<void> {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/payments");

  const admin = createAdminClient();
  await admin.from("invoices").update({ status: "cancelled" }).eq("id", id);
  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "invoice_cancelled",
    entity_type: "invoice",
    entity_id: id
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/payments/" + id);
  redirect("/admin/payments?status=all");
}
