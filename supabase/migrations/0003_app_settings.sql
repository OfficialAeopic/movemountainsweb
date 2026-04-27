-- PROMPT 19 - Application settings store.
-- Singleton row keyed by id='global'. Holds business info and brand config.

create table if not exists app_settings (
  id text primary key default 'global' check (id = 'global'),
  business_name text,
  business_address text,
  business_city text,
  business_state text default 'TX',
  business_zip text,
  business_phone text,
  business_email text,
  social_instagram text,
  social_facebook text,
  social_tiktok text,
  social_website text,
  brand_logo_url text,
  brand_color_primary text,
  brand_color_secondary text,
  brand_color_accent text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table app_settings enable row level security;

-- Read: admin and staff. Write: admin only.
create policy app_settings_read on app_settings
  for select using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role in ('admin', 'staff')
    )
  );

create policy app_settings_write on app_settings
  for all using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid() and user_roles.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid() and user_roles.role = 'admin'
    )
  );

-- Seed the singleton row so reads never return empty.
insert into app_settings (id) values ('global') on conflict do nothing;

create or replace function set_app_settings_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger app_settings_updated_at before update on app_settings
  for each row execute function set_app_settings_updated_at();
