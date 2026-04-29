// POST /api/intake/volunteer
// Inserts into volunteers table (added in 0004_intake_gaps.sql).

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  asBool,
  badRequest,
  collectCheckedKeys,
  emailSchema,
  isHoneypotTripped,
  ok,
  readJsonBody,
  s,
  serviceError
} from "../_helpers";

export const dynamic = "force-dynamic";

// Form posts free-form fields. We accept the volunteer-form shape AND a
// generic name/email shape so the route is easy to call from elsewhere.
const InputSchema = z
  .object({
    // From the static form:
    first: z.string().optional(),
    last: z.string().optional(),
    email: emailSchema,
    phone: z.string().max(40).optional(),
    age: z.string().max(40).optional(),
    city: z.string().max(120).optional(),
    dates: z.string().max(2000).optional(),
    notes: z.string().max(4000).optional(),
    waiver: z.union([z.string(), z.boolean()]).optional(),
    // Generic alias.
    name: z.string().optional(),
    interests: z.array(z.string()).optional(),
    availability: z.string().optional(),
    additional_info: z.string().optional(),
    // Honeypot.
    website: z.string().optional()
  })
  .passthrough();

export async function POST(req: Request) {
  const payload = await readJsonBody(req);

  if (isHoneypotTripped(payload)) return ok({ skipped: true });

  const parsed = InputSchema.safeParse(payload);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const d = parsed.data;
  const fullName =
    d.name?.trim() ||
    [d.first, d.last].map((x) => (x ?? "").trim()).filter(Boolean).join(" ") ||
    null;

  if (!fullName) {
    return badRequest({ formErrors: ["Name is required."] });
  }

  // Build interests array from role-* and venue-* checkboxes.
  const roles = collectCheckedKeys(payload, "role-");
  const venues = collectCheckedKeys(payload, "venue-").map((v) => "venue-" + v);
  const explicit = Array.isArray(d.interests) ? d.interests : [];
  const interests = Array.from(new Set([...explicit, ...roles, ...venues])).slice(0, 40);

  // Combine notes + city + age into additional_info if not provided.
  const extras: string[] = [];
  if (s(d.age)) extras.push("Age: " + s(d.age));
  if (s(d.city)) extras.push("City: " + s(d.city));
  if (s(d.notes)) extras.push("Notes: " + s(d.notes));
  if (asBool(d.waiver)) extras.push("Outdoor waiver acknowledged: yes");
  const additional = d.additional_info?.trim() || extras.join(" | ") || null;

  const insert = {
    name: fullName,
    email: d.email.trim().toLowerCase(),
    phone: s(d.phone) ?? null,
    interests: interests.length ? interests : null,
    availability: s(d.availability) ?? s(d.dates) ?? null,
    additional_info: additional,
    status: "new" as const
  };

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("volunteers" as any)
    .insert(insert as any)
    .select("id")
    .single();

  if (error) {
    console.error("[intake/volunteer] supabase error", error);
    return serviceError();
  }

  return ok({ id: (row as any)?.id });
}
