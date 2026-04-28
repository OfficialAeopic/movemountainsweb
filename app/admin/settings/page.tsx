// PROMPT 19 - Settings: Business info tab (default).

import { createClient } from "@/lib/supabase/server";
import { saveBusinessInfo } from "./actions";

type Search = Promise<{ saved?: string; error?: string }>;

export default async function BusinessInfoTab({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", "global")
    .maybeSingle();

  const s: any = settings ?? {};

  return (
    <div className="space-y-6">
      {sp.saved ? (
        <Banner tone="ok">Business info saved.</Banner>
      ) : null}
      {sp.error ? <Banner tone="err">{decodeURIComponent(sp.error)}</Banner> : null}

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold">Business info</h2>
          <p className="text-xs text-muted-foreground">
            Used as defaults across emails, invoices, and the public footer when integrated.
          </p>
        </header>

        <form action={saveBusinessInfo} className="space-y-3">
          <Field label="Business name" name="business_name" defaultValue={s.business_name} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone" name="business_phone" defaultValue={s.business_phone} />
            <Field label="Email" name="business_email" type="email" defaultValue={s.business_email} />
          </div>
          <Field label="Street address" name="business_address" defaultValue={s.business_address} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="City" name="business_city" defaultValue={s.business_city} />
            <Field label="State" name="business_state" defaultValue={s.business_state ?? "TX"} />
            <Field label="ZIP" name="business_zip" defaultValue={s.business_zip} />
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs uppercase text-muted-foreground mb-2 mt-1">Social handles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Instagram handle" name="social_instagram" defaultValue={s.social_instagram} placeholder="@movemountainsmarket" />
              <Field label="Facebook page" name="social_facebook" defaultValue={s.social_facebook} placeholder="MoveMountainsMarket" />
              <Field label="TikTok handle" name="social_tiktok" defaultValue={s.social_tiktok} placeholder="@movemountainsmarket" />
              <Field label="Website" name="social_website" defaultValue={s.social_website} placeholder="https://movemountainsmarket.com" />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90"
            >
              Save business info
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase text-muted-foreground">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
      />
    </div>
  );
}

function Banner({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : "border-rose-300 bg-rose-50 text-rose-900";
  return <div className={"border rounded-md p-3 text-sm " + cls}>{children}</div>;
}
