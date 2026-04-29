-- Move Mountains CRM intake-gap bridge v1
-- Strictly additive. Does NOT modify or rename existing tables/columns.
-- Adds: volunteers, employment_applications.
-- Extends: musicians (new columns alongside legacy `active`; do not drop legacy).
-- Origin: Sam audit 2026-04-18 / COO sign-off 2026-04-28.

begin;

-- 1. volunteers ------------------------------------------------------------
create table if not exists volunteers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  interests text[] default array[]::text[],
  availability text,
  additional_info text,
  status text not null default 'new' check (status in ('new', 'contacted', 'active', 'inactive')),
  created_at timestamptz not null default now()
);
create index if not exists volunteers_status_idx on volunteers(status);
create index if not exists volunteers_created_idx on volunteers(created_at desc);

-- 2. employment_applications ----------------------------------------------
create table if not exists employment_applications (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  position_interest text,
  experience text,
  resume_url text,
  additional_info text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'interviewed', 'hired', 'rejected', 'archived')),
  created_at timestamptz not null default now()
);
create index if not exists employment_applications_status_idx on employment_applications(status);
create index if not exists employment_applications_created_idx on employment_applications(created_at desc);

-- 3. musicians: additive columns only -------------------------------------
-- The legacy `active` column from 0001_schema.sql is intentionally LEFT IN PLACE.
-- We add `is_active` alongside so the admin UI can transition without a destructive migration.
alter table musicians add column if not exists photo_url text;
alter table musicians add column if not exists instagram_url text;
alter table musicians add column if not exists facebook_url text;
alter table musicians add column if not exists display_on_website boolean default false;
alter table musicians add column if not exists is_active boolean default true;

-- 4. RLS ------------------------------------------------------------------
alter table volunteers enable row level security;
alter table employment_applications enable row level security;

-- volunteers policies
drop policy if exists "admin_full_volunteers" on volunteers;
create policy "admin_full_volunteers" on volunteers for all using (is_admin()) with check (is_admin());

drop policy if exists "staff_read_volunteers" on volunteers;
create policy "staff_read_volunteers" on volunteers for select using (is_staff_or_admin());

drop policy if exists "staff_update_volunteers" on volunteers;
create policy "staff_update_volunteers" on volunteers for update using (is_staff_or_admin()) with check (is_staff_or_admin());

drop policy if exists "staff_delete_volunteers" on volunteers;
create policy "staff_delete_volunteers" on volunteers for delete using (is_staff_or_admin());

-- employment_applications policies
drop policy if exists "admin_full_employment_applications" on employment_applications;
create policy "admin_full_employment_applications" on employment_applications for all using (is_admin()) with check (is_admin());

drop policy if exists "staff_read_employment_applications" on employment_applications;
create policy "staff_read_employment_applications" on employment_applications for select using (is_staff_or_admin());

drop policy if exists "staff_update_employment_applications" on employment_applications;
create policy "staff_update_employment_applications" on employment_applications for update using (is_staff_or_admin()) with check (is_staff_or_admin());

drop policy if exists "staff_delete_employment_applications" on employment_applications;
create policy "staff_delete_employment_applications" on employment_applications for delete using (is_staff_or_admin());

-- Note on intake: API routes use the service role client, which bypasses RLS.
-- We deliberately do NOT add a public-anon insert policy here. This keeps direct
-- anon writes blocked even if someone discovers the table via the anon key.

commit;
