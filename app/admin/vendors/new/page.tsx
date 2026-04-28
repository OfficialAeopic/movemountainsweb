import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VendorForm } from "../_components/vendor-form";
import { createVendor } from "../actions";

export default async function NewVendorPage() {
  const supabase = await createClient();

  const [{ data: vendorTypes }, { data: productCategories }] = await Promise.all([
    supabase.from("vendor_types").select("id, name").eq("active", true).order("name"),
    supabase.from("product_categories").select("id, name").eq("active", true).order("name")
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/vendors" className="text-sm text-muted-foreground hover:text-foreground">
          Back to vendors
        </Link>
        <h1 className="text-2xl font-semibold mt-2">New vendor</h1>
        <p className="text-sm text-muted-foreground">Add a vendor to the directory.</p>
      </div>

      <VendorForm
        action={createVendor}
        vendorTypes={vendorTypes ?? []}
        productCategories={productCategories ?? []}
        submitLabel="Create vendor"
      />
    </div>
  );
}
