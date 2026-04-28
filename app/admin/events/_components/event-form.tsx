"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { EventFormState } from "../actions";
import type { MarketEvent, Location, Musician } from "@/types/database";

type EventFormProps = {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  initial?: Partial<MarketEvent>;
  locations: Pick<Location, "id" | "name">[];
  musicians: Pick<Musician, "id" | "name">[];
  submitLabel: string;
};

const initialState: EventFormState = {};

export function EventForm({ action, initial, locations, musicians, submitLabel }: EventFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive text-sm rounded-md p-3">
          {state.error}
        </div>
      ) : null}

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location" error={fe.location_id?.[0]}>
            <Select name="location_id" defaultValue={initial?.location_id ?? ""} required>
              <option value="">Pick a location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Status" error={fe.status?.[0]}>
            <Select name="status" defaultValue={initial?.status ?? "scheduled"} required>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="complete">Complete</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Field>

          <Field label="Event date" error={fe.event_date?.[0]}>
            <Input type="date" name="event_date" defaultValue={initial?.event_date ?? ""} required />
          </Field>

          <Field label="Vendor capacity" error={fe.vendor_capacity?.[0]}>
            <Input
              type="number"
              name="vendor_capacity"
              min={0}
              defaultValue={initial?.vendor_capacity ?? ""}
            />
          </Field>

          <Field label="Start time" error={fe.start_time?.[0]}>
            <Input type="time" name="start_time" defaultValue={initial?.start_time ?? ""} />
          </Field>

          <Field label="End time" error={fe.end_time?.[0]}>
            <Input type="time" name="end_time" defaultValue={initial?.end_time ?? ""} />
          </Field>

          <Field label="Theme" error={fe.theme?.[0]}>
            <Input name="theme" defaultValue={initial?.theme ?? ""} placeholder="e.g. Spring Bloom" />
          </Field>

          <Field label="Musician" error={fe.musician_id?.[0]}>
            <Select name="musician_id" defaultValue={initial?.musician_id ?? ""}>
              <option value="">No musician booked</option>
              {musicians.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Raffle prize description" error={fe.raffle_prize_description?.[0]}>
          <Input
            name="raffle_prize_description"
            defaultValue={initial?.raffle_prize_description ?? ""}
            placeholder="e.g. Vendor-donated gift basket"
          />
        </Field>

        <Field label="Internal notes" error={fe.notes?.[0]}>
          <Textarea name="notes" defaultValue={initial?.notes ?? ""} rows={4} />
        </Field>
      </section>

      <div className="flex justify-end gap-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}
