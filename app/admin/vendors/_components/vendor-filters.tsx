"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string };

export function VendorFilters({ vendorTypes, productCategories }: { vendorTypes: Option[]; productCategories: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState(params.get("q") ?? "");

  // Debounce search input to avoid hammering the server on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search) {
        next.set("q", search);
      } else {
        next.delete("q");
      }
      const target = pathname + (next.toString() ? "?" + next.toString() : "");
      startTransition(() => router.push(target));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    startTransition(() => router.push(pathname + "?" + next.toString()));
  }

  function clear() {
    setSearch("");
    startTransition(() => router.push(pathname));
  }

  return (
    <div className="bg-card border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div className="space-y-1 lg:col-span-2">
        <Label htmlFor="filter-search">Search</Label>
        <Input
          id="filter-search"
          type="search"
          placeholder="Business, contact, phone, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-vendor-type">Vendor type</Label>
        <Select
          id="filter-vendor-type"
          defaultValue={params.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
          disabled={pending}
        >
          <option value="">All types</option>
          {vendorTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-category">Product category</Label>
        <Select
          id="filter-category"
          defaultValue={params.get("category") ?? ""}
          onChange={(e) => update("category", e.target.value)}
          disabled={pending}
        >
          <option value="">All categories</option>
          {productCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-status">Status</Label>
        <Select
          id="filter-status"
          defaultValue={params.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
          disabled={pending}
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </Select>
      </div>

      <div className="flex items-end lg:col-span-5">
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={pending}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
