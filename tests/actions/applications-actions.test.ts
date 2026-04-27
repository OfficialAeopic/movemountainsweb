// Smoke test for app/(admin)/applications/actions.ts.
// Verifies that approveApplication enforces the requireStaff guard and that
// it cascades through vendor + event_vendor + invoice + audit_log writes.

import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createSupabaseStub, type MemorySupabase } from "../_shim/supabase.ts";

let db: MemorySupabase;
let redirectCalled: string | null = null;

class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT:${to}`);
  }
}

const sessionState: { allow: boolean } = { allow: true };

describe("applications server actions", () => {
  let actions: typeof import("../../app/(admin)/applications/actions.ts");

  before(async () => {
    db = createSupabaseStub({
      applications: [
        {
          id: "app-1",
          business_name: "Sourdough Sam",
          contact_name: "Sam Adams",
          email: "sam@example.test",
          phone: "5125550101",
          vendor_type_id: "vt-1",
          product_categories: ["cat-baked"],
          requested_space_type_id: "sp-1",
          status: "pending",
        },
      ],
      vendors: [],
      event_vendors: [],
      invoices: [],
      category_caps: [],
      audit_log: [],
    });

    mock.module("@/lib/supabase/server", {
      namedExports: { createClient: async () => db },
    });
    mock.module("@/lib/supabase/admin", {
      namedExports: { createAdminClient: () => db },
    });
    mock.module("@/lib/supabase/auth", {
      namedExports: {
        requireStaff: async () => {
          if (!sessionState.allow) {
            redirectCalled = "/admin/login?error=unauthorized";
            throw new RedirectError(redirectCalled);
          }
          return { userId: "admin-1", email: "admin@example.test", role: "admin" };
        },
      },
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
      namedExports: { revalidatePath: () => {} },
    });

    actions = await import("../../app/(admin)/applications/actions.ts");
  });
  after(() => {
    mock.restoreAll();
  });

  it("approveApplication redirects to login when role check fails", async () => {
    sessionState.allow = false;
    redirectCalled = null;
    const fd = new FormData();
    fd.append("id", "app-1");
    fd.append("event_id", "11111111-1111-1111-1111-111111111111");
    fd.append("amount", "50");
    await assert.rejects(
      () => actions.approveApplication(fd),
      (err: Error) => /unauthorized/.test(err.message)
    );
    sessionState.allow = true;
  });

  it("approveApplication writes vendor, event_vendor, invoice, and audit row", async () => {
    sessionState.allow = true;
    const fd = new FormData();
    fd.append("id", "app-1");
    fd.append("event_id", "22222222-2222-2222-2222-222222222222");
    fd.append("amount", "50");
    fd.append("booth_number", "A-3");
    await assert.rejects(
      () => actions.approveApplication(fd),
      (err: Error) => /NEXT_REDIRECT/.test(err.message)
    );

    assert.equal(db.state.tables.vendors.length, 1, "vendor row created");
    assert.equal(db.state.tables.event_vendors.length, 1, "event_vendor row created");
    assert.equal(db.state.tables.invoices.length, 1, "invoice row created");
    assert.ok(
      db.state.tables.audit_log.some(
        (r) => (r as Record<string, unknown>).action === "application_approved"
      ),
      "audit log entry recorded"
    );

    const app = db.state.tables.applications[0] as Record<string, unknown>;
    assert.equal(app.status, "approved");
    assert.equal(app.decided_by, "admin-1");
  });
});
