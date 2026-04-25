-- Move Mountains CRM schema v1
-- Generated 2026-04-24, per docs/crm-blueprint/MMM_CRM_BLUEPRINT_v1.md
-- All PKs UUID. created_at/updated_at on all tables. RLS enabled in 0002_rls.sql.

create extension if not exists "uuid-ossp";

-- 1. user_roles: role mechanism for RLS
create table user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'staff', 'vendor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. locations: market venues
create table locations (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  address text,
  city text,
  state text default 'TX',
  zip text,
  schedule_description text,
  schedule_day_of_week text,
  schedule_week_of_month integer,
  open_time time,
  close_time time,
  summer_open_time time,
  summer_close_time time,
  max_vendors integer,
  property_management text,
  active boolean not null default true,
  booth_map_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. space_types: booth options per location with pricing
create table space_types (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references locations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  price_first_market numeric(10,2),
  price_recurring numeric(10,2),
  capacity integer,
  active boolean not null default true,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(location_id, slug)
);

-- 4. vendor_types: standard, food truck, kid/teen, etc.
create table vendor_types (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  base_price numeric(10,2),
  requires_permits boolean default false,
  active boolean default true,
  created_at timestamptz not null default now()
);

-- 5. product_categories: candles, jewelry, etc. (for cap enforcement)
create table product_categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  active boolean default true,
  created_at timestamptz not null default now()
);

-- 6. musicians: local musician directory
create table musicians (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  handle text,
  website text,
  email text,
  phone text,
  notes text,
  active boolean default true,
  created_at timestamptz not null default now()
);

-- 7. vendors: master vendor records
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  vendor_type_id uuid references vendor_types(id),
  product_categories uuid[] default array[]::uuid[],
  social_instagram text,
  social_facebook text,
  social_website text,
  status text not null default 'active' check (status in ('active', 'inactive', 'banned', 'pending')),
  ban_reason text,
  internal_notes text,
  total_markets_attended integer default 0,
  is_recurring boolean default false,
  liability_insurance_url text,
  liability_insurance_expires date,
  food_manager_cert_url text,
  food_manager_cert_expires date,
  county_permit_url text,
  county_permit_expires date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vendors_business_name_idx on vendors using gin(to_tsvector('english', business_name));
create index vendors_status_idx on vendors(status);

-- 8. market_events: individual market dates
create table market_events (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references locations(id),
  event_date date not null,
  start_time time,
  end_time time,
  theme text,
  musician_id uuid references musicians(id),
  vendor_capacity integer,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'complete', 'cancelled')),
  vendor_map_url text,
  vendor_map_published_at timestamptz,
  raffle_prize_description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(location_id, event_date)
);
create index market_events_date_idx on market_events(event_date);
create index market_events_status_idx on market_events(status);

-- 9. applications: vendor applications per location
create table applications (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references locations(id),
  vendor_id uuid references vendors(id),
  business_name text not null,
  contact_name text,
  email text not null,
  phone text,
  vendor_type_id uuid references vendor_types(id),
  product_categories uuid[] default array[]::uuid[],
  product_description text,
  requested_space_type_id uuid references space_types(id),
  booth_share_with_email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'waitlist', 'withdrawn')),
  reviewer_notes text,
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  waiver_envelope_id text,
  waiver_signed boolean default false,
  waiver_document_url text,
  waiver_signed_at timestamptz,
  source text default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_status_idx on applications(status);
create index applications_location_idx on applications(location_id);

-- 10. event_vendors: junction for vendor-to-event assignments
create table event_vendors (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references market_events(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  space_type_id uuid references space_types(id),
  booth_number text,
  booth_x integer,
  booth_y integer,
  amount numeric(10,2),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'comped', 'refunded')),
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  attended boolean,
  no_show boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, vendor_id)
);

-- 11. invoices: payment tracking
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique,
  vendor_id uuid not null references vendors(id),
  event_id uuid references market_events(id),
  event_vendor_id uuid references event_vendors(id),
  amount numeric(10,2) not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'overdue', 'cancelled', 'refunded')),
  due_date date,
  paid_date date,
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_status_idx on invoices(status);
create index invoices_due_date_idx on invoices(due_date);

-- 12. sms_messages: SMS log
create table sms_messages (
  id uuid primary key default uuid_generate_v4(),
  twilio_sid text unique,
  vendor_id uuid references vendors(id),
  event_id uuid references market_events(id),
  to_phone text not null,
  from_phone text,
  body text not null,
  template_key text,
  status text default 'queued',
  error_message text,
  sent_by uuid references auth.users(id),
  sent_at timestamptz default now(),
  delivered_at timestamptz
);

-- 13. email_subscribers: newsletter list per location bucket
create table email_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  name text,
  phone text,
  location_id uuid references locations(id),
  source text,
  raffle_entries integer default 0,
  unsubscribed boolean default false,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(email, location_id)
);

-- 14. email_campaigns: newsletter campaigns
create table email_campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text not null,
  body_html text,
  body_text text,
  attachment_url text,
  target_location_ids uuid[] default array[]::uuid[],
  status text default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer default 0,
  open_count integer default 0,
  click_count integer default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 15. survey_responses: post-market surveys
create table survey_responses (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references market_events(id) on delete cascade,
  vendor_id uuid references vendors(id),
  rating integer check (rating between 1 and 5),
  estimated_revenue numeric(10,2),
  feedback text,
  would_return boolean,
  submitted_at timestamptz default now()
);

-- 16. category_caps: limit per category per event
create table category_caps (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references market_events(id) on delete cascade,
  product_category_id uuid not null references product_categories(id),
  cap integer not null,
  unique(event_id, product_category_id)
);

-- 17. audit_log: admin action tracking
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index audit_log_actor_idx on audit_log(actor_id);
create index audit_log_entity_idx on audit_log(entity_type, entity_id);
create index audit_log_created_idx on audit_log(created_at desc);

-- updated_at triggers
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger user_roles_updated_at before update on user_roles for each row execute function set_updated_at();
create trigger locations_updated_at before update on locations for each row execute function set_updated_at();
create trigger space_types_updated_at before update on space_types for each row execute function set_updated_at();
create trigger vendors_updated_at before update on vendors for each row execute function set_updated_at();
create trigger market_events_updated_at before update on market_events for each row execute function set_updated_at();
create trigger applications_updated_at before update on applications for each row execute function set_updated_at();
create trigger event_vendors_updated_at before update on event_vendors for each row execute function set_updated_at();
create trigger invoices_updated_at before update on invoices for each row execute function set_updated_at();
