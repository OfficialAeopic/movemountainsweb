-- Move Mountains CRM RLS policies v1
-- Roles: admin (full), staff (limited write), vendor (own data)

-- Helper: is_admin()
create or replace function is_admin() returns boolean as $$
  select exists(select 1 from user_roles where user_id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- Helper: is_staff_or_admin()
create or replace function is_staff_or_admin() returns boolean as $$
  select exists(select 1 from user_roles where user_id = auth.uid() and role in ('admin', 'staff'));
$$ language sql security definer stable;

-- Helper: current_vendor_id()
create or replace function current_vendor_id() returns uuid as $$
  select id from vendors where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- Enable RLS on all tables
alter table user_roles enable row level security;
alter table locations enable row level security;
alter table space_types enable row level security;
alter table vendor_types enable row level security;
alter table product_categories enable row level security;
alter table musicians enable row level security;
alter table vendors enable row level security;
alter table market_events enable row level security;
alter table applications enable row level security;
alter table event_vendors enable row level security;
alter table invoices enable row level security;
alter table sms_messages enable row level security;
alter table email_subscribers enable row level security;
alter table email_campaigns enable row level security;
alter table survey_responses enable row level security;
alter table category_caps enable row level security;
alter table audit_log enable row level security;

-- ADMIN: full access on all tables
create policy "admin_full_user_roles" on user_roles for all using (is_admin()) with check (is_admin());
create policy "admin_full_locations" on locations for all using (is_admin()) with check (is_admin());
create policy "admin_full_space_types" on space_types for all using (is_admin()) with check (is_admin());
create policy "admin_full_vendor_types" on vendor_types for all using (is_admin()) with check (is_admin());
create policy "admin_full_product_categories" on product_categories for all using (is_admin()) with check (is_admin());
create policy "admin_full_musicians" on musicians for all using (is_admin()) with check (is_admin());
create policy "admin_full_vendors" on vendors for all using (is_admin()) with check (is_admin());
create policy "admin_full_market_events" on market_events for all using (is_admin()) with check (is_admin());
create policy "admin_full_applications" on applications for all using (is_admin()) with check (is_admin());
create policy "admin_full_event_vendors" on event_vendors for all using (is_admin()) with check (is_admin());
create policy "admin_full_invoices" on invoices for all using (is_admin()) with check (is_admin());
create policy "admin_full_sms_messages" on sms_messages for all using (is_admin()) with check (is_admin());
create policy "admin_full_email_subscribers" on email_subscribers for all using (is_admin()) with check (is_admin());
create policy "admin_full_email_campaigns" on email_campaigns for all using (is_admin()) with check (is_admin());
create policy "admin_full_survey_responses" on survey_responses for all using (is_admin()) with check (is_admin());
create policy "admin_full_category_caps" on category_caps for all using (is_admin()) with check (is_admin());
create policy "admin_full_audit_log" on audit_log for all using (is_admin()) with check (is_admin());

-- STAFF: read everywhere, write to event_vendors (attendance) and sms_messages and audit_log
create policy "staff_read_user_roles" on user_roles for select using (is_staff_or_admin());
create policy "staff_read_locations" on locations for select using (is_staff_or_admin());
create policy "staff_read_space_types" on space_types for select using (is_staff_or_admin());
create policy "staff_read_vendor_types" on vendor_types for select using (is_staff_or_admin());
create policy "staff_read_product_categories" on product_categories for select using (is_staff_or_admin());
create policy "staff_read_musicians" on musicians for select using (is_staff_or_admin());
create policy "staff_read_vendors" on vendors for select using (is_staff_or_admin());
create policy "staff_read_market_events" on market_events for select using (is_staff_or_admin());
create policy "staff_read_applications" on applications for select using (is_staff_or_admin());
create policy "staff_read_event_vendors" on event_vendors for select using (is_staff_or_admin());
create policy "staff_read_invoices" on invoices for select using (is_staff_or_admin());
create policy "staff_read_sms_messages" on sms_messages for select using (is_staff_or_admin());
create policy "staff_read_email_subscribers" on email_subscribers for select using (is_staff_or_admin());
create policy "staff_read_email_campaigns" on email_campaigns for select using (is_staff_or_admin());
create policy "staff_read_survey_responses" on survey_responses for select using (is_staff_or_admin());
create policy "staff_read_category_caps" on category_caps for select using (is_staff_or_admin());
create policy "staff_read_audit_log" on audit_log for select using (is_staff_or_admin());
create policy "staff_update_event_vendors" on event_vendors for update using (is_staff_or_admin()) with check (is_staff_or_admin());
create policy "staff_insert_sms" on sms_messages for insert with check (is_staff_or_admin());
create policy "staff_insert_audit" on audit_log for insert with check (is_staff_or_admin());

-- VENDOR: own row in vendors table only
create policy "vendor_self" on vendors for select using (user_id = auth.uid());
create policy "vendor_self_update" on vendors for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Vendor sees own applications
create policy "vendor_own_applications" on applications for select using (vendor_id = current_vendor_id());
-- Vendor sees own event assignments
create policy "vendor_own_event_vendors" on event_vendors for select using (vendor_id = current_vendor_id());
-- Vendor sees own invoices
create policy "vendor_own_invoices" on invoices for select using (vendor_id = current_vendor_id());
-- Vendor sees own SMS log
create policy "vendor_own_sms" on sms_messages for select using (vendor_id = current_vendor_id());

-- PUBLIC INTAKE: anon can insert into applications via the public form
create policy "public_insert_applications" on applications for insert with check (true);

-- PUBLIC: locations and space_types and musicians are readable by anon (for the website)
create policy "public_read_locations" on locations for select using (true);
create policy "public_read_space_types" on space_types for select using (true);
create policy "public_read_vendor_types" on vendor_types for select using (true);
create policy "public_read_product_categories" on product_categories for select using (true);
create policy "public_read_musicians" on musicians for select using (true);
create policy "public_read_market_events" on market_events for select using (status in ('scheduled', 'live'));

