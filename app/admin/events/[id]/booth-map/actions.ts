"use server";

// PROMPT 17 - Server actions for the booth map editor.
// saveAssignment: assign or move an event_vendor to a booth slot, freeing the previous occupant if any.
// clearBooth: clear booth_number from a single event_vendor (drop on unassigned tray).
// saveLayout: bulk save all assignments at once on Save click.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { error?: string };

/**
 * Move an event_vendor to a specific booth slot for the given event.
 * If another vendor is already in that slot, that vendor's booth_number is cleared first.
 */
export async function saveAssignment(eventId: string, eventVendorId: string, boothNumber: string | null, spaceTypeId: string | null): Promise<SaveResult> {
  const supabase = await createClient();

  if (boothNumber) {
    // Free the existing occupant of the target slot, if any, and not the same vendor.
    const { data: occupant } = await supabase
      .from("event_vendors")
      .select("id")
      .eq("event_id", eventId)
      .eq("booth_number", boothNumber)
      .neq("id", eventVendorId)
      .maybeSingle();
    if (occupant) {
      const { error: clearErr } = await supabase
        .from("event_vendors")
        .update({ booth_number: null })
        .eq("id", occupant.id);
      if (clearErr) return { error: "Could not free target slot: " + clearErr.message };
    }
  }

  const update: { booth_number: string | null; space_type_id?: string | null } = { booth_number: boothNumber };
  if (spaceTypeId) update.space_type_id = spaceTypeId;

  const { error } = await supabase
    .from("event_vendors")
    .update(update)
    .eq("id", eventVendorId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };

  revalidatePath("/admin/events/" + eventId);
  revalidatePath("/admin/events/" + eventId + "/booth-map");
  return {};
}

/**
 * Bulk save: takes a complete map of booth_number -> event_vendor_id and applies it.
 * Clears any vendor that is no longer in the map.
 */
export async function saveLayout(eventId: string, mapping: Record<string, string>): Promise<SaveResult> {
  const supabase = await createClient();

  // 1. Pull current assignments.
  const { data: current, error: readErr } = await supabase
    .from("event_vendors")
    .select("id, booth_number")
    .eq("event_id", eventId);
  if (readErr) return { error: readErr.message };

  const desiredById: Record<string, string | null> = {};
  for (const [booth, vendorId] of Object.entries(mapping)) {
    desiredById[vendorId] = booth;
  }

  // Compute updates: anything whose desired booth differs from current.
  const updates: { id: string; booth_number: string | null }[] = [];
  for (const row of current ?? []) {
    const desired = desiredById[row.id] ?? null;
    if (desired !== row.booth_number) {
      updates.push({ id: row.id, booth_number: desired });
    }
  }

  // Apply updates one at a time (small N, simpler than upserting and avoids unique conflicts).
  // First clear all changed rows, then assign, to dodge a transient duplicate booth_number per event.
  for (const u of updates) {
    const { error: clearErr } = await supabase
      .from("event_vendors")
      .update({ booth_number: null })
      .eq("id", u.id);
    if (clearErr) return { error: "Clear failed: " + clearErr.message };
  }
  for (const u of updates) {
    if (u.booth_number === null) continue;
    const { error: setErr } = await supabase
      .from("event_vendors")
      .update({ booth_number: u.booth_number })
      .eq("id", u.id);
    if (setErr) return { error: "Assign failed: " + setErr.message };
  }

  revalidatePath("/admin/events/" + eventId);
  revalidatePath("/admin/events/" + eventId + "/booth-map");
  return {};
}
