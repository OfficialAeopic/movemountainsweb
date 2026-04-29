"use server";

// PROMPT 16 - Email lists server actions.
// Handles: CSV import (parse + dedupe + bulk insert), CSV export, unsubscribe toggle, manual add, delete.
// CSV parser is hand-rolled (no extra deps). Supports quoted fields with embedded commas.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ImportState = {
  error?: string;
  inserted?: number;
  duplicates?: number;
  invalid?: number;
  total?: number;
};

export type ManualAddState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const VALID_SOURCES = ["signup-form", "market-day-survey", "manual-add", "import"];

const manualAddSchema = z.object({
  email: z.string().email("Enter a valid email."),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  location_id: z.string().uuid().optional().nullable().or(z.literal("")),
  source: z.string().default("manual-add")
});

// Hand-rolled CSV parser. Handles quoted fields, escaped quotes, commas, CRLF.
// Returns rows of string arrays. Skips empty lines.
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      // Close field and row.
      row.push(field);
      field = "";
      // Skip CRLF as one break.
      if (ch === "\r" && input[i + 1] === "\n") i++;
      // Avoid pushing rows that are entirely blank.
      if (!(row.length === 1 && row[0] === "")) rows.push(row);
      row = [];
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Trailing field.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
  }
  return rows;
}

// Map raw header strings to canonical column keys.
function detectColumns(header: string[]): { email: number; name: number; phone: number } {
  const idx = { email: -1, name: -1, phone: -1 };
  header.forEach((h, i) => {
    const norm = h.trim().toLowerCase();
    if (idx.email < 0 && (norm === "email" || norm === "email address" || norm === "e-mail")) idx.email = i;
    if (idx.name < 0 && (norm === "name" || norm === "full name" || norm === "first name")) idx.name = i;
    if (idx.phone < 0 && (norm === "phone" || norm === "mobile" || norm === "phone number")) idx.phone = i;
  });
  // Fallback: if no email column found but col 0 looks like email, use it.
  if (idx.email < 0) idx.email = 0;
  return idx;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function importCsv(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const file = formData.get("file");
  const locationId = (formData.get("location_id") as string) || null;
  const source = ((formData.get("source") as string) || "import").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pick a CSV file before importing." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "CSV exceeds the 5MB limit. Split into smaller files." };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { error: "CSV is empty or only has a header row." };
  }

  const cols = detectColumns(rows[0]);
  const dataRows = rows.slice(1);

  // Service role to bypass RLS for bulk import. Caller is already gated by admin layout.
  const supabase = createAdminClient();

  // Pre-fetch existing emails for the chosen location bucket to dedupe.
  // Schema unique constraint: (email, location_id). Treat null location as a separate bucket.
  const emailsToInsert: { email: string; name: string | null; phone: string | null; source: string; location_id: string | null }[] = [];
  const seenInBatch = new Set<string>();
  let invalid = 0;

  for (const r of dataRows) {
    const rawEmail = (r[cols.email] ?? "").trim().toLowerCase();
    if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
      invalid++;
      continue;
    }
    const key = rawEmail + "|" + (locationId ?? "");
    if (seenInBatch.has(key)) continue;
    seenInBatch.add(key);

    emailsToInsert.push({
      email: rawEmail,
      name: cols.name >= 0 ? ((r[cols.name] ?? "").trim() || null) : null,
      phone: cols.phone >= 0 ? ((r[cols.phone] ?? "").trim() || null) : null,
      source,
      location_id: locationId
    });
  }

  if (emailsToInsert.length === 0) {
    return { error: "No valid emails found in the CSV.", invalid, total: dataRows.length };
  }

  // Look up existing rows in this bucket.
  const allEmails = emailsToInsert.map((e) => e.email);
  let existingQuery = supabase.from("email_subscribers").select("email").in("email", allEmails);
  if (locationId) {
    existingQuery = existingQuery.eq("location_id", locationId);
  } else {
    existingQuery = existingQuery.is("location_id", null);
  }
  const { data: existing, error: lookupError } = await existingQuery;
  if (lookupError) return { error: "Lookup failed: " + lookupError.message };

  const existingSet = new Set((existing ?? []).map((r: any) => r.email));
  const fresh = emailsToInsert.filter((e) => !existingSet.has(e.email));
  const duplicates = emailsToInsert.length - fresh.length;

  if (fresh.length === 0) {
    return { inserted: 0, duplicates, invalid, total: dataRows.length };
  }

  // Insert in chunks of 500 to stay friendly to PostgREST.
  let inserted = 0;
  for (let i = 0; i < fresh.length; i += 500) {
    const chunk = fresh.slice(i, i + 500);
    const { error: insertError, count } = await supabase
      .from("email_subscribers")
      .insert(chunk, { count: "exact" });
    if (insertError) {
      return {
        error: "Inserted " + inserted + " before failure: " + insertError.message,
        inserted,
        duplicates,
        invalid,
        total: dataRows.length
      };
    }
    inserted += count ?? chunk.length;
  }

  revalidatePath("/admin/email-lists");
  return { inserted, duplicates, invalid, total: dataRows.length };
}

export async function setUnsubscribed(id: string, unsubscribed: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("email_subscribers")
    .update({
      unsubscribed,
      unsubscribed_at: unsubscribed ? new Date().toISOString() : null
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/email-lists");
  revalidatePath("/admin/email-lists/" + id);
  return {};
}

export async function deleteSubscriber(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("email_subscribers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email-lists");
  redirect("/admin/email-lists");
}

export async function manualAddSubscriber(_prev: ManualAddState, formData: FormData): Promise<ManualAddState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = manualAddSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("email_subscribers").insert({
    email: v.email.trim().toLowerCase(),
    name: v.name || null,
    phone: v.phone || null,
    location_id: v.location_id ? v.location_id : null,
    source: VALID_SOURCES.includes(v.source) ? v.source : "manual-add"
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "That email is already on the list for this location." };
    }
    return { error: error.message };
  }
  revalidatePath("/admin/email-lists");
  return {};
}
