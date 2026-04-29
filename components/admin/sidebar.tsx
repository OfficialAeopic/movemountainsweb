"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MapPin, Calendar, Users, ClipboardList, DollarSign, MessageSquare, Mail, Map, BarChart3, Settings, HeartHandshake, Music, Briefcase, Inbox } from "lucide-react";

type Item = { href: string; label: string; icon: any };
const items: Item[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/vendors", label: "Vendors", icon: Users },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/volunteers", label: "Volunteers", icon: HeartHandshake },
  { href: "/admin/musicians", label: "Musicians", icon: Music },
  { href: "/admin/employment", label: "Employment", icon: Briefcase },
  { href: "/admin/payments", label: "Payments", icon: DollarSign },
  { href: "/admin/communications", label: "Communications", icon: MessageSquare },
  { href: "/admin/email-lists", label: "Email Lists", icon: Mail },
  { href: "/admin/contact-messages", label: "Contact Messages", icon: Inbox },
  { href: "/admin/maps", label: "Booth Maps", icon: Map },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function Sidebar({ role }: { role: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <p className="font-semibold text-sm">Move Mountains</p>
        <p className="text-xs text-muted-foreground">CRM {role ? "· " + role : ""}</p>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href} className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent", active && "bg-accent font-medium")}>
              <Icon className="h-4 w-4" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
