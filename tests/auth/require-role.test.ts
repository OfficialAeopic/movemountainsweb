// Tests for requireAdmin / requireStaff / requireRole.
// Uses node:test mock.module to swap out @/lib/supabase/server and
// next/navigation before importing the auth module under test.
//
// Requires Node flag: --experimental-test-module-mocks

import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";

const stubState: {
  user: { id: string; email: string } | null;
  role: string | null;
} = { user: null, role: null };

class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT:${to}`);
    this.name = "RedirectError";
  }
}

function makeSupabaseStub() {
  return {
    createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: stubState.user }, error: null }),
      },
      from: (_table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: stubState.role ? { role: stubState.role } : null,
              error: null,
            }),
          }),
        }),
      }),
    }),
  };
}

const navigationStub = {
  redirect: (to: string) => {
    throw new RedirectError(to);
  },
};

describe("supabase auth helpers", () => {
  let auth: typeof import("../../lib/supabase/auth.ts");

  before(async () => {
    mock.module("@/lib/supabase/server", { namedExports: makeSupabaseStub() });
    mock.module("next/navigation", { namedExports: navigationStub });
    auth = (await import("../../lib/supabase/auth.ts")) as typeof import("../../lib/supabase/auth.ts");
  });
  after(() => {
    mock.restoreAll();
    stubState.user = null;
    stubState.role = null;
  });

  it("getServerSession returns null when no user", async () => {
    stubState.user = null;
    stubState.role = null;
    const session = await auth.getServerSession();
    assert.equal(session, null);
  });

  it("getServerSession returns session with role", async () => {
    stubState.user = { id: "u1", email: "u1@example.test" };
    stubState.role = "admin";
    const session = await auth.getServerSession();
    assert.deepEqual(session, {
      userId: "u1",
      email: "u1@example.test",
      role: "admin",
    });
  });

  it("requireAdmin redirects when no session", async () => {
    stubState.user = null;
    stubState.role = null;
    await assert.rejects(
      () => auth.requireAdmin(),
      (err: Error) => /NEXT_REDIRECT:\/admin\/login/.test(err.message)
    );
  });

  it("requireAdmin redirects when role is staff", async () => {
    stubState.user = { id: "u2", email: "staff@example.test" };
    stubState.role = "staff";
    await assert.rejects(
      () => auth.requireAdmin(),
      (err: Error) => /unauthorized/.test(err.message)
    );
  });

  it("requireStaff allows admin", async () => {
    stubState.user = { id: "u3", email: "boss@example.test" };
    stubState.role = "admin";
    const session = await auth.requireStaff();
    assert.equal(session.role, "admin");
  });

  it("requireStaff allows staff", async () => {
    stubState.user = { id: "u4", email: "staff@example.test" };
    stubState.role = "staff";
    const session = await auth.requireStaff();
    assert.equal(session.role, "staff");
  });

  it("requireStaff redirects vendor role", async () => {
    stubState.user = { id: "u5", email: "vendor@example.test" };
    stubState.role = "vendor";
    await assert.rejects(
      () => auth.requireStaff(),
      (err: Error) => /unauthorized/.test(err.message)
    );
  });
});
