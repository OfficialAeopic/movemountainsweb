"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SettingsTab({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isIndex = href === "/admin/settings";
  const isActive = isIndex ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={
        "px-4 py-2 -mb-px text-sm border-b-2 transition whitespace-nowrap " +
        (isActive
          ? "border-primary text-foreground font-medium"
          : "border-transparent text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </Link>
  );
}
