# Move Mountains Artisan Market, Revised Pricing Options

**Prepared for:** Amanda (Owner)
**Prepared by:** Justin (CMO) and Theron (COO), Aeopic
**Date:** 2026-04-18
**Purpose:** Align on scope and pricing for the platform Amanda described on the 2026-04-17 onboarding call, so we can start building toward her 2026-05-01 vendor portal test.

---

## Where we are

On 2026-04-14 we signed a verbal agreement for a 6-location marketing website at $100/month. On the 2026-04-17 onboarding call, Amanda walked us through what she actually needs day to day, and the ask grew significantly. It is now a full vendor management platform with a public marketing site sitting on top of it, not a website with a contact form.

This is a good outcome. Amanda knows her business and she knows what would actually help. We want to build what she asked for. The original $100/month figure was priced for the site-only version of the deal, and it does not cover the platform scope. Before we start building, we need to re-set pricing so both sides are protected.

---

## What Amanda asked for (summary)

**Admin side (Amanda's console):**
- Vendor CRM replacing the spreadsheet
- Per-location vendor inquiry screener
- Full application form post-approval with document upload
- Food vendor certificate upload with approval gating
- Repeat vendor tracking with tier and preferred section
- Email template editor and blast system with segmentation
- SMS automation via Twilio for reminders and day-of comms
- Social scheduling (Facebook + Instagram) for Canva content Amanda makes
- Scripted FAQ chatbot
- Volunteer, musician, and staff application intake

**Vendor side (portal):**
- Magic link login, no passwords
- My upcoming events list
- Booth assignment visibility
- Invoice access

**Public side (website):**
- 6-location marketing site (home, each location, about, contact, vendor info)
- Public event calendar with schema.org Event markup for SEO
- Scripture integration throughout

**Parked for V2 (Amanda agreed):**
- Interactive booth map
- Stripe card payments
- Raffle digital pipeline
- Analytics dashboard
- TikTok integration
- AI content generation

---

## Why $100/month does not cover this

At the platform scope Amanda described, Aeopic's baseline monthly cost to keep the system running (before a single hour of our labor is counted) looks like this.

| Service | Purpose | Monthly cost |
|---------|---------|-------------:|
| Supabase Pro | Database, auth, file storage | $25 |
| Vercel Pro | Hosting, automatic deploys | $20 |
| Resend | Transactional and blast email | ~$20 |
| Twilio | SMS automation across 6 locations | $50 to $150 |
| Domain | Annual, amortized | ~$15 |
| **Total infrastructure floor** | | **$130 to $230** |

At $100/month, Aeopic loses $30 to $130 per month before any labor. Over 12 months that is $360 to $1,560 of negative margin on infrastructure alone. We cannot build and maintain a platform this way without the project collapsing, which ends with Amanda on a half-built system. That is not an outcome anyone wants.

The honest read: the $100/month figure was set for a marketing site, not a platform. The scope grew. The price should grow with it.

---

## Three options

All three options deliver the full scope Amanda described. The parked V2 list stays parked. What changes between options is when money moves.

### Option A, Build fee plus retainer

- **Upfront:** $5,000 one-time build fee
- **Recurring:** $1,200/month starting at launch
- **Term:** Month-to-month after launch, 30-day cancellation either side

This is the cleanest structure for Aeopic and the most front-loaded for Amanda. It recovers the build cost immediately and the monthly retainer covers infrastructure, hosting, support, and ongoing small changes.

Best for: a business with cash on hand that prefers a lower monthly rate going forward.

### Option B, Amortized (recommended)

- **Upfront:** $0
- **Recurring:** $1,500/month for 12 months, then renegotiate
- **Term:** 12-month commitment required, no early cancellation during year one

No upfront shock, the build cost is baked into the monthly. After 12 months both sides renegotiate based on what the platform is actually doing for the business. This is the option most small businesses pick because it matches how they think about operational cost.

Best for: Amanda specifically. It lines up with vendor booth fees being her own recurring revenue, and it removes the upfront decision that often stalls deals.

### Option C, Staged

- **Phase 0 + Phase 1 (vendor portal MVP):** $500 one-time
- **Phase 2+ (public site, automation, launch):** $1,000/month starting at cutover
- **Term:** Month-to-month, 30-day cancellation

Lowest-friction entry. Amanda sees the vendor portal working in 2 weeks for $500, then decides whether to green-light the rest. If she says no after Phase 1, we keep the vendor portal running for her at a price we can agree on (or she exits). If she says yes, we proceed with Phase 2 at $1,000/month.

Best for: if Amanda wants to de-risk by paying for the first visible deliverable before committing to the rest.

---

## What happens if none of these land

If Amanda does not want any of the three options, the fallback is simple and honest: we deliver the originally scoped 6-location marketing website for $100/month, as signed. No admin console, no vendor portal, no automation, no applications flow. Amanda stays on her spreadsheet for vendor management. The marketing site is a real deliverable and $100/month is a real fit for that scope. Nobody owes anybody anything extra.

This fallback exists specifically so Amanda does not feel trapped into the platform tier. She gets to choose the scope that fits her budget, and either answer is a real answer.

---

## Timeline once pricing is signed

This is contingent on a signed SOW by 2026-04-24.

| Phase | Window | Deliverable |
|-------|--------|-------------|
| Phase 0, Scope lock | 2026-04-17 to 2026-04-24 | SOW signed, domain, Supabase, repo, Vercel, data model |
| Phase 1, Vendor Portal MVP | 2026-04-25 to 2026-05-01 | Magic link login, admin UI, vendor portal, staging URL for Amanda's test |
| Phase 2, Public Site + Intake | 2026-05-02 to 2026-05-15 | 6-location marketing site, application forms, email template editor |
| Phase 3, Automation + Launch | 2026-05-16 to 2026-05-27 | SMS, email blasts, social scheduling, FAQ chatbot, event calendar, cutover |

The 2026-05-01 vendor portal test Amanda asked for is achievable if we close pricing this week.

---

## What we need from Amanda

1. Pick Option A, B, C, or the $100/month fallback.
2. Confirm domain choice (movemountainsmarket.com preferred, movemountainsartisanmarket.com as fallback).
3. Send the current vendor and event spreadsheet so we can seed the database.

Justin will send the SOW through SignatureAPI within 24 hours of Amanda's choice.

---

*For the full engineering plan behind this scope, see `Aeopic/clients/move-mountains-market/docs/build-plan-v1.md`.*
