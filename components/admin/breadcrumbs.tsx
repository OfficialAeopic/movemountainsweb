"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";

const PRETTY_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  locations: "Locations",
  events: "Events",
  vendors: "Vendors",
  applications: "Applications",
  payments: "Payments",
  communications: "Communications",
  "email-lists": "Email Lists",
  maps: "Booth Maps",
  reports: "Reports",
  settings: "Settings"
};

function pretty(segment: string) {
  return PRETTY_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex items-center flex-wrap gap-1">
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          return (
            <Fragment key={href}>
              {index > 0 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
              {isLast ? (
                <span className="font-medium text-foreground">{pretty(segment)}</span>
              ) : (
                <Link href={href} className="hover:text-foreground">{pretty(segment)}</Link>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
