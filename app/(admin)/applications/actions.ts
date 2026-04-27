"use server";
// PROMPT 10 - Application server actions.
// Approve creates a vendor (or links existing), creates an event_vendors row,
// creates an invoice, and writes the application transition. Category caps are
// soft-enforced: an over-cap approval is allowed but surfaces a warning banner.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/auth";

function nextInvoiceNumber(): string {
  // Lightweight invoice number: INV-YYYYMMDD-<6 random hex>.
  // Real numbering can move to a Postgres sequence later.
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `INV-${date}-${rand}`;
}

export async function approveApplication(formData: FormData): Promise<void> {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const boothNumber = String(formData.get("booth_number") ?? "").trim() || null;
  const amount = Number.parseFloat(amountRaw);

  if (!id || !eventId || Number.isNaN(amount)) {
    redirect("/admin/applications/" + id + "?error=missing_fields");
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: app } = await supabase.from("applications").select("*").eq("id", id).single();
  if (!app) redirect("/admin/applications?error=not_found");

  // 1) Resolve or create the vendor.
  let vendorId: string | null = (app as any).vendor_id;
  if (!vendorId && (app as any).email) {
    const { data: match } = await admin
      .from("vendors")
      .select("id")
      .eq("email", (app as any).email)
      .maybeSingle();
    vendorId = match?.id ?? null;
  }
  if (!vendorId) {
    const { data: created, error: vErr } = await admin
      .from("vendors")
      .insert({
        business_name: (app as any).business_name,
        contact_name: (app as any).contact_name,
        email: (app as any).email,
        phone: (app as any).phone,
        vendor_type_id: (app as any).vendor_type_id,
        product_categories: (app as any).product_categories ?? [],
        status: "active"
      })
      .select("id")
      .single();
    if (vErr || !created) {
      redirect("/admin/applications/" + id + "?warn=" + encodeURIComponent("vendor create failed: " + (vErr?.message ?? "unknown")));
    }
    vendorId = created!.id;
  }

  // 2) Cap check (soft) on the target event for any of the applicant's categories.
  const requestedCategories: string[] = (app as any).product_categories ?? [];
  let warning: string | undefined;
  if (requestedCategories.length > 0) {
    const { data: caps } = await admin
      .from("category_caps")
      .select("product_category_id, cap, product_categories(name)")
      .eq("event_id", eventId)
      .in("product_category_id", requestedCategories);

    if (caps && caps.length > 0) {
      const { data: assigned } = await admin
        .from("event_vendors")
        .select("vendor_id, vendors(product_categories)")
        .eq("event_id", eventId);
      const counts = new Map<string, number>();
      for (const row of assigned ?? []) {
        const cats: string[] = (row as any).vendors?.product_categories ?? [];
        for (const cat of cats) counts.set(cat, (counts.get(cat) ?? 0) + 1);
      }
      const exceeded = caps.filter(
        (c: any) => (counts.get(c.product_category_id) ?? 0) + 1 > c.cap
      );
      if (exceeded.length > 0) {
        warning =
          "category cap exceeded for " +
          exceeded.map((c: any) => c.product_categories?.name ?? "category").join(", ");
      }
    }
  }

  // 3) Insert the event_vendors row.
  const { data: ev, error: evErr } = await admin
    .from("event_vendors")
    .insert({
      event_id: eventId,
      vendor_id: vendorId!,
      space_type_id: (app as any).requested_space_type_id,
      booth_number: boothNumber,
      amount,
      payment_status: "pending"
    })
    .select("id")
    .single();
  if (evErr) {
    redirect(
      "/admin/applications/" +
        id +
        "?warn=" +
        encodeURIComponent("event_vendors insert failed: " + evErr.message)
    );
  }

  // 4) Create the invoice.
  const { error: invErr } = await admin.from("invoices").insert({
    invoice_number: nextInvoiceNumber(),
    vendor_id: vendorId!,
    event_id: eventId,
    event_vendor_id: ev!.id,
    amount,
    status: "unpaid",
    due_date: addDaysISO(7)
  });
  if (invErr) {
    warning = (warning ? warning + "; " : "") + "invoice create failed: " + invErr.message;
  }

  // 5) Update the application status and stamp reviewer.
  await admin
    .from("applications")
    .update({
      status: "approved",
      vendor_id: vendorId,
      decided_by: session.userId,
      decided_at: new Date().toISOString()
    })
    .eq("id", id);

  // 6) Audit.
  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "application_approved",
    entity_type: "application",
    entity_id: id,
    new_values: { event_id: eventId, vendor_id: vendorId, amount, warning: warning ?? null }
  });

  // TODO: trigger SignatureAPI envelope, approval email, magic link (lib/signature-api,
  // lib/resend land in prompts 14 and 15).

  revalidatePath("/admin/applications");
  revalidatePath("/admin/applications/" + id);
  revalidatePath("/admin/payments");

  redirect("/admin/applications/" + id + (warning ? "?warn=" + encodeURIComponent(warning) : ""));
}

export async function rejectApplication(formData: FormData): Promise<void> {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id) redirect("/admin/applications");

  const admin = createAdminClient();
  await admin
    .from("applications")
    .update({
      status: "denied",
      reviewer_notes: reason,
      decided_by: session.userId,
      decided_at: new Date().toISOString()
    })
    .eq("id", id);

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "application_denied",
    entity_type: "application",
    entity_id: id,
    new_values: { reason }
  });

  // TODO: queue rejection email via lib/resend stub.

  revalidatePath("/admin/applications");
  revalidatePath("/admin/applications/" + id);
  redirect("/admin/applications?status=denied");
}

export async function waitlistApplication(formData: FormData): Promise<void> {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/applications");

  const admin = createAdminClient();
  await admin
    .from("applications")
    .update({
      status: "waitlist",
      decided_by: session.userId,
      decided_at: new Date().toISOString()
    })
    .eq("id", id);

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "application_waitlisted",
    entity_type: "application",
    entity_id: id
  });

  revalidatePath("/admin/applications");
  revalidatePath("/admin/applications/" + id);
  redirect("/admin/applications?status=waitlist");
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
