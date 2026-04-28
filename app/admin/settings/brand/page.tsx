// PROMPT 19 - Settings: Brand tab.
// Logo upload to Supabase Storage bucket "brand", plus brand color hex inputs.

import { createClient } from "@/lib/supabase/server";
import { saveBrand } from "../actions";

type Search = Promise<{ saved?: string; error?: string }>;

export default async function BrandTab({ searchParams }: { searchParams: Search }) {
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
      {sp.saved ? <Banner tone="ok">Brand settings saved.</Banner> : null}
      {sp.error ? <Banner tone="err">{decodeURIComponent(sp.error)}</Banner> : null}

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold">Brand</h2>
          <p className="text-xs text-muted-foreground">
            Logo file is uploaded to Supabase Storage bucket <code>brand</code>. Bucket must exist
            with public read access.
          </p>
        </header>

        {s.brand_logo_url ? (
          <div className="border rounded-md p-4 bg-muted/20">
            <p className="text-xs uppercase text-muted-foreground mb-2">Current logo</p>
            {/* Use plain img to avoid next/image domain config friction in this admin context. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.brand_logo_url} alt="Logo" className="max-h-32" />
            <p className="text-[11px] text-muted-foreground mt-2 break-all">{s.brand_logo_url}</p>
          </div>
        ) : (
          <div className="border rounded-md p-4 bg-muted/20 text-sm text-muted-foreground">
            No logo uploaded yet.
          </div>
        )}

        <form action={saveBrand} encType="multipart/form-data" className="space-y-3">
          <div>
            <label className="block text-xs font-medium uppercase text-muted-foreground">
              Replace logo
            </label>
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="w-full text-sm border rounded-md px-2 py-1.5 mt-1 bg-card"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              PNG, JPEG, SVG, or WebP. Leave empty to keep the existing logo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ColorField
              label="Primary"
              name="brand_color_primary"
              defaultValue={s.brand_color_primary}
            />
            <ColorField
              label="Secondary"
              name="brand_color_secondary"
              defaultValue={s.brand_color_secondary}
            />
            <ColorField
              label="Accent"
              name="brand_color_accent"
              defaultValue={s.brand_color_accent}
            />
          </div>

          <button
            type="submit"
            className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Save brand
          </button>
        </form>
      </section>
    </div>
  );
}

function ColorField({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  const value = defaultValue ?? "";
  const isValid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div>
      <label className="block text-xs font-medium uppercase text-muted-foreground">{label}</label>
      <div className="mt-1 flex gap-2 items-center">
        <input
          type="color"
          name={`${name}_picker`}
          defaultValue={isValid ? value : "#000000"}
          className="h-9 w-12 border rounded-md cursor-pointer bg-card"
        />
        <input
          type="text"
          name={name}
          defaultValue={value}
          placeholder="#1f2937"
          pattern="^#[0-9a-fA-F]{6}$"
          className="flex-1 text-sm border rounded-md px-2 py-1.5 font-mono"
        />
      </div>
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
