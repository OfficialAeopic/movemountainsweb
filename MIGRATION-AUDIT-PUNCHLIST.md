# MMM CRM Migration Audit Punch List

Generated: 2026-04-29 by platform-builder agent
Scope: migrations 0001_schema.sql, 0002_rls.sql, 0003_app_settings.sql
Out of scope: 0004_intake_gaps.sql, 0005_contact_and_subscribers.sql

---

## CRITICAL (potentially breaks runtime)

1. `audit_log` insert RLS uses `is_admin()` which calls `auth.uid()`. When app routes use service_role via `createAdminClient()`, `auth.uid()` is null. PostgreSQL default is service_role bypasses RLS, so inserts work in practice. Verify production behavior. If FORCE RLS is ever enabled, switch to explicit service_role policy.
2. `event_vendors` staff INSERT policy missing. App inserts via service_role (works), but a future staff user using `createClient()` would fail.
3. `invoices` staff WRITE policy missing (admin-only). Same pattern as #2.

## HIGH (performance at scale)

4. Add btree index on `event_vendors.vendor_id`, `event_vendors.event_id`, `event_vendors.space_type_id`.
5. Add btree index on `invoices.vendor_id`, `invoices.event_id`.
6. Add btree index on `applications.vendor_id`, `applications.email`, `applications.requested_space_type_id`.
7. Add unique btree index on `vendors.user_id` (used in `current_vendor_id()` RLS helper).
8. Add btree indexes on `sms_messages.vendor_id`, `event_id`, `sent_at`, `template_key`.
9. Add btree indexes on `survey_responses.vendor_id`, `event_id`.
10. Add btree indexes on `email_subscribers.location_id`, `unsubscribed`.
11. Add btree index on `space_types.location_id`.
12. Replace tsvector GIN index on `vendors.business_name` with `gin (business_name gin_trgm_ops)` since app uses `ilike`, not `to_tsquery`.

## MEDIUM (correctness)

13. Add NOT NULL to boolean columns with defaults: `vendor_types.active`, `requires_permits`, `product_categories.active`, `musicians.active`.
14. Add ON DELETE clauses to FKs: `market_events.location_id`, `applications.location_id/vendor_id`, `invoices.vendor_id/event_id/event_vendor_id`, `category_caps.product_category_id`. Decide cascade vs set null per relation.
15. Add unique constraint + index on `vendors.email` and `vendors.phone`.
16. Add CHECK on `applications.email` for basic format validation.
17. Add CHECK on `sms_messages.status` for valid Twilio states (queued/sent/delivered/failed/undelivered).
18. Confirm or drop `event_vendors.payment_status` `partial` enum value per blueprint.
19. Make `invoices.invoice_number` NOT NULL (already unique).
20. Replace `vendors.product_categories uuid[]` with junction table `vendor_product_categories` for FK enforcement.
21. Either default `survey_responses.rating` or change `submitted_at` to be set only when rating is provided.
22. Add CHECK `start_time < end_time` on `market_events`, `open_time < close_time` on `locations`.
23. Add CHECK `cap >= 0` on `category_caps`.

## LOW (cleanup / cosmetic)

24. Unused columns to wire up or drop: `locations.summer_open_time/close_time`, `locations.booth_map_url`, `event_vendors.booth_x/booth_y`, `vendors.liability_insurance_url/expires`, `vendors.food_manager_cert_url/expires`, `vendors.county_permit_url/expires`.
25. `vendor_types.requires_permits` set but never read.
26. Add `updated_at` trigger on `email_campaigns`, `email_subscribers`, `sms_messages`, `category_caps`, `audit_log`, `survey_responses` (and add the columns where missing).
27. Define `audit_log` retention/partition strategy before it balloons.
28. Deduplicate `set_updated_at()` and `set_app_settings_updated_at()` functions.
29. Add `created_at` column to `app_settings`.
30. Block DELETE on `app_settings` singleton row (revoke or restrict via policy).

---

## Recommended approach

Bundle CRITICAL + HIGH (#1-#12) into migration `0006_perf_and_rls_hardening.sql`. MEDIUM into `0007_correctness_constraints.sql`. LOW into `0008_cleanup.sql`.

Run each on a fresh dev project first, then promote to prod. Some MEDIUM CHECK constraints will fail if existing data violates them (unlikely on fresh project, but worth checking).

Hussam: this is your queue. Theron's ready to apply if you sign off.
