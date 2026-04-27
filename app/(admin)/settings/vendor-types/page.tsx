// PROMPT 19 - Settings: Vendor types CRUD.

import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { createVendorType, toggleVendorType } from "../actions";

type Search = Promise<{ saved?: string; error?: string }>;

export default async function VendorTypesTab({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("vendor_types")
    .select("id, slug, name, description, base_price, requires_permits, active")
    .order("name");

  return (
    <div className="space-y-4">
      {sp.saved ? <Banner tone="ok">Vendor type saved.</Banner> : null}
      {sp.error ? <Banner tone="err">{decodeURIComponent(sp.error)}</Banner> : null}

      <section className="bg-card border rounded-lg p-6 space-y-3">
        <header>
          <h2 className="text-lg font-semibold">Vendor types</h2>
          <p className="text-xs text-muted-foreground">
            Categories applied to vendors and applications. Toggle inactive instead of deleting to
            preserve history.
          </p>
        </header>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Name</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Slug</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Base price</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Permits</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Active</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(rows ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-sm">{r.name}</td>
                  <td className="px-3 py-2 text-sm font-mono text-xs">{r.slug}</td>
                  <td className="px-3 py-2 text-sm">
                    {r.base_price !== null && r.base_price !== undefined
                      ? formatCurrency(Number(r.base_price))
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-sm">{r.requires_permits ? "yes" : "no"}</td>
                  <td className="px-3 py-2 text-sm">
                    <span
                      className={
                        "inline-flex items-center px-2 py-0.5 text-xs rounded-md border " +
                        (r.active
                          ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200")
                      }
                    >
                      {r.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-right">
                    <form action={toggleVendorType}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="active" value={r.active ? "false" : "true"} />
                      <button
                        type="submit"
                        className="text-xs px-2 py-1 rounded-md border bg-card hover:bg-accent"
                      >
                        {r.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No vendor types yet. Add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 space-y-3">
        <h3 className="font-semibold">Add vendor type</h3>
        <form action={createVendorType} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" name="name" required />
          <Field label="Slug" name="slug" required placeholder="standard-artisan" />
          <Field label="Base price (USD)" name="base_price" type="number" step="0.01" />
          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              id="requires_permits"
              name="requires_permits"
              className="h-4 w-4"
            />
            <label htmlFor="requires_permits" className="text-sm">
              Requires food permits
            </label>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description (optional)" name="description" />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90"
            >
              Create vendor type
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
  step,
  required,
  placeholder
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase text-muted-foreground">{label}</label>
      <input
        type={type}
        name={name}
        step={step}
        required={required}
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
