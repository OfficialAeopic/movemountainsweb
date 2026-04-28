# MMM CRM Handoff to Hussam

**Date:** 2026-04-28
**Status:** Database ready, dev server boots, admin login works.

---

## What is wired and working

- Supabase project `move-mountains-market` (ref: `fjklsxpjcneysaoopqmi`) created in OfficialAeopic's Org
- All schema migrations applied (`0001_schema.sql`, `0002_rls.sql`, `0003_app_settings.sql`)
- Seed data loaded: 4 market locations (Easton Park, Goodnight Ranch, Whisper Valley, Wolf Ranch)
- 18 tables live: vendors, applications, market_events, event_vendors, invoices, contracts, audit_log, user_roles, locations, space_types, vendor_types, product_categories, category_caps, sms_messages, email_subscribers, email_campaigns, survey_responses, app_settings, musicians
- RLS policies enabled
- Admin user `admin@aeopic.com` created in Supabase Auth, granted `admin` role

## What you need from Theron (separately, in private channel)

1. Supabase admin password for `admin@aeopic.com`
2. Database password (for direct psql / connection-string access)
3. PAT (if you want full Management API access from your machine)

These are NOT in this repo. Theron will share via Slack DM or whatever secure channel you prefer.

## To run locally

```
cd Aeopic/clients/move-mountains-market
git checkout feat/crm-build-v1
npm install
# Save .env.local at the project root with these keys (Theron will share):
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   NEXT_PUBLIC_APP_URL
#   CRON_SECRET
npm run dev
```

Then http://localhost:3000/admin/login. Sign in with the admin creds Theron shares.

## Useful URLs

| Resource | URL |
|---|---|
| Supabase project dashboard | https://supabase.com/dashboard/project/fjklsxpjcneysaoopqmi |
| Supabase SQL Editor | https://supabase.com/dashboard/project/fjklsxpjcneysaoopqmi/sql/new |
| Auth users | https://supabase.com/dashboard/project/fjklsxpjcneysaoopqmi/auth/users |
| Repo | https://github.com/OfficialAeopic/movemountainsweb |
| Branch | `feat/crm-build-v1` |
| Build spec | `docs/MMM_CRM_BLUEPRINT_v1.md` |
| Build instructions | `THERON_BUILD_INSTRUCTIONS.md` (or wherever Theron has them) |
| Build status fork notes | `CRM_BUILD_STATUS.md` (root) |

## Still pending (NOT blocking the CRM dashboard)

These are V2 wiring needed for full SMS/email/contract workflows. The dashboard, vendor list, applications, market events, invoices, and core admin flows all work without them.

| Item | Owner | Notes |
|---|---|---|
| Twilio account + phone number | Theron / Hussam | For SMS reminders |
| Resend account + verified `movemountainsmarket.com` (or fallback domain) | Theron / Hussam | For email cron, payment reminders, admin notifications |
| SignatureAPI account + per-location templates | Theron / Hussam | For vendor contracts |
| Real production domain DNS to Vercel | Amanda | When she confirms which domain |
| Vercel project linked to repo + env vars set | Hussam | Production deploy |

## Architecture notes (so you don't re-discover them)

1. **Static `/site/` directory must be preserved untouched.** The Next.js app coexists with `/site/` at the repo root. The static MMM marketing site lives there and is the live website for Amanda. The Next.js CRM is internal-only.
2. **`(public)` route group is a stub.** The live website still serves from `/site/*.html`.
3. **Security headers baked in via next.config.js.** Per Standing Order 29.
4. **`user_roles` table is the role mechanism (not Supabase custom claims).** Helper functions `is_admin()`, `is_staff_or_admin()`, `current_vendor_id()` provide RLS expressions.
5. **`types/database.ts` is hand-rolled.** Replace later via `supabase gen types typescript --local`.
6. **`.env.local` is gitignored.** Never commit it. Only `.env.example` ships.

## Open questions for Amanda (existing)

Per `docs/onboarding-holes.md`:
- Last name
- Phone, owner email
- Mailing address
- Site upkeep billing model
- Revision limit
- Brand colors / logo (existing file)
- Domain decision (renew movemountainsmarket.com or use new)
- Wolf Ranch capacity, Goodnight Ranch property/management entity

---

*Handoff prepared by Theron + Claude on 2026-04-28.*
