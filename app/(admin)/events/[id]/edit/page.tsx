import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../../_components/event-form";
import { updateEvent } from "../../actions";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("market_events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) return notFound();

  const [{ data: locations }, { data: musicians }] = await Promise.all([
    supabase.from("locations").select("id, name").order("name"),
    supabase.from("musicians").select("id, name").order("name")
  ]);

  const action = updateEvent.bind(null, id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href={"/admin/events/" + id} className="text-sm text-muted-foreground hover:text-foreground">
          Back to event
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Edit event</h1>
        <p className="text-sm text-muted-foreground">Update market date details.</p>
      </div>

      <EventForm
        action={action}
        initial={event}
        locations={locations ?? []}
        musicians={musicians ?? []}
        submitLabel="Save changes"
      />
    </div>
  );
}
