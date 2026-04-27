import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VendorFilters } from "./_components/vendor-filters";
import type { VendorStatus } from "@/types/database";

type SearchParams = Promise<{
  q?: string;
  type?: string;
  category?: string;
  status?: string;
}>;

const STATUS_VARIANT: Record<VendorStatus, "default" | "secondary" | "muted" | "destructive" | "success" | "warning"> = {
  active: "success",
  pending: "warning",
  inactive: "muted",
  banned: "destructive"
};

export default async function VendorsList({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: vendorTypes }, { data: productCategories }] = await Promise.all([
    supabase.from("vendor_types").select("id, name").eq("active", true).order("name"),
    supabase.from("product_categories").select("id, name").eq("active", true).order("name")
  ]);

  let query = supabase
    .from("vendors")
    .select("id, business_name, contact_name, email, phone, status, is_recurring, total_markets_attended, product_categories, vendor_type:vendor_types(name)")
    .order("business_name");

  if (sp.type) query = query.eq("vendor_type_id", sp.type);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.category) query = query.contains("product_categories", [sp.category]);
  if (sp.q) {
    const q = sp.q.replace(/[%_]/g, "\\$&");
    query = query.or(
      "business_name.ilike.%" + q + "%,contact_name.ilike.%" + q + "%,email.ilike.%" + q + "%,phone.ilike.%" + q + "%"
    );
  }

  const { data: vendors } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground">Master vendor directory.</p>
        </div>
        <Button asChild>
          <Link href="/admin/vendors/new">New vendor</Link>
        </Button>
      </div>

      <VendorFilters
        vendorTypes={vendorTypes ?? []}
        productCategories={productCategories ?? []}
      />

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Business</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Contact</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Type</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Markets</th>
              <th className="text-left text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(vendors ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No vendors match these filters.
                </td>
              </tr>
            ) : (
              (vendors ?? []).map((v) => {
                const vt = v.vendor_type as unknown as { name: string } | null;
                return (
                  <tr key={v.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={"/admin/vendors/" + v.id} className="font-medium text-primary hover:underline">
                        {v.business_name}
                      </Link>
                      {v.is_recurring ? (
                        <Badge variant="outline" className="ml-2">Recurring</Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {v.contact_name ? <p>{v.contact_name}</p> : null}
                      {v.email ? <p className="text-xs text-muted-foreground">{v.email}</p> : null}
                      {v.phone ? <p className="text-xs text-muted-foreground">{v.phone}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{vt?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-sm">{v.total_markets_attended ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[v.status as VendorStatus]}>{v.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={"/admin/vendors/" + v.id} className="text-sm text-primary hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
