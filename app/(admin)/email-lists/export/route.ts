// PROMPT 16 - CSV export route. Streams subscribers as a download.
// Filters mirror the list page query params: q, source, location, status.

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/supabase/auth";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: NextRequest) {
  // Reuse the same gate the admin layout uses.
  await requireStaff();

  const sp = req.nextUrl.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("email_subscribers")
    .select("email, name, phone, source, raffle_entries, unsubscribed, created_at, location_id, locations(name)")
    .order("created_at", { ascending: false });

  const q = sp.get("q");
  if (q && q.trim()) {
    const term = q.trim();
    query = query.or("email.ilike.%" + term + "%,name.ilike.%" + term + "%");
  }
  const source = sp.get("source");
  if (source && source !== "all") query = query.eq("source", source);
  const location = sp.get("location");
  if (location && location !== "all") query = query.eq("location_id", location);
  const status = sp.get("status");
  if (status === "subscribed") query = query.eq("unsubscribed", false);
  if (status === "unsubscribed") query = query.eq("unsubscribed", true);

  const { data, error } = await query;
  if (error) {
    return new Response("Export failed: " + error.message, { status: 500 });
  }

  const header = ["email", "name", "phone", "location", "source", "raffle_entries", "unsubscribed", "created_at"];
  const lines = [header.join(",")];

  for (const row of data ?? []) {
    const r = row as any;
    lines.push(
      [
        csvEscape(r.email),
        csvEscape(r.name),
        csvEscape(r.phone),
        csvEscape(r.locations?.name),
        csvEscape(r.source),
        csvEscape(r.raffle_entries ?? 0),
        csvEscape(r.unsubscribed ? "true" : "false"),
        csvEscape(r.created_at)
      ].join(",")
    );
  }

  const body = lines.join("\r\n");
  const filename = "email-subscribers-" + new Date().toISOString().slice(0, 10) + ".csv";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="' + filename + '"',
      "Cache-Control": "no-store"
    }
  });
}
