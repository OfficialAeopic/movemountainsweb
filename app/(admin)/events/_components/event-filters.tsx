"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type LocationOption = { id: string; name: string };

export function EventFilters({ locations }: { locations: LocationOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    startTransition(() => {
      router.push(pathname + "?" + next.toString());
    });
  }

  function clear() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <div className="bg-card border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div className="space-y-1">
        <Label htmlFor="filter-location">Location</Label>
        <Select
          id="filter-location"
          defaultValue={params.get("location") ?? ""}
          onChange={(e) => update("location", e.target.value)}
          disabled={pending}
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
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
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="complete">Complete</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-from">From</Label>
        <Input
          id="filter-from"
          type="date"
          defaultValue={params.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-to">To</Label>
        <Input
          id="filter-to"
          type="date"
          defaultValue={params.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="flex items-end">
        <Button type="button" variant="outline" onClick={clear} disabled={pending} className="w-full">
          Clear filters
        </Button>
      </div>
    </div>
  );
}
