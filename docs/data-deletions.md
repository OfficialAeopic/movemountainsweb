# Move Mountains Artisan Market - Data Deletions Log

Append-only audit log of email and contact data scrub requests.

| Date | Email / Identifier | Source file(s) | Reason | Confirmed By |
|------|--------------------|----------------|--------|--------------|
| 2026-05-23 | [REDACTED-per-data-deletion-request] | South Austin email list (not in repo, no in-repo references found at the time of scrub) | Amanda request 2026-05-23 per v2 blueprint P8 | Theron (COO), Phase B execution 2026-05-24 |

## Notes

- 2026-05-24: Grep across the full repository for `[REDACTED-per-data-deletion-request]` found matches only in blueprint and promptdoc files (`docs/2026-05-23_website-updates-blueprint-v2.md`, `docs/promptdocs/2026-05-24_blueprint-v2-phase-b.md`, `docs/blueprints/2026-05-24_blueprint-v2-phase-b.md`, `docs/compliance-checks/2026-05-24_blueprint-v2-phase-b.md`). Those are deletion-request artifacts, not active subscriber data, so they are intentionally left in place to preserve the audit trail of the request itself. No subscriber list file currently lives in this repo; the South Austin list lives in Amanda's external email tool. Theron to apply the deletion in that tool out-of-band and report back when removed.
