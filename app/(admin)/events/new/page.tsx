import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../_components/event-form";
import { createEvent } from "../actions";

export default async function NewEventPage() {
  const supabase = await createClient();

  const [{ data: locations }, { data: musicians }] = await Promise.all([
    supabase.from("locations").select("id, name").eq("active", true).order("name"),
    supabase.from("musicians").select("id, name").eq("active", true).order("name")
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">
          Back to events
        </Link>
        <h1 className="text-2xl font-semibold mt-2">New event</h1>
        <p className="text-sm text-muted-foreground">Schedule a new market date.</p>
      </div>

      <EventForm
        action={createEvent}
        locations={locations ?? []}
        musicians={musicians ?? []}
        submitLabel="Create event"
      />
    </div>
  );
}
