-- Move Mountains CRM contact + newsletter bridge v1
-- Strictly additive. Adds contact_messages table for the public /contact form.
-- Newsletter and vendor-portal-interest both write into the existing
-- email_subscribers table from 0001_schema.sql via different `source` values,
-- so no new table is needed for those.
-- Origin: Sam audit 2026-04-18 / COO sign-off 2026-04-28.

begin;

-- 1. contact_messages -------------------------------------------------------
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text not null,
  phone text,
  inquiry_type text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'responded', 'archived')),
  responded_at timestamptz,
  responded_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_status on contact_messages(status);
create index if not exists idx_contact_messages_created on contact_messages(created_at desc);

alter table contact_messages enable row level security;

-- Mirror the access patterns used in 0002_rls.sql for similar staff-owned
-- tables. Public anon does NOT get an INSERT policy here because all inserts
-- come via the service role through /api/intake/contact.
drop policy if exists "staff_full_contact_messages" on contact_messages;
create policy "staff_full_contact_messages" on contact_messages
  for all
  using (is_staff_or_admin())
  with check (is_staff_or_admin());

commit;
