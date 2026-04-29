// Shared helpers for the public intake API routes (gap-bridge v1).
// Server-only. Used by /api/intake/* routes.

import { NextResponse } from "next/server";
import { z } from "zod";

export type Json = Record<string, unknown>;

// Honeypot field name. If present and non-empty, we silently accept and drop.
export const HONEYPOT_FIELD = "website";

export function isHoneypotTripped(payload: Json): boolean {
  const v = payload[HONEYPOT_FIELD];
  return typeof v === "string" && v.trim().length > 0;
}

export function ok(body: Json = {}) {
  return NextResponse.json({ ok: true, ...body }, { status: 200 });
}

export function badRequest(errors: unknown) {
  return NextResponse.json({ ok: false, errors }, { status: 400 });
}

export function serviceError() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Could not save your submission. Please try again or email info@movemountainsmarket.com."
    },
    { status: 503 }
  );
}

// safe json parse, returns {} on failure
export async function readJsonBody(req: Request): Promise<Json> {
  try {
    const body = (await req.json()) as Json;
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

// Convert "1", "true", "on", "yes", true to boolean true.
export function asBool(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "1" || s === "true" || s === "on" || s === "yes";
  }
  return false;
}

// Collect every form key that starts with a given prefix and was checked,
// returning the suffix portion. Useful for translating volunteer
// role-XXX checkboxes into a string[] of role keys.
export function collectCheckedKeys(payload: Json, prefix: string): string[] {
  const out: string[] = [];
  for (const k of Object.keys(payload)) {
    if (k.startsWith(prefix) && asBool(payload[k])) {
      out.push(k.slice(prefix.length));
    }
  }
  return out;
}

// Trim a string field, returning undefined for empty.
export function s(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

// Minimum email/phone shape.
export const emailSchema = z.string().email("Invalid email address");
export const phoneSchema = z
  .string()
  .min(7, "Phone is too short")
  .max(40, "Phone is too long");
