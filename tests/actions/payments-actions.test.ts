// Smoke test for app/(admin)/payments/actions.ts.
// markInvoicePaid should mark the invoice paid and cascade to event_vendors.

import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createSupabaseStub, type MemorySupabase } from "../_shim/supabase.ts";

let db: MemorySupabase;

class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT:${to}`);
  }
}

describe("payments server actions", () => {
  let actions: typeof import("../../app/(admin)/payments/actions.ts");

  before(async () => {
    db = createSupabaseStub({
      invoices: [
        {
          id: "inv-1",
          status: "unpaid",
          event_vendor_id: "ev-1",
          amount: 50,
          vendor_id: "vendor-1",
          event_id: "event-1",
        },
      ],
      event_vendors: [
        { id: "ev-1", payment_status: "pending", vendor_id: "vendor-1", event_id: "event-1" },
      ],
      audit_log: [],
      sms_messages: [],
    });

    mock.module("@/lib/supabase/admin", {
      namedExports: { createAdminClient: () => db },
    });
    mock.module("@/lib/supabase/auth", {
      namedExports: {
        requireStaff: async () => ({
          userId: "admin-1",
          email: "admin@example.test",
          role: "admin",
        }),
      },
    });
    mock.module("next/navigation", {
      namedExports: {
        redirect: (to: string) => {
          throw new RedirectError(to);
        },
      },
    });
    mock.module("next/cache", {
      namedExports: { revalidatePath: () => {} },
    });

    actions = await import("../../app/(admin)/payments/actions.ts");
  });
  after(() => {
    mock.restoreAll();
  });

  it("markInvoicePaid flips invoice and cascades to event_vendor", async () => {
    const fd = new FormData();
    fd.append("id", "inv-1");
    fd.append("payment_method", "Zelle");
    fd.append("payment_reference", "Z-123");
    fd.append("paid_date", "2026-04-26");

    await assert.rejects(
      () => actions.markInvoicePaid(fd),
      (err: Error) => /NEXT_REDIRECT/.test(err.message)
    );

    const inv = db.state.tables.invoices[0] as Record<string, unknown>;
    assert.equal(inv.status, "paid");
    assert.equal(inv.payment_method, "Zelle");
    assert.equal(inv.payment_reference, "Z-123");

    const ev = db.state.tables.event_vendors[0] as Record<string, unknown>;
    assert.equal(ev.payment_status, "paid");
    assert.equal(ev.payment_method, "Zelle");

    assert.ok(
      db.state.tables.audit_log.some(
        (r) => (r as Record<string, unknown>).action === "invoice_marked_paid"
      ),
      "audit row recorded"
    );
  });
});
