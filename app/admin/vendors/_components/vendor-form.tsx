"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { VendorFormState } from "../actions";
import type { Vendor, VendorType, ProductCategory } from "@/types/database";

type VendorFormProps = {
  action: (prev: VendorFormState, formData: FormData) => Promise<VendorFormState>;
  initial?: Partial<Vendor>;
  vendorTypes: Pick<VendorType, "id" | "name">[];
  productCategories: Pick<ProductCategory, "id" | "name">[];
  submitLabel: string;
};

const initialState: VendorFormState = {};

export function VendorForm({ action, initial, vendorTypes, productCategories, submitLabel }: VendorFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const fe = state.fieldErrors ?? {};
  const selectedCategories = new Set(initial?.product_categories ?? []);

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive text-sm rounded-md p-3">
          {state.error}
        </div>
      ) : null}

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Business</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business name" error={fe.business_name?.[0]}>
            <Input name="business_name" defaultValue={initial?.business_name ?? ""} required />
          </Field>
          <Field label="Contact name" error={fe.contact_name?.[0]}>
            <Input name="contact_name" defaultValue={initial?.contact_name ?? ""} />
          </Field>
          <Field label="Email" error={fe.email?.[0]}>
            <Input type="email" name="email" defaultValue={initial?.email ?? ""} />
          </Field>
          <Field label="Phone" error={fe.phone?.[0]}>
            <Input type="tel" name="phone" defaultValue={initial?.phone ?? ""} />
          </Field>
          <Field label="Vendor type" error={fe.vendor_type_id?.[0]}>
            <Select name="vendor_type_id" defaultValue={initial?.vendor_type_id ?? ""}>
              <option value="">Unspecified</option>
              {vendorTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status" error={fe.status?.[0]}>
            <Select name="status" defaultValue={initial?.status ?? "active"} required>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </Select>
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_recurring"
            name="is_recurring"
            defaultChecked={initial?.is_recurring ?? false}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="is_recurring">Recurring vendor (attends most markets)</Label>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Product categories</h2>
        <p className="text-xs text-muted-foreground">Select all categories that apply. Used for cap enforcement at events.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {productCategories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="product_categories"
                value={c.id}
                defaultChecked={selectedCategories.has(c.id)}
                className="h-4 w-4 rounded border-input"
              />
              {c.name}
            </label>
          ))}
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Social and web</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Instagram" error={fe.social_instagram?.[0]}>
            <Input name="social_instagram" defaultValue={initial?.social_instagram ?? ""} placeholder="@handle" />
          </Field>
          <Field label="Facebook" error={fe.social_facebook?.[0]}>
            <Input name="social_facebook" defaultValue={initial?.social_facebook ?? ""} placeholder="facebook.com/page" />
          </Field>
          <Field label="Website" error={fe.social_website?.[0]}>
            <Input name="social_website" defaultValue={initial?.social_website ?? ""} placeholder="https://..." />
          </Field>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Internal</h2>
        <Field label="Ban reason (only when status is banned)" error={fe.ban_reason?.[0]}>
          <Input name="ban_reason" defaultValue={initial?.ban_reason ?? ""} />
        </Field>
        <Field label="Internal notes" error={fe.internal_notes?.[0]}>
          <Textarea name="internal_notes" defaultValue={initial?.internal_notes ?? ""} rows={4} />
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
