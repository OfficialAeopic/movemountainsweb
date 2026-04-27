"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CommsTab({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/admin/communications" && pathname.startsWith(href));
  // Special case: SMS log lives at the index. Only show active when exact match.
  const isIndex = href === "/admin/communications";
  const isActive = isIndex ? pathname === href : active;
  return (
    <Link
      href={href}
      className={
        "px-4 py-2 -mb-px text-sm border-b-2 transition " +
        (isActive
          ? "border-primary text-foreground font-medium"
          : "border-transparent text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </Link>
  );
}
