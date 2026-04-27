import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in - Move Mountains CRM",
  description: "Admin and staff sign in for the Move Mountains Artisan Market operations dashboard."
};

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (session && (session.role === "admin" || session.role === "staff")) {
    redirect("/admin");
  }

  const params = await searchParams;
  const initialError = params.error === "unauthorized"
    ? "Your account does not have CRM access. Contact an administrator."
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm bg-card border rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Move Mountains CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your operations dashboard.</p>
        </div>
        <LoginForm initialError={initialError} />
        <p className="text-xs text-muted-foreground mt-6">
          Vendors do not sign in here. The vendor portal launches in a later phase.
        </p>
      </div>
    </div>
  );
}
