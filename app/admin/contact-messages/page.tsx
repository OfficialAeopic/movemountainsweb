// /admin/contact-messages -- list view for the contact_messages table.
// Status filter via ?status=, search via ?q=. Mirrors /admin/volunteers style.

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type MessageStatus = "new" | "responded" | "archived";

const STATUS_TABS: { key: MessageStatus | "all"; label: string }[] = [
  { key: "new", label: "New" },
  { key: "responded", label: "Responded" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" }
];

const STATUS_BADGE: Record<MessageStatus, string> = {
  new: "bg-amber-100 text-amber-900 border-amber-200",
  responded: "bg-emerald-100 text-emerald-900 border-emerald-200",
  archived: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

const INQUIRY_BADGE: Record<string, string> = {
  vendor: "bg-violet-100 text-violet-900 border-violet-200",
  shopper: "bg-sky-100 text-sky-900 border-sky-200",
  partnership: "bg-rose-100 text-rose-900 border-rose-200",
  general: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

type Search = Promise<{ status?: string; q?: string }>;

export default async function ContactMessagesList({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const status = (params.status as MessageStatus | "all" | undefined) ?? "new";
  const q = (params.q ?? "").trim();

  const supabase = createAdminClient();

  let query = supabase
    .from("contact_messages" as any)
    .select("id, first_name, last_name, email, phone, inquiry_type, message, status, created_at")
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (q.length) {
    const like = `%${q.replace(/%/g, "")}%`;
    query = query.or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`);
  }

  const { data: rows } = await query;
  const list: any[] = (rows ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">
          Inbound contact form submissions. Respond within 2-3 business days per the page promise.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {STATUS_TABS.map((tab) => {
          const href = `/admin/contact-messages${tab.key === "new" ? "" : `?status=${tab.key}`}${q ? `${tab.key === "new" ? "?" : "&"}q=${encodeURIComponent(q)}` : ""}`;
          const active = (status === tab.key) || (status === "new" && tab.key === "new");
          return (
            <Link
              key={tab.key}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}
            >
              {tab.label}
            </Link>
          );
        })}

        <form className="ml-auto flex items-center gap-2" action="/admin/contact-messages" method="get">
          {status !== "new" && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Name or email..."
            className="px-3 py-1.5 rounded-md text-sm border bg-background w-56"
          />
          <button type="submit" className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground">
            Search
          </button>
        </form>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Received</th>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Inquiry</th>
              <th className="text-left px-4 py-2 font-medium">Message</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {q ? `No messages match "${q}".` : `No ${status === "all" ? "" : status} messages yet.`}
                </td>
              </tr>
            ) : (
              list.map((m) => {
                const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ");
                const excerpt = (m.message || "").slice(0, 120) + ((m.message || "").length > 120 ? "..." : "");
                const inquiry = (m.inquiry_type || "general").toLowerCase();
                return (
                  <tr key={m.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-2 font-medium">{fullName || "(no name)"}</td>
                    <td className="px-4 py-2"><a href={`mailto:${m.email}`} className="text-primary underline">{m.email}</a></td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${INQUIRY_BADGE[inquiry] || INQUIRY_BADGE.general}`}>
                        {inquiry}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground max-w-md">{excerpt}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[m.status as MessageStatus] || STATUS_BADGE.new}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {list.length} {list.length === 1 ? "message" : "messages"} shown. Detail view coming in Phase 2.
      </p>
    </div>
  );
}
