# Amanda Onboarding Call, Master Reconciliation (2026-04-17)

**Call:** 2026-04-17, ~56:46, Google Meet
**Attendees:** Amanda (owner, MMM), Sam (CEO, Aeopic), Justin (CMO, Aeopic), Theron (COO, Aeopic)
**Source A:** `docs/amanda-call-notes-2026-04-17-raw.md` (Theron's post-call brain dump)
**Source B:** `call-recordings/2026-04-17-amanda-onboarding.transcript.txt` (faster-whisper CPU int8, 1100 segments)
**Reconciliation owner:** Theron
**Purpose:** Single source of truth for the onboarding. All scope decisions, commitments, and risks going forward tie back to this doc.

---

## 1. Critical scope expansion flag (READ FIRST)

Sam opened the call with (00:21, verbatim transcript):

> "So you signed on for our full stacks, all four modules, a marketing website, ads management, a CRM to run your operations, and a vendor-facing portal."

**What was actually signed 2026-04-14 (per `CLAUDE.md` deal summary):** $100/month recurring plus separate site upkeep fees, scope is SITE ONLY. No social media management, no ads, no CRM, no vendor portal.

**Gap between pitched scope and signed scope:**

| Pitched on the call | Signed 2026-04-14 | Status |
|---------------------|--------------------|--------|
| Marketing website | Yes | Matches |
| Ads management | No | **NEW, not sold** |
| CRM for operations | No | **NEW, not sold** |
| Vendor-facing portal | No | **NEW, not sold** |
| Social media management | Partial (Amanda provides content, Aeopic posts) | **NEW, not in signed scope** |

**Action:** Theron must raise this with Sam and Justin before the Monday 2026-04-20 mockup email goes out. Either (a) they re-price and re-paper, or (b) they walk Amanda back to the site-only deliverable. See `build-plan-v1.md` for the three pricing paths.

---

## 2. Confirmed facts (raw notes + transcript agree)

### Amanda's current reality
- Single operator running a pop-up artisan market across (currently) 3 Austin-area venues.
- Hired one part-time helper (Gina, transcript line 764), evaluating second hire as markets expand.
- Tracks everything in Google Sheets, one sheet per market per month (Easton Park, Goodnight Ranch, Whisper Valley).
- Vendor fields captured: name, email, phone, social media, method of payment, amount paid, booth assignment.
- Second spreadsheet for raffle entries pulled from a QR on an A-frame sign at each market, feeding a Google Form.
- Sends email blasts manually, copy-pastes recipient list each time, no automation.
- Draws booth maps by hand on location, saves as PDF, emails to vendors monthly. Willing to keep that workflow if digital mapping is too complex to build.
- Manual approval screener via Google Form. If approved, she emails the location-specific application with liability waiver.
- Runs a post-market survey via email to collect vendor feedback and re-book interest for the following month.

### Current venues (confirmed)
| Week | Venue | Address |
|------|-------|---------|
| 1st Sunday monthly | Easton Park (Skyline Park) | 7604 Solari Dr, Austin TX 78744 |
| 2nd Saturday monthly | Goodnight Ranch | Austin TX (address not confirmed on call) |
| 3rd Sunday monthly | Whisper Valley | 9400 Petrichor Blvd, Manor TX 78653 |

### Scale
- Amanda said 20 to 60 vendors per location, varies by venue.
- Currently "in contract talks with two more locations" (transcript line 718).
- Long-term target 6 locations. Interim state is 3, moving to 5, then 6.
- Peak theoretical capacity if all 6 fill near max: ~360 vendors, but that is a ceiling not a run-rate.
- **Mockup update already applied:** "55+" replaced with "Up to 60" on stat card, "Fifty-five makers" replaced with "Dozens of makers" in pull quotes, timeline signals growth to six locations.

### Marketing posture
- Amanda provides the content (photos, videos, captions). Aeopic schedules and posts.
- Amanda does NOT want AI-generated photos. Confirmed in Discord (Skeet + Bladerah thread 4:02-4:03 PM pre-call) and effectively confirmed by Amanda saying she'll send "anything and everything" she has (transcript lines 677-682).
- Platforms in play: Instagram, Facebook, TikTok. TikTok new, low engagement, Amanda finds Reels creation difficult.
- Email should arrive with a recommended posting cadence per platform.

### Domain (locked)
- **movemountainsartisanmarket.com** is the agreed domain.
- Amanda initially was open to the shorter `movemountainsmarket.com` but deferred to Sam's recommendation (transcript lines 544-569).
- Sitemap already updated in the mockup site to match.
- Side note: Theron flagged `movemountainsartisan.com` as a shorter alternative after the call. Ask Amanda next touch if she'd prefer that, otherwise stick with the locked choice.

### Timeline commitments
- **Monday 2026-04-20:** Sam commits to emailing Amanda the mockup link for her review.
- **Sunday 2026-04-27:** Full website and marketing live.
- **~Two weeks out from 2026-04-17 (~2026-05-01):** Vendor portal test ready (per Theron's notes; not explicitly committed in the transcript but implied by the "ecosystem by 27th" target).

### Content Amanda is sending
- Google Form links for each location's application
- PDF copy of a vendor tracking spreadsheet
- Application form per location (current PDF form)
- Booth maps per location
- Policy restrictions / waiver content
- Photos (confirmed)
- Videos (confirmed, transcript lines 681-683)

### Payments
- Keep Zelle, Venmo, Cash App, Apple Pay as-is. Vendors already know her handles.
- Sam suggested Stripe as optional upgrade if Amanda wants full ecosystem tracking. Not required.
- Amanda fine with continuing manual payment tracking in her spreadsheet.

### Chatbot
- Amanda approved it (transcript lines 591-617). Should answer site content questions plus direct users to vendor signup, social links, FAQ.
- KB already updated with all three venues on the mockup.

---

## 3. Resolved ambiguities from raw notes

### "The second option from Sam's 2 choices"
Theron's raw notes flagged this as pending. The transcript resolves it (lines 284-318).

**Context:** How do food vendors (who need Travis County or Williamson County permits + commercial kitchen proof + liability insurance) get their certificates into the workflow?

**Option 1 (rejected):** Application form detects they are a food vendor and prompts them to upload all required documents BEFORE the application is submitted. Docs are gate-kept at application submission.

**Option 2 (ACCEPTED by Amanda, line 318):** Application is submitted regardless. Amanda reviews, decides they need documents, emails them back with an upload link. Vendor uploads. Application returns to Amanda for final approval or denial.

**Why Amanda chose Option 2:** Laws for food and drink vendors change frequently. Some private properties will still allow vendors to attend without every piece of paperwork if the property manager greenlights an exception. Option 2 preserves her flexibility to read each case.

**Implication for build:** The vendor portal must support a second round-trip state ("Docs Requested") between "Submitted" and "Approved." Application status enum minimum: submitted, docs_requested, docs_uploaded, approved, denied.

### Scripture (Matthew 17:20) attribution
Amanda thought Justin put the scripture on the mockup (line 685). Theron corrected her (line 690-693). Amanda said "Well, thank you Theron" (line 694).

**Amanda's actual quote:** "Because that is the inspiration behind our name, we are not really in people's faces so we try to keep things a little more [subtle]... it was a nice touch to have on the website."

**Implication:** Keep the scripture, but keep the treatment subtle, not in-your-face. Current mockup approach (pull quote at line 291 of homepage + "Faith That Moves Things" section at lines 131-136 of about page) is on brand. Do not ramp it up, do not reduce it.

### Domain (resolved above in Section 2)
Raw notes said "Options: movemountainsmarket.com or movemountainsartisanmarket.com." Transcript confirms Amanda and Sam locked in movemountainsartisanmarket.com.

### Application delivery format (JotForm vs PDF)
Amanda asked. Sam said he would take it back and figure out the most automated option (transcript lines 641-671). Recommendation: build the application natively inside the vendor portal so vendors sign electronically at submission, replacing both Google Forms (screener) and PDF (full application + waiver). This removes the round-trip of vendors printing, signing, photographing, and emailing back.

### Booth map complexity
Amanda explicitly said she is OK leaving maps off the site if it is too complex (raw notes + transcript lines 108-119). Property-accurate maps are hand-drawn. Build suggestion: Phase 1 ship PDF download per event, Phase 2 add digital drag-drop assignment for recurring vendors, Phase 3 add visible map preview for vendors in their portal.

---

## 4. Net new from the transcript (not in raw notes)

### Login method preference
Sam asked Google SSO or Aeopic-issued credentials (transcript lines 35-42). Amanda did not commit. Decision needed before vendor portal build.

### Post-market survey automation
Amanda mentioned a post-market survey she sends after every event asking about sales and next-month interest. This needs to be part of the automated flow (transcript lines 182-192). Not in raw notes. Add to build plan Phase 3.

### Gina (employee)
Currently one part-time helper named Gina. Amanda considering a second hire as markets expand. No access/permissions decision yet for Gina in the platform. Flag for scoping: will there be multi-user admin roles inside Amanda's dashboard?

### Volunteer, musician, and employee applications
Raw notes mentioned these as future asks. Transcript confirms Amanda wants these as PHASE 1 tabs on the public site (transcript lines 744-765), not later phases. Build plan needs to reflect this.

### Pavilion / indoor preference selection
Amanda wants a preference field on the application: pavilion vs indoor vs general (transcript lines 1043-1062). Build as enum field, not free-text.

### Two locations already being contracted
Transcript line 718: "we are already locking in right now two more locations, we are kind of in communications, trying to figure out contracts with them." Not in raw notes. Move from "future nice-to-have" to "confirmed near-term."

### Admin email
Confirmations and platform outbound will come from `admin@aopic.com` per Sam (transcript line 1088). Note: Sam said "aopic.com" on the recording, likely a verbal elision of "aeopic.com." Verify the actual sending domain with Sam before first email goes out.

### Recording disclosure
Sam did not disclose recording at the start of the call but did disclose at 40:54 (transcript lines 731-735). Amanda said "Okay." Texas is a one-party consent state so this is legal, but Aeopic SOP should be to disclose at call start going forward. Add to Fathom SOP and Meet SOP.

---

## 5. Amanda's stated pain points, ranked by her language

From the transcript, in her own words, her biggest problems:

1. **Manual email reach-out to inquirers.** "half the time I don't hear back. And I'm sitting here like, why did you even bother submitting an inquiry? You know, you're wasting my time where I'm typing up an email to you with details." (lines 121-128)
2. **Copy-pasting vendor emails every month for raffle and market blasts.** "I'm constantly having to copy all the emails, put it in a new email, typing it up with fresh information for that month." (lines 164-166)
3. **Juggling spreadsheets per location per month.** "that's how I'm using my spreadsheets right now." (lines 155-156)
4. **Duplicate vendor liability waivers per property.** "we do require new vendors to sign the form once per property for our records. So that would be another thing that I'd like to automate in some way." (lines 180-181)

**Implication for the build order:** Automate #1 and #2 before #3. The automation wins are worth more to Amanda than the dashboard polish.

---

## 6. Theron observations (post-reconciliation)

- Amanda is the ideal client: thoughtful, self-aware about her own tech limits ("I don't know how that would look like on your website"), willing to trade features for simplicity, explicitly says she will keep doing things manually if something is too complex. She is not demanding.
- **Sam's pitch set expectations wildly above the signed scope.** This is the biggest delivery risk, not the build itself. If Sam presents the Monday mockup framed as "the start of your four-module platform" when we have only built a marketing site, Amanda will ask when the portal is coming and we will be starting from a deficit.
- Amanda's pain is real and the wins are obvious: (1) automate inquiry responses, (2) automate raffle email blasts, (3) centralize vendor tracking, (4) digitize the waiver. If we land just those four, we have won the relationship.
- The "two more locations locking in" comment is a growth signal. If we build a platform that scales, we are the system of record for a scaling business. If we build just a site, we are a vendor she will outgrow.
- Her faith branding posture is subtle, not loud. "We are not really in people's faces." The current site treatment is correct. Do not change it.

---

## 7. Open questions still owed back to Amanda

| # | Question | Owner | Target |
|---|----------|-------|--------|
| 1 | Her last name | Justin | ASAP |
| 2 | Preferred login method (Google SSO vs Aeopic-issued) | Sam | Before portal build |
| 3 | JotForm vs native-portal application decision | Sam + Theron | Before Monday email |
| 4 | Addresses and details for the two pending locations | Amanda | When contracts close |
| 5 | Multi-user admin roles (Gina access?) | Amanda | Before portal build |
| 6 | Stripe opt-in or keep manual | Amanda | Non-blocking |
| 7 | Final pricing and scope re-paper given the "four modules" pitch | Sam + Justin + Theron | Before Monday |
| 8 | Domain: movemountainsartisanmarket.com vs movemountainsartisan.com | Amanda (Theron surfaces option) | Non-blocking |

---

## 8. Delivery commitments locked by this call

- Mockup email to Amanda by **Monday 2026-04-20** with the link.
- Full website live by **Sunday 2026-04-27**.
- Marketing posting operation running by **Sunday 2026-04-27**.
- Vendor portal test window **approximately two weeks out (2026-05-01)** per Theron's verbal commitment in raw notes (not explicitly on recording, verify before booking).
- Big follow-up email from `admin@aopic.com` (verify spelling) to Amanda "tonight or this weekend" with to-do list per Sam.

---

## 9. Artifacts and their status

| Artifact | Path | Status |
|----------|------|--------|
| Call recording | `call-recordings/2026-04-17-amanda-onboarding.mp4` | Saved, 1.47 GB |
| Audio extract | `call-recordings/2026-04-17-amanda-onboarding.mp3` | Saved, 53 MB, 56:46 |
| Transcript (txt) | `call-recordings/2026-04-17-amanda-onboarding.transcript.txt` | Saved, 1100 segments |
| Transcript (vtt) | `call-recordings/2026-04-17-amanda-onboarding.transcript.vtt` | Saved |
| Raw notes (Theron) | `docs/amanda-call-notes-2026-04-17-raw.md` | Preserved |
| Master reconciliation | `docs/amanda-call-notes-2026-04-17.md` | This file |
| Build plan v1 | `docs/build-plan-v1.md` | Drafted, pending Sam+Justin signoff |
| Vendor upside hypothesis | `docs/vendor-upside-hypothesis.md` | Existing |
| Onboarding holes | `docs/onboarding-holes.md` | Existing, update from this doc |
| Live mockup | `https://move-mountains-market.surge.sh` | Patched to v2 post-call, HTTP 200 |

---

## 10. Next actions owned by Theron

1. Update `docs/onboarding-holes.md` with resolutions from this doc (domain locked, login method still open, JotForm decision still open, etc.).
2. Deliver `build-plan-v1.md` to Sam and Justin before the Monday mockup email.
3. Add scope-expansion event to `Aeopic/ops/coo-log.json` (four-module pitch vs signed site-only deal).
4. Add work-log entry via `auto-track-session.py` for today's call + reconciliation hours.
5. Write Fathom and Meet recording SOPs including the "disclose at start of call" rule.
