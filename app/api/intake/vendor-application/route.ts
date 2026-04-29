// POST /api/intake/vendor-application
// Public-facing intake endpoint. Inserts into the existing `applications` table.
// Service-role insert, RLS bypassed by design. Honeypot + zod validation.

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  badRequest,
  emailSchema,
  isHoneypotTripped,
  ok,
  readJsonBody,
  s,
  serviceError
} from "../_helpers";

export const dynamic = "force-dynamic";

const InputSchema = z.object({
  business_name: z.string().min(1, "Business name is required").max(200),
  contact_name: z.string().max(200).optional(),
  email: emailSchema,
  phone: z.string().max(40).optional(),
  // Location can come in as either a UUID or a slug. We resolve below.
  location_id: z.string().optional(),
  location_slug: z.string().optional(),
  vendor_type_id: z.string().uuid().optional(),
  product_description: z.string().max(4000).optional(),
  requested_space_type_id: z.string().uuid().optional(),
  booth_share_with_email: z.string().email().optional().or(z.literal("")),
  // Honeypot
  website: z.string().optional()
});

export async function POST(req: Request) {
  const payload = await readJsonBody(req);

  // Honeypot: silently accept, never insert.
  if (isHoneypotTripped(payload)) return ok({ skipped: true });

  const parsed = InputSchema.safeParse(payload);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const data = parsed.data;
  const supabase = createAdminClient();

  // Resolve location_id from slug if needed. If neither provided, pick the
  // first active location as a fallback so the form never hard-fails.
  let locationId = data.location_id;
  if (!locationId && data.location_slug) {
    const { data: loc } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", data.location_slug)
      .maybeSingle();
    locationId = loc?.id;
  }
  if (!locationId) {
    const { data: anyLoc } = await supabase
      .from("locations")
      .select("id")
      .eq("active", true)
      .order("name")
      .limit(1)
      .maybeSingle();
    locationId = anyLoc?.id;
  }
  if (!locationId) {
    return badRequest({ formErrors: ["No active location configured. Contact info@movemountainsmarket.com."] });
  }

  const insert: Record<string, unknown> = {
    location_id: locationId,
    business_name: data.business_name.trim(),
    contact_name: s(data.contact_name) ?? null,
    email: data.email.trim().toLowerCase(),
    phone: s(data.phone) ?? null,
    vendor_type_id: data.vendor_type_id ?? null,
    product_description: s(data.product_description) ?? null,
    requested_space_type_id: data.requested_space_type_id ?? null,
    booth_share_with_email: s(data.booth_share_with_email) ?? null,
    status: "pending",
    source: "web-form-v1"
  };

  const { data: row, error } = await supabase
    .from("applications")
    .insert(insert as any)
    .select("id")
    .single();

  if (error) {
    console.error("[intake/vendor-application] supabase error", error);
    return serviceError();
  }

  return ok({ id: row?.id });
}
