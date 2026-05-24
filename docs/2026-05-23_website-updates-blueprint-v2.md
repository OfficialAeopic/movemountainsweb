# MOVE MOUNTAINS WEBSITE — UPDATES BLUEPRINT v2
## For: Theron Smith (COO) | Assigned by: Sam Shahin
### Date: May 23, 2026
### Site: movemountainsmarket.com | Repo: OfficialAeopic/movemountainsweb | Root: site/
### Replaces: WEBSITE_FIXES_BLUEPRINT_v1.md (May 11 — now outdated)

---

## WHY THIS REPLACES v1

Amanda's May 15-23 emails changed the scope significantly:
- Goodnight Ranch is REMOVED (partnership ended May 15)
- Two NEW locations signed: Rough Hollow (Lakeway) and Travisso (Leander)
- Total venues: now 5 (was going to be 4 in v1)
- Color theme change requested (dark green → blue/turquoise)
- Real event photos requested (replace current images)
- Extensive homepage + about page copy edits provided by Amanda
- Several questions from v1 are now answered (Easton Park address confirmed, Wolf Ranch venue name confirmed)

**Do NOT reference v1 — use this blueprint only.**

---

## TECH STACK REMINDER

This is a **static HTML/CSS/JS site** — no build step, no framework. All changes are direct edits to HTML files in the `site/` directory. Deployed on Vercel with root directory set to `site/`.

Stack: Plain HTML, CSS (custom properties), vanilla JS, Google Fonts (Fraunces + Source Sans 3). No npm, no React, no build tools.

---

## PRIORITY 1: REMOVE GOODNIGHT RANCH (Do first — everything else builds on this)

Amanda confirmed May 15: "We are no longer working with the Goodnight Ranch community. Please remove anything associated with them from the website."

### Task 1A: Remove Goodnight Ranch from Homepage
**File:** `site/index.html`

- Delete the Goodnight Ranch venue card entirely
- Remove any Goodnight Ranch references from body copy
- Remove Goodnight Ranch from the schedule rotation paragraph
- Update "Four Venues" → "Five Venues" (after adding Rough Hollow + Travisso in Priority 2)

### Task 1B: Remove Goodnight Ranch from Events Page
**File:** `site/events/index.html`

- Delete all Goodnight Ranch event entries (May, June, and any future months)
- Update intro copy to remove Goodnight Ranch references

### Task 1C: Remove Goodnight Ranch Site-Wide
**Files:** All pages — `site/about/index.html`, `site/get-involved/`, `site/contact/`, footer, meta descriptions

- Search for "Goodnight" across all files and remove every reference
- Remove from any location lists, volunteer pages, or get-involved pages
- Remove from Property Management Entities references if present

---

## PRIORITY 2: ADD TWO NEW LOCATIONS

### Task 2A: Add Rough Hollow (Lakeway) — Monthly Market

**Details from Amanda (May 21-22):**
- Community: Rough Hollow
- Venue: Highland Village Amenity Center
- Address: 901 Highlands Blvd, Lakeway, TX 78734
- Schedule: Every 3rd Saturday of the month
- Hours: 11am-2pm (year round — NO summer hour change)

**File:** `site/index.html` — Add venue card:
```html
<div class="venue-card">
  <span class="venue-tag">3rd Saturday Monthly</span>
  <h3>Rough Hollow</h3>
  <p class="venue-day">Highland Village Amenity Center</p>
  <address>901 Highlands Blvd<br>Lakeway, TX 78734</address>
</div>
```

**File:** `site/events/index.html` — Add event entries:
- June 20, 2026 (3rd Saturday) — 11:00 AM - 2:00 PM
- July 18, 2026 (3rd Saturday) — 11:00 AM - 2:00 PM
- Add at least 2 months of events

### Task 2B: Add Travisso (Leander) — Quarterly Collaboration Events

**Details from Amanda (May 21):**
- Community: Travisso
- Address: 2437 Travisso Parkway, Leander, TX 78641
- Schedule: Quarterly — in collaboration with Travisso's planned community events
- Move Mountains brings the artisan vendors, Travisso supplies live music and activities
- Tentative dates and times:
  - June 27, 2026 — 5:00 PM - 7:00 PM
  - September 26, 2026 — in conjunction with Car Show (time TBD)
  - December 12, 2026 — alongside Winter Wonderland (time TBD)
  - March 2027 — in conjunction with Spring Fling (date and time TBD)

**File:** `site/index.html` — Add venue card:
```html
<div class="venue-card">
  <span class="venue-tag">Quarterly Events</span>
  <h3>Travisso</h3>
  <p class="venue-day">Community Collaboration Events</p>
  <address>2437 Travisso Parkway<br>Leander, TX 78641</address>
</div>
```

**File:** `site/events/index.html` — Add the confirmed event:
- June 27, 2026 — 5:00 PM - 7:00 PM (first confirmed quarterly event)
- Note: Label these as "Quarterly Collaboration" or similar to differentiate from monthly markets

### Task 2C: Add Rough Hollow + Travisso Logos
Amanda attached logos for both communities in her May 21 email. These need to be:
- Downloaded from the email attachments
- Saved to `site/images/` (or wherever community logos are stored)
- Displayed on the venue cards or location detail sections if applicable

### Task 2D: Update Location References Site-Wide
**Files:** All pages

- "Austin & Manor, TX" → "Austin, Georgetown, Lakeway, Leander & Manor, TX" (or "Central Texas" per Amanda's suggestion — see Priority 4)
- Meta descriptions, footer tagline, homepage eyebrow — update all location references
- Total venues: **5** (4 monthly + 1 quarterly)

---

## PRIORITY 3: COLOR THEME CHANGE

Amanda requested (May 21): "I would like to request the color theme of the site match our logo (it's more of a blue-ish/turquoise color) instead of the dark green."

### Task 3A: Update CSS Color Variables
**File:** `site/css/styles.css`

Current palette uses `var(--green)` as the primary accent. Change to a **blue/turquoise** that matches the Move Mountains logo.

- Reference the Move Mountains logo (should be in the Google Drive or site assets) to extract the exact turquoise/blue shade
- Update `--green` (or rename the variable to `--primary`) to the new blue/turquoise value
- Update any hardcoded green hex values throughout the CSS
- Ensure all hover states, accents, buttons, links, tags, and section backgrounds reflect the new color
- Keep `--cream` and `--terra` (earth tones) if they still complement the new primary

### Task 3B: Verify Contrast
After changing the primary color, verify:
- Text on colored backgrounds maintains readable contrast (WCAG AA minimum)
- Buttons remain clearly visible
- Links are distinguishable from body text

---

## PRIORITY 4: HOMEPAGE + ABOUT PAGE COPY REWRITE

Amanda provided detailed copy edits in her May 21 email. These are her exact instructions (her edits in bold below). Apply all of these.

### Task 4A: Homepage Hero / Intro Section
**File:** `site/index.html`

**Current:** "Move Mountains Artisan Market is a community-centered pop-up market series running across [three/four] Austin-area venues every month."

**Updated:** Rewrite to reflect:
- **5 venues** (not three or four)
- "**Central Texas area**" instead of "Austin-area" (Amanda's suggestion since they've expanded to Lakeway, Georgetown, and Leander)
- Phrasing: "four venues every month and one venue quarterly"
- Remove "Saturday morning" — markets run on Sunday, Thursday evening, and Saturday. Replace with "day" or rephrase to be day-agnostic

### Task 4B: Schedule / Rotation Paragraph
**File:** `site/index.html`

**Current:** References Goodnight Ranch and only 3-4 venues.

**Updated rotation copy:**
"Because no single neighborhood owns community, Move Mountains rotates across five communities in Central Texas. Easton Park on the first Sunday, Wolf Ranch on the first Thursday, Whisper Valley on the third Sunday, Rough Hollow on the third Saturday, and Travisso quarterly in collaboration with their planned community events."

### Task 4C: Hours Section
**File:** `site/index.html`, `site/events/index.html`

Hours vary significantly by location now. The copy cannot say a single time range. Update to reflect:

| Location | Day | Hours | Notes |
|---|---|---|---|
| Easton Park | 1st Sunday | 11am-3pm (standard) / 10am-2pm (summer) | Summer hours apply |
| Wolf Ranch | 1st Thursday | 5:30pm-8:30pm | Evening market, year round |
| Whisper Valley | 3rd Sunday | 11am-3pm (standard) / 10am-2pm (summer) | Summer hours apply |
| Rough Hollow | 3rd Saturday | 11am-2pm | Year round, no summer change |
| Travisso | Quarterly Saturday | Varies by event | Times TBD per event |

Suggested copy: "Each market runs on its own schedule — weekend markets from 11am to 3pm (10am to 2pm in summer), Thursday evenings from 5:30pm to 8:30pm in Georgetown, and year-round Saturday markets from 11am to 2pm in Lakeway."

### Task 4D: Activities / Experience Section
**File:** `site/index.html`

Amanda gave background on how they actually operate. The current copy oversimplifies. Key points to work into the copy:
- They host **themed events** (Christmas, fall fest, Valentine's, summer kick-off, Father's/Mother's Day, etc.) with themed activities and giveaways
- Live music is a goal at every event but not always possible (budget) — this is why they seek sponsors
- Kid's corner and activities depend on the event theme
- **Vendor of the Month** — one vendor per location is selected monthly and donates a raffle item. Winner is contacted beforehand from the email list
- Separate larger raffles are donated by Move Mountains themselves ($100 market bucks, date night baskets, etc.)
- Amanda said she does NOT expect all this detail on the site — but the copy should be accurate. Don't overclaim.

Rewrite the activities paragraph to be honest about what happens at events without overpromising. Something like:

"Every Move Mountains event brings the full market experience — local artisan vendors, themed activities, and community giveaways. We feature a Vendor of the Month spotlight, seasonal raffles, and kid-friendly activities that rotate with each event's theme. Live music is a staple whenever possible, and our markets are always free to attend."

### Task 4E: About Page — Venue Count + History
**File:** `site/about/index.html`

**Current:** "What began as the Manor Artisans Market in 2022 has grown into Move Mountains Artisan Market, a three-venue monthly series..."

**Updated:**
- "three-venue" → "five-venue" (4 monthly + 1 quarterly)
- "monthly series" → consider "market series" (since one is quarterly)
- "best Saturday of the month" → "best **day** of the month" (markets run different days)

### Task 4F: Keep This Line (Amanda loved it)
"Faith-inspired. Community-rooted. Artisan-powered." — DO NOT CHANGE.

---

## PRIORITY 5: SWAP PHOTOS FOR REAL EVENT PHOTOS

Amanda requested (May 21): "I would like to request we change all photos and use photos from our actual events! I want to be as authentic and transparent as possible."

### Task 5A: Source Photos from Google Drive
Amanda's Google Drive folder: https://drive.google.com/drive/folders/17Fp60uehhyxdspF6n_Bw1jQfmcIBsF-j

She said she's already uploaded some photos and offered to email specific ones if preferred.

### Task 5B: Replace Site Images
**File:** `site/images/` (or wherever images are stored)

- Replace all current photos with real event photos
- Maintain appropriate aspect ratios for each placement (hero, venue cards, about page, etc.)
- Optimize for web (compress, appropriate dimensions)
- Ensure diversity of locations represented in photos

### Task 5C: If Photos Are Insufficient
If the Google Drive doesn't have enough photos for all placements, flag which slots need photos and we'll request specific ones from Amanda.

---

## PRIORITY 6: UPDATE EXISTING LOCATION DATA

### Task 6A: Easton Park Address — CONFIRMED
**Files:** `site/index.html`, `site/events/index.html`

Amanda confirmed (May 12): The correct address is **7800 Apogee Blvd** ("Skyline Park"). Update from whatever is currently showing.

### Task 6B: Wolf Ranch Venue Name — CONFIRMED
**Files:** `site/index.html`, `site/events/index.html`

Amanda confirmed (May 12): The venue name is **"River Camp Amenity Center & Lawn"** at 101 River Overlook Road, Georgetown TX. Update the venue card and event entries.

---

## PRIORITY 7: ITEMS CARRIED FROM v1 (Still Valid)

### Task 7A: Musician Spotlight Section
**File:** `site/index.html`

Add a "Meet Our Musicians" section. 6 confirmed musicians in alphabetical order:
1. Aaron Cook — Instagram: @aaroncantcook
2. Brian Wolff — brianwolffmusic.com
3. Dani The Violinist — Instagram: @dmcviolin
4. JustHannah — justhannah.live
5. Mike Kiddoo — mikekiddoo.com
6. Nick Adamo — nickadamo.net

CTA: "Want to perform? Apply Here" → link to existing `/get-involved/musician/` page.

### Task 7B: Non-Profit Spotlight Section
**File:** `site/index.html`

Placeholder section: "Monthly Non-Profit Spotlight" — Amanda donates one free vendor booth per event to a local non-profit. General description for now, Amanda will fill in the featured org each month.

### Task 7C: Sponsor Section
**File:** `site/index.html`

"Sponsors & Community Partners" section near bottom of homepage. No logos yet — placeholder with CTA to contact for sponsorship opportunities.

### Task 7D: Connect Contact Form
**File:** `site/contact/index.html`

Form currently fakes success. Connect to Formspree (free tier) or similar. Must deliver to movemountainsmarket@gmail.com. Add visible email address (mailto link) to contact page.

### Task 7E: Connect Newsletter Signups
**Files:** All pages with newsletter forms

Same approach — connect to Formspree or email collection endpoint so Amanda receives signups.

### Task 7F: Vendor Application Link
**File:** `site/vendors/index.html`

Amanda is transitioning from Google Forms to JotForm with per-location links. For now, keep the current general application link active. When Amanda sends JotForm links, they'll need to be attached per location.

---

## PRIORITY 8: EMAIL LIST MAINTENANCE

### Task 8A: Remove Email from South Austin List
Amanda requested (May 23): Remove **[REDACTED-per-data-deletion-request]** from the South Austin market email list.

This may need to happen in whatever email tool is managing the lists (Google Contacts, Mailchimp, or the CRM once it's live). Flag for Theron to check where email lists are currently managed.

---

## COMPLETE SCHEDULE REFERENCE (for copy and events page)

| Location | Community | Venue | Address | Schedule | Hours | Summer Hours |
|---|---|---|---|---|---|---|
| **Easton Park** | Easton Park | Skyline Park | 7800 Apogee Blvd, Austin TX 78744 | 1st Sunday | 11am-3pm | 10am-2pm |
| **Wolf Ranch** | Wolf Ranch | River Camp Amenity Center & Lawn | 101 River Overlook Rd, Georgetown TX 78628 | 1st Thursday | 5:30pm-8:30pm | Same (evening) |
| **Whisper Valley** | Whisper Valley | — | 9400 Petrichor Blvd, Manor TX 78653 | 3rd Sunday | 11am-3pm | 10am-2pm |
| **Rough Hollow** | Rough Hollow | Highland Village Amenity Center | 901 Highlands Blvd, Lakeway TX 78734 | 3rd Saturday | 11am-2pm | Same (year round) |
| **Travisso** | Travisso | — | 2437 Travisso Parkway, Leander TX 78641 | Quarterly (collab) | Varies | Varies |

**Travisso tentative dates:**
- June 27, 2026 — 5:00pm-7:00pm
- September 26, 2026 — with Car Show (time TBD)
- December 12, 2026 — with Winter Wonderland (time TBD)
- March 2027 — with Spring Fling (date + time TBD)

---

## FILE CHANGE SUMMARY

| File | Changes |
|---|---|
| `site/css/styles.css` | Color theme: green → blue/turquoise matching logo. Musician grid styles. Sponsor/non-profit section styles. Contrast verification. |
| `site/index.html` | Remove Goodnight Ranch. Add Rough Hollow + Travisso venue cards. Update to 5 venues. Rewrite schedule rotation paragraph. Rewrite hours section. Rewrite activities section. Update hero/intro copy ("Central Texas"). Add musician section. Add non-profit section. Add sponsor section. Swap photos. |
| `site/events/index.html` | Remove Goodnight Ranch events. Add Rough Hollow monthly events. Add Travisso June 27 event. Update intro copy. Update location references. Swap photos. |
| `site/about/index.html` | Update venue count. Update "Austin-area" → "Central Texas". Update history paragraph. Swap photos. |
| `site/contact/index.html` | Connect form to Formspree. Add email display. |
| `site/vendors/index.html` | Verify application link. |
| `site/get-involved/index.html` | Remove Goodnight Ranch, add Rough Hollow + Travisso. |
| `site/get-involved/volunteer/index.html` | Remove Goodnight Ranch, add new locations. |
| `site/images/` | Replace all images with real event photos from Google Drive. Add Rough Hollow + Travisso community logos. |
| All pages | Update footer/meta location references. Connect newsletter forms. |

---

## DEPLOYMENT

After all changes:
1. Commit to `main` branch on `OfficialAeopic/movemountainsweb`
2. Vercel auto-deploys from `main` with root directory `site/`
3. No build step needed — static files served directly
4. Verify at movemountainsmarket.com after deploy
5. Send Amanda a heads-up email to review the updated site

---

## POST-COMPLETION: UPDATE PROJECT STATUS

Once ALL priorities are complete and the site is deployed and verified:

1. Update the PM status file at `project-manager/movemountains/STATUS.md`:
   - Change "Current Phase" from "Data Import — Theron Executing" to "Website v2 Updates — COMPLETE"
   - Change "Status" to "COMPLETE"
   - Add a dated note at the bottom summarizing what was done (Goodnight removed, Rough Hollow + Travisso added, color theme changed, copy rewritten, photos swapped)
   - Mark all v2 tasks as complete in the committed deadlines table

2. Update `project-manager/movemountains/CONTEXT.md`:
   - Remove Goodnight Ranch from the locations table
   - Add Rough Hollow and Travisso to the locations table with full details
   - Update venue count from 4 to 5
   - Update the "2 Additional Locations" section — both are now signed and live

3. Notify Sam (admin@aeopic.com) via email that all v2 updates are complete and live at movemountainsmarket.com

---

## DO NOT CHANGE

- "Faith-inspired. Community-rooted. Artisan-powered." tagline
- Scripture reference (Matthew 17:20)
- Chatbot widget (chatbot-kb.js + chatbot.js)
- Navigation structure + mobile hamburger
- Responsive layout framework
- Overall page structure and section ordering (just update content within)
