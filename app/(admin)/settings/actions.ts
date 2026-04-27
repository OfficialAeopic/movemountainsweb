"use server";
// PROMPT 19 - Settings server actions.
// All write paths require admin role. All writes log an audit_log entry.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";

const SETTINGS_ID = "global";

function asString(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

export async function saveBusinessInfo(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const admin = createAdminClient();

  const patch = {
    business_name: asString(formData, "business_name"),
    business_address: asString(formData, "business_address"),
    business_city: asString(formData, "business_city"),
    business_state: asString(formData, "business_state"),
    business_zip: asString(formData, "business_zip"),
    business_phone: asString(formData, "business_phone"),
    business_email: asString(formData, "business_email"),
    social_instagram: asString(formData, "social_instagram"),
    social_facebook: asString(formData, "social_facebook"),
    social_tiktok: asString(formData, "social_tiktok"),
    social_website: asString(formData, "social_website"),
    updated_by: session.userId
  };

  const { error } = await admin.from("app_settings").update(patch).eq("id", SETTINGS_ID);
  if (error) {
    redirect("/admin/settings?error=" + encodeURIComponent(error.message));
  }

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "business_settings_updated",
    entity_type: "app_settings",
    entity_id: null,
    new_values: patch
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function saveBrand(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const admin = createAdminClient();

  const patch = {
    brand_color_primary: asString(formData, "brand_color_primary"),
    brand_color_secondary: asString(formData, "brand_color_secondary"),
    brand_color_accent: asString(formData, "brand_color_accent"),
    updated_by: session.userId
  };

  // Optional logo upload to Supabase Storage bucket "brand".
  // Bucket should exist with public read; if missing the action surfaces the error.
  const logo = formData.get("logo") as File | null;
  let logoUrl: string | null = null;
  if (logo && typeof logo === "object" && "arrayBuffer" in logo && logo.size > 0) {
    const ext = (logo.name.split(".").pop() ?? "png").toLowerCase();
    const path = `logo-${Date.now()}.${ext}`;
    const buf = Buffer.from(await logo.arrayBuffer());
    const { error: upErr } = await admin.storage.from("brand").upload(path, buf, {
      contentType: logo.type || "application/octet-stream",
      upsert: true
    });
    if (upErr) {
      redirect("/admin/settings/brand?error=" + encodeURIComponent("Logo upload failed: " + upErr.message));
    }
    const { data: pub } = admin.storage.from("brand").getPublicUrl(path);
    logoUrl = pub.publicUrl;
  }

  const updates: Record<string, unknown> = { ...patch };
  if (logoUrl) updates.brand_logo_url = logoUrl;

  const { error } = await admin.from("app_settings").update(updates).eq("id", SETTINGS_ID);
  if (error) {
    redirect("/admin/settings/brand?error=" + encodeURIComponent(error.message));
  }

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "brand_settings_updated",
    entity_type: "app_settings",
    new_values: updates
  });

  revalidatePath("/admin/settings/brand");
  redirect("/admin/settings/brand?saved=1");
}

// ----- Vendor types CRUD -----

export async function createVendorType(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const admin = createAdminClient();
  const slug = (asString(formData, "slug") ?? "").toLowerCase().replace(/\s+/g, "-");
  const name = asString(formData, "name");
  if (!slug || !name) {
    redirect("/admin/settings/vendor-types?error=" + encodeURIComponent("Slug and name are required."));
  }
  const basePriceRaw = asString(formData, "base_price");
  const requiresPermits = formData.get("requires_permits") === "on";

  const { error } = await admin.from("vendor_types").insert({
    slug,
    name,
    description: asString(formData, "description"),
    base_price: basePriceRaw ? Number(basePriceRaw) : null,
    requires_permits: requiresPermits,
    active: true
  });
  if (error) {
    redirect("/admin/settings/vendor-types?error=" + encodeURIComponent(error.message));
  }
  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "vendor_type_created",
    entity_type: "vendor_type",
    new_values: { slug, name }
  });
  revalidatePath("/admin/settings/vendor-types");
  redirect("/admin/settings/vendor-types?saved=1");
}

export async function toggleVendorType(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const admin = createAdminClient();
  const id = asString(formData, "id");
  const next = formData.get("active") === "true";
  if (!id) redirect("/admin/settings/vendor-types?error=missing_id");
  await admin.from("vendor_types").update({ active: next }).eq("id", id);
  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "vendor_type_toggled",
    entity_type: "vendor_type",
    entity_id: id,
    new_values: { active: next }
  });
  revalidatePath("/admin/settings/vendor-types");
  redirect("/admin/settings/vendor-types?saved=1");
}

// ----- Product categories CRUD -----

export async function createProductCategory(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const admin = createAdminClient();
  const name = asString(formData, "name");
  const slugInput = asString(formData, "slug");
  const slug = (slugInput ?? name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug || !name) {
    redirect("/admin/settings/product-categories?error=" + encodeURIComponent("Name is required."));
  }
  const { error } = await admin.from("product_categories").insert({ slug, name, active: true });
  if (error) {
    redirect("/admin/settings/product-categories?error=" + encodeURIComponent(error.message));
  }
  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "product_category_created",
    entity_type: "product_category",
    new_values: { slug, name }
  });
  revalidatePath("/admin/settings/product-categories");
  redirect("/admin/settings/product-categories?saved=1");
}

export async function toggleProductCategory(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const admin = createAdminClient();
  const id = asString(formData, "id");
  const next = formData.get("active") === "true";
  if (!id) redirect("/admin/settings/product-categories?error=missing_id");
  await admin.from("product_categories").update({ active: next }).eq("id", id);
  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "product_category_toggled",
    entity_type: "product_category",
    entity_id: id,
    new_values: { active: next }
  });
  revalidatePath("/admin/settings/product-categories");
  redirect("/admin/settings/product-categories?saved=1");
}

// ----- Users (admin/staff team) -----

export async function inviteUser(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const email = asString(formData, "email");
  const role = (asString(formData, "role") ?? "staff").toLowerCase();
  if (!email || !["admin", "staff"].includes(role)) {
    redirect("/admin/settings/users?error=" + encodeURIComponent("Email and a role of admin or staff are required."));
  }

  // Service role required for inviteUserByEmail. Graceful degrade when missing.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/admin/settings/users?error=" + encodeURIComponent("SUPABASE_SERVICE_ROLE_KEY is not configured. Set it in .env.local to invite users."));
  }

  const admin = createAdminClient();
  const redirectTo = (process.env.NEXT_PUBLIC_APP_URL ?? "") + "/admin";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email!, { redirectTo });
  if (error || !data?.user) {
    redirect("/admin/settings/users?error=" + encodeURIComponent(error?.message ?? "Invite failed."));
  }

  await admin.from("user_roles").upsert(
    { user_id: data.user.id, role },
    { onConflict: "user_id" }
  );

  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "user_invited",
    entity_type: "user",
    entity_id: data.user.id,
    new_values: { email, role }
  });

  revalidatePath("/admin/settings/users");
  redirect("/admin/settings/users?saved=1");
}

export async function updateUserRole(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const userId = asString(formData, "user_id");
  const role = asString(formData, "role");
  if (!userId || !role || !["admin", "staff", "vendor"].includes(role)) {
    redirect("/admin/settings/users?error=" + encodeURIComponent("Invalid user or role."));
  }
  const admin = createAdminClient();
  await admin.from("user_roles").upsert(
    { user_id: userId, role },
    { onConflict: "user_id" }
  );
  await admin.from("audit_log").insert({
    actor_id: session.userId,
    actor_email: session.email,
    action: "user_role_updated",
    entity_type: "user",
    entity_id: userId,
    new_values: { role }
  });
  revalidatePath("/admin/settings/users");
  redirect("/admin/settings/users?saved=1");
}
