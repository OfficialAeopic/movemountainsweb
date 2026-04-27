// PROMPT 19 - Settings layout shell with tab navigation.

import { SettingsTab } from "./tab-link";

const TABS = [
  { href: "/admin/settings", label: "Business" },
  { href: "/admin/settings/brand", label: "Brand" },
  { href: "/admin/settings/locations", label: "Locations" },
  { href: "/admin/settings/vendor-types", label: "Vendor types" },
  { href: "/admin/settings/product-categories", label: "Product categories" },
  { href: "/admin/settings/category-caps", label: "Category caps" },
  { href: "/admin/settings/users", label: "Users" },
  { href: "/admin/settings/integrations", label: "Integrations" }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure business info, brand assets, and integration credentials. Edits require an admin
          role and are written to the audit log.
        </p>
      </div>

      <nav className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <SettingsTab key={tab.href} href={tab.href} label={tab.label} />
        ))}
      </nav>

      <div>{children}</div>
    </div>
  );
}
