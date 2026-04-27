// Cron auth bearer-token tests.

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

// Loader stub for next/server already provides NextRequest and NextResponse.
const { authorizeCron } = await import("../../lib/cron/auth.ts");

function makeReq(headers: Record<string, string>): unknown {
  // NextRequest's headers.get is the only surface authorizeCron touches.
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  };
}

describe("cron auth", () => {
  const original = process.env.CRON_SECRET;
  before(() => {
    process.env.CRON_SECRET = "shhh";
  });
  after(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });

  it("returns 401 when no header is provided", () => {
    const result = authorizeCron(makeReq({}) as never);
    assert.equal(result.ok, false);
    assert.equal(result.response?.status, 401);
  });

  it("returns 401 when bearer token is wrong", () => {
    const result = authorizeCron(
      makeReq({ authorization: "Bearer wrong-token" }) as never
    );
    assert.equal(result.ok, false);
  });

  it("authorizes when bearer token matches", () => {
    const result = authorizeCron(
      makeReq({ authorization: "Bearer shhh" }) as never
    );
    assert.equal(result.ok, true);
    assert.equal(result.response, null);
  });

  it("returns 503 when CRON_SECRET is missing in env", () => {
    delete process.env.CRON_SECRET;
    const result = authorizeCron(
      makeReq({ authorization: "Bearer shhh" }) as never
    );
    assert.equal(result.ok, false);
    assert.equal(result.response?.status, 503);
    process.env.CRON_SECRET = "shhh";
  });
});
