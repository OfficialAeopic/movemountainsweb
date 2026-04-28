"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const vendorStatuses = ["active", "inactive", "banned", "pending"] as const;

const vendorSchema = z.object({
  business_name: z.string().min(1, "Business name is required."),
  contact_name: z.string().optional().nullable(),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  vendor_type_id: z.string().uuid().optional().nullable().or(z.literal("")),
  product_categories: z.array(z.string().uuid()).optional(),
  social_instagram: z.string().optional().nullable(),
  social_facebook: z.string().optional().nullable(),
  social_website: z.string().optional().nullable(),
  status: z.enum(vendorStatuses),
  ban_reason: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  is_recurring: z.coerce.boolean().optional()
});

export type VendorFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function buildPayload(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  // Multi-select for product_categories arrives as repeated entries.
  const categories = formData.getAll("product_categories").map(String).filter(Boolean);
  const candidate = {
    ...raw,
    product_categories: categories,
    is_recurring: raw.is_recurring === "on" || raw.is_recurring === "true"
  };
  return vendorSchema.safeParse(candidate);
}

function emptyToNull<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = { ...input };
  for (const k of Object.keys(out)) {
    if (out[k] === "" || out[k] === undefined) out[k] = null;
  }
  return out as T;
}

export async function createVendor(_prev: VendorFormState, formData: FormData): Promise<VendorFormState> {
  const parsed = buildPayload(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const payload = emptyToNull(parsed.data);
  const { data, error } = await supabase
    .from("vendors")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/vendors");
  redirect("/admin/vendors/" + data.id);
}

export async function updateVendor(id: string, _prev: VendorFormState, formData: FormData): Promise<VendorFormState> {
  const parsed = buildPayload(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const payload = emptyToNull(parsed.data);
  const { error } = await supabase
    .from("vendors")
    .update(payload)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/vendors");
  revalidatePath("/admin/vendors/" + id);
  redirect("/admin/vendors/" + id);
}

export async function deleteVendor(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}
