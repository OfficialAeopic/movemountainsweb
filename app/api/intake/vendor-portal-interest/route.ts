// POST /api/intake/vendor-portal-interest
// Inserts into email_subscribers with source='vendor-portal-interest'.
// Backs the /site/vendor-login-preview/ "send me a magic link" form. Phase 2
// magic-link auth is not built; this captures the email so Amanda has a list
// of vendors who tried to log in (doubles as an interested-vendor lead list).

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
    // Honeypot.
    website: z.string().optional()
  })
  .passthrough();

export async function POST(req: Request) {
  const payload = await readJsonBody(req);

  if (isHoneypotTripped(payload)) return ok({ skipped: true });

  const parsed = InputSchema.safeParse(payload);
  if (!parsed.success) {
    // Same forgiveness pattern as newsletter: a bad email becomes a silent ok
    // so the static form's fake-success UX still completes for the user.
    return ok({ skipped: true });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const supabase = createAdminClient();

  // Pre-check: see newsletter route comment. Postgres NULL != NULL means
  // unique(email, location_id) does not block dupes when location_id is null,
  // so we check manually to honor the intended idempotent UX.
  const { data: existing } = await supabase
    .from("email_subscribers")
    .select("id")
    .eq("email", email)
    .eq("source", "vendor-portal-interest")
    .is("location_id", null)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    console.log("[intake] vendor-portal-interest duplicate", email);
    return ok({ already_recorded: true, id: existing.id });
  }

  const { data: row, error } = await supabase
    .from("email_subscribers")
    .insert({
      email,
      source: "vendor-portal-interest",
      location_id: null
    } as any)
    .select("id")
    .single();

  if (error) {
    const isDup =
      (error as any).code === "23505" ||
      /duplicate key/i.test(error.message ?? "");
    if (isDup) {
      console.log("[intake] vendor-portal-interest duplicate (race)", email);
      return ok({ already_recorded: true });
    }
    console.error("[intake/vendor-portal-interest] supabase error", error);
    return serviceError();
  }

  const id = (row as any)?.id;
  console.log("[intake] vendor-portal-interest saved", id);
  return ok({ id });
}
