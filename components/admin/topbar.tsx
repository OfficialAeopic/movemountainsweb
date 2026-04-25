"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Topbar({ user, role }: { user: { email?: string }; role: string | null }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4">
      <div className="text-sm text-muted-foreground">Welcome back</div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{user.email}</p>
          <p className="text-xs text-muted-foreground">{role ?? "no role"}</p>
        </div>
        <button onClick={signOut} className="text-sm px-3 py-1 border rounded-md hover:bg-accent">Sign out</button>
      </div>
    </header>
  );
}
