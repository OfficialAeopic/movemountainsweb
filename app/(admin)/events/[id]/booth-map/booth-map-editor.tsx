"use client";

// PROMPT 17 - Booth map drag-drop editor.
// HTML5 drag-and-drop, no extra deps. Optimistic UI with a Save button that flushes via the saveLayout server action.
// Color coding: per primary product category, plus a payment-status overlay (paid = solid border, pending = dashed).
// Print-friendly: page-level CSS @media print rules in this component scope hide UI controls.

import { useMemo, useState, useTransition } from "react";
import { saveLayout } from "./actions";
import type { ProductCategory } from "@/types/database";

type Vendor = {
  id: string;
  business_name: string;
  contact_name: string | null;
  product_categories: string[];
};

type Assignment = {
  id: string;
  booth_number: string | null;
  payment_status: string;
  space_type_id: string | null;
  vendor: Vendor | null;
};

type SpaceLayout = {
  id: string;
  name: string;
  slug: string;
  capacity: number;
  slots: string[];
};

// Tailwind-safe palette keyed by product category slug. Falls back to slate.
// Each entry must use a known Tailwind class so JIT picks it up.
const CATEGORY_PALETTE: Record<string, string> = {
  candles: "bg-amber-100 text-amber-900 border-amber-300",
  "baked-goods": "bg-orange-100 text-orange-900 border-orange-300",
  jewelry: "bg-pink-100 text-pink-900 border-pink-300",
  skincare: "bg-rose-100 text-rose-900 border-rose-300",
  "pet-products": "bg-lime-100 text-lime-900 border-lime-300",
  plants: "bg-emerald-100 text-emerald-900 border-emerald-300",
  art: "bg-violet-100 text-violet-900 border-violet-300",
  clothing: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300",
  "home-decor": "bg-stone-100 text-stone-900 border-stone-300",
  "eggs-produce": "bg-yellow-100 text-yellow-900 border-yellow-300",
  "hot-food": "bg-red-100 text-red-900 border-red-300",
  drinks: "bg-cyan-100 text-cyan-900 border-cyan-300",
  books: "bg-indigo-100 text-indigo-900 border-indigo-300",
  crafts: "bg-teal-100 text-teal-900 border-teal-300"
};
const FALLBACK_COLOR = "bg-slate-100 text-slate-900 border-slate-300";

function colorForVendor(vendor: Vendor | null, categoryMap: Record<string, ProductCategory>): string {
  if (!vendor) return FALLBACK_COLOR;
  const first = vendor.product_categories?.[0];
  if (!first) return FALLBACK_COLOR;
  const slug = categoryMap[first]?.slug;
  if (!slug) return FALLBACK_COLOR;
  return CATEGORY_PALETTE[slug] ?? FALLBACK_COLOR;
}

export function BoothMapEditor({
  eventId,
  layout,
  assignments,
  unassigned,
  categoryMap
}: {
  eventId: string;
  layout: SpaceLayout[];
  assignments: Record<string, Assignment>;
  unassigned: Assignment[];
  categoryMap: Record<string, ProductCategory>;
}) {
  // Local state: booth_number -> event_vendor_id, plus an unassigned pool.
  const initialMapping = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [booth, a] of Object.entries(assignments)) {
      if (a) m[booth] = a.id;
    }
    return m;
  }, [assignments]);

  const allEventVendors = useMemo(() => {
    const map: Record<string, Assignment> = { ...assignments };
    for (const u of unassigned) map[u.id] = u;
    // The assignments object is keyed by booth, so flatten to id-keyed.
    const flat: Record<string, Assignment> = {};
    for (const a of Object.values(assignments)) flat[a.id] = a;
    for (const u of unassigned) flat[u.id] = u;
    return flat;
  }, [assignments, unassigned]);

  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const assignedVendorIds = new Set(Object.values(mapping));
  const trayVendors = Object.values(allEventVendors).filter((a) => !assignedVendorIds.has(a.id));

  function onDragStart(e: React.DragEvent, eventVendorId: string, fromBooth: string | null) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ eventVendorId, fromBooth }));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function moveTo(targetBooth: string | null, payload: { eventVendorId: string; fromBooth: string | null }) {
    setMapping((prev) => {
      const next = { ...prev };
      // Clear source if the vendor was already in a slot.
      if (payload.fromBooth) delete next[payload.fromBooth];
      // If dropping on an occupied target, swap the occupant out (becomes unassigned).
      if (targetBooth) {
        // If target is occupied by someone else, that vendor returns to the tray.
        if (next[targetBooth] && next[targetBooth] !== payload.eventVendorId) {
          delete next[targetBooth];
        }
        next[targetBooth] = payload.eventVendorId;
      }
      return next;
    });
    setDirty(true);
    setSaved(false);
  }

  function onDropSlot(e: React.DragEvent, targetBooth: string) {
    e.preventDefault();
    try {
      const payload = JSON.parse(e.dataTransfer.getData("text/plain"));
      moveTo(targetBooth, payload);
    } catch {
      // Ignore malformed drag payloads.
    }
  }

  function onDropTray(e: React.DragEvent) {
    e.preventDefault();
    try {
      const payload = JSON.parse(e.dataTransfer.getData("text/plain"));
      moveTo(null, payload);
    } catch {
      // Ignore.
    }
  }

  function onSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveLayout(eventId, mapping);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setSaved(true);
    });
  }

  function onReset() {
    setMapping(initialMapping);
    setDirty(false);
    setSaved(false);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar. Hidden on print. */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Legend:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500 text-xs">
            Solid border = paid
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border-2 border-dashed border-amber-500 text-xs">
            Dashed = pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-sm text-rose-700">{error}</span>
          ) : saved ? (
            <span className="text-sm text-emerald-700">Saved.</span>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty || pending}
            className="px-3 py-1.5 text-sm rounded-md border bg-card hover:bg-accent disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || pending}
            className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save layout"}
          </button>
        </div>
      </div>

      {/* Booth grid per space type. */}
      <div className="space-y-6">
        {layout.map((band) => (
          <section key={band.id} className="bg-card border rounded-lg p-4 print:border-2 print:p-2">
            <header className="flex items-center justify-between mb-3 print:mb-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide">{band.name}</h2>
              <span className="text-xs text-muted-foreground">{band.capacity} slots</span>
            </header>
            <div
              className="grid gap-2 print:gap-1"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
            >
              {band.slots.map((boothNumber, idx) => {
                const occupantId = mapping[boothNumber];
                const occupant = occupantId ? allEventVendors[occupantId] : null;
                const vendor = occupant?.vendor ?? null;
                const color = colorForVendor(vendor, categoryMap);
                const paymentBorder = occupant?.payment_status === "paid"
                  ? "border-2 border-solid"
                  : occupant
                  ? "border-2 border-dashed"
                  : "border border-dashed border-muted-foreground/30";

                return (
                  <div
                    key={boothNumber}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDropSlot(e, boothNumber)}
                    className={
                      "rounded-md p-2 min-h-[72px] text-xs flex flex-col justify-between " +
                      paymentBorder + " " +
                      (occupant ? color : "bg-muted/30")
                    }
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wide opacity-70">
                      <span>Booth {idx + 1}</span>
                      <span className="font-mono">{boothNumber}</span>
                    </div>
                    {occupant && vendor ? (
                      <div
                        draggable
                        onDragStart={(e) => onDragStart(e, occupant.id, boothNumber)}
                        className="cursor-grab active:cursor-grabbing"
                        title={vendor.business_name + (vendor.contact_name ? " (" + vendor.contact_name + ")" : "")}
                      >
                        <p className="font-medium leading-tight line-clamp-2">{vendor.business_name}</p>
                        {vendor.contact_name ? (
                          <p className="text-[10px] opacity-70 line-clamp-1">{vendor.contact_name}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">Empty</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Unassigned tray. Hidden on print. */}
      <section
        onDragOver={onDragOver}
        onDrop={onDropTray}
        className="bg-card border rounded-lg p-4 print:hidden"
      >
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Unassigned vendors</h2>
          <span className="text-xs text-muted-foreground">{trayVendors.length} waiting</span>
        </header>
        {trayVendors.length === 0 ? (
          <p className="text-sm text-muted-foreground">All event vendors are seated. Drop a booth here to clear.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {trayVendors.map((a) => {
              const v = a.vendor;
              if (!v) return null;
              const color = colorForVendor(v, categoryMap);
              return (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, a.id, null)}
                  className={"px-3 py-2 rounded-md border-2 cursor-grab active:cursor-grabbing text-xs " + color}
                  title={v.business_name + (v.contact_name ? " (" + v.contact_name + ")" : "")}
                >
                  <p className="font-medium">{v.business_name}</p>
                  {v.contact_name ? <p className="opacity-70">{v.contact_name}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Print stylesheet block. Hidden tray, larger booth labels, no shadows, single-column page break safety. */}
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0.5in; }
          body { background: white !important; }
          aside, nav, header[data-topbar], .print\\:hidden { display: none !important; }
          .grid { gap: 0.25rem !important; }
        }
      `}</style>
    </div>
  );
}
