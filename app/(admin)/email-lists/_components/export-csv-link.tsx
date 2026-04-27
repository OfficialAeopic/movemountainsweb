// PROMPT 16 - Server component link to the CSV export route.
// Preserves the active filter set so exports match what the user is looking at.

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ExportCsvLink({ params }: { params: string }) {
  const href = "/admin/email-lists/export" + (params ? "?" + params : "");
  return (
    <Button asChild variant="outline">
      <Link href={href} prefetch={false}>Export CSV</Link>
    </Button>
  );
}
