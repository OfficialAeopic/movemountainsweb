// PROMPT 12 - Communications: Compose page.
// Drafts a message but does not send. Sending integration lands in prompts 13/14.
// Channel toggle: SMS draft (writes a queued sms_messages row keyed to a vendor)
// or Email draft (writes an email_campaigns row in draft status).

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { saveSmsDraft, saveEmailDraft } from "../actions";

type Search = Promise<{ saved?: string; channel?: string; error?: string }>;

export default async function ComposePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: locations }, { data: vendors }, { data: recentDrafts }] = await Promise.all([
    supabase.from("locations").select("id, name").eq("active", true).order("name"),
    supabase
      .from("vendors")
      .select("id, business_name, phone")
      .eq("status", "active")
      .order("business_name")
      .limit(500),
    supabase
      .from("email_campaigns")
      .select("id, name, subject, status, created_at")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {sp.saved ? (
          <div className="border border-emerald-300 bg-emerald-50 text-emerald-900 rounded-md p-3 text-sm">
            Draft saved as {sp.channel === "email" ? "an email campaign" : "a queued SMS"}. Sending
            ships in the next build prompt.
          </div>
        ) : null}
        {sp.error ? (
          <div className="border border-rose-300 bg-rose-50 text-rose-900 rounded-md p-3 text-sm">
            {decodeURIComponent(sp.error)}
          </div>
        ) : null}

        <section className="bg-card border rounded-lg p-6 space-y-4">
          <header>
            <h2 className="text-lg font-semibold">SMS draft</h2>
            <p className="text-xs text-muted-foreground">
              Stored to the SMS log with status &quot;queued&quot;. Twilio dispatch is wired in
              prompt 13.
            </p>
          </header>
          <form action={saveSmsDraft} className="space-y-3">
            <div>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Recipient vendor
              </label>
              <select
                name="vendor_id"
                required
                className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1"
              >
                <option value="">Select a vendor...</option>
                {(vendors ?? []).map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.business_name}
                    {v.phone ? " (" + v.phone + ")" : " (no phone)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Template
              </label>
              <select
                name="template_key"
                defaultValue="custom"
                className="w-full text-sm border rounded-md px-2 py-1.5 bg-card mt-1"
              >
                <option value="custom">Custom message</option>
                <option value="payment_reminder_24h">Payment reminder (24 hour)</option>
                <option value="payment_reminder_tuesday">Recurring payment reminder (Tuesday)</option>
                <option value="map_posted">Map posted notification</option>
                <option value="survey_request">Post-market survey</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Message body
              </label>
              <textarea
                name="body"
                required
                maxLength={1600}
                placeholder="Type the SMS body. Keep it under 160 characters per segment."
                className="w-full text-sm border rounded-md p-2 mt-1 min-h-[120px] font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Twilio segments at 160 GSM characters. Each emoji or accent counts more.
              </p>
            </div>
            <button
              type="submit"
              className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90"
            >
              Save SMS draft
            </button>
          </form>
        </section>

        <section className="bg-card border rounded-lg p-6 space-y-4">
          <header>
            <h2 className="text-lg font-semibold">Email campaign draft</h2>
            <p className="text-xs text-muted-foreground">
              Stored as a draft campaign. Resend dispatch and rich text editor land in prompt 14.
            </p>
          </header>
          <form action={saveEmailDraft} className="space-y-3">
            <div>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Internal name
              </label>
              <input
                name="name"
                required
                placeholder="May 2026 Easton Park - Vendor map ready"
                className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Subject
              </label>
              <input
                name="subject"
                required
                placeholder="Your vendor map for Easton Park is ready"
                className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Target locations
              </label>
              <select
                name="target_location_ids"
                multiple
                size={Math.min(6, (locations?.length ?? 0) + 1)}
                className="w-full text-sm border rounded-md px-2 py-1.5 mt-1 bg-card"
              >
                {(locations ?? []).map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Hold Ctrl or Cmd to select multiple. Leave empty to target all subscribers.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Plain text body
              </label>
              <textarea
                name="body_text"
                required
                placeholder="Write the plain text version. Rich HTML editor lands in prompt 14."
                className="w-full text-sm border rounded-md p-2 mt-1 min-h-[160px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase text-muted-foreground">
                Attachment URL (optional)
              </label>
              <input
                name="attachment_url"
                placeholder="https://... (flyer or map PDF in Supabase Storage)"
                className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
              />
            </div>
            <button
              type="submit"
              className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90"
            >
              Save email draft
            </button>
          </form>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold">Recent drafts</h2>
          <ul className="mt-3 divide-y">
            {(recentDrafts ?? []).length === 0 ? (
              <li className="py-2 text-sm text-muted-foreground">No drafts yet.</li>
            ) : (
              (recentDrafts ?? []).map((d: any) => (
                <li key={d.id} className="py-2 text-sm">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.subject}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(d.created_at)}</p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-card border rounded-lg p-6 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Send pipeline</p>
          <p>
            Drafts saved here do not transmit. Twilio (SMS) and Resend (email) integration land in
            the next two build prompts. Once those modules export their send functions, this page
            gains a &quot;Send now&quot; button next to each draft.
          </p>
        </div>
      </aside>
    </div>
  );
}
