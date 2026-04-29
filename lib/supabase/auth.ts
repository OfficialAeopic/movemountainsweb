// lib/supabase/auth.ts
// Auth helpers shared by server components, server actions, and route handlers.
// Admin and staff sign in with email + password. Vendor portal uses magic link.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "staff" | "vendor";

export interface SessionContext {
  userId: string;
  email: string | null;
  role: AppRole | null;
}

/**
 * Returns the active session context, or null if the visitor is anonymous.
 * Reads the auth cookie via the server Supabase client.
 */
export async function getServerSession(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: (roleRow?.role as AppRole | undefined) ?? null
  };
}

/**
 * Server-side guard. Use at the top of admin pages or server actions.
 * Redirects to /admin/login if the user is not signed in or lacks the role.
 */
export async function requireRole(allowed: AppRole[]): Promise<SessionContext> {
  const session = await getServerSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (!session.role || !allowed.includes(session.role)) {
    redirect("/admin/login?error=unauthorized");
  }
  return session;
}

/**
 * Convenience: admin or staff only. Used for the entire (admin) route group.
 */
export async function requireStaff(): Promise<SessionContext> {
  return requireRole(["admin", "staff"]);
}

/**
 * Convenience: admin only. Used for destructive or settings actions.
 */
export async function requireAdmin(): Promise<SessionContext> {
  return requireRole(["admin"]);
}

/**
 * Vendor magic-link request. Used by the future vendor portal sign-in flow.
 * Email is the only input. Supabase emails the link.
 * Returns null on success, an error message on failure.
 */
export async function requestVendorMagicLink(email: string, redirectTo: string): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: false }
  });
  return error ? error.message : null;
}
