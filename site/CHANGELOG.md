# Changelog - Move Mountains Artisan Market Site

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## v2.2.0 - 2026-04-19

### Added

- Employment page professional rewrite. Five tracks (Event Coordinator, Vendor Liaison, Marketing and Social, Operations Lead, Kids Programming Lead) plus General Interest. Tighter copy, cleaner structure.

### Changed

- Vendor booth cards now display "Contact for pricing" placeholders. Prior fabricated values (65 / 115 / 95) pulled per Standing Order 24 (no unvetted prices). Amanda provides final numbers on review, or cards remain open.

### Origin

- Transcript reconciliation Row 3 (employment rewrite) and Row 5 (pricing posture) for the 2026-04-17 Amanda onboarding call. See docs/transcript-reconciliation.md. COO operating posture set 2026-04-19 per Standing Order 22.

---

## v2.1.0 - 2026-04-18

### Added

- **Get Involved hub + 3 application tabs.** New section `/get-involved/` plus three purpose-built application pages: `/get-involved/musician/`, `/get-involved/volunteer/`, `/get-involved/employment/`. Each has a tailored form with realistic fields, a client-only submit handler, graceful success state, and a Matthew 17:20 scripture anchor.
- **Musician application page.** Captures artist/band name, contact, email, phone, genre, setup size (solo through band), years performing, audio/video links, availability, day rate, notes, plus checkboxes for own-PA, outdoor comfort, and family-friendly set.
- **Volunteer application page.** Role preference checkboxes (setup crew, greeter, kids craft, music hospitality, vendor support, raffle, teardown, flexible), venue preference checkboxes (Easton Park, Goodnight Ranch, Whisper Valley), age group, specific-dates textarea, and a required outdoor-conditions waiver.
- **Employment/careers page.** Intro-style role list for 5 open tracks (Event Coordinator, Vendor Liaison, Marketing and Social, Operations Lead, Kids Programming Lead) with tag badges, then a full application form covering identity, role choice, start date, schedule type, resume URL, why-this-role, experience, notes, and confirmation checkboxes for weekends, outdoor work, and driver's license.
- **Nav + mobile drawer integration.** "Get Involved" link added to primary nav on all 5 existing pages (index, about, events, vendors, contact) between Our Story and Contact. Mobile nav drawer updated to match.
- **Footer column.** New "Get Involved" column added to the footer on all pages, linking to the overview, musicians, volunteer, and careers sub-pages.
- **Sitemap coverage.** `sitemap.xml` now includes lastmod 2026-04-18 for every existing URL and adds the four new get-involved URLs at priorities 0.8 and 0.7.

### Origin

- These pages close out Amanda's explicit asks from the 2026-04-17 onboarding transcript (lines 744-765): a musician application tab, a volunteer tab, and an employment tab. Reconciled and documented in `docs/transcript-reconciliation.md`. Standing Order 22 (transcript-reconciliation gate) was retroactively satisfied by this ship.

### Notes

- All three application forms submit client-side only. They disable inputs on submit, surface a success note, and scroll it into view. A real backend wiring is a follow-up item and is tracked in the reconciliation doc.
- No new external dependencies. Same Fraunces + Source Sans 3 stack, same green/terra/cream palette, same chatbot widget wired on every new page.

---

## v1.1.0 - 2026-04-18

### Added

- Site-wide chatbot widget (scripted FAQ engine, no LLM calls). `js/chatbot.js` (Aeopic Chatbot Engine v1.1.0) and `js/chatbot-kb.js` (65 entries covering market basics, three venues, event schedule, booth pricing, vendor application, pet policy, parking, food, weather, and more). Loaded on every page.
- Natural-language patterns tuned for real visitor questions: "is it free", "can I bring my dog", "how much is a booth", "when is the next market", "what if it rains", etc.

### Fixed

- Chatbot brand colors were stuck on Kubin Automotive defaults (navy + gold). Corrected to Move Mountains palette: green #2D5016 primary, dark green #1e3510, cream #FAF3E0.
- Bot name shortened from "Move Mountains Artisan Market Assistant" to "Market Helper" for cleaner header layout.

### Notes

- Zero recurring cost. No API keys. Client-side matching only.
- Chatbot fits within Phase 3 of build-plan-v1 (scripted FAQ). Ships as part of the launch polish rather than waiting for Phase 3.

---

## v1.0.0 - 2026-04-14 (verbal deal, initial build)

### Added

- Initial site: index, about, contact, events, vendors, plus vendor-login-preview.
- Brand system: green/terra/cream palette, Fraunces headings, Source Sans 3 body.
- Hero imagery for three Austin-metro venues (Easton Park, Goodnight Ranch, Whisper Valley).
- Events page with May and June 2026 schedule scaffolding.
- Vendor booth pricing (Compact $65, Popular $115, Premium $95) and 4-step application flow.

### Notes

- $100/month recurring plus separate site upkeep fees (verbal with Justin, SLA paperwork pending).
- Phase 0 scope lock required by 2026-04-24 per build-plan-v1.
