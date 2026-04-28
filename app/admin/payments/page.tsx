// PROMPT 11 - Payments / invoices list.
// Manual payment tracking per blueprint: "Manual marking in CRM, no API integration".
// Filter tabs: unpaid, paid, overdue, all. Click row to detail view.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/database";

const TABS: { key: InvoiceStatus | "all"; label: string }[] = [
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
  { key: "all", label: "All" }
];

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  unpaid: "bg-amber-100 text-amber-900 border-amber-200",
  paid: "bg-emerald-100 text-emerald-900 border-emerald-200",
  overdue: "bg-rose-100 text-rose-900 border-rose-200",
  cancelled: "bg-zinc-100 text-zinc-700 border-zinc-200",
  refunded: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

type Search = Promise<{ status?: string }>;

export default async function PaymentsList({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const status = (sp.status as InvoiceStatus | "all" | undefined) ?? "unpaid";

  const supabase = await createClient();

  // Promote any unpaid invoice past its due date to "overdue" for display purposes
  // by handling it in the query. The status column itself is only flipped when
  // the admin chooses to (see send-reminder action below) or via a future cron.
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, amount, status, due_date, paid_date, vendor_id, vendors(business_name, phone, email), market_events:event_id(event_date, locations(name))"
    )
    .order("due_date", { ascending: true, nullsFirst: false });

  if (status === "overdue") {
    query = query.eq("status", "unpaid").lt("due_date", today);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  const [{ data: invoices }, totals] = await Promise.all([
    query,
    loadTotals(supabase, today)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Manual invoice tracking. Mark paid when funds clear via Zelle, Venmo, CashApp, or Apple Pay.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Outstanding" value={formatCurrency(totals.outstandingAmount)} hint={`${totals.outstandingCount} unpaid`} />
        <Stat
          label="Overdue"
          value={formatCurrency(totals.overdueAmount)}
          hint={`${totals.overdueCount} past due`}
          tone={totals.overdueCount > 0 ? "warn" : undefined}
        />
        <Stat label="Collected (30d)" value={formatCurrency(totals.collected30dAmount)} hint={`${totals.collected30dCount} paid`} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {TABS.map((tab) => {
          const active = tab.key === status;
          const href = "/admin/payments?status=" + tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={
                "px-3 py-1.5 text-sm rounded-md border transition " +
                (active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-accent border-transparent")
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Invoice</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Vendor</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Event</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Amount</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Due</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(invoices ?? []).map((inv: any) => {
              const overdue =
                inv.status === "unpaid" && inv.due_date && inv.due_date < today;
              const displayStatus: InvoiceStatus = overdue ? "overdue" : inv.status;
              return (
                <tr key={inv.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={"/admin/payments/" + inv.id}
                      className="font-medium text-primary hover:underline"
                    >
                      {inv.invoice_number ?? inv.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {inv.vendors?.business_name ?? "-"}
                    <div className="text-xs text-muted-foreground">{inv.vendors?.email ?? inv.vendors?.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {inv.market_events ? inv.market_events.event_date + " - " + inv.market_events.locations?.name : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {inv.due_date ? formatDate(inv.due_date) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={
                        "inline-flex items-center px-2 py-0.5 text-xs rounded-md border " +
                        STATUS_BADGE[displayStatus]
                      }
                    >
                      {displayStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!invoices || invoices.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No invoices match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "warn";
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={
          "text-2xl font-semibold mt-1 " + (tone === "warn" ? "text-rose-700" : "")
        }
      >
        {value}
      </p>
      {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}

async function loadTotals(
  supabase: any,
  today: string
): Promise<{
  outstandingAmount: number;
  outstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
  collected30dAmount: number;
  collected30dCount: number;
}> {
  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const thirtyAgoIso = thirtyAgo.toISOString().slice(0, 10);

  const [{ data: unpaid }, { data: overdue }, { data: paid }] = await Promise.all([
    supabase.from("invoices").select("amount").eq("status", "unpaid"),
    supabase.from("invoices").select("amount").eq("status", "unpaid").lt("due_date", today),
    supabase.from("invoices").select("amount").eq("status", "paid").gte("paid_date", thirtyAgoIso)
  ]);

  const sum = (rows: any[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.amount ?? 0), 0);

  return {
    outstandingAmount: sum(unpaid),
    outstandingCount: unpaid?.length ?? 0,
    overdueAmount: sum(overdue),
    overdueCount: overdue?.length ?? 0,
    collected30dAmount: sum(paid),
    collected30dCount: paid?.length ?? 0
  };
}
