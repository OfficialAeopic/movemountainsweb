import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorForm } from "../../_components/vendor-form";
import { updateVendor } from "../../actions";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .single();

  if (!vendor) return notFound();

  const [{ data: vendorTypes }, { data: productCategories }] = await Promise.all([
    supabase.from("vendor_types").select("id, name").order("name"),
    supabase.from("product_categories").select("id, name").order("name")
  ]);

  const action = updateVendor.bind(null, id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href={"/admin/vendors/" + id} className="text-sm text-muted-foreground hover:text-foreground">
          Back to vendor
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Edit vendor</h1>
        <p className="text-sm text-muted-foreground">Update vendor record.</p>
      </div>

      <VendorForm
        action={action}
        initial={vendor}
        vendorTypes={vendorTypes ?? []}
        productCategories={productCategories ?? []}
        submitLabel="Save changes"
      />
    </div>
  );
}
