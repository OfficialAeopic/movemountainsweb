// Idempotency helpers. Cron routes are safe to invoke multiple times per day
// because each action checks audit_log for a recent matching entry before
// firing. This avoids duplicate SMS, duplicate emails, and double-counting.
//
// Convention:
//   action: snake_case verb describing the side effect
//   entity_type: the table the action touches
//   entity_id: row UUID
//   window: the dedupe window in hours

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DedupeKey {
  action: string;
  entityType: string;
  entityId: string;
  windowHours: number;
}

export async function alreadyDone(
  db: SupabaseClient,
  key: DedupeKey
): Promise<boolean> {
  const since = new Date(
    Date.now() - key.windowHours * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await db
    .from("audit_log")
    .select("id")
    .eq("action", key.action)
    .eq("entity_type", key.entityType)
    .eq("entity_id", key.entityId)
    .gte("created_at", since)
    .limit(1);
  if (error) {
    // On error, fail open (do the work). The cron run summary will surface
    // the error count separately. Silent dedupe failures should not block
    // legitimate sends.
    console.warn("[cron-dedupe] lookup failed:", error.message);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  newValues?: Record<string, unknown>;
}

export async function recordAudit(
  db: SupabaseClient,
  entry: AuditEntry
): Promise<void> {
  try {
    await db.from("audit_log").insert({
      actor_id: null,
      actor_email: "cron@system",
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      new_values: entry.newValues ?? null,
    });
  } catch (err) {
    console.warn("[cron-dedupe] audit insert failed:", err);
  }
}
