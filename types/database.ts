// types/database.ts
// Database types for Move Mountains CRM. Hand-rolled v1.
// Regenerate later via: npx supabase gen types typescript --local > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface UserRole {
  user_id: string;
  role: "admin" | "staff" | "vendor";
  created_at: string;
  updated_at: string;
}

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

export interface VendorType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  base_price: number | null;
  requires_permits: boolean;
  active: boolean;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  active: boolean;
}

export interface Musician {
  id: string;
  name: string;
  handle: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
}

export type ApplicationStatus = "pending" | "approved" | "denied" | "waitlist" | "withdrawn";
export type EventStatus = "scheduled" | "live" | "complete" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "comped" | "refunded";
export type InvoiceStatus = "unpaid" | "paid" | "overdue" | "cancelled" | "refunded";
export type VendorStatus = "active" | "inactive" | "banned" | "pending";
