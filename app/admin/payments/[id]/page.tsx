// PROMPT 11 - Invoice detail page with mark-paid and send-reminder actions.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/database";
import { markInvoicePaid, sendInvoiceReminder, cancelInvoice } from "../actions";

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  unpaid: "bg-amber-100 text-amber-900 border-amber-200",
  paid: "bg-emerald-100 text-emerald-900 border-emerald-200",
  overdue: "bg-rose-100 text-rose-900 border-rose-200",
  cancelled: "bg-zinc-100 text-zinc-700 border-zinc-200",
  refunded: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

const PAYMENT_METHODS = ["Zelle", "Venmo", "CashApp", "Apple Pay", "Cash", "Check", "Other"];

type Search = Promise<{ paid?: string; reminder?: string; error?: string }>;

export default async function InvoiceDetail({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: inv } = await supabase
    .from("invoices")
    .select(
      "*, vendors(id, business_name, contact_name, email, phone), market_events:event_id(id, event_date, locations(name, slug)), event_vendors:event_vendor_id(booth_number, space_type_id, space_types(name, price_first_market, price_recurring))"
    )
    .eq("id", id)
    .single();

  if (!inv) return notFound();

  const today = new Date().toISOString().slice(0, 10);
  const overdue = (inv as any).status === "unpaid" && (inv as any).due_date && (inv as any).due_date < today;
  const displayStatus: InvoiceStatus = overdue ? "overdue" : ((inv as any).status as InvoiceStatus);

  const lineDescription =
    (inv as any).market_events && (inv as any).event_vendors
      ? `${(inv as any).event_vendors.space_types?.name ?? "Booth"} at ${(inv as any).market_events.locations?.name ?? "market"} on ${(inv as any).market_events.event_date}`
      : (inv as any).notes ?? "Booth fee";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/payments?status=unpaid" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; All invoices
          </Link>
          <h1 className="text-2xl font-semibold mt-1">
            {(inv as any).invoice_number ?? "Invoice " + (inv as any).id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Issued {formatDate((inv as any).created_at)}
            {(inv as any).due_date ? " · Due " + formatDate((inv as any).due_date) : ""}
          </p>
        </div>
        <span
          className={
            "inline-flex items-center px-2.5 py-1 text-xs rounded-md border " +
            STATUS_BADGE[displayStatus]
          }
        >
          {displayStatus}
        </span>
      </div>

      {sp.paid ? (
        <div className="border border-emerald-300 bg-emerald-50 text-emerald-900 rounded-md p-3 text-sm">
          Payment recorded.
        </div>
      ) : null}
      {sp.reminder ? (
        <div className="border border-sky-300 bg-sky-50 text-sky-900 rounded-md p-3 text-sm">
          Reminder queued for delivery.
        </div>
      ) : null}
      {sp.error ? (
        <div className="border border-rose-300 bg-rose-50 text-rose-900 rounded-md p-3 text-sm">
          {decodeURIComponent(sp.error)}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-card border rounded-lg p-6 lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Line items</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-3">{lineDescription}</td>
                  <td className="py-3 text-right">{formatCurrency((inv as any).amount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td className="py-3 text-right font-medium">Total</td>
                  <td className="py-3 text-right font-semibold">{formatCurrency((inv as any).amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {(inv as any).status === "paid" ? (
            <div className="border-l-4 border-emerald-400 bg-emerald-50 rounded-r p-3 text-sm">
              <p className="font-medium text-emerald-900">Paid</p>
              <p className="text-emerald-800 text-xs mt-1">
                {(inv as any).paid_date ? formatDate((inv as any).paid_date) : "-"}
                {(inv as any).payment_method ? " · " + (inv as any).payment_method : ""}
                {(inv as any).payment_reference ? " · ref " + (inv as any).payment_reference : ""}
              </p>
            </div>
          ) : null}

          {(inv as any).notes ? (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Notes</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{(inv as any).notes}</p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold">Vendor</h2>
            <div className="mt-2 text-sm">
              <p className="font-medium">{(inv as any).vendors?.business_name}</p>
              <p className="text-muted-foreground">{(inv as any).vendors?.contact_name ?? ""}</p>
              <p className="mt-2">
                {(inv as any).vendors?.email ? (
                  <a href={"mailto:" + (inv as any).vendors.email} className="text-primary hover:underline">
                    {(inv as any).vendors.email}
                  </a>
                ) : null}
              </p>
              <p>
                {(inv as any).vendors?.phone ? (
                  <a href={"tel:" + (inv as any).vendors.phone} className="text-primary hover:underline">
                    {(inv as any).vendors.phone}
                  </a>
                ) : null}
              </p>
              {(inv as any).vendors?.id ? (
                <Link
                  href={"/admin/vendors/" + (inv as any).vendors.id}
                  className="block mt-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  View vendor profile &rarr;
                </Link>
              ) : null}
            </div>
          </div>

          {(inv as any).status === "unpaid" ? (
            <>
              <div className="bg-card border rounded-lg p-6 space-y-3">
                <h2 className="text-lg font-semibold">Mark as paid</h2>
                <form action={markInvoicePaid} className="space-y-2">
                  <input type="hidden" name="id" value={(inv as any).id} />
                  <label className="block text-xs font-medium uppercase text-muted-foreground">
                    Payment method
                  </label>
                  <select
                    name="payment_method"
                    required
                    defaultValue="Zelle"
                    className="w-full text-sm border rounded-md px-2 py-1.5 bg-card"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <label className="block text-xs font-medium uppercase text-muted-foreground mt-2">
                    Reference (optional)
                  </label>
                  <input
                    name="payment_reference"
                    placeholder="Transaction ID or note"
                    className="w-full text-sm border rounded-md px-2 py-1.5"
                  />
                  <label className="block text-xs font-medium uppercase text-muted-foreground mt-2">
                    Paid on
                  </label>
                  <input
                    name="paid_date"
                    type="date"
                    defaultValue={today}
                    className="w-full text-sm border rounded-md px-2 py-1.5"
                  />
                  <button
                    type="submit"
                    className="w-full text-sm py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 mt-2"
                  >
                    Confirm payment
                  </button>
                </form>
              </div>

              <form action={sendInvoiceReminder}>
                <input type="hidden" name="id" value={(inv as any).id} />
                <button
                  type="submit"
                  className="w-full text-sm py-2 rounded-md border bg-card hover:bg-accent"
                >
                  Send payment reminder
                </button>
              </form>

              <form action={cancelInvoice}>
                <input type="hidden" name="id" value={(inv as any).id} />
                <button
                  type="submit"
                  className="w-full text-sm py-2 rounded-md border text-rose-700 hover:bg-rose-50"
                >
                  Cancel invoice
                </button>
              </form>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
