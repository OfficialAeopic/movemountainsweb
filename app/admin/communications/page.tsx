// PROMPT 12 - Communications: SMS log (default tab).

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  queued: "bg-zinc-100 text-zinc-700 border-zinc-200",
  sent: "bg-sky-100 text-sky-900 border-sky-200",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-200",
  failed: "bg-rose-100 text-rose-900 border-rose-200",
  undelivered: "bg-rose-100 text-rose-900 border-rose-200"
};

export default async function SmsLog() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("sms_messages")
    .select(
      "id, to_phone, body, template_key, status, sent_at, delivered_at, vendor_id, vendors(business_name)"
    )
    .order("sent_at", { ascending: false })
    .limit(200);

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Sent</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Vendor</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">To</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Template</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Body</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(rows ?? []).map((row: any) => (
            <tr key={row.id} className="hover:bg-muted/40 align-top">
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(row.sent_at)}
              </td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">
                {row.vendors?.business_name ?? "-"}
              </td>
              <td className="px-4 py-3 text-sm font-mono">{row.to_phone}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {row.template_key ?? "custom"}
              </td>
              <td className="px-4 py-3 text-sm max-w-md">{row.body}</td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={
                    "inline-flex items-center px-2 py-0.5 text-xs rounded-md border " +
                    (STATUS_BADGE[row.status] ?? STATUS_BADGE.queued)
                  }
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
          {(!rows || rows.length === 0) && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                No SMS messages on record. Approving applications and sending payment reminders will
                populate this log.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
