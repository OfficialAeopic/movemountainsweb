# Move Mountains CRM — Build Instructions for Theron
Created: April 24, 2026
Author: Sam Shahin

---

## READ THIS FIRST

Theron, this document contains everything you need to build the Move Mountains CRM. Feed these instructions and prompts to your Claude Code session. The blueprint is comprehensive — your AI should be able to build from it with minimal back-and-forth.

---

## Repository Setup

**DO NOT create a new repo.** Build directly into the existing website repo:

```
Repository: OfficialAeopic/movemountainsweb
```

**Clone and start:**
```bash
git clone https://github.com/OfficialAeopic/movemountainsweb.git
cd movemountainsweb
npm install
```

---

## Project Structure

Use Next.js 15 route groups to separate public website from admin CRM:

```
movemountainsweb/
├── app/
│   ├── (public)/                 # Existing public website
│   │   ├── page.tsx
│   │   ├── locations/
│   │   ├── vendors/
│   │   └── musicians/
│   │
│   ├── (admin)/                  # NEW: CRM (this build)
│   │   ├── layout.tsx            # Admin layout with sidebar
│   │   ├── page.tsx              # Dashboard /admin
│   │   ├── locations/
│   │   ├── events/
│   │   ├── vendors/
│   │   ├── applications/
│   │   ├── payments/
│   │   ├── communications/
│   │   ├── email-lists/
│   │   ├── maps/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── (portal)/                 # FUTURE: Vendor Portal (Phase 2)
│   │   └── ...
│   │
│   └── api/
│       ├── locations/
│       ├── events/
│       ├── vendors/
│       ├── applications/
│       ├── invoices/
│       ├── sms/
│       ├── email/
│       └── webhooks/
│
├── components/
│   ├── ui/                       # ShadCN components
│   ├── admin/                    # CRM-specific components
│   └── shared/                   # Shared components
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── twilio.ts
│   ├── resend.ts
│   ├── signature-api.ts
│   └── utils.ts
│
├── types/
│   └── database.ts               # Generated from Supabase
│
└── supabase/
    ├── migrations/               # SQL migration files
    └── seed.sql
```

---

## Tech Stack (Confirmed)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 | App Router, Server Actions |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS + ShadCN UI | Use Context7 MCP for docs |
| Database | Supabase PostgreSQL | RLS enabled |
| Auth | Supabase Auth | Email/password for admin, magic link for vendors |
| Storage | Supabase Storage | PDFs, images |
| SMS | Twilio | 4 template types |
| Email | Resend | Transactional + campaigns |
| E-Signatures | SignatureAPI | Location-specific templates |
| Hosting | Vercel | Already connected |

---

## Key Decisions (Already Made)

These are NOT open questions — they've been decided:

| Decision | Answer |
|---|---|
| Booth map editor | Build custom visual drag-and-drop |
| Staff access level | Limited write (mark attendance, view, no delete) |
| Platform priority | Fully responsive: desktop, tablet, AND mobile |
| Auth method | Admin = email/password, Vendor = magic link |
| Payment tracking | Manual marking in CRM (no API integration) |
| E-signatures | SignatureAPI with location-specific templates |
| Content rule | Real photos only, NO AI-generated imagery |

---

## Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Resend
RESEND_API_KEY=

# SignatureAPI
SIGNATURE_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://movemountainsmarket.com
```

---

## Sequential Build Prompts

Feed these prompts to Claude Code in order. Each prompt builds on the previous. Wait for completion before moving to the next.

---

### PROMPT 1: Database Schema Setup

```
I'm building a CRM for Move Mountains Artisan Market. Set up the Supabase database schema.

Create these tables in order (with foreign key dependencies):

1. locations - Market locations (4 active + 2 future)
2. space_types - Booth options per location (tent, pavilion, indoor, top deck)
3. vendor_types - Vendor categories (standard, food truck, kid/teen, etc.)
4. product_categories - For category cap enforcement (candles, jewelry, etc.)
5. musicians - Musician directory
6. vendors - Master vendor records
7. market_events - Individual market dates
8. applications - Vendor applications per location
9. event_vendors - Junction table for vendor-event assignments
10. invoices - Payment tracking
11. sms_messages - SMS log
12. email_subscribers - Customer email lists
13. email_campaigns - Newsletter campaigns
14. survey_responses - Post-market surveys
15. category_caps - Category limits per event
16. audit_log - Admin action tracking

Use UUIDs for all primary keys. Add created_at/updated_at timestamps.
Enable RLS on all tables.

Reference the full schema in: AEOPIC /movemountain/blueprint/MMM_CRM_BLUEPRINT_v1.md

Create migration files in supabase/migrations/
```

---

### PROMPT 2: RLS Policies

```
Set up Row Level Security policies for the CRM.

User roles:
- admin: Full access to all tables
- staff: Read + limited write (can mark attendance, view vendors, cannot delete)
- vendor: Own data only (for future vendor portal)

Create policies for each table:
- Admin users can SELECT, INSERT, UPDATE, DELETE
- Staff users can SELECT all, UPDATE limited fields
- Vendors can only access their own records

Add a user_roles table or use Supabase custom claims for role management.

Create the RLS policies in a migration file.
```

---

### PROMPT 3: Seed Data

```
Create seed data for the CRM.

Locations (4 active):
1. Easton Park - 7800 Apogee Blvd, Austin TX 78744
   - First Sundays, 11AM-3PM (Summer: 10AM-2PM)
   - Has pavilion, max ~80 vendors
   - Property: Easton Park Residential Master Community / Cohere Life

2. Whisper Valley - 9400 Petrichor Blvd, Manor TX 78653
   - Third Sundays, 11AM-3PM
   - Has pavilion, indoor, max 30-35 vendors
   - Property: Whisper Valley Residential Master Community / FirstService Residential

3. Goodnight Ranch - 5601 Baythorne Drive, Austin TX
   - Second Sundays, 11AM-3PM
   - Tent only, max ~45 vendors
   - Property: TBD

4. Wolf Ranch - 101 River Overlook Rd, Georgetown TX 78628
   - First Thursdays, 5:30-8:30PM
   - Has top deck, max TBD
   - Property: Wolf Ranch Residential Community Association / FirstService Residential

Vendor Types:
- Standard Artisan
- Agricultural Producer ($20)
- Kid/Teen Entrepreneur ($25)
- Ice Cream/Snow Cone ($50)
- Hot Food ($75) - requires permits
- Food Truck ($75-100) - requires permits

Product Categories:
Candles, Baked Goods, Jewelry, Skincare, Pet Products, Plants, Art, Clothing, Home Decor, Eggs/Produce, Hot Food, Drinks, Books, Crafts

Space Types with pricing (varies by location - see blueprint for full matrix)

Musicians (6):
1. Aaron Cook - @aaroncantcook
2. Brian Wolff - brianwolffmusic.com
3. Dani The Violinist - @dmcviolin
4. JustHannah - justhannah.live
5. Mike Kiddoo - mikekiddoo.com
6. Nick Adamo - nickadamo.net

Create in supabase/seed.sql
```

---

### PROMPT 4: Auth Setup

```
Set up Supabase Auth for the CRM.

Requirements:
- Admin users: Email/password authentication
- Staff users: Email/password authentication
- Vendor users: Magic link authentication (no password)

Create:
1. Auth helper functions in lib/supabase/
2. Middleware for protected routes
3. Admin layout that checks for authenticated admin/staff user
4. Login page at /admin/login
5. Sign out functionality

The (admin) route group should be fully protected.
Redirect unauthenticated users to /admin/login.
```

---

### PROMPT 5: Admin Layout & Navigation

```
Build the admin layout for the CRM.

Components needed:
1. Sidebar navigation (collapsible on mobile)
   - Dashboard
   - Locations
   - Events
   - Vendors
   - Applications (with pending count badge)
   - Payments
   - Communications
   - Email Lists
   - Booth Maps
   - Reports
   - Settings

2. Top bar
   - Search (Cmd+K)
   - Notifications dropdown
   - User menu (profile, sign out)

3. Breadcrumb navigation

4. Mobile responsive (works on tablet and phone)

Use ShadCN components:
- Sidebar, NavigationMenu
- Command (for search)
- DropdownMenu
- Avatar
- Badge

Create the layout at app/(admin)/layout.tsx
```

---

### PROMPT 6: Dashboard

```
Build the admin dashboard at /admin.

Sections:

1. Quick Stats Cards (top row)
   - Upcoming markets (next 30 days count)
   - Pending applications (needs review count)
   - Outstanding payments (unpaid invoices count)
   - Total active vendors

2. Upcoming Markets Timeline
   - Next 4 events
   - Show: date, location, vendor count/capacity
   - Quick action buttons: View, Send Map, Post Survey

3. Recent Activity Feed
   - New applications
   - Payments received
   - Waiver signatures
   - Survey responses
   - Show last 10 items with timestamps

4. Alerts Panel
   - Overdue payments
   - Events missing maps
   - Food vendors with expired docs

Use ShadCN Card, Badge, ScrollArea components.
Fetch data from Supabase with server components.
```

---

### PROMPT 7: Locations Module

```
Build the Locations module.

List page /admin/locations:
- Table of all locations
- Columns: Name, Schedule, Max Capacity, Status
- Click row to view details

Detail page /admin/locations/[slug]:
- Location info section
- Space types configuration (add/edit/delete)
- Pricing matrix display
- Upcoming events at this location
- Booth map upload/management
- Toggle active/inactive

CRUD operations:
- Create new location
- Edit location details
- Configure space types per location
- Upload booth map PDF

Use ShadCN DataTable, Dialog, Sheet, Tabs.
```

---

### PROMPT 8: Events Module

```
Build the Events module.

List page /admin/events:
- Calendar view + list view toggle
- Filter by: location, status, date range
- Quick stats per event (vendor count, payment status)

Detail page /admin/events/[id] with tabs:

1. Overview Tab
   - Event details (date, time, theme, musician)
   - Capacity meter
   - Status controls (cancel, complete)

2. Vendors Tab
   - List of assigned vendors
   - Booth assignment, payment status, space type
   - Add/remove vendors
   - Click-to-call/text/email

3. Booth Map Tab
   - Visual booth map (drag-and-drop assignment)
   - Color code: Paid=green, Pending=yellow
   - Publish map button
   - Export to PDF

4. Payments Tab
   - Payment status summary
   - One-click mark paid
   - Bulk mark paid
   - Send payment reminders

5. Communications Tab
   - Send bulk SMS/email to event vendors
   - Message templates
   - Sent history

6. Post-Market Tab
   - Mark event complete
   - Send survey
   - View survey responses
   - Attendance tracking

Use ShadCN Calendar, Tabs, DataTable, Dialog.
```

---

### PROMPT 9: Vendors Module

```
Build the Vendors module.

List page /admin/vendors:
- Search by name, business, phone, email
- Filter by: Status, Location, Category, Recurring
- Sort by: Name, Recent activity, Total markets
- Bulk actions: Export, Send message

Detail page /admin/vendors/[id] with tabs:

1. Profile Tab
   - Business info, contact info
   - Social media links (clickable)
   - Product categories
   - Status with ban controls
   - Internal notes

2. Documents Tab (for food vendors)
   - Upload/view required docs:
     - Liability insurance
     - Commercial kitchen proof
     - Food manager certification
     - County permit
   - Document expiration tracking
   - Verification status

3. History Tab
   - All markets attended
   - Payment history
   - Application history
   - Communication history

4. Invoices Tab
   - All invoices for this vendor
   - Create new invoice
   - Mark paid

Use ShadCN DataTable, Tabs, Sheet, Avatar.
```

---

### PROMPT 10: Applications Module

```
Build the Applications module.

List page /admin/applications:
- Filter by: Status, Location, Date range
- Pending count badge in nav
- Sort by submission date

Review page /admin/applications/[id]:
- Applicant info
- Requested location + space type
- Product description
- Category cap check (show if at limit)
- Existing vendor match detection
- Booth share request (if applicable)

Actions:
1. Approve - triggers workflow:
   - Create/update vendor record
   - Send SignatureAPI waiver
   - Create invoice
   - Send approval email with magic link

2. Deny - sends denial notification

3. Waitlist - holds for future

4. Request Docs - for food vendors

Build the approval workflow as a server action.
```

---

### PROMPT 11: Payments Module

```
Build the Payments module at /admin/payments.

Views (tabs):
- Pending Payments - outstanding invoices
- Received Today - quick confirmation view
- Overdue - past due date
- All Invoices - full history

Features:
1. Quick Mark Paid
   - One-click mark paid
   - Select payment method (Zelle, Venmo, CashApp, Apple Pay)
   - Add reference note
   - Auto-timestamp

2. Payment Entry
   - Vendor search/select
   - Amount
   - Payment method
   - Reference
   - Associate with event

3. Bulk Actions
   - Send payment reminders (SMS + email)
   - Mark multiple paid
   - Export for reconciliation

Use ShadCN DataTable, Dialog, Select.
```

---

### PROMPT 12: Communications Module

```
Build the Communications module at /admin/communications.

SMS Center tab:
- Send individual SMS
- Send bulk SMS by: Location, Event, All vendors
- Message templates (4 types):
  1. Payment reminder (24-hour)
  2. Recurring payment reminder (Tuesday)
  3. Map posted notification
  4. Post-market survey
- Character count display
- Delivery status tracking
- SMS history log

Email Center tab:
- Compose newsletter
- Rich text editor
- Attach flyer/map
- Target by location bucket
- Schedule send
- Campaign history

Vendor Notifications tab:
- Configure automated triggers
- Preview templates

Integrate with Twilio for SMS, Resend for email.
Create API routes for sending.
```

---

### PROMPT 13: Twilio Integration

```
Set up Twilio SMS integration.

Create lib/twilio.ts with functions:
- sendSMS(to, message) - single SMS
- sendBulkSMS(recipients[], message) - bulk SMS
- getDeliveryStatus(messageSid)

Create API routes:
- POST /api/sms/send - send single SMS
- POST /api/sms/bulk - send bulk SMS
- POST /api/webhooks/twilio - delivery status webhook

SMS Templates (stored in database):
1. payment_reminder_24h
2. payment_reminder_tuesday
3. map_posted
4. survey_request

Log all messages to sms_messages table.
Handle errors gracefully.
```

---

### PROMPT 14: Resend Integration

```
Set up Resend email integration.

Create lib/resend.ts with functions:
- sendEmail(to, subject, html, text)
- sendBulkEmail(recipients[], subject, html)
- sendWithAttachment(to, subject, html, attachments[])

Create API routes:
- POST /api/email/send - send single email
- POST /api/email/campaign - send campaign to location bucket

Email Templates:
1. application_approved - Welcome, waiver link, payment instructions
2. payment_received - Receipt, event details
3. map_published - Map attached, booth assignment
4. survey_request - Thank you, survey link

Use React Email for templates if helpful.
Track opens/clicks if Resend supports it.
```

---

### PROMPT 15: SignatureAPI Integration

```
Set up SignatureAPI for liability waivers.

Create lib/signature-api.ts with functions:
- createEnvelope(templateId, signerName, signerEmail, webhookUrl)
- getEnvelopeStatus(envelopeId)
- downloadSignedDocument(envelopeId)

Create API route:
- POST /api/webhooks/signature-api - handle completion webhook

Webhook handler should:
1. Verify webhook signature
2. Download signed PDF
3. Upload to Supabase Storage
4. Update application.waiver_signed = true
5. Update application.waiver_document_url
6. Trigger SMS confirmation

Template IDs (to be configured):
- tpl_easton_park
- tpl_whisper_valley
- tpl_wolf_ranch
- tpl_goodnight_ranch

Each references different property management company.
```

---

### PROMPT 16: Email Lists Module

```
Build the Email Lists module at /admin/email-lists.

Features:
- View subscribers per location bucket
- Import from CSV
- Export lists
- Manage unsubscribes
- View raffle entries

Import Flow:
1. Upload CSV file
2. Map columns (email, name, phone)
3. Select location bucket(s)
4. Preview import
5. Import with duplicate detection
6. Show import results

Send Newsletter:
- Select location bucket(s)
- Compose message
- Attach flyer
- Preview
- Send or schedule

Use ShadCN DataTable, Dialog, FileUpload.
```

---

### PROMPT 17: Booth Maps Module

```
Build the Booth Maps module at /admin/maps.

This is the custom visual drag-and-drop booth map editor.

Per Location:
- Upload base PDF map
- Define booth positions on canvas
- Set booth numbering
- Mark special areas (pavilion, indoor, food truck zone)

Per Event:
- Start from location template
- Drag vendors to booth positions
- Color code by category
- Mark paid (green) / unpaid (yellow)
- Show vendor name labels
- Generate final PDF
- Publish to vendor portal

Map Editor Features:
- Visual canvas
- Zoom/pan controls
- Booth markers (numbered circles)
- Vendor name tooltips
- Category icons in legend
- Export to PDF

Consider using:
- react-konva or fabric.js for canvas
- pdf-lib for PDF generation
- Or build custom with SVG

This is complex - take it step by step.
```

---

### PROMPT 18: Reports Module

```
Build the Reports module at /admin/reports.

Available Reports:
1. Revenue by Location - Monthly/yearly breakdown
2. Vendor Retention - Recurring vs one-time vendors
3. Category Distribution - What's selling at each location
4. Payment Methods - Zelle vs Venmo vs CashApp breakdown
5. Capacity Trends - Vendor counts over time
6. No-Show Tracking - Problem vendors

Features:
- Date range selector
- Location filter
- Data visualization (charts)
- Export to CSV or PDF

Use recharts or similar for charts.
Use ShadCN Card, Select, DatePicker.
```

---

### PROMPT 19: Settings Module

```
Build the Settings module at /admin/settings.

Sections:
1. Locations - Quick link to locations management
2. Space Types - Configure pricing
3. Vendor Types - Manage categories
4. Product Categories - For cap enforcement
5. SMS Templates - Edit message templates
6. Email Templates - Edit notification templates
7. Users - Staff account management
8. Integrations - API key configuration (display only)

Users Management:
- List admin/staff users
- Invite new user
- Set role (admin/staff)
- Deactivate user

Use ShadCN Tabs, Card, Form, Input.
```

---

### PROMPT 20: Automated Workflows

```
Implement the automated workflows as server actions.

1. Application Approved Workflow:
   - Create/update vendor record
   - Send SignatureAPI waiver
   - Create invoice
   - Send approval email with magic link
   - Log to audit_log

2. Waiver Signed Workflow (webhook triggered):
   - Update application.waiver_signed
   - Store signed PDF URL
   - Send SMS confirmation
   - Log to audit_log

3. Payment Received Workflow:
   - Update invoice status
   - Update event_vendor payment status
   - Assign booth if not assigned
   - Send confirmation SMS + email
   - Log to audit_log

4. Map Published Workflow:
   - Store map PDF URL
   - Update event.vendor_map_published
   - Send SMS to all event vendors
   - Send email with map attached
   - Log to audit_log

Create these as composable server actions that can be called from UI or scheduled jobs.
```

---

### PROMPT 21: Testing

```
Add comprehensive testing.

Test files:
- __tests__/api/ - API route tests
- __tests__/components/ - Component tests
- __tests__/workflows/ - Workflow integration tests

Core Flows to Test:
1. Application → approval → waiver → payment → assignment
2. Bulk SMS send
3. Email campaign send
4. Map publish + notifications
5. Payment marking
6. Category cap enforcement
7. Vendor ban workflow

Integration Tests:
- SignatureAPI mock
- Twilio mock
- Resend mock
- Supabase test database

Use Vitest or Jest.
Aim for 100% coverage on critical workflows.
```

---

## Important Files Reference

| File | Location |
|---|---|
| CRM Blueprint | `AEOPIC /movemountain/blueprint/MMM_CRM_BLUEPRINT_v1.md` |
| Onboarding Call | `project-manager/movemountains/ONBOARDING_CALL_2026-04-17.txt` |
| Client Docs | `AEOPIC /movemountain/important docs/` |
| Project Status | `project-manager/movemountains/STATUS.md` |
| Decisions Log | `project-manager/movemountains/DECISIONS.md` |

---

## Client Context

**Client:** Amanda A., Move Mountains Artisan Market
**Business:** Artisan market operator, 4 active locations in Austin TX area
**Current System:** Google Sheets + manual emails + PDF applications
**Goal:** Replace spreadsheets with unified CRM dashboard

**Key Pain Points:**
- Manual vendor tracking across 4 markets
- Manual payment tracking
- Manual email blasts
- No automated waiver signing
- No centralized booth assignment

---

## Questions / Blockers

If you hit a blocker, check:
1. Blueprint for specifications
2. DECISIONS.md for confirmed decisions
3. Reach out to Sam if unclear

---

## Deployment

The repo is already connected to Vercel under `movemountainsmarket.com`.

- Push to `main` deploys to production
- Create feature branches for development
- Test locally with `npm run dev`

---

## Checklist

Before marking complete, verify:

- [ ] All 14 tables created with RLS
- [ ] Seed data populated
- [ ] Admin auth working
- [ ] All 11 CRM modules functional
- [ ] Twilio SMS sending
- [ ] Resend email sending
- [ ] SignatureAPI waiver flow
- [ ] Booth map editor working
- [ ] All automated workflows functioning
- [ ] Mobile responsive
- [ ] TestSprite integration (or equivalent)
- [ ] No console errors
- [ ] Performance acceptable

---

*Build Instructions Version 1.0*
*Ready for Theron*
