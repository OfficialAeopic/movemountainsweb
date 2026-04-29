// POST /api/intake/employment-application
// Inserts into employment_applications (added in 0004_intake_gaps.sql).

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  asBool,
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
    first: z.string().optional(),
    last: z.string().optional(),
    name: z.string().optional(),
    email: emailSchema,
    phone: z.string().max(40).optional(),
    city: z.string().max(120).optional(),
    role: z.string().max(200).optional(),
    position_interest: z.string().max(200).optional(),
    start: z.string().max(200).optional(),
    schedule: z.string().max(200).optional(),
    resume: z.string().max(1000).optional(),
    resume_url: z.string().max(1000).optional(),
    why: z.string().max(8000).optional(),
    experience: z.string().max(8000).optional(),
    notes: z.string().max(8000).optional(),
    additional_info: z.string().max(8000).optional(),
    weekends: z.union([z.string(), z.boolean()]).optional(),
    outdoors: z.union([z.string(), z.boolean()]).optional(),
    license: z.union([z.string(), z.boolean()]).optional(),
    website: z.string().optional() // honeypot
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

  const additionalParts: string[] = [];
  if (s(d.city)) additionalParts.push("City: " + s(d.city));
  if (s(d.start)) additionalParts.push("Earliest start: " + s(d.start));
  if (s(d.schedule)) additionalParts.push("Schedule: " + s(d.schedule));
  if (s(d.why)) additionalParts.push("Why this role: " + s(d.why));
  if (s(d.notes)) additionalParts.push("Notes: " + s(d.notes));
  if (asBool(d.weekends)) additionalParts.push("Available market weekends: yes");
  if (asBool(d.outdoors)) additionalParts.push("Comfortable outdoors: yes");
  if (asBool(d.license)) additionalParts.push("Driver license + transport: yes");

  const insert = {
    name: fullName,
    email: d.email.trim().toLowerCase(),
    phone: s(d.phone) ?? null,
    position_interest: s(d.position_interest) ?? s(d.role) ?? null,
    experience: s(d.experience) ?? null,
    resume_url: s(d.resume_url) ?? s(d.resume) ?? null,
    additional_info: s(d.additional_info) ?? (additionalParts.join(" | ") || null),
    status: "new" as const
  };

  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("employment_applications" as any)
    .insert(insert as any)
    .select("id")
    .single();

  if (error) {
    console.error("[intake/employment-application] supabase error", error);
    return serviceError();
  }

  return ok({ id: (row as any)?.id });
}
