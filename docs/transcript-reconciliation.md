# Move Mountains Artisan Market - Transcript Reconciliation

**Source transcript:** docs/amanda-call-notes-2026-04-17.md (16 KB)
**Source raw:** docs/amanda-call-notes-2026-04-17-raw.md (5.4 KB)
**Call date:** 2026-04-17
**Reconciled:** 2026-04-18, revised 2026-04-19
**Reconciler:** Theron (COO)
**Standing Order:** #22

---

## COO Operating Posture (set 2026-04-19)

1. Vendor pricing is open. v2.2.0 pulled the three fabricated prices per Standing Order 24 (no unvetted prices). Booth cards now read 'Contact for pricing.' Amanda fills in numbers on review or we leave it open. Not a blocker.
2. Hosting lockdown (domain + registrar + DNS + SSL) is Justin + Hussam. COO lane ends at the final ready-to-ship build.
3. Logo is fine. Onboarding-day posture: 'site was looking good.' No logo work pending unless Amanda requests.
4. Amanda reviews v2.2.0 next. Everything blockable by her review stays in this doc until she signs off.

---

## Status legend

- SHIPPED - Live on v2.2.0 or prior.
- SHIPPED OPEN - Built with placeholder waiting on Amanda input (e.g. pricing). Not a blocker.
- PLANNED - In build-plan-v1, not built.
- DEFERRED - Parked with reason.
- OUT OF SCOPE - Not under current SLA.
- PENDING AMANDA - Waiting on Amanda input.
- PENDING JUSTIN/HUSSAM - Hosting/domain/partner lane.

---

## Reconciled asks

| # | Anchor | Ask | Status | Evidence / next step |
|---|---|---|---|---|
| 1 | 744-752 | Musician application tab | SHIPPED v2.1.0 | /get-involved/musician/ full form. |
| 2 | 753-760 | Volunteer tab | SHIPPED v2.1.0 | /get-involved/volunteer/ with outdoor-waiver checkbox. |
| 3 | 761-765 | Employment tab | SHIPPED v2.2.0 | /get-involved/employment/ professional rewrite 2026-04-19. Two listings + General Interest. |
| 4 | 200-215 | Vendor login portal | SHIPPED (preview) | /vendor-login-preview/ visual preview. Real auth Phase 4. |
| 5 | 310-330 | Booth pricing clarity | SHIPPED OPEN v2.2.0 | /vendors/ cards show 'Contact for pricing' placeholders. Prior 65/115/95 pulled per Standing Order 24. Amanda provides final numbers on review or we leave open. |
| 6 | 340-380 | Event schedule visible | SHIPPED v1.0.0 | /events/ renders rotating schedule. |
| 7 | 420-450 | Matthew 17:20 faith anchor | SHIPPED v1.0.0 | Footer site-wide + pullquote on About, Get Involved, Musician, Volunteer, Employment. |
| 8 | 500-540 | FAQ for visitor questions | SHIPPED v1.1.0 | Chatbot widget, 65-entry KB. |
| 9 | 600-640 | IG/FB links in footer | SHIPPED v1.0.0 | Footer socials + inline homepage row. |
| 10 | 670-690 | Vendor application replacing Google Form | SHIPPED v1.0.0 | /vendors/#apply four-step form. |
| 11 | 700-720 | Family-friendly kids craft corner | SHIPPED v1.0.0 | Homepage intro, about, events. |
| 12 | 770-790 | Newsletter sign-up | DEFERRED | No email platform selected. Phase 3. |
| 13 | 800-820 | Vendor spotlight/directory | PLANNED | Phase 2. Needs 10-15 anchor vendors. |
| 14 | 830-840 | Online raffle tickets | OUT OF SCOPE | E-commerce stack not site-only. |
| 15 | 850-870 | Music/activities calendar cross-listed | PLANNED | Phase 2. |
| 16 | 880-900 | Brand palette green/terra/cream | SHIPPED v1.0.0 | Tokens green #2D5016, terra #C4653A, cream #FAF3E0. |
| 17 | 920-940 | Logo / brand mark | SHIPPED v1.0.0 | Wordmark + triangle mustard-seed glyph. COO posture 2026-04-19: site looked good at onboarding. Full logo stays optional Phase 2. |
| 18 | 950-970 | SMS text alerts | OUT OF SCOPE | Not site-only. |
| 19 | 980-1000 | Accept booth fees online | OUT OF SCOPE | Payment processing not site-only. |
| 20 | 1020-1040 | About page rebrand story | SHIPPED v1.0.0 | /about/ tells 2022 founding + rebrand. |

---

## Hosting / domain handoff (Justin + Hussam lane)

| Item | Owner | Status |
|---|---|---|
| Domain registration/renewal | Justin + Hussam | PENDING JUSTIN/HUSSAM |
| DNS provider selection/config | Justin + Hussam | PENDING JUSTIN/HUSSAM |
| SSL / CDN | Justin + Hussam | PENDING JUSTIN/HUSSAM |
| Hosting provider | Justin + Hussam | PENDING JUSTIN/HUSSAM |
| Final DNS flip after approval | Justin + Hussam | PENDING JUSTIN/HUSSAM |

COO lane ends at 'site tested, approved by Amanda, packaged ready.' Push-live is partner lane.

---

## What COO has left before Amanda handoff

1. Send v2.2.0 staging link to Amanda. She approves 'Contact for pricing' posture or provides numbers.
2. If she gives prices, update booth cards and cut v2.3.0.
3. Final QA (desktop + mobile, forms, chatbot).
4. Package ready-to-host build, hand to Justin + Hussam.

---

## What this closes

- Standing Order 22 satisfied.
- Row 5 pricing updated to v2.2.0 state.
- Row 17 logo reclassified shipped-acceptable.
- Hosting handed to Justin + Hussam.

## What this does NOT do

- Speak for Justin/Hussam on hosting lane.
- Decide pricing for Amanda.

---

*Authoritative reconciliation for 2026-04-17 Move Mountains onboarding. New calls get new files.*


---

## Sam (CEO) Blueprint, 2026-04-21 - Phase 1 reconciliation

**Source:** CEO Sam Shahin, AEOPIC LLC Move Mountains Artisan Market Website Completion Blueprint v1.0, delivered 2026-04-21 in chat.
**Intent:** Close pre-Monday-review gaps ahead of Amanda review.
**Reconciler:** Theron (COO) per Standing Order 22.

| # | Phase | Ask | Status v2.3.0 | Evidence / next step |
|---|---|---|---|---|
| B1 | Phase 1 | Wolf Ranch added as fourth venue on every page | SHIPPED v2.3.0 | Meta descriptions, lead copy, footer mentions, and chatbot KB now list Wolf Ranch alongside Easton Park, Goodnight Ranch, Whisper Valley. Georgetown TX city tag. Event calendar entries for Wolf Ranch remain PENDING AMANDA (dates, address, hero image). |
| B2 | Phase 1 | Location-specific vendor application flow | SHIPPED v2.3.0 | /vendors/#apply now renders four venue cards, each linking to the Google Form with `?venue=<name>` prefill. Replaces the single generic Apply button. Prefill field mapping is best-effort, will confirm with Amanda that Google Form accepts the venue query param. |
| B3 | Phase 1 | Chatbot widget on all pages | SHIPPED v1.1.0 | Already shipped in v1.1.0. KB expanded in v2.3.0 to answer Wolf Ranch questions. |
| B4 | Phase 1 | Contact form connected to Formspree | SHIPPED OPEN v2.3.0 | /contact/ main form + newsletter form both POST to `https://formspree.io/f/REPLACE_ME`. Endpoint placeholder, swap before launch once Justin creates the Formspree project. Flagged in CHANGELOG. |
| B5 | Phase 1 | GA4 installed | SHIPPED OPEN v2.3.0 | gtag snippet added to every page with placeholder `G-XXXXXXXXXX`. Swap before launch. Flagged in CHANGELOG. |
| B6 | Phase 2 | Four individual location pages + hub | PLANNED | Not in v2.3.0. Phase 2 scope, 8.5 hrs estimated. |
| B7 | Phase 2 | Non-profit section | PLANNED | Phase 2. |
| B8 | Phase 2 | Sponsor section | PLANNED | Phase 2. |
| B9 | Phase 2 | Newsletter backend | PLANNED | Phase 2, paired with email platform selection (row 12 on earlier reconciliation). |
| B10 | Phase 2 | Meta Pixel | DEFERRED | Blocked on Facebook admin access (row in existing onboarding-holes.md). Add after access grant. |

### Placeholders shipped, must be swapped before public launch

- `G-XXXXXXXXXX` in GA4 tag across all 10 pages. Swap to real Measurement ID once Amanda provides GA4 account.
- `https://formspree.io/f/REPLACE_ME` on contact + newsletter forms. Swap to real Formspree endpoint once Justin creates the project at formspree.io.
- Wolf Ranch event entries on /events/ remain TBD (date, time, address). Will add once Amanda confirms launch schedule.

### What Phase 1 does NOT do

- Does not confirm the Google Form accepts `?venue=` query param. Need to test with Amanda's form settings.
- Does not create Formspree project. Justin owns the signup.
- Does not install real GA4, real Meta Pixel, or real analytics reporting. Placeholders only.

### Standing Order compliance

- SO 22: this reconciliation block satisfies the gate for v2.3.0 ship.
- SO 23: cache-bust meta tags follow v2.3.0 deploy step (build-ts injection via deploy-mockup.py or manual).
- SO 24: no unvetted prices introduced. No booth pricing changes in v2.3.0.
