import type { Metadata } from "next";
import { requireStaff } from "@/lib/supabase/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { Breadcrumbs } from "@/components/admin/breadcrumbs";

export const metadata: Metadata = {
  title: "Move Mountains CRM",
  description: "Operations dashboard for the Move Mountains Artisan Market team."
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard. Redirects to /login if no session, or to /login?error=unauthorized
  // if the signed-in user has no admin or staff role.
  const session = await requireStaff();

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col">
        <Topbar email={session.email} role={session.role} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Breadcrumbs />
          <div className="mt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
