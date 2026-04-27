"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export type LoginFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok" };

/**
 * Server action for admin and staff sign in.
 * Validates inputs server side, calls Supabase, and redirects on success.
 * Returns a serializable state object on failure so the client form can render the error.
 */
export async function signInAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: "Invalid email or password." };
  }

  // Verify that this user has an admin or staff role assigned.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sign in succeeded but no user was returned." };
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!roleRow || (roleRow.role !== "admin" && roleRow.role !== "staff")) {
    await supabase.auth.signOut();
    return { status: "error", message: "Your account is not authorized for the CRM." };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
