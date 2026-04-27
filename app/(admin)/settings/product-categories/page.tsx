// PROMPT 19 - Settings: Product categories CRUD.

import { createClient } from "@/lib/supabase/server";
import { createProductCategory, toggleProductCategory } from "../actions";

type Search = Promise<{ saved?: string; error?: string }>;

export default async function ProductCategoriesTab({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("product_categories")
    .select("id, slug, name, active")
    .order("name");

  return (
    <div className="space-y-4">
      {sp.saved ? <Banner tone="ok">Product category saved.</Banner> : null}
      {sp.error ? <Banner tone="err">{decodeURIComponent(sp.error)}</Banner> : null}

      <section className="bg-card border rounded-lg p-6 space-y-3">
        <header>
          <h2 className="text-lg font-semibold">Product categories</h2>
          <p className="text-xs text-muted-foreground">
            Used for category cap enforcement on applications and event assignments.
          </p>
        </header>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Name</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Slug</th>
                <th className="text-left text-xs font-medium uppercase px-3 py-2">Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(rows ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-sm">{r.name}</td>
                  <td className="px-3 py-2 text-sm font-mono text-xs">{r.slug}</td>
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
                    <form action={toggleProductCategory}>
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
                  <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No product categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 space-y-3">
        <h3 className="font-semibold">Add product category</h3>
        <form action={createProductCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase text-muted-foreground">Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase text-muted-foreground">
              Slug (optional, auto-derived from name)
            </label>
            <input
              type="text"
              name="slug"
              placeholder="candles"
              className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90"
            >
              Create category
            </button>
          </div>
        </form>
      </section>
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
