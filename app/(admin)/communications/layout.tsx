// PROMPT 12 - Communications layout shell with tab nav.
// Tabs: SMS log (default), Email log, Compose.

import { CommsTab } from "./tab-link";

const TABS = [
  { href: "/admin/communications", label: "SMS log" },
  { href: "/admin/communications/email", label: "Email log" },
  { href: "/admin/communications/compose", label: "Compose" }
];

export default function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Communications</h1>
        <p className="text-sm text-muted-foreground">
          SMS and email history for vendor outreach. Compose drafts message bodies for review.
        </p>
      </div>

      <nav className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <CommsTab key={tab.href} href={tab.href} label={tab.label} />
        ))}
      </nav>

      <div>{children}</div>
    </div>
  );
}
