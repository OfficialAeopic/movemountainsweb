// Smoke test for app/(admin)/events/actions.ts.
// createEvent should reject empty form data with field errors and not call
// the redirect() helper. We mock @/lib/supabase/server with the in-memory
// shim and next/navigation + next/cache so the action runs in isolation.

import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createSupabaseStub, type MemorySupabase } from "../_shim/supabase.ts";

let db: MemorySupabase;
let redirectCalled: string | null = null;
let revalidatedPaths: string[] = [];

class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT:${to}`);
  }
}

describe("events server actions", () => {
  let actions: typeof import("../../app/(admin)/events/actions.ts");

  before(async () => {
    db = createSupabaseStub({
      market_events: [],
      locations: [{ id: "11111111-1111-1111-1111-111111111111", name: "Easton Park" }],
    });

    mock.module("@/lib/supabase/server", {
      namedExports: { createClient: async () => db },
    });
    mock.module("next/navigation", {
      namedExports: {
        redirect: (to: string) => {
          redirectCalled = to;
          throw new RedirectError(to);
        },
      },
    });
    mock.module("next/cache", {
      namedExports: {
        revalidatePath: (p: string) => {
          revalidatedPaths.push(p);
        },
      },
    });

    actions = await import("../../app/(admin)/events/actions.ts");
  });
  after(() => {
    mock.restoreAll();
  });

  it("createEvent returns field errors when required fields are missing", async () => {
    redirectCalled = null;
    const fd = new FormData();
    fd.append("location_id", ""); // invalid uuid
    fd.append("event_date", "");
    fd.append("status", "scheduled");
    const out = await actions.createEvent({}, fd);
    assert.equal(out.error, "Fix the highlighted fields.");
    assert.ok(out.fieldErrors);
    assert.ok(
      Array.isArray(out.fieldErrors!.location_id) && out.fieldErrors!.location_id!.length > 0,
      "expected location_id field error"
    );
    assert.ok(
      Array.isArray(out.fieldErrors!.event_date) && out.fieldErrors!.event_date!.length > 0,
      "expected event_date field error"
    );
    assert.equal(redirectCalled, null);
  });

  it("createEvent inserts and redirects when valid", async () => {
    redirectCalled = null;
    revalidatedPaths = [];
    const fd = new FormData();
    fd.append("location_id", "11111111-1111-1111-1111-111111111111");
    fd.append("event_date", "2026-05-10");
    fd.append("status", "scheduled");
    fd.append("vendor_capacity", "40");

    await assert.rejects(
      () => actions.createEvent({}, fd),
      (err: Error) => /NEXT_REDIRECT:\/admin\/events\//.test(err.message)
    );
    assert.ok(revalidatedPaths.includes("/admin/events"));
    assert.equal(db.state.tables.market_events.length, 1);
    assert.equal((db.state.tables.market_events[0] as Record<string, unknown>).event_date, "2026-05-10");
  });

  it("createEvent rejects unknown status enum", async () => {
    const fd = new FormData();
    fd.append("location_id", "11111111-1111-1111-1111-111111111111");
    fd.append("event_date", "2026-05-10");
    fd.append("status", "halfway-cancelled-but-not-really"); // invalid
    const out = await actions.createEvent({}, fd);
    assert.equal(out.error, "Fix the highlighted fields.");
    assert.ok(out.fieldErrors?.status);
  });
});
