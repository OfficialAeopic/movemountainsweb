// PROMPT 12 - Communications: Email campaign log.

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { CampaignStatus } from "@/types/database";

const STATUS_BADGE: Record<CampaignStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200",
  scheduled: "bg-sky-100 text-sky-900 border-sky-200",
  sending: "bg-amber-100 text-amber-900 border-amber-200",
  sent: "bg-emerald-100 text-emerald-900 border-emerald-200",
  failed: "bg-rose-100 text-rose-900 border-rose-200"
};

export default async function EmailLog() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("email_campaigns")
    .select(
      "id, name, subject, status, scheduled_at, sent_at, recipient_count, open_count, click_count, target_location_ids, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Name</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Subject</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Sent</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Recipients</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Opens</th>
            <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Clicks</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(rows ?? []).map((row: any) => (
            <tr key={row.id} className="hover:bg-muted/40">
              <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{row.subject}</td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={
                    "inline-flex items-center px-2 py-0.5 text-xs rounded-md border " +
                    (STATUS_BADGE[row.status as CampaignStatus] ?? STATUS_BADGE.draft)
                  }
                >
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {row.sent_at ? formatDate(row.sent_at) : row.scheduled_at ? "scheduled " + formatDate(row.scheduled_at) : "-"}
              </td>
              <td className="px-4 py-3 text-sm">{row.recipient_count ?? 0}</td>
              <td className="px-4 py-3 text-sm">{row.open_count ?? 0}</td>
              <td className="px-4 py-3 text-sm">{row.click_count ?? 0}</td>
            </tr>
          ))}
          {(!rows || rows.length === 0) && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                No campaigns on record. Drafted campaigns appear here once they are saved.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
