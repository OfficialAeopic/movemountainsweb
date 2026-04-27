"use client";

import { signOutAction } from "@/app/(auth)/login/actions";
import { Search } from "lucide-react";

interface TopbarProps {
  email: string | null;
  role: string | null;
}

export function Topbar({ email, role }: TopbarProps) {
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/60 rounded-md text-sm text-muted-foreground w-full">
          <Search className="h-4 w-4" />
          <span>Search vendors, events, or invoices...</span>
          <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Cmd K
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{email ?? "unknown"}</p>
          <p className="text-xs text-muted-foreground capitalize">{role ?? "no role"}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm px-3 py-1 border rounded-md hover:bg-accent"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
