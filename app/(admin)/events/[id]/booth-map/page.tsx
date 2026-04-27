// PROMPT 17 - Booth map for an individual event.
// Server component fetches the event, its location's space_types, and assigned event_vendors.
// Layout is a CSS grid sized per the location's space type capacities.
// Drag-drop and print-trigger live in client islands below.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { BoothMapEditor } from "./booth-map-editor";
import { PrintButton } from "./print-button";
import type { ProductCategory } from "@/types/database";

export default async function EventBoothMap({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("market_events")
    .select("id, event_date, status, location:locations(id, name, slug, max_vendors)")
    .eq("id", id)
    .single();

  if (!event) return notFound();

  const loc = event.location as unknown as { id: string; name: string; slug: string; max_vendors: number | null } | null;
  if (!loc) return notFound();

  const [{ data: spaceTypes }, { data: assignments }, { data: categories }] = await Promise.all([
    supabase
      .from("space_types")
      .select("id, name, slug, capacity, display_order")
      .eq("location_id", loc.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("event_vendors")
      .select("id, booth_number, payment_status, space_type_id, vendor:vendors(id, business_name, contact_name, product_categories)")
      .eq("event_id", id),
    supabase.from("product_categories").select("id, slug, name")
  ]);

  // Build per-space-type cell layouts.
  // Each space type spans a row band. Booth slots are derived from capacity.
  // Booth_number convention: <space_slug>-<n>, e.g. "pavilion-10-3".
  const layout = (spaceTypes ?? []).map((s) => {
    const cap = s.capacity ?? 0;
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      capacity: cap,
      slots: Array.from({ length: cap }, (_, i) => s.slug + "-" + (i + 1))
    };
  });

  // Map booth_number to its assignment for client hydration.
  const assignmentsByBooth: Record<string, any> = {};
  for (const a of assignments ?? []) {
    if (a.booth_number) assignmentsByBooth[a.booth_number] = a;
  }
  const unassigned = (assignments ?? []).filter((a: any) => !a.booth_number);

  const categoryMap: Record<string, ProductCategory> = {};
  for (const c of categories ?? []) categoryMap[c.id] = c as ProductCategory;

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <Link href={"/admin/events/" + id} className="text-sm text-muted-foreground hover:text-foreground">
            Back to event
          </Link>
          <h1 className="text-2xl font-semibold mt-2">
            Booth map: {loc.name}, {formatDate(event.event_date)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag a vendor onto a booth slot to assign. Drag between slots to reseat. Drop on the unassigned tray to clear a slot.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={"/admin/events/" + id}>Done</Link>
          </Button>
          <PrintButton />
        </div>
      </div>

      {/* Print header. Hidden on screen, visible on paper. */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">{loc.name} booth map</h1>
        <p className="text-sm">{formatDate(event.event_date)}</p>
      </div>

      {layout.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            This location has no space types configured. Add space types in the location settings to render a booth map.
          </p>
          <Link
            href={"/admin/locations/" + loc.slug}
            className="inline-block mt-3 text-sm text-primary hover:underline"
          >
            Configure {loc.name}
          </Link>
        </div>
      ) : (
        <BoothMapEditor
          eventId={id}
          layout={layout}
          assignments={assignmentsByBooth}
          unassigned={unassigned}
          categoryMap={categoryMap}
        />
      )}
    </div>
  );
}
