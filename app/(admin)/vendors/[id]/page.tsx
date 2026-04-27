import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { deleteVendor } from "../actions";
import type { VendorStatus, ApplicationStatus } from "@/types/database";

const VENDOR_STATUS_VARIANT: Record<VendorStatus, "default" | "secondary" | "muted" | "destructive" | "success" | "warning"> = {
  active: "success",
  pending: "warning",
  inactive: "muted",
  banned: "destructive"
};

const APP_STATUS_VARIANT: Record<ApplicationStatus, "default" | "secondary" | "muted" | "destructive" | "success" | "warning"> = {
  pending: "warning",
  approved: "success",
  denied: "destructive",
  waitlist: "secondary",
  withdrawn: "muted"
};

export default async function VendorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*, vendor_type:vendor_types(id, name)")
    .eq("id", id)
    .single();

  if (!vendor) return notFound();

  // Resolve product category names from the array column.
  let categoryNames: string[] = [];
  if (vendor.product_categories && vendor.product_categories.length > 0) {
    const { data: cats } = await supabase
      .from("product_categories")
      .select("id, name")
      .in("id", vendor.product_categories);
    categoryNames = (cats ?? []).map((c) => c.name);
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("id, created_at, status, business_name, source, location:locations(name, slug)")
    .eq("vendor_id", id)
    .order("created_at", { ascending: false });

  const vt = vendor.vendor_type as unknown as { id: string; name: string } | null;

  async function handleDelete() {
    "use server";
    await deleteVendor(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/vendors" className="text-sm text-muted-foreground hover:text-foreground">
            Back to vendors
          </Link>
          <h1 className="text-2xl font-semibold mt-2">{vendor.business_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={VENDOR_STATUS_VARIANT[vendor.status as VendorStatus]}>{vendor.status}</Badge>
            {vendor.is_recurring ? <Badge variant="outline">Recurring</Badge> : null}
            {vt ? <span className="text-sm text-muted-foreground">{vt.name}</span> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={"/admin/vendors/" + id + "/edit"}>Edit</Link>
          </Button>
          <form action={handleDelete}>
            <Button type="submit" variant="destructive">Delete</Button>
          </form>
        </div>
      </div>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Row label="Contact name">{vendor.contact_name ?? "-"}</Row>
          <Row label="Email">
            {vendor.email ? <a href={"mailto:" + vendor.email} className="text-primary hover:underline">{vendor.email}</a> : "-"}
          </Row>
          <Row label="Phone">
            {vendor.phone ? <a href={"tel:" + vendor.phone} className="text-primary hover:underline">{vendor.phone}</a> : "-"}
          </Row>
          <Row label="Markets attended">{vendor.total_markets_attended ?? 0}</Row>
          <Row label="Instagram">{vendor.social_instagram ?? "-"}</Row>
          <Row label="Facebook">{vendor.social_facebook ?? "-"}</Row>
          <Row label="Website">
            {vendor.social_website ? (
              <a href={vendor.social_website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {vendor.social_website}
              </a>
            ) : "-"}
          </Row>
          <Row label="Product categories">
            {categoryNames.length > 0 ? categoryNames.join(", ") : "-"}
          </Row>
        </dl>
        {vendor.status === "banned" && vendor.ban_reason ? (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium uppercase text-destructive mb-1">Ban reason</p>
            <p className="text-sm">{vendor.ban_reason}</p>
          </div>
        ) : null}
        {vendor.internal_notes ? (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Internal notes</p>
            <p className="text-sm whitespace-pre-wrap">{vendor.internal_notes}</p>
          </div>
        ) : null}
      </section>

      <section className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Applications history</h2>
        {applications && applications.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-2">Submitted</th>
                <th>Location</th>
                <th>Source</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((a) => {
                const loc = a.location as unknown as { name: string; slug: string } | null;
                return (
                  <tr key={a.id}>
                    <td className="py-2">{formatDate(a.created_at)}</td>
                    <td>{loc?.name ?? "-"}</td>
                    <td className="text-muted-foreground">{a.source ?? "-"}</td>
                    <td>
                      <Badge variant={APP_STATUS_VARIANT[a.status as ApplicationStatus]}>{a.status}</Badge>
                    </td>
                    <td className="text-right">
                      <Link href={"/admin/applications/" + a.id} className="text-primary hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">No applications on file for this vendor.</p>
        )}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
