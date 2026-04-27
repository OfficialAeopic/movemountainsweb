// Shared bearer-token check for cron routes.
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when configured.
// Routes return 401 if the secret is set in env and the header does not match.
// If CRON_SECRET is missing in env, routes refuse to run (fail closed) so an
// unconfigured deployment cannot fire automated SMS or email by accident.

import { NextRequest, NextResponse } from "next/server";

export interface CronAuthResult {
  ok: boolean;
  response: NextResponse | null;
}

export function authorizeCron(req: NextRequest): CronAuthResult {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "CRON_SECRET not configured on server" },
        { status: 503 }
      ),
    };
  }
  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (provided !== expected) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, response: null };
}
