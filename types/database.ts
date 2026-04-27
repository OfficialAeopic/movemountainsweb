// types/database.ts
// Hand-rolled types for the Move Mountains CRM v1 schema.
// Mirrors supabase/migrations/0001_schema.sql.
// Replace with auto-generated types once Supabase is wired:
//   npx supabase gen types typescript --local > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Shared enum unions
export type AppRole = "admin" | "staff" | "vendor";
export type ApplicationStatus = "pending" | "approved" | "denied" | "waitlist" | "withdrawn";
export type EventStatus = "scheduled" | "live" | "complete" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "comped" | "refunded";
export type InvoiceStatus = "unpaid" | "paid" | "overdue" | "cancelled" | "refunded";
export type VendorStatus = "active" | "inactive" | "banned" | "pending";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type SmsStatus = "queued" | "sent" | "delivered" | "failed" | "undelivered";

// 1. user_roles
export interface UserRole {
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

// 2. locations
export interface Location {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  schedule_description: string | null;
  schedule_day_of_week: string | null;
  schedule_week_of_month: number | null;
  open_time: string | null;
  close_time: string | null;
  summer_open_time: string | null;
  summer_close_time: string | null;
  max_vendors: number | null;
  property_management: string | null;
  active: boolean;
  booth_map_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 3. space_types
export interface SpaceType {
  id: string;
  location_id: string;
  name: string;
  slug: string;
  description: string | null;
  price_first_market: number | null;
  price_recurring: number | null;
  capacity: number | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 4. vendor_types
export interface VendorType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  base_price: number | null;
  requires_permits: boolean;
  active: boolean;
  created_at: string;
}

// 5. product_categories
export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  created_at: string;
}

// 6. musicians
export interface Musician {
  id: string;
  name: string;
  handle: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

// 7. vendors
export interface Vendor {
  id: string;
  user_id: string | null;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  vendor_type_id: string | null;
  product_categories: string[];
  social_instagram: string | null;
  social_facebook: string | null;
  social_website: string | null;
  status: VendorStatus;
  ban_reason: string | null;
  internal_notes: string | null;
  total_markets_attended: number;
  is_recurring: boolean;
  liability_insurance_url: string | null;
  liability_insurance_expires: string | null;
  food_manager_cert_url: string | null;
  food_manager_cert_expires: string | null;
  county_permit_url: string | null;
  county_permit_expires: string | null;
  created_at: string;
  updated_at: string;
}

// 8. market_events
export interface MarketEvent {
  id: string;
  location_id: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  theme: string | null;
  musician_id: string | null;
  vendor_capacity: number | null;
  status: EventStatus;
  vendor_map_url: string | null;
  vendor_map_published_at: string | null;
  raffle_prize_description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 9. applications
export interface Application {
  id: string;
  location_id: string;
  vendor_id: string | null;
  business_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  vendor_type_id: string | null;
  product_categories: string[];
  product_description: string | null;
  requested_space_type_id: string | null;
  booth_share_with_email: string | null;
  status: ApplicationStatus;
  reviewer_notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
  waiver_envelope_id: string | null;
  waiver_signed: boolean;
  waiver_document_url: string | null;
  waiver_signed_at: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

// 10. event_vendors
export interface EventVendor {
  id: string;
  event_id: string;
  vendor_id: string;
  space_type_id: string | null;
  booth_number: string | null;
  booth_x: number | null;
  booth_y: number | null;
  amount: number | null;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  attended: boolean | null;
  no_show: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 11. invoices
export interface Invoice {
  id: string;
  invoice_number: string | null;
  vendor_id: string;
  event_id: string | null;
  event_vendor_id: string | null;
  amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 12. sms_messages
export interface SmsMessage {
  id: string;
  twilio_sid: string | null;
  vendor_id: string | null;
  event_id: string | null;
  to_phone: string;
  from_phone: string | null;
  body: string;
  template_key: string | null;
  status: SmsStatus | string;
  error_message: string | null;
  sent_by: string | null;
  sent_at: string;
  delivered_at: string | null;
}

// 13. email_subscribers
export interface EmailSubscriber {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  location_id: string | null;
  source: string | null;
  raffle_entries: number;
  unsubscribed: boolean;
  unsubscribed_at: string | null;
  created_at: string;
}

// 14. email_campaigns
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  attachment_url: string | null;
  target_location_ids: string[];
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_by: string | null;
  created_at: string;
}

// 15. survey_responses
export interface SurveyResponse {
  id: string;
  event_id: string;
  vendor_id: string | null;
  rating: number | null;
  estimated_revenue: number | null;
  feedback: string | null;
  would_return: boolean | null;
  submitted_at: string;
}

// 16. category_caps
export interface CategoryCap {
  id: string;
  event_id: string;
  product_category_id: string;
  cap: number;
}

// 17. audit_log
export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Convenience map for any future generic helpers.
// Matches the supabase-js Database<{...}> shape loosely.
export interface Database {
  public: {
    Tables: {
      user_roles: { Row: UserRole; Insert: Partial<UserRole> & Pick<UserRole, "user_id" | "role">; Update: Partial<UserRole> };
      locations: { Row: Location; Insert: Partial<Location> & Pick<Location, "slug" | "name">; Update: Partial<Location> };
      space_types: { Row: SpaceType; Insert: Partial<SpaceType> & Pick<SpaceType, "location_id" | "name" | "slug">; Update: Partial<SpaceType> };
      vendor_types: { Row: VendorType; Insert: Partial<VendorType> & Pick<VendorType, "slug" | "name">; Update: Partial<VendorType> };
      product_categories: { Row: ProductCategory; Insert: Partial<ProductCategory> & Pick<ProductCategory, "slug" | "name">; Update: Partial<ProductCategory> };
      musicians: { Row: Musician; Insert: Partial<Musician> & Pick<Musician, "name">; Update: Partial<Musician> };
      vendors: { Row: Vendor; Insert: Partial<Vendor> & Pick<Vendor, "business_name">; Update: Partial<Vendor> };
      market_events: { Row: MarketEvent; Insert: Partial<MarketEvent> & Pick<MarketEvent, "location_id" | "event_date">; Update: Partial<MarketEvent> };
      applications: { Row: Application; Insert: Partial<Application> & Pick<Application, "location_id" | "business_name" | "email">; Update: Partial<Application> };
      event_vendors: { Row: EventVendor; Insert: Partial<EventVendor> & Pick<EventVendor, "event_id" | "vendor_id">; Update: Partial<EventVendor> };
      invoices: { Row: Invoice; Insert: Partial<Invoice> & Pick<Invoice, "vendor_id" | "amount">; Update: Partial<Invoice> };
      sms_messages: { Row: SmsMessage; Insert: Partial<SmsMessage> & Pick<SmsMessage, "to_phone" | "body">; Update: Partial<SmsMessage> };
      email_subscribers: { Row: EmailSubscriber; Insert: Partial<EmailSubscriber> & Pick<EmailSubscriber, "email">; Update: Partial<EmailSubscriber> };
      email_campaigns: { Row: EmailCampaign; Insert: Partial<EmailCampaign> & Pick<EmailCampaign, "name" | "subject">; Update: Partial<EmailCampaign> };
      survey_responses: { Row: SurveyResponse; Insert: Partial<SurveyResponse> & Pick<SurveyResponse, "event_id">; Update: Partial<SurveyResponse> };
      category_caps: { Row: CategoryCap; Insert: Partial<CategoryCap> & Pick<CategoryCap, "event_id" | "product_category_id" | "cap">; Update: Partial<CategoryCap> };
      audit_log: { Row: AuditLogEntry; Insert: Partial<AuditLogEntry> & Pick<AuditLogEntry, "action">; Update: Partial<AuditLogEntry> };
    };
  };
}
