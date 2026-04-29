// POST /api/intake/newsletter
// Inserts into the existing email_subscribers table (0001_schema.sql) with
// source='newsletter'. Duplicate emails (per the (email, location_id) unique
// constraint) are treated as already-subscribed and return ok=true.

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  emailSchema,
  isHoneypotTripped,
  ok,
  readJsonBody,
  serviceError
} from "../_helpers";

export const dynamic = "force-dynamic";

const InputSchema = z
  .object({
    email: emailSchema,
    name: z.string().max(120).optional(),
    // Honeypot.
    website: z.string().optional()
  })
  .passthrough();

export async function POST(req: Request) {
  const payload = await readJsonBody(req);

  if (isHoneypotTripped(payload)) return ok({ skipped: true });

  const parsed = InputSchema.safeParse(payload);
  if (!parsed.success) {
    // For the newsletter form we forgive bad emails by behaving like a no-op
    // success. The public form has a single email field with HTML5 validation,
    // so a 400 here would only surface in scripted abuse.
    return ok({ skipped: true });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const supabase = createAdminClient();

  // Pre-check: the existing schema's unique(email, location_id) allows
  // multiple rows when location_id is NULL (Postgres treats NULLs as not
  // equal). To honor the "ON CONFLICT DO NOTHING" intent, manually check
  // for an existing row with the same (email, source, location_id=null)
  // before inserting.
  const { data: existing } = await supabase
    .from("email_subscribers")
    .select("id")
    .eq("email", email)
    .eq("source", "newsletter")
    .is("location_id", null)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    console.log("[intake] newsletter duplicate (already subscribed)", email);
    return ok({ already_subscribed: true, id: existing.id });
  }

  const { data: row, error } = await supabase
    .from("email_subscribers")
    .insert({
      email,
      source: "newsletter",
      location_id: null
    } as any)
    .select("id")
    .single();

  if (error) {
    // Defensive: a true unique-violation can still occur on a race or if
    // policy adds a stricter constraint later.
    const isDup =
      (error as any).code === "23505" ||
      /duplicate key/i.test(error.message ?? "");
    if (isDup) {
      console.log("[intake] newsletter duplicate (race)", email);
      return ok({ already_subscribed: true });
    }
    console.error("[intake/newsletter] supabase error", error);
    return serviceError();
  }

  const id = (row as any)?.id;
  console.log("[intake] newsletter subscription saved", id);
  return ok({ id });
}
