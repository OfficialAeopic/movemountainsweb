# Move Mountains Artisan Market, Full Build Plan v1

**Author:** Theron (COO) via Claude PM
**Date:** 2026-04-17
**Status:** DRAFT, pending Sam + Justin signoff
**Source inputs:** Verbal signed deal 2026-04-14 (Justin CMO close, $100/mo site-only), Amanda onboarding call 2026-04-17, onboarding-holes.md, vendor-upside-hypothesis.md, amanda-call-notes-2026-04-17-raw.md.
**Reconciliation note:** This plan is drafted from live call notes. Final reconciliation pending against the Whisper transcript of the 2026-04-17 onboarding call. Any discrepancy surfaced by the transcript will trigger a v1.1 revision.

## TL;DR

What Amanda asked for on the 2026-04-17 call is a SaaS platform with a marketing site sitting on top of it, not a website. The signed $100/mo deal cannot cover this scope. We need a new SOW, new pricing, and a timeline reset before any meaningful build work begins.

Phase 1 MVP (vendor portal) is achievable by Amanda's 2-week target of 2026-05-01 if scope locks this week (by 2026-04-24). If Sam and Justin do not approve a revised deal, we deliver the originally scoped site-only build and park the platform work entirely. We do not attempt platform delivery at $100/mo. That path is a scope-creep cliff.

## Scope Breakdown

### In the signed verbal (2026-04-14)

- 6-location public marketing site (originally 4, Amanda raised to 6 on the call).
- Basic content pages: about, locations, vendor info, contact, scripture integration.
- Site upkeep (terms TBD, billed separately).
- $100/mo recurring.

### New since the onboarding call (2026-04-17)

Amanda expanded scope to the following items. None of these were in the $100/mo verbal.

- Full vendor CRM (admin-side) to replace her spreadsheet.
- Vendor-facing portal with magic link login, upcoming events, invoice access, booth assignment visibility.
- Vendor inquiry screener per location (filter by craft category, fit, capacity).
- Full application form post-approval with document upload.
- Food vendor certificate upload with gating (cannot be approved until cert is on file).
- Vendor uniqueness per property for liability.
- Email template editor for Amanda to self-serve blast copy.
- Email blast automation with segmentation (by location, by vendor status, by repeat tier).
- SMS automation (Twilio) for reminders, approvals, day-of comms.
- Social media posting pipeline for FB + IG using Amanda's Canva content (TikTok NOT requested, explicit).
- Repeat vendor tracking with tier or stats.
- Preferred section assignment logic (for example, "the pavilion" repeat vendors).
- Volunteer application form.
- Musician application form.
- Staff application form.
- Scripted FAQ chatbot (not a full LLM agent).
- Public event calendar with schema.org Events markup for SEO.
- 6 locations (up from 4), 20-60 vendors per location, up to 360 total at peak.
- Vendor portal MVP test in 2 weeks (2026-05-01).
- Full site + marketing live by 2026-05-27.

### Out for now (V2 park list)

Amanda explicitly agreed these can wait.

- Interactive booth map (clickable grid showing which booths are open).
- Stripe integration and card-present payments (she keeps Apple Pay, Venmo, Zelle, Cash App, tracked manually in admin).
- Raffle digital pipeline (today runs on a Google Form, stays as-is for V1).
- Analytics dashboard for Amanda.
- No-show tracking.
- Certificate expiry auto-reminders.
- TikTok integration.
- AI-generated content (Amanda makes her own in Canva, we post).

## Architecture

### Tech stack

- **Framework:** Next.js 14 with App Router, TypeScript.
- **Styling:** Tailwind CSS + ShadCN UI components.
- **Database and auth:** Supabase (Postgres, Auth with magic links, Storage for documents, Row Level Security enforced on every table).
- **Email:** Resend for transactional and blast email.
- **SMS:** Twilio for automation (reminders, approvals, day-of comms).
- **Social:** Meta Graph API for FB + IG scheduling and posting.
- **Hosting:** Vercel.
- **File storage:** Supabase Storage for food cert uploads, vendor docs, applications, insurance.
- **Payments:** No Stripe in V1. Amanda's existing rails (Apple Pay, Venmo, Zelle, Cash App) are tracked manually in the admin payments table.

### Data model (bullet sketch, full schema in Phase 0)

- `locations`: the 6 market venues with address, capacity, default vendor cap, and per-location screener rules.
- `events`: dated market occurrences tied to a location.
- `vendors`: the unique vendor record per person or business per property (enforced unique per location for liability).
- `event_vendors`: the join table assigning a vendor to a specific event with booth or section assignment and payment status.
- `applications`: inbound applications from inquiry screener through full post-approval form.
- `documents`: uploaded cert files, insurance docs, signed agreements, tied to vendor and type.
- `email_templates`: Amanda-editable templates with merge tags.
- `sms_templates`: same, for SMS.
- `email_log`: every outbound email with status, open, bounce.
- `sms_log`: every outbound SMS with delivery status.
- `payments`: manual entries for Apple Pay, Venmo, Zelle, Cash App reconciliation.
- `repeat_vendor_stats`: computed tier, total events attended, preferred section, notes.

### Auth model

- **admin:** Amanda, plus any Aeopic internal staff with admin-level access.
- **vendor:** approved vendor, sees only their own data via RLS.
- **applicant:** pre-approval state, can fill applications and upload docs, cannot see vendor portal.

## Phased Build Plan

### Phase 0, Scope Lock (2026-04-17 to 2026-04-24, this week)

Nothing gets built until this phase closes.

- SOW review and revision (Justin).
- Pricing option selected (Sam + Justin + Theron).
- Domain registered (movemountainsmarket.com preferred, movemountainsartisanmarket.com as fallback).
- Supabase project created, environment scaffolded.
- GitHub repo initialized under peregrineio org.
- Vercel project linked to repo.
- Final data model signoff from Theron.
- Amanda sends current spreadsheet of vendors, events, and locations for seed data.

### Phase 1, Vendor Portal MVP (2026-04-25 to 2026-05-01, Amanda's 2-week test)

The deliverable Amanda asked to see in 2 weeks.

- Magic link auth via Supabase for admin and vendor roles.
- Basic admin UI: add/edit vendors, add/edit events, assign vendors to events, set booth assignments.
- Basic vendor portal: login, "my upcoming events" list, invoice URL field surfaced, booth assignment visible.
- Manual seed of Amanda's current spreadsheet data into the database.
- Staging URL (Vercel preview) shared with Amanda for her test.
- No public site yet, no automation yet, no applications flow yet.

### Phase 2, Public Website + Intake (2026-05-02 to 2026-05-15)

- 6-location public marketing site (home, about, each location as its own page, contact).
- Scripture integration in the site design per Amanda's request.
- Per-location inquiry screener form.
- Post-inquiry automation (auto-email on submission, routing to Amanda for review).
- Full application form rendered post-approval.
- Document upload flow (food cert gating enforced at approval).
- Email template editor in admin (WYSIWYG with merge tag picker).
- Vendor portal invoice and notification surfaces layered in.

### Phase 3, Automation + Launch (2026-05-16 to 2026-05-27, THE May 27 deliverable)

- SMS automation via Twilio (reminders, approval notifications, day-of comms).
- Email blast system with segmentation (by location, status, repeat tier).
- Volunteer, musician, and staff application forms live on public site.
- Scripted FAQ chatbot (rules-based, answers FAQ about locations, vendor requirements, application process). Not an LLM agent.
- Repeat vendor tracking visible in admin with tier and preferred section.
- Public event calendar with schema.org Event markup for SEO.
- Social scheduling workflow: Amanda uploads Canva image + caption in admin, system queues to FB + IG via Meta Graph API.
- Cutover to real domain (movemountainsmarket.com).
- Amanda training: 1 Zoom walkthrough plus a Loom library for self-serve reference.

### Phase 4, V2 (June+)

Parked items pulled in later based on usage and willingness to expand scope.

- Interactive booth map (click-to-assign grid per event).
- Raffle digital pipeline replacing the Google Form.
- Stripe integration for card payments.
- Analytics dashboard for Amanda.
- No-show tracking and vendor reliability scoring.
- Certificate expiry auto-reminders.

## Risks + What Could Break the Timeline

- **SOW delay.** If Sam and Justin do not close the revised pricing deal by 2026-04-24, Phase 1 cannot start, and the 2026-05-01 MVP slips.
- **Amanda data delay.** If the spreadsheet seed data is not in our hands by 2026-04-28, Phase 1 slips.
- **DNS delay.** Registrar propagation and Amanda's existing DNS host (if any, unknown) could cost 24-72 hours at launch.
- **Capacity contention.** Theron is also delivering Kubin Automotive platform scope (due 2026-06-03), Patty Daddy re-engagement if it revives, and the 17-slug prospect cleanup queue. Move Mountains cannot monopolize delivery without triage.
- **Booth map scope creep.** Amanda parked it, but may push on it mid-build. Needs a hard "V2" answer if raised.
- **Chatbot scope creep.** If Amanda pushes from FAQ-scripted to "answers anything about my business," that becomes an LLM integration and a different cost line. Hold the line on scripted.

## Pricing Recommendation

Current $100/mo is insufficient. Math below.

### Infra floor (monthly)

- Supabase Pro: $25
- Vercel Pro: $20
- Resend: approximately $20 at expected volume
- Twilio: approximately $50 to $150 depending on SMS volume across 6 locations
- Domain amortized: approximately $15 (/12 on annual)

**Total infra floor: approximately $130 to $230/mo before any labor.**

At $100/mo we are underwater on infra alone, before a single hour of Aeopic labor is counted.

### Build effort estimate

- 120 to 180 hours of build across Phases 0 through 3.
- At $85/hr contractor rate: $10,200 to $15,300.
- At Aeopic internal blended rate: approximately $6,000 to $9,000.

### Three pricing options

**Option A, Build + Retainer.** $5,000 one-time build fee + $1,200/mo platform retainer. Cleanest recovery of build cost. Probably too much upfront for Amanda at this stage.

**Option B, Amortized.** $0 upfront + $1,500/mo for 12 months, then renegotiate. Requires a 12-month commitment on the SOW. Most likely to close because there is no upfront shock and it matches how Amanda thinks about operational cost. Recommended primary option.

**Option C, Staged.** $500 for Phase 0 through Phase 1, then $1,000/mo starting Phase 2. Ramps with the value she actually sees. Good fallback if Option B is declined.

**Theron's recommendation:** Lead with Option B, fall back to Option C if she pushes back. Do NOT stay at $100/mo and try to deliver this scope. That is a scope-creep cliff and it ends with the platform half-built, Amanda frustrated, and Aeopic eating 100+ hours of free work.

## What We Need From Sam + Justin

- Signoff on one of the three pricing options (or a counterproposal) by 2026-04-24.
- Justin to coordinate the new SOW via SignatureAPI this week, overriding the 2026-04-14 verbal.
- Sam to help walk Amanda through the math so she understands why the ask grew (it is her scope expansion, not ours).
- Agreement in writing: if Amanda declines revised pricing, Aeopic delivers the originally scoped site-only build for $100/mo, and Amanda stays on spreadsheets for vendor management. No platform work happens below Option C floor.

## Next Actions for Theron

In order.

1. Reconcile this plan against the Whisper transcript of the 2026-04-17 onboarding call once it finishes processing. Revise to v1.1 if anything material is captured that this draft missed.
2. Send this document to Sam and Justin for review today, 2026-04-17.
3. coo-log entry logged for "major scope expansion on Move Mountains, re-SOW pending, no build hours committed yet."
4. Do NOT start Supabase project creation or any repo init until Phase 0 closes with signed SOW.
5. In the meantime, continue clearing Patty Daddy follow-up, Kubin Automotive onboarding tasks, and the 17-slug prospect cleanup queue. Move Mountains is blocked on paperwork, not engineering.
