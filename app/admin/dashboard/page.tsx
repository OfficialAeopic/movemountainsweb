import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Move Mountains CRM"
};

// Placeholder dashboard scaffold for Prompt 5 acceptance.
// The fully wired dashboard with live counts lives at /admin (the index route).
// This page is reserved for the next iteration when richer widgets land.
export default function DashboardPlaceholder() {
  const cards = [
    { title: "Upcoming Markets", hint: "Next 30 days, scheduled or live." },
    { title: "Pending Applications", hint: "Vendor submissions awaiting review." },
    { title: "Outstanding Payments", hint: "Unpaid or overdue invoices." },
    { title: "Active Vendors", hint: "Vendors flagged as active in the directory." }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          High-level operational view for the Move Mountains team.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="text-3xl font-semibold mt-1">0</p>
            <p className="text-xs text-muted-foreground mt-2">{card.hint}</p>
          </div>
        ))}
      </div>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold">Activity Feed</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Recent applications, payments, signed waivers, and survey responses surface here.
        </p>
        <div className="mt-4 border border-dashed rounded-md p-8 text-center text-sm text-muted-foreground">
          No activity recorded yet.
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold">Alerts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overdue invoices, missing booth maps, and expiring food vendor documents appear here.
        </p>
        <div className="mt-4 border border-dashed rounded-md p-8 text-center text-sm text-muted-foreground">
          All clear.
        </div>
      </section>
    </div>
  );
}
