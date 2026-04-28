// PROMPT 18 - Date range picker for the reports dashboard.
// Server-rendered links for the preset ranges plus a custom range form.

import Link from "next/link";
import type { DateRange } from "./_lib";

const PRESETS: Array<{ key: DateRange["key"]; label: string }> = [
  { key: "30d", label: "Last 30 days" },
  { key: "quarter", label: "This quarter" },
  { key: "year", label: "Year to date" }
];

export function RangePicker({ active }: { active: DateRange }) {
  return (
    <div className="bg-card border rounded-lg p-4 flex flex-wrap items-end gap-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const isActive = active.key === p.key;
          const href = `/admin/reports?range=${p.key}`;
          return (
            <Link
              key={p.key}
              href={href}
              className={
                "px-3 py-1.5 text-sm rounded-md border transition " +
                (isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-accent border-input")
              }
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      <form method="GET" action="/admin/reports" className="flex flex-wrap items-end gap-2 ml-auto">
        <input type="hidden" name="range" value="custom" />
        <div>
          <label className="block text-[11px] font-medium uppercase text-muted-foreground">
            Start
          </label>
          <input
            type="date"
            name="start"
            defaultValue={active.key === "custom" ? active.startIso : ""}
            className="text-sm border rounded-md px-2 py-1.5"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase text-muted-foreground">
            End
          </label>
          <input
            type="date"
            name="end"
            defaultValue={active.key === "custom" ? active.endIso : ""}
            className="text-sm border rounded-md px-2 py-1.5"
            required
          />
        </div>
        <button
          type="submit"
          className="text-sm py-1.5 px-3 rounded-md border bg-card hover:bg-accent"
        >
          Apply custom
        </button>
      </form>

      <div className="basis-full text-xs text-muted-foreground">
        Showing data for {active.label} ({active.startIso} through {active.endIso}).
      </div>
    </div>
  );
}
