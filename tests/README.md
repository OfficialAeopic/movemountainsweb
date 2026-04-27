# Move Mountains CRM Tests

These tests cover the units that the Vercel runtime cannot easily exercise
end-to-end without real Twilio, Resend, SignatureAPI, and Supabase
credentials. They run against an in-memory Supabase shim plus stub responses
from each integration module.

## Stack

- `node:test` (built into Node 20+, recommended Node 22+)
- `node:assert/strict`
- Native TypeScript via `--experimental-strip-types` (Node 22.6+, default in
  Node 23+)
- Module mocks via `--experimental-test-module-mocks` (Node 22+)

No npm packages are required. There is no Vitest, no Jest, no ts-node.

## Running

From the project root:

```bash
node --experimental-strip-types \
     --experimental-transform-types \
     --experimental-test-module-mocks \
     --test "tests/**/*.test.ts"
```

A simpler shortcut, using the helper script:

```bash
node tests/run.mjs
```

The runner script wraps the same flags so contributors do not have to
remember them. It also forwards any extra args to `node:test`.

To run a single file:

```bash
node tests/run.mjs tests/lib/twilio-templates.test.ts
```

## Layout

```
tests/
  _shim/
    supabase.ts        in-memory Supabase JS shim (select/insert/update/delete)
    env.ts             env isolation helper
  lib/
    twilio-templates.test.ts
    resend-templates.test.ts
    signature-api.test.ts
    category-caps.test.ts
  auth/
    require-role.test.ts
  actions/
    events-actions.test.ts
    applications-actions.test.ts
    payments-actions.test.ts
  cron/
    auth.test.ts
  README.md
  run.mjs
```

## What is covered

- SMS template rendering and variable substitution
- Email template rendering with valid HTML and no emdashes
- SignatureAPI `createContract` in stub mode plus location template mapping
- Supabase auth helpers `requireAdmin` / `requireStaff` / `getServerSession`
- `createEvent` validates required fields
- `approveApplication` enforces the staff role check and cascades writes
  through vendors, event_vendors, invoices, and audit_log
- `markInvoicePaid` cascades to event_vendors
- Category cap calculator counts and warning thresholds
- Cron route bearer-token authorization

## What is intentionally NOT covered

- Real Supabase round-trips (use the SQL migrations directly to test the
  database in a staging project)
- Live SMS or email delivery (covered by the Twilio and Resend dashboards)
- Stripe webhooks (no Stripe in the MMM CRM, payments are manual)
- Browser interactions (use Playwright or TestSprite for those flows when
  the budget exists)

## Mocking strategy

Each integration is designed to no-op cleanly when its env vars are missing.
Tests rely on that stub mode rather than fakes wherever possible. For the
server-action tests, `node:test` `mock.module` swaps in the in-memory
Supabase shim plus stub `next/navigation` and `next/cache` modules before
the action under test is dynamically imported.
