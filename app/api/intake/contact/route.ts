// POST /api/intake/contact
// Inserts into contact_messages table (added in 0005_contact_and_subscribers.sql).
// Public form: site/contact/index.html.

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
    first_name: z.string().min(1, "First name is required").max(120),
    last_name: z.string().max(120).optional(),
    email: emailSchema,
    phone: z.string().max(40).optional(),
    inquiry_type: z.string().max(60).optional(),
    message: z.string().min(1, "Message is required").max(8000),
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

  const insert = {
    first_name: d.first_name.trim(),
    last_name: s(d.last_name) ?? null,
    email: d.email.trim().toLowerCase(),
    phone: s(d.phone) ?? null,
    inquiry_type: s(d.inquiry_type) ?? null,
    message: d.message.trim(),
    status: "new" as const
  };

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("contact_messages" as any)
    .insert(insert as any)
    .select("id")
    .single();

  if (error) {
    console.error("[intake/contact] supabase error", error);
    return serviceError();
  }

  const id = (row as any)?.id;
  console.log("[intake] contact message saved", id);
  return ok({ id });
}
