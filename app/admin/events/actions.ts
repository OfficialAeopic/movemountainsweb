"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus } from "@/types/database";

const eventStatuses = ["scheduled", "live", "complete", "cancelled"] as const;

const eventSchema = z.object({
  location_id: z.string().uuid("Pick a location."),
  event_date: z.string().min(1, "Event date is required."),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  musician_id: z.string().uuid().optional().nullable().or(z.literal("")),
  vendor_capacity: z.coerce.number().int().nonnegative().optional().nullable(),
  status: z.enum(eventStatuses),
  raffle_prize_description: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export type EventFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function emptyToNull<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = { ...input };
  for (const k of Object.keys(out)) {
    if (out[k] === "" || out[k] === undefined) out[k] = null;
  }
  return out as T;
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const payload = emptyToNull(parsed.data);
  const { data, error } = await supabase
    .from("market_events")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events/" + data.id);
}

export async function updateEvent(id: string, _prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const payload = emptyToNull(parsed.data);
  const { error } = await supabase
    .from("market_events")
    .update(payload)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin/events/" + id);
  redirect("/admin/events/" + id);
}

export async function setEventStatus(id: string, status: EventStatus): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("market_events")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/events");
  revalidatePath("/admin/events/" + id);
  return {};
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("market_events").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/events");
  redirect("/admin/events");
}
