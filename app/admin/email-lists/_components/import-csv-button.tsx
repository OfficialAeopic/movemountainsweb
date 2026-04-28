"use client";

// PROMPT 16 - Client-side CSV import dialog.
// Uploads a file via FormData to the importCsv server action and renders the result counts.

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { importCsv, type ImportState } from "../actions";

const initial: ImportState = {};

type LocationOption = { id: string; name: string };

export function ImportCsvButton({ locations }: { locations: LocationOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(importCsv, initial);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Import CSV</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-card border rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Import subscribers from CSV</h2>
                <p className="text-xs text-muted-foreground">
                  CSV should have an email column. Optional name and phone columns are auto-detected.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
                aria-label="Close"
                type="button"
              >
                Close
              </button>
            </div>

            <form action={formAction} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="file">
                  CSV file
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="block w-full text-sm border rounded-md px-3 py-2 bg-background file:mr-3 file:px-3 file:py-1 file:text-xs file:rounded file:border-0 file:bg-muted file:text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="location_id">
                    Location bucket
                  </label>
                  <select
                    id="location_id"
                    name="location_id"
                    className="w-full text-sm border rounded-md px-2 py-1.5 bg-background h-9"
                  >
                    <option value="">No location bucket</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="source">
                    Source tag
                  </label>
                  <select
                    id="source"
                    name="source"
                    defaultValue="import"
                    className="w-full text-sm border rounded-md px-2 py-1.5 bg-background h-9"
                  >
                    <option value="import">CSV import</option>
                    <option value="signup-form">Signup form</option>
                    <option value="market-day-survey">Market day survey</option>
                    <option value="manual-add">Manual add</option>
                  </select>
                </div>
              </div>

              {state.error ? (
                <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                  {state.error}
                </p>
              ) : null}

              {state.inserted !== undefined && !state.error ? (
                <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md px-3 py-2 space-y-0.5">
                  <p className="font-medium">Import finished.</p>
                  <p className="text-xs">Inserted {state.inserted}, skipped {state.duplicates ?? 0} duplicates, {state.invalid ?? 0} invalid rows out of {state.total ?? 0} total.</p>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Importing..." : "Import"}
    </Button>
  );
}
