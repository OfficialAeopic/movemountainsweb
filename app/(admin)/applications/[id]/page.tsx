// PROMPT 10 - Application detail with approve / reject / waitlist actions.
// Approval creates an event_vendors row and an invoice. Category caps are
// checked against the target market_event before approval is allowed.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/database";
import {
  approveApplication,
  rejectApplication,
  waitlistApplication
} from "../actions";

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  approved: "bg-emerald-100 text-emerald-900 border-emerald-200",
  denied: "bg-rose-100 text-rose-900 border-rose-200",
  waitlist: "bg-sky-100 text-sky-900 border-sky-200",
  withdrawn: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

type Search = Promise<{ approve?: string; warn?: string }>;

export default async function ApplicationDetail({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("applications")
    .select(
      "*, locations(id, name, slug), vendor_types(name, slug, base_price), space_types:requested_space_type_id(name, price_first_market, price_recurring)"
    )
    .eq("id", id)
    .single();

  if (!app) return notFound();

  // Existing vendor match by email (loose match for the reviewer hint).
  const { data: existingVendor } = await supabase
    .from("vendors")
    .select("id, business_name, status, total_markets_attended, is_recurring")
    .eq("email", (app as any).email)
    .maybeSingle();

  // Upcoming events at this location for booth target selection.
  const today = new Date().toISOString().slice(0, 10);
  const { data: upcomingEvents } = await supabase
    .from("market_events")
    .select("id, event_date, status, vendor_capacity")
    .eq("location_id", (app as any).location_id)
    .gte("event_date", today)
    .in("status", ["scheduled", "live"])
    .order("event_date")
    .limit(12);

  // Category caps for the next event at this location, with current usage.
  const nextEventId = upcomingEvents?.[0]?.id ?? null;
  const capRows = await loadCategoryCaps(supabase, nextEventId, (app as any).product_categories ?? []);

  // Category names for display.
  const categoryIds: string[] = (app as any).product_categories ?? [];
  let categoryNames: { id: string; name: string }[] = [];
  if (categoryIds.length) {
    const { data: cats } = await supabase
      .from("product_categories")
      .select("id, name")
      .in("id", categoryIds);
    categoryNames = (cats as any) ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/applications?status=pending"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; All applications
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{(app as any).business_name}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted {formatDate((app as any).created_at)} for {(app as any).locations?.name ?? "Unknown"}
          </p>
        </div>
        <span
          className={
            "inline-flex items-center px-2.5 py-1 text-xs rounded-md border " +
            STATUS_BADGE[(app as any).status as ApplicationStatus]
          }
        >
          {(app as any).status}
        </span>
      </div>

      {sp.warn ? (
        <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-md p-3 text-sm">
          Approval was applied. Heads up: {decodeURIComponent(sp.warn)}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-card border rounded-lg p-6 lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Applicant</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Field label="Contact name">{(app as any).contact_name ?? "-"}</Field>
            <Field label="Email">{(app as any).email}</Field>
            <Field label="Phone">{(app as any).phone ?? "-"}</Field>
            <Field label="Vendor type">{(app as any).vendor_types?.name ?? "-"}</Field>
            <Field label="Requested space">
              {(app as any).space_types?.name ?? "-"}
              {(app as any).space_types?.price_first_market ? (
                <span className="block text-xs text-muted-foreground mt-0.5">
                  First market {formatCurrency((app as any).space_types.price_first_market)} / recurring{" "}
                  {(app as any).space_types.price_recurring
                    ? formatCurrency((app as any).space_types.price_recurring)
                    : "-"}
                </span>
              ) : null}
            </Field>
            <Field label="Booth share with">{(app as any).booth_share_with_email ?? "-"}</Field>
          </dl>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Product description</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{(app as any).product_description ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Categories</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {categoryNames.length === 0 ? (
                <span className="text-sm text-muted-foreground">None listed</span>
              ) : (
                categoryNames.map((c) => (
                  <span key={c.id} className="text-xs px-2 py-0.5 rounded border bg-muted/50">
                    {c.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {existingVendor ? (
            <div className="border-l-4 border-sky-400 bg-sky-50 text-sky-900 rounded-r p-3 text-sm">
              Possible existing vendor match:{" "}
              <Link
                href={"/admin/vendors/" + existingVendor.id}
                className="font-medium underline"
              >
                {existingVendor.business_name}
              </Link>{" "}
              ({existingVendor.status}, {existingVendor.total_markets_attended} markets attended).
              Approval will link this application to that vendor record.
            </div>
          ) : (
            <div className="border-l-4 border-zinc-300 bg-muted/40 rounded-r p-3 text-xs text-muted-foreground">
              No existing vendor matches this email. Approval will create a new vendor record.
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="bg-card border rounded-lg p-6 space-y-3">
            <h2 className="text-lg font-semibold">Category cap check</h2>
            {!nextEventId ? (
              <p className="text-sm text-muted-foreground">
                No upcoming events configured at this location. Approval will not be blocked, but no
                booth assignment can be made until an event exists.
              </p>
            ) : capRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No category caps set on the next event ({upcomingEvents?.[0]?.event_date}).
                Approval is unrestricted.
              </p>
            ) : (
              <ul className="space-y-2">
                {capRows.map((c) => (
                  <li key={c.product_category_id} className="text-sm flex items-center justify-between">
                    <span>{c.name}</span>
                    <span
                      className={
                        c.current >= c.cap
                          ? "text-rose-700 font-medium"
                          : c.current + 1 >= c.cap
                          ? "text-amber-700"
                          : "text-muted-foreground"
                      }
                    >
                      {c.current} / {c.cap}
                    </span>
                  </li>
                ))}
                {capRows.some((c) => c.current >= c.cap) && (
                  <li className="text-xs text-rose-700 pt-2 border-t">
                    At least one requested category is at cap. Approval will still proceed but a
                    warning is recorded.
                  </li>
                )}
              </ul>
            )}
          </div>

          {(app as any).status === "pending" ? (
            <div className="bg-card border rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-semibold">Actions</h2>
              <ApproveForm
                applicationId={(app as any).id}
                events={upcomingEvents ?? []}
                defaultAmount={
                  (app as any).space_types?.price_first_market ??
                  (app as any).vendor_types?.base_price ??
                  null
                }
              />

              <form action={waitlistApplication}>
                <input type="hidden" name="id" value={(app as any).id} />
                <button
                  type="submit"
                  className="w-full text-sm py-2 rounded-md border hover:bg-sky-50 hover:border-sky-300"
                >
                  Move to waitlist
                </button>
              </form>

              <details className="border rounded-md">
                <summary className="cursor-pointer text-sm font-medium px-3 py-2 hover:bg-muted/40">
                  Reject application
                </summary>
                <form action={rejectApplication} className="p-3 space-y-2">
                  <input type="hidden" name="id" value={(app as any).id} />
                  <textarea
                    name="reason"
                    required
                    placeholder="Reason shared with applicant (optional but recommended)"
                    className="w-full text-sm border rounded-md p-2 min-h-[80px]"
                  />
                  <button
                    type="submit"
                    className="w-full text-sm py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Confirm rejection
                  </button>
                </form>
              </details>
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-6 text-sm text-muted-foreground">
              <p>
                This application was decided on{" "}
                {(app as any).decided_at ? formatDate((app as any).decided_at) : "an earlier date"}.
              </p>
              {(app as any).reviewer_notes ? (
                <p className="mt-2 whitespace-pre-wrap">{(app as any).reviewer_notes}</p>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function ApproveForm({
  applicationId,
  events,
  defaultAmount
}: {
  applicationId: string;
  events: { id: string; event_date: string; status: string; vendor_capacity: number | null }[];
  defaultAmount: number | null;
}) {
  return (
    <form action={approveApplication} className="space-y-2">
      <input type="hidden" name="id" value={applicationId} />
      <label className="block text-xs font-medium uppercase text-muted-foreground">Assign to event</label>
      <select
        name="event_id"
        required
        className="w-full text-sm border rounded-md px-2 py-1.5 bg-card"
        defaultValue={events[0]?.id ?? ""}
      >
        {events.length === 0 ? (
          <option value="">No upcoming events configured</option>
        ) : (
          events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.event_date} ({e.status})
            </option>
          ))
        )}
      </select>

      <label className="block text-xs font-medium uppercase text-muted-foreground mt-2">Booth fee</label>
      <input
        name="amount"
        type="number"
        min={0}
        step="0.01"
        defaultValue={defaultAmount ?? ""}
        required
        className="w-full text-sm border rounded-md px-2 py-1.5"
      />

      <label className="block text-xs font-medium uppercase text-muted-foreground mt-2">
        Booth number (optional)
      </label>
      <input name="booth_number" className="w-full text-sm border rounded-md px-2 py-1.5" />

      <button
        type="submit"
        disabled={events.length === 0}
        className="w-full text-sm py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-zinc-400 disabled:cursor-not-allowed"
      >
        Approve and create invoice
      </button>
      <p className="text-[11px] text-muted-foreground">
        Creates an event_vendors row, generates an invoice, and (when integrations land) queues the
        approval email and waiver envelope.
      </p>
    </form>
  );
}

// Loads the cap rows for the categories the applicant requested at a single event,
// alongside the current count of approved event_vendors that share each category.
async function loadCategoryCaps(
  supabase: any,
  eventId: string | null,
  requestedCategoryIds: string[]
): Promise<{ product_category_id: string; name: string; cap: number; current: number }[]> {
  if (!eventId || requestedCategoryIds.length === 0) return [];

  const { data: caps } = await supabase
    .from("category_caps")
    .select("product_category_id, cap, product_categories(name)")
    .eq("event_id", eventId)
    .in("product_category_id", requestedCategoryIds);

  if (!caps || caps.length === 0) return [];

  // Sum up current usage by counting approved event_vendors that share categories
  // with this event. Pull all vendors assigned to this event and count categories.
  const { data: assigned } = await supabase
    .from("event_vendors")
    .select("vendor_id, vendors(product_categories)")
    .eq("event_id", eventId);

  const counts = new Map<string, number>();
  for (const row of assigned ?? []) {
    const cats: string[] = (row as any).vendors?.product_categories ?? [];
    for (const cat of cats) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  return caps.map((c: any) => ({
    product_category_id: c.product_category_id,
    name: c.product_categories?.name ?? "Unknown",
    cap: c.cap,
    current: counts.get(c.product_category_id) ?? 0
  }));
}

