// POST /api/intake/musician
// Inserts into the musicians table. Uses both legacy `active` and new `is_active`
// columns so admin views work whether they read either field.

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

const InputSchema = z
  .object({
    name: z.string().optional(),
    contact: z.string().optional(),
    email: emailSchema.optional(),
    phone: z.string().max(40).optional(),
    genre: z.string().max(200).optional(),
    setup: z.string().max(80).optional(),
    experience: z.string().max(200).optional(),
    links: z.string().max(4000).optional(),
    availability: z.string().max(4000).optional(),
    rate: z.string().max(200).optional(),
    notes: z.string().max(4000).optional(),
    instagram_url: z.string().max(500).optional(),
    facebook_url: z.string().max(500).optional(),
    photo_url: z.string().max(1000).optional(),
    handle: z.string().max(120).optional(),
    website: z.string().max(500).optional() // doubles as honeypot, see below
  })
  .passthrough();

export async function POST(req: Request) {
  const payload = await readJsonBody(req);

  // Honeypot: reuse the `website` field name. Real site forms do NOT send a
  // `website` value (the musician form has no such input). If something sends
  // a `website`, treat it as bot trap UNLESS it looks like a real https URL
  // shorter than 200 chars (in case a future form adds a real website field).
  const w = payload["website"];
  if (typeof w === "string" && w.trim().length > 0 && !/^https?:\/\//i.test(w.trim())) {
    return ok({ skipped: true });
  }
  // Also still treat as honeypot if the string is suspiciously huge.
  if (isHoneypotTripped(payload) && typeof w === "string" && w.length > 500) {
    return ok({ skipped: true });
  }

  const parsed = InputSchema.safeParse(payload);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const d = parsed.data;
  const name = s(d.name);
  if (!name) return badRequest({ formErrors: ["Artist or band name is required."] });

  // Compose notes blob from secondary fields.
  const notesParts: string[] = [];
  if (s(d.contact)) notesParts.push("Contact: " + s(d.contact));
  if (s(d.genre)) notesParts.push("Genre: " + s(d.genre));
  if (s(d.setup)) notesParts.push("Setup: " + s(d.setup));
  if (s(d.experience)) notesParts.push("Experience: " + s(d.experience));
  if (s(d.links)) notesParts.push("Links: " + s(d.links));
  if (s(d.availability)) notesParts.push("Availability: " + s(d.availability));
  if (s(d.rate)) notesParts.push("Rate: " + s(d.rate));
  if (s(d.notes)) notesParts.push("Notes: " + s(d.notes));
  // Pull through any of the form-only checkboxes.
  for (const k of ["own-pa", "outdoor", "family-ok"]) {
    if (payload[k]) notesParts.push(k + ": yes");
  }

  // The musicians.website column predates is_active. We set legacy `website`
  // to whatever the user sent if it looks like a URL, otherwise null.
  const websiteUrl =
    typeof d.website === "string" && /^https?:\/\//i.test(d.website.trim())
      ? d.website.trim()
      : null;

  const insert: Record<string, unknown> = {
    name,
    handle: s(d.handle) ?? null,
    website: websiteUrl,
    email: s(d.email) ?? null,
    phone: s(d.phone) ?? null,
    notes: notesParts.join("\n") || null,
    // legacy column kept untouched
    active: true,
    // new columns from 0004_intake_gaps.sql
    photo_url: s(d.photo_url) ?? null,
    instagram_url: s(d.instagram_url) ?? null,
    facebook_url: s(d.facebook_url) ?? null,
    display_on_website: false,
    is_active: true
  };

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("musicians" as any)
    .insert(insert as any)
    .select("id")
    .single();

  if (error) {
    console.error("[intake/musician] supabase error", error);
    return serviceError();
  }

  return ok({ id: (row as any)?.id });
}
