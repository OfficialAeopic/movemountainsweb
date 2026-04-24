# Move Mountains Market — CRM/Admin Platform Blueprint
Version: 1.0
Created: April 24, 2026
Author: Sam Shahin / Aeopic LLC

---

## Overview

This blueprint defines the internal CRM/Admin platform for Move Mountains Artisan Market. This is Amanda's operational hub — replacing spreadsheets across 4+ market locations with a unified dashboard for vendor management, booth assignments, payment tracking, and automated communications.

**This document covers the CRM only.** Vendor Portal is a separate blueprint.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| SMS | Twilio |
| Email | Resend |
| E-Signatures | SignatureAPI |
| Hosting | Vercel |
| Auth | Supabase Auth (magic link for vendors, email/password for admin) |

---

## User Roles

| Role | Access | Auth Method |
|---|---|---|
| **Admin** (Amanda) | Full CRM access, all locations | Email/password |
| **Staff** (Gina, future hires) | Limited CRM access (view vendors, mark attendance) | Email/password |
| **Vendor** | Vendor Portal only (separate app) | Magic link |

---

## Data Model (Supabase)

### Core Tables

#### `locations`
Market locations — designed for 6+ locations.

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Easton Park"
  slug TEXT UNIQUE NOT NULL,             -- "easton-park"
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'TX',
  zip TEXT,

  -- Schedule
  schedule_day TEXT NOT NULL,            -- "first_sunday", "first_thursday"
  schedule_display TEXT NOT NULL,        -- "First Sundays"
  standard_hours TEXT,                   -- "11 AM - 3 PM"
  summer_hours TEXT,                     -- "10 AM - 2 PM"
  setup_time TEXT,                       -- "9 AM"
  teardown_time TEXT,                    -- "3 PM"

  -- Capacity
  max_vendors INTEGER,

  -- Liability
  property_entity TEXT,                  -- "Easton Park Residential Master Community"
  management_company TEXT,               -- "Cohere Life"

  -- Features
  has_pavilion BOOLEAN DEFAULT FALSE,
  has_indoor BOOLEAN DEFAULT FALSE,
  has_top_deck BOOLEAN DEFAULT FALSE,
  electricity_available BOOLEAN DEFAULT FALSE,

  -- Map
  map_pdf_url TEXT,                      -- Supabase Storage URL
  map_image_url TEXT,                    -- Rendered map image

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `space_types`
Available booth/space options per location.

```sql
CREATE TABLE space_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Standard Artisan Tent"
  slug TEXT NOT NULL,                    -- "tent"
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  requires_tent BOOLEAN DEFAULT FALSE,
  requires_weights BOOLEAN DEFAULT FALSE,
  electricity_available BOOLEAN DEFAULT FALSE,
  space_dimensions TEXT,                 -- "10x10" or "7ft x 7ft"
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `vendor_types`
Categories of vendors (for pricing and requirements).

```sql
CREATE TABLE vendor_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Standard Artisan"
  slug TEXT NOT NULL,                    -- "standard"
  description TEXT,
  requires_food_permits BOOLEAN DEFAULT FALSE,
  requires_cottage_cert BOOLEAN DEFAULT FALSE,
  requires_liability_insurance BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data:
-- standard, agricultural_producer, kid_teen, ice_cream_snow_cone, hot_food, food_truck
```

#### `product_categories`
For category cap enforcement.

```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Candles"
  slug TEXT NOT NULL,                    -- "candles"
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Examples: candles, baked_goods, jewelry, skincare, pet_products, plants, art, clothing, home_decor, eggs_produce, hot_food
```

#### `vendors`
Master vendor record.

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Auth link (for vendor portal)
  user_id UUID REFERENCES auth.users(id),

  -- Business info
  business_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,             -- Contact person
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  social_media JSONB,                    -- {"instagram": "@handle", "facebook": "url", "tiktok": "@handle"}

  -- Classification
  vendor_type_id UUID REFERENCES vendor_types(id),
  product_categories UUID[],             -- Array of category IDs
  products_description TEXT,             -- What they sell

  -- Status
  status TEXT DEFAULT 'pending',         -- pending, approved, denied, banned
  ban_reason TEXT,

  -- Compliance
  has_proper_tent BOOLEAN,
  has_proper_weights BOOLEAN,

  -- Food vendor docs (Supabase Storage URLs)
  liability_insurance_url TEXT,
  commercial_kitchen_proof_url TEXT,
  food_manager_cert_url TEXT,
  county_permit_url TEXT,
  food_handler_cert_url TEXT,            -- For cottage law vendors
  docs_verified BOOLEAN DEFAULT FALSE,
  docs_verified_at TIMESTAMPTZ,

  -- Payment preferences
  preferred_payment_method TEXT,         -- zelle, venmo, cashapp, apple_pay

  -- Recurring vendor tracking
  is_recurring BOOLEAN DEFAULT FALSE,
  first_market_date DATE,
  total_markets_attended INTEGER DEFAULT 0,

  -- Communication
  receives_sms BOOLEAN DEFAULT TRUE,
  receives_email BOOLEAN DEFAULT TRUE,

  notes TEXT,                            -- Internal notes

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `market_events`
Individual market dates.

```sql
CREATE TABLE market_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,

  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  setup_time TIME NOT NULL,

  -- Theme
  theme_name TEXT,                       -- "Merry Grinchmas"
  theme_description TEXT,
  activities TEXT[],                     -- ["Photos with Grinch", "Raffle Giveaway"]

  -- Musician
  musician_name TEXT,
  musician_time TEXT,                    -- "11AM-1PM"

  -- Status
  status TEXT DEFAULT 'scheduled',       -- scheduled, cancelled, completed
  cancellation_reason TEXT,

  -- Capacity tracking
  max_vendors INTEGER,
  current_vendor_count INTEGER DEFAULT 0,

  -- Map
  vendor_map_url TEXT,                   -- Final map PDF for this event
  vendor_map_published BOOLEAN DEFAULT FALSE,
  vendor_map_published_at TIMESTAMPTZ,

  -- Setup info sent
  setup_info_sent BOOLEAN DEFAULT FALSE,
  setup_info_sent_at TIMESTAMPTZ,

  -- Post-market
  survey_sent BOOLEAN DEFAULT FALSE,
  survey_sent_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `applications`
Vendor applications per location.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to existing vendor OR new application
  vendor_id UUID REFERENCES vendors(id),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,

  -- If new vendor (not yet in vendors table)
  business_name TEXT,
  vendor_name TEXT,
  phone TEXT,
  email TEXT,
  social_media JSONB,
  products_description TEXT,
  vendor_type_id UUID REFERENCES vendor_types(id),

  -- Space preferences
  space_type_id UUID REFERENCES space_types(id),
  space_preference TEXT,                 -- "pavilion", "indoor", "tent"
  electricity_needed BOOLEAN DEFAULT FALSE,

  -- Booth sharing
  wants_booth_share BOOLEAN DEFAULT FALSE,
  booth_share_business TEXT,
  booth_share_approved BOOLEAN,

  -- Status
  status TEXT DEFAULT 'pending',         -- pending, approved, denied, waitlisted
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  denial_reason TEXT,

  -- Waiver
  waiver_signed BOOLEAN DEFAULT FALSE,
  waiver_signed_at TIMESTAMPTZ,
  waiver_document_url TEXT,              -- SignatureAPI completed doc
  signature_envelope_id TEXT,            -- SignatureAPI envelope ID

  -- Payment tracking (for this application)
  amount_due DECIMAL(10,2),
  payment_method TEXT,
  payment_received BOOLEAN DEFAULT FALSE,
  payment_received_at TIMESTAMPTZ,
  payment_marked_by UUID,
  payment_notes TEXT,

  -- Dates interested in
  target_event_id UUID REFERENCES market_events(id),

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `event_vendors`
Vendor assignments per market event (junction table).

```sql
CREATE TABLE event_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES market_events(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),

  -- Assignment
  booth_number TEXT,                     -- "42"
  booth_location TEXT,                   -- "Pavilion Row A"
  assigned_at TIMESTAMPTZ,
  assigned_by UUID,

  -- Space/pricing
  space_type_id UUID REFERENCES space_types(id),
  amount_charged DECIMAL(10,2),

  -- Payment for this event
  payment_status TEXT DEFAULT 'pending', -- pending, paid, waived, refunded
  payment_method TEXT,
  payment_received_at TIMESTAMPTZ,
  payment_marked_by UUID,

  -- Attendance
  attendance_status TEXT,                -- confirmed, no_show, cancelled, early_leave
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,

  -- Survey
  survey_completed BOOLEAN DEFAULT FALSE,
  survey_response_id UUID,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, vendor_id)
);
```

#### `invoices`
Payment tracking.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,   -- "INV-2026-0001"

  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  event_vendor_id UUID REFERENCES event_vendors(id),

  amount DECIMAL(10,2) NOT NULL,
  description TEXT,

  status TEXT DEFAULT 'pending',         -- pending, paid, overdue, cancelled
  due_date DATE,

  payment_method TEXT,
  payment_received_at TIMESTAMPTZ,
  payment_marked_by UUID,
  payment_reference TEXT,                -- Transaction ID or note

  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sms_messages`
SMS log.

```sql
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  vendor_id UUID REFERENCES vendors(id),
  phone TEXT NOT NULL,

  message_type TEXT NOT NULL,            -- payment_reminder, survey, map_posted, custom
  message_body TEXT NOT NULL,

  twilio_sid TEXT,
  status TEXT,                           -- queued, sent, delivered, failed
  error_message TEXT,

  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);
```

#### `email_subscribers`
Customer email lists per location.

```sql
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,

  -- Location buckets
  locations UUID[],                      -- Array of location IDs

  -- Raffle info
  entered_raffle BOOLEAN DEFAULT FALSE,
  allergies TEXT,                        -- For raffle prize selection

  source TEXT,                           -- "raffle_form", "website", "import"

  is_subscribed BOOLEAN DEFAULT TRUE,
  unsubscribed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email)
);
```

#### `email_campaigns`
Newsletter campaigns.

```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- Targeting
  target_locations UUID[],               -- Which location buckets

  -- Attachments
  flyer_url TEXT,
  map_url TEXT,

  -- Status
  status TEXT DEFAULT 'draft',           -- draft, scheduled, sending, sent
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Stats
  recipients_count INTEGER DEFAULT 0,
  opens_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `survey_responses`
Post-market survey responses.

```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_vendor_id UUID REFERENCES event_vendors(id),
  vendor_id UUID REFERENCES vendors(id),
  event_id UUID REFERENCES market_events(id),

  -- Survey questions
  sales_rating INTEGER,                  -- 1-5
  sales_estimate TEXT,                   -- "$0-100", "$100-500", etc.
  experience_rating INTEGER,             -- 1-5
  feedback TEXT,

  -- Future interest
  interested_next_month BOOLEAN,
  interested_locations UUID[],

  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `category_caps`
Category limits per event.

```sql
CREATE TABLE category_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_id UUID REFERENCES market_events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id),

  max_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `musicians`
Musician directory.

```sql
CREATE TABLE musicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  photo_url TEXT,

  -- Socials
  instagram_url TEXT,
  facebook_url TEXT,
  website_url TEXT,

  -- Contact
  email TEXT,
  phone TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  display_on_website BOOLEAN DEFAULT TRUE,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `audit_log`
Track all admin actions.

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID,
  action TEXT NOT NULL,                  -- "vendor_approved", "payment_marked", etc.
  entity_type TEXT,                      -- "vendor", "application", "invoice"
  entity_id UUID,

  old_data JSONB,
  new_data JSONB,

  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## CRM Modules

### 1. Dashboard

**URL:** `/admin`

**Components:**
- **Quick Stats Cards**
  - Upcoming markets (next 30 days)
  - Pending applications (needs review)
  - Outstanding payments
  - Total vendors (active)

- **Upcoming Markets Timeline**
  - Next 4 events with vendor count, capacity percentage
  - Quick actions: View vendors, Send map, Post survey

- **Recent Activity Feed**
  - New applications
  - Payments received
  - Waiver signatures
  - Survey responses

- **Alerts Panel**
  - Overdue payments
  - Events missing maps
  - Food vendors with expired docs

---

### 2. Locations Management

**URL:** `/admin/locations`

**Features:**
- List all locations with status indicators
- Add/edit location details
- Configure space types and pricing per location
- Upload/manage booth maps
- Set capacity limits
- Toggle active/inactive

**Location Detail Page:** `/admin/locations/[slug]`
- Location info
- Space types configuration
- Pricing matrix
- Upcoming events
- Vendor history at this location
- Map management

---

### 3. Market Events

**URL:** `/admin/events`

**List View:**
- Calendar view + list view toggle
- Filter by location, status, date range
- Quick stats per event

**Event Detail Page:** `/admin/events/[id]`

**Tabs:**

#### 3a. Overview Tab
- Event details (date, time, theme, musician)
- Capacity meter (current/max)
- Status controls (cancel event, mark complete)
- Edit theme/activities

#### 3b. Vendors Tab
- List of assigned vendors with:
  - Booth assignment
  - Payment status
  - Space type
  - Product category
  - Contact info (click to call/text/email)
- Add vendor to event
- Remove vendor from event
- Bulk actions: Send reminder, Export list

#### 3c. Booth Map Tab
- Visual booth map (built from PDF foundation)
- Drag-and-drop vendor assignment
- Color coding: Paid (green), Pending (yellow), Category (icon)
- Export map as PDF
- Publish map to vendor portal
- Click booth to see/assign vendor

#### 3d. Payments Tab
- Payment status summary
- Mark payments received (one-click)
- Bulk mark paid
- Send payment reminders (SMS/email)
- Payment method breakdown

#### 3e. Communications Tab
- Send bulk SMS to event vendors
- Send bulk email to event vendors
- View sent messages history
- Templates: Map posted, Setup info, Reminder

#### 3f. Post-Market Tab
- Mark event complete
- Send post-market survey
- View survey responses
- Sales data summary
- Attendance tracking (who showed up, no-shows)

---

### 4. Vendors

**URL:** `/admin/vendors`

**List View:**
- Search by name, business, phone, email
- Filter by: Status, Location, Category, Recurring
- Sort by: Name, Recent activity, Total markets
- Bulk actions: Export, Send message

**Vendor Detail Page:** `/admin/vendors/[id]`

**Tabs:**

#### 4a. Profile Tab
- Business info
- Contact info (click to call/text/email)
- Social media links (clickable)
- Product categories
- Vendor type
- Internal notes
- Status (with ban controls)

#### 4b. Documents Tab (Food Vendors)
- Upload/view required docs:
  - Liability insurance
  - Commercial kitchen proof
  - Food manager certification
  - County permit
  - Food handler certification
- Document expiration tracking
- Verification status
- Request missing docs (sends email)

#### 4c. History Tab
- All markets attended
- Payment history
- Application history
- Communication history
- Survey responses

#### 4d. Invoices Tab
- All invoices for this vendor
- Create new invoice
- Mark paid
- Payment history

---

### 5. Applications

**URL:** `/admin/applications`

**List View:**
- Filter by: Status, Location, Date range
- Sort by: Submitted date, Location
- Pending count badge in nav

**Application Review Page:** `/admin/applications/[id]`

**Sections:**
- Applicant info
- Requested location + space type
- Product description
- Category check (shows if category is at cap)
- Existing vendor match detection
- Booth share request (if applicable)

**Actions:**
- **Approve** → Creates/updates vendor record, triggers waiver, creates invoice
- **Deny** → Sends denial notification, records reason
- **Waitlist** → Holds for future openings
- **Request Docs** → For food vendors missing requirements

**Approval Flow:**
1. Review application
2. Check category availability
3. Set space type and price
4. Click Approve
5. System creates vendor (if new) or links to existing
6. SignatureAPI sends liability waiver
7. Invoice created with payment instructions
8. Vendor receives email with portal access (magic link)

---

### 6. Payments

**URL:** `/admin/payments`

**Views:**
- **Pending Payments** — Outstanding invoices
- **Received Today** — Quick confirmation view
- **Overdue** — Past due date
- **All Invoices** — Full history

**Quick Mark Paid:**
- One-click mark paid
- Select payment method
- Add reference note (optional)
- Auto-timestamps

**Payment Entry:**
- Vendor search/select
- Amount
- Payment method (Zelle, Venmo, CashApp, Apple Pay)
- Reference (transaction ID, vendor note)
- Associate with event (optional)

**Bulk Actions:**
- Send payment reminders (SMS + email)
- Export for reconciliation
- Mark multiple paid

---

### 7. Communications

**URL:** `/admin/communications`

#### 7a. SMS Center
- Send individual SMS
- Send bulk SMS by:
  - Location bucket
  - Specific event
  - All vendors
- Message templates
- Character count
- Delivery status tracking
- SMS history log

**Templates:**
- Payment reminder (24-hour)
- Recurring payment reminder (Tuesday)
- Map posted notification
- Post-market survey
- Custom

#### 7b. Email Center
- Compose newsletter
- Rich text editor
- Attach flyer/map
- Target by location bucket
- Schedule send
- Campaign history
- Open/click tracking

#### 7c. Vendor Notifications
- Configure automated triggers:
  - Application approved
  - Waiver sent
  - Payment received
  - Map published
  - Survey request

---

### 8. Email Lists (Customer)

**URL:** `/admin/email-lists`

**Features:**
- View subscribers per location bucket
- Import from CSV (Amanda's existing lists)
- Export lists
- Manage unsubscribes
- Send location-specific newsletters
- View raffle entries

**Import Flow:**
- Upload CSV
- Map columns
- Select location bucket(s)
- Preview
- Import with duplicate detection

---

### 9. Booth Maps

**URL:** `/admin/maps`

**Per Location:**
- Upload base PDF map
- Convert to editable grid
- Define booth positions
- Set booth numbering
- Mark special areas (pavilion, indoor, food truck zone)

**Per Event:**
- Start from location template
- Assign vendors via drag-drop
- Color code by category
- Mark paid/unpaid
- Generate final PDF
- Publish to vendor portal

**Map Editor:**
- Visual canvas (built from PDF)
- Booth markers (numbered)
- Vendor name labels
- Category icons
- Legend
- Zoom/pan controls
- Export to PDF

---

### 10. Reports

**URL:** `/admin/reports`

**Available Reports:**
- **Revenue by Location** — Monthly/yearly breakdown
- **Vendor Retention** — Recurring vs one-time vendors
- **Category Distribution** — What's selling at each location
- **Payment Methods** — Zelle vs Venmo vs CashApp breakdown
- **Capacity Trends** — Vendor counts over time
- **No-Show Tracking** — Problem vendors

**Export:** CSV, PDF

---

### 11. Settings

**URL:** `/admin/settings`

**Sections:**
- **Locations** — Manage all locations
- **Space Types** — Configure pricing
- **Vendor Types** — Manage vendor categories
- **Product Categories** — For cap enforcement
- **SMS Templates** — Edit message templates
- **Email Templates** — Edit notification templates
- **Users** — Staff accounts
- **Integrations** — Twilio, Resend, SignatureAPI keys

---

## Automated Workflows

### 1. Application Approved

**Trigger:** Admin clicks "Approve" on application

**Actions:**
1. Create/update vendor record
2. Send SignatureAPI waiver request
3. Create invoice
4. Send approval email with:
   - Welcome message
   - Waiver signing link
   - Payment instructions
   - Portal access (magic link)
5. Log in audit trail

### 2. Waiver Signed

**Trigger:** SignatureAPI webhook — signature complete

**Actions:**
1. Update application `waiver_signed = true`
2. Store signed PDF URL
3. Update vendor docs status
4. Send SMS: "Waiver received! Complete your payment to reserve your spot."
5. Log in audit trail

### 3. Payment Received

**Trigger:** Admin marks payment received

**Actions:**
1. Update invoice status
2. Update event_vendor payment status
3. Assign booth number (if not assigned)
4. Send confirmation SMS
5. Send confirmation email with:
   - Receipt
   - Event details
   - Portal link
6. Log in audit trail

### 4. Map Published

**Trigger:** Admin clicks "Publish Map" for event

**Actions:**
1. Store map PDF URL
2. Update event `vendor_map_published = true`
3. Send SMS to all event vendors: "Your vendor map for [Event] is now available!"
4. Send email with map attached
5. Update vendor portal (map now visible)

### 5. Payment Reminder (Scheduled)

**Trigger:** Tuesday after market OR 24 hours after approval (new vendors)

**Actions:**
1. Query unpaid invoices
2. Send SMS reminder
3. Send email reminder
4. Log reminder sent
5. Mark `reminder_sent = true`

### 6. Post-Market Survey (Scheduled)

**Trigger:** Admin clicks "Send Survey" OR 2 hours after event end time

**Actions:**
1. Query all event vendors
2. Send SMS with survey link
3. Send email with survey link
4. Mark `survey_sent = true`

### 7. Vendor Ban

**Trigger:** 2 consecutive cancellations OR 1 no-show detected

**System:**
1. Flag vendor for review
2. Admin reviews and confirms ban
3. Update vendor `status = banned`
4. Record ban reason
5. Vendor loses portal access
6. Log in audit trail

---

## UI Components (ShadCN)

### Layout
- Sidebar navigation (collapsible)
- Top bar with search, notifications, user menu
- Breadcrumb navigation
- Mobile responsive (tablet priority)

### Key Components
- `DataTable` — Sortable, filterable, paginated tables
- `Card` — Stat cards, info cards
- `Dialog` — Modals for quick actions
- `Sheet` — Slide-out panels for details
- `Tabs` — Section organization
- `Badge` — Status indicators
- `Avatar` — Vendor photos/initials
- `Calendar` — Event scheduling
- `Command` — Quick search (Cmd+K)
- `Toast` — Action confirmations

### Status Colors
- **Pending** — Yellow/Amber
- **Approved/Paid** — Green
- **Denied/Overdue** — Red
- **Waitlisted** — Blue
- **Cancelled** — Gray

---

## API Routes (Next.js)

### Locations
- `GET /api/locations` — List all
- `GET /api/locations/[id]` — Get one
- `POST /api/locations` — Create
- `PATCH /api/locations/[id]` — Update
- `DELETE /api/locations/[id]` — Soft delete

### Events
- `GET /api/events` — List with filters
- `GET /api/events/[id]` — Get with vendors
- `POST /api/events` — Create
- `PATCH /api/events/[id]` — Update
- `POST /api/events/[id]/publish-map` — Publish map + notify
- `POST /api/events/[id]/send-survey` — Send survey

### Vendors
- `GET /api/vendors` — List with filters
- `GET /api/vendors/[id]` — Get with history
- `POST /api/vendors` — Create
- `PATCH /api/vendors/[id]` — Update
- `POST /api/vendors/[id]/ban` — Ban vendor

### Applications
- `GET /api/applications` — List with filters
- `GET /api/applications/[id]` — Get one
- `POST /api/applications/[id]/approve` — Approve + trigger workflows
- `POST /api/applications/[id]/deny` — Deny + notify
- `POST /api/applications/[id]/waitlist` — Waitlist

### Payments
- `GET /api/invoices` — List with filters
- `POST /api/invoices` — Create
- `POST /api/invoices/[id]/mark-paid` — Mark paid
- `POST /api/invoices/bulk-reminder` — Send reminders

### Communications
- `POST /api/sms/send` — Send SMS
- `POST /api/sms/bulk` — Bulk SMS
- `POST /api/email/send` — Send email
- `POST /api/email/campaign` — Send campaign

### Webhooks
- `POST /api/webhooks/signature-api` — Waiver completion
- `POST /api/webhooks/twilio` — Delivery status

---

## SignatureAPI Integration

### Waiver Flow

1. **Create Envelope**
```javascript
POST /envelopes
{
  "title": "Move Mountains Artisan Market - Liability Waiver",
  "documents": [{ "template_id": "[location-specific-template]" }],
  "signers": [{
    "name": "[vendor_name]",
    "email": "[vendor_email]",
    "places": [
      { "label": "signature", "page": 4, "x": 100, "y": 600 },
      { "label": "date", "page": 4, "x": 400, "y": 600 }
    ]
  }],
  "webhook_url": "https://movemountainsmarket.com/api/webhooks/signature-api"
}
```

2. **Webhook Handler**
```javascript
// On signature complete
if (event === 'envelope.completed') {
  // Download signed PDF
  // Store in Supabase Storage
  // Update application.waiver_signed = true
  // Update application.waiver_document_url
  // Trigger next workflow step
}
```

### Templates Per Location
Each location has different liability language referencing the property management company:
- `tpl_easton_park` — References Cohere Life
- `tpl_whisper_valley` — References FirstService Residential
- `tpl_wolf_ranch` — References FirstService Residential
- `tpl_goodnight_ranch` — TBD

---

## Twilio Integration

### SMS Templates

**Payment Reminder (24-hour):**
```
Hi [vendor_name]! Your spot at [location] on [date] isn't confirmed yet.
Please submit payment within 24 hours to reserve your booth.
Questions? Reply to this text.
- Move Mountains Market
```

**Recurring Payment Reminder:**
```
Hi [vendor_name]! Friendly reminder: payment for [location] on [date] is due by Tuesday.
Pay via Zelle/Venmo/CashApp to 512-612-8850.
- Move Mountains Market
```

**Map Posted:**
```
[vendor_name], your vendor map for [location] on [date] is ready!
Check your email or portal for your booth assignment: [booth_number].
- Move Mountains Market
```

**Post-Market Survey:**
```
Thank you for joining us at [location]!
We'd love your feedback: [survey_link]
Interested in [next_month]? Let us know!
- Move Mountains Market
```

---

## Resend Integration

### Email Templates

**Application Approved:**
- Subject: "Welcome to Move Mountains Artisan Market!"
- Body: Welcome message, waiver link, payment instructions, portal access

**Payment Received:**
- Subject: "Payment Confirmed - [Location] [Date]"
- Body: Receipt, event details, what to bring, setup time

**Map Published:**
- Subject: "Your Vendor Map is Ready - [Location] [Date]"
- Body: Map PDF attached, booth assignment, setup instructions

**Post-Market Survey:**
- Subject: "How was [Location]? Quick Survey"
- Body: Thank you, survey link, upcoming dates

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled:
- Admin users: Full access
- Staff users: Read + limited write
- Vendors: Own data only (via vendor portal)

### Auth
- Admin: Email/password with MFA optional
- Staff: Email/password
- Vendor: Magic link only (no password to remember)

### API Security
- All routes require authentication
- Role-based access control
- Rate limiting on SMS/email endpoints
- Webhook signature verification

---

## Seed Data

### Locations
1. Easton Park (easton-park)
2. Whisper Valley (whisper-valley)
3. Goodnight Ranch (goodnight-ranch)
4. Wolf Ranch (wolf-ranch)

### Vendor Types
1. Standard Artisan
2. Agricultural Producer
3. Kid/Teen Entrepreneur
4. Ice Cream/Snow Cone
5. Hot Food
6. Food Truck

### Product Categories
Candles, Baked Goods, Jewelry, Skincare, Pet Products, Plants, Art, Clothing, Home Decor, Eggs/Produce, Hot Food, Drinks, Books, Crafts

---

## Migration Plan

### Phase 1: Import Existing Data
1. Import vendor list from Amanda's spreadsheets
2. Import email subscriber lists per location
3. Create upcoming market events
4. Map product categories

### Phase 2: Parallel Running
1. Amanda uses CRM for new applications
2. Existing vendors migrated gradually
3. Both systems run for 1-2 weeks

### Phase 3: Full Cutover
1. All operations in CRM
2. Spreadsheets archived
3. Vendor portal goes live

---

## Testing Requirements

### Core Flows
- [ ] Application submission → approval → waiver → payment → booth assignment
- [ ] Bulk SMS send
- [ ] Email campaign send
- [ ] Map publish + notifications
- [ ] Payment marking
- [ ] Survey collection
- [ ] Category cap enforcement
- [ ] Vendor ban workflow

### Integrations
- [ ] SignatureAPI waiver round-trip
- [ ] Twilio SMS delivery
- [ ] Resend email delivery
- [ ] Supabase Auth magic links

---

## Prompt Sequence Reference

This blueprint will be converted into sequential prompts for implementation. Key prompt groupings:

1. **Database Setup** — Supabase schema, RLS policies, seed data
2. **Auth Setup** — Admin auth, magic links
3. **Layout + Navigation** — Sidebar, top bar, routing
4. **Dashboard** — Stats, activity feed, alerts
5. **Locations Module** — CRUD, space types
6. **Events Module** — CRUD, vendor assignment, booth map
7. **Vendors Module** — CRUD, documents, history
8. **Applications Module** — Review flow, approval workflow
9. **Payments Module** — Invoices, mark paid, reminders
10. **Communications Module** — SMS, email, templates
11. **Integrations** — SignatureAPI, Twilio, Resend
12. **Reports Module** — Data visualization
13. **Settings Module** — Configuration
14. **Testing** — TestSprite integration

---

## Open Questions

1. **Booth Map Editor** — Build custom or use existing library? Recommend: Start with simple numbered list, add visual map in Phase 2.

2. **Email Lists Import** — Amanda has ~350 emails. CSV format confirmation needed.

3. **Existing Vendor Migration** — Does Amanda have a master vendor list across all locations or separate per location?

4. **Staff Access** — What should Gina be able to do vs not do?

5. **Mobile Priority** — Amanda likely uses this on phone at markets. Tablet-first or phone-first?

---

## Sign-Off

- [ ] Sam Shahin
- [ ] Theron Smith (build owner)
- [ ] Amanda A. (client review)

---

*Blueprint Version 1.0 — Ready for prompt engineering.*
